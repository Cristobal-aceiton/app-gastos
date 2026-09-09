// Fase 11 — Edge Function de Supabase: cancela el Premium MOCK del usuario
// dueño del JWT que llama (marca is_premium = false).
//
// Reemplaza al `supabase.from('profiles').update({ is_premium: false }, ...)`
// que hacía "Cancelar suscripción" en Settings.tsx. Mismo motivo que
// `activate-premium-mock`: desde la Fase 11 el cliente ya no puede tocar
// `is_premium` directamente (ver trigger `protect_premium_columns` en
// supabase/schema.sql).
//
// Cuando haya una pasarela real conectada, este botón conviene reemplazarlo
// por un link al Customer Portal hospedado de Stripe (o el equivalente de
// Mercado Pago) en vez de seguir llamando a esta función — ver la nota en
// Settings.tsx y la sección "Activar pagos reales" del README.
//
// Desplegar:
//   supabase functions deploy cancel-premium-mock
//   (sin --no-verify-jwt, mismo motivo que activate-premium-mock)

// deno-lint-ignore-file no-explicit-any
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { getUserFromRequest } from '../_shared/getUserFromRequest.ts'

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
  }

  const { user, error: authError } = await getUserFromRequest(req)
  if (!user) {
    return new Response(JSON.stringify({ error: authError }), { status: 401 })
  }

  try {
    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    const { error: updateError } = await admin.from('profiles').update({ is_premium: false }).eq('id', user.id)

    if (updateError) {
      return new Response(JSON.stringify({ error: updateError.message }), { status: 500 })
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message ?? 'Error desconocido' }), { status: 500 })
  }
})
