// Fase 13.1-13.2 — Edge Function de Supabase: revisa diariamente, para cada
// usuario Premium, los tres casos que `claude.md` pide notificar y envía un
// Web Push por cada uno que corresponda:
//
//   1. Una suscripción se cobrará en los próximos 2-3 días.
//   2. Una categoría con límite asignado llega al 80% de su tope.
//   3. Una meta de ahorro está cerca de su fecha límite y del monto objetivo.
//
// No la llama el cliente: la dispara un cron (Supabase Cron / pg_cron), no
// una persona con sesión — por eso NO usa `getUserFromRequest` como las
// funciones de la Fase 11. En su lugar, valida un secreto compartido
// (`CRON_SECRET`) para que nadie pueda invocarla desde fuera y gastar la
// cuota de envío de notificaciones.
//
// Desplegar:
//   supabase functions deploy check-notifications --no-verify-jwt
//   (--no-verify-jwt porque quien llama es el scheduler, no un usuario con
//   sesión de Supabase Auth; la función igual exige su propio secreto, ver
//   abajo, así que sigue protegida)
//   supabase secrets set CRON_SECRET=$(openssl rand -hex 32)
//   supabase secrets set VAPID_PUBLIC_KEY=... VAPID_PRIVATE_KEY=... VAPID_SUBJECT=mailto:tu@correo.com
//   (generar el par de claves VAPID una sola vez con `npx web-push generate-vapid-keys`;
//   la pública también va en VITE_VAPID_PUBLIC_KEY del cliente, ver .env.example)
//
// Programar el cron (SQL Editor de Supabase, una sola vez):
//   select cron.schedule(
//     'check-notifications-daily',
//     '0 13 * * *', -- 13:00 UTC = 10:00 en Chile (CLT, UTC-3) fuera de horario de verano
//     $$
//     select net.http_post(
//       url := 'https://tu-proyecto.supabase.co/functions/v1/check-notifications',
//       headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', 'EL_MISMO_VALOR_DE_CRON_SECRET'),
//       body := '{}'::jsonb
//     );
//     $$
//   );
//   (requiere las extensiones pg_cron y pg_net habilitadas en Database -> Extensions)
//
// Variables de entorno: SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY se inyectan
// automáticamente. CRON_SECRET, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY y
// VAPID_SUBJECT hay que configurarlos a mano (ver arriba).

// deno-lint-ignore-file no-explicit-any
import { createClient } from 'jsr:@supabase/supabase-js@2'
import webpush from 'npm:web-push@3'

// ── Lógica de fechas, duplicada intencionalmente de src/lib/premium.ts ────
// Un Edge Function de Deno no puede depender de forma confiable de imports
// relativos hacia fuera de `supabase/functions/`, así que estas funciones
// puras se mantienen espejadas aquí. Están cubiertas por los mismos casos
// que `src/lib/premium.test.ts` (willChargeSoon/isGoalNearDeadline) — si
// cambias la fórmula en un lado, cámbiala también en el otro.
function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

function effectiveBillingDay(billingDay: number, date: Date): number {
  return Math.min(billingDay, daysInMonth(date.getFullYear(), date.getMonth()))
}

function willChargeSoon(billingDay: number, date: Date, daysAhead = 3): boolean {
  for (let offset = 1; offset <= daysAhead; offset++) {
    const future = new Date(date.getFullYear(), date.getMonth(), date.getDate() + offset)
    if (future.getDate() === effectiveBillingDay(billingDay, future)) return true
  }
  return false
}

function isGoalNearDeadline(
  goal: { target_amount: number; saved_amount: number; deadline: string },
  date: Date,
  daysAhead = 7
): boolean {
  if (goal.saved_amount >= goal.target_amount) return false
  const deadline = new Date(`${goal.deadline}T00:00:00`)
  const today = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const daysLeft = Math.round((deadline.getTime() - today.getTime()) / (24 * 60 * 60 * 1000))
  return daysLeft >= 0 && daysLeft <= daysAhead
}

function monthStartISO(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`
}

// Mismos 8 slugs/labels que src/lib/categories.ts, para no tener que tirar
// del bundle de React + Lucide solo para mostrar un nombre en la notificación.
const DEFAULT_CATEGORY_LABELS: Record<string, string> = {
  comida: 'Comida',
  transporte: 'Transporte',
  compras: 'Compras',
  salud: 'Salud',
  entretenimiento: 'Entretenimiento',
  servicios: 'Servicios',
  sueldo: 'Sueldo',
  otros: 'Otros',
}

interface NotificationJob {
  userId: string
  kind: 'subscription_charge' | 'category_limit' | 'savings_goal'
  refId: string
  periodKey: string
  title: string
  body: string
  url: string
}

Deno.serve(async (req: Request) => {
  const expectedSecret = Deno.env.get('CRON_SECRET')
  const providedSecret = req.headers.get('x-cron-secret')
  if (!expectedSecret || providedSecret !== expectedSecret) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 })
  }

  const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY')
  const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')
  const vapidSubject = Deno.env.get('VAPID_SUBJECT')
  if (!vapidPublicKey || !vapidPrivateKey || !vapidSubject) {
    return new Response(JSON.stringify({ error: 'Faltan las claves VAPID en los secrets de la función' }), {
      status: 500,
    })
  }
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey)

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const today = new Date()
  const monthKey = monthStartISO(today).slice(0, 7) // "YYYY-MM", para period_key

  try {
    // Solo Premium: metas, límites y suscripciones automáticas son
    // funciones Premium (claude.md, sección 1), así que un usuario
    // gratuito no puede tener nada que notificar de estos 3 tipos.
    const { data: profiles, error: profilesError } = await admin
      .from('profiles')
      .select('id')
      .eq('is_premium', true)

    if (profilesError) throw profilesError

    const jobs: NotificationJob[] = []

    for (const profile of profiles ?? []) {
      const userId = profile.id as string

      const { data: prefs } = await admin
        .from('notification_prefs')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()

      const subscriptionsReminder = prefs?.subscriptions_reminder ?? true
      const categoryLimitAlert = prefs?.category_limit_alert ?? true
      const savingsGoalReminder = prefs?.savings_goal_reminder ?? true

      // 1) Suscripciones que se cobran en los próximos 2-3 días.
      if (subscriptionsReminder) {
        const { data: subs } = await admin
          .from('subscriptions')
          .select('*')
          .eq('user_id', userId)
          .eq('active', true)

        for (const sub of subs ?? []) {
          if (!willChargeSoon(sub.billing_day, today)) continue
          jobs.push({
            userId,
            kind: 'subscription_charge',
            refId: sub.id,
            periodKey: monthKey,
            title: 'Cobro próximo',
            body: `"${sub.name}" se cobrará en los próximos días (${formatCLP(sub.amount)}).`,
            url: '/premium',
          })
        }
      }

      // 2) Categorías con límite que llegan al 80% del tope este mes.
      if (categoryLimitAlert) {
        const monthStart = monthStartISO(today)
        const { data: limits } = await admin
          .from('category_limits')
          .select('*')
          .eq('user_id', userId)
          .eq('month_year', monthStart)

        for (const limit of limits ?? []) {
          const { data: expenses } = await admin
            .from('transactions')
            .select('amount')
            .eq('user_id', userId)
            .eq('type', 'expense')
            .eq('category', limit.category)
            .gte('date', monthStart)

          const spent = (expenses ?? []).reduce((sum: number, t: { amount: number }) => sum + Number(t.amount), 0)
          const pct = limit.limit_amount > 0 ? (spent / limit.limit_amount) * 100 : 0
          if (pct < 80) continue

          const label = await resolveCategoryLabel(admin, userId, limit.category)
          jobs.push({
            userId,
            kind: 'category_limit',
            refId: limit.id,
            periodKey: monthKey,
            title: pct >= 100 ? 'Límite superado' : 'Límite casi alcanzado',
            body: `Llevas ${Math.round(pct)}% del límite de ${label} este mes.`,
            url: '/premium',
          })
        }
      }

      // 3) Metas de ahorro cerca de su fecha límite y sin cumplir.
      if (savingsGoalReminder) {
        const { data: goals } = await admin.from('savings_goals').select('*').eq('user_id', userId)

        for (const goal of goals ?? []) {
          if (!isGoalNearDeadline(goal, today)) continue
          jobs.push({
            userId,
            kind: 'savings_goal',
            refId: goal.id,
            // Aviso único por meta (no se repite cada mes ni cada día dentro
            // de la ventana), a diferencia de suscripciones/límites que se
            // vuelven a evaluar mes a mes.
            periodKey: 'once',
            title: 'Meta por vencer',
            body: `"${goal.name}" vence pronto y todavía no llega al monto objetivo.`,
            url: '/premium',
          })
        }
      }
    }

    const result = await sendJobs(admin, jobs)
    return new Response(JSON.stringify(result), { headers: { 'Content-Type': 'application/json' } })
  } catch (err: any) {
    console.error('check-notifications error:', err?.message ?? err)
    return new Response(JSON.stringify({ error: err?.message ?? 'Error desconocido' }), { status: 500 })
  }
})

/** "Comida", "Servicios", etc. — resuelve también categorías personalizadas (uuid) consultando `categories`. */
async function resolveCategoryLabel(admin: any, userId: string, categoryId: string): Promise<string> {
  if (DEFAULT_CATEGORY_LABELS[categoryId]) return DEFAULT_CATEGORY_LABELS[categoryId]
  const { data } = await admin
    .from('categories')
    .select('name')
    .eq('user_id', userId)
    .eq('id', categoryId)
    .maybeSingle()
  return data?.name ?? categoryId
}

function formatCLP(amount: number): string {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(
    amount
  )
}

/**
 * Filtra los jobs ya notificados (vía `notifications_log`), envía el resto
 * por Web Push a cada dispositivo suscrito del usuario, y limpia las
 * suscripciones que el navegador ya dio de baja (404/410 del proveedor de
 * push, ej. el usuario desinstaló la PWA o borró los datos del sitio).
 */
async function sendJobs(admin: any, jobs: NotificationJob[]) {
  let sent = 0
  let skippedDuplicate = 0
  let failed = 0

  for (const job of jobs) {
    // `notifications_log` tiene una constraint única (user_id, kind, ref_id,
    // period_key): si el insert falla por conflicto, ya se avisó este mismo
    // evento en este mismo período y no hay que reenviarlo.
    const { error: logError } = await admin.from('notifications_log').insert({
      user_id: job.userId,
      kind: job.kind,
      ref_id: job.refId,
      period_key: job.periodKey,
    })
    if (logError) {
      skippedDuplicate++
      continue
    }

    const { data: subscriptions } = await admin
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', job.userId)

    for (const sub of subscriptions ?? []) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth_key } },
          JSON.stringify({ title: job.title, body: job.body, url: job.url })
        )
        sent++
      } catch (err: any) {
        failed++
        // 404/410: el navegador dio de baja esta suscripción (desinstaló la
        // PWA, borró datos del sitio, etc.) — ya no sirve, se borra para no
        // seguir intentando en cada corrida del cron.
        if (err?.statusCode === 404 || err?.statusCode === 410) {
          await admin.from('push_subscriptions').delete().eq('id', sub.id)
        } else {
          console.error('web-push error:', err?.statusCode, err?.body ?? err?.message)
        }
      }
    }
  }

  return { jobs: jobs.length, sent, skippedDuplicate, failed }
}
