// Fase 11 — Edge Function de Supabase: activa el Premium MOCK (sin cobro
// real, ver src/lib/payments.ts) para el usuario dueño del JWT que llama.
//
// Reemplaza al `supabase.from('profiles').update({ is_premium: true }, ...)`
// que hasta la Fase 9 hacía el cliente directamente. Desde la Fase 11 eso ya
// no es posible: el trigger `protect_premium_columns` (ver
// supabase/schema.sql) rechaza cualquier UPDATE a `is_premium` que no venga
// del service_role, y esta función es la única que usa el service_role para
// hacerlo — después de confirmar, vía el JWT, que el usuario está pidiendo
// activar SU PROPIO Premium (ver `_shared/getUserFromRequest.ts`).
//
// Sigue siendo un mock: no verifica ningún pago real, solo simula que ya se
// pagó (igual que `MockPaymentModal`/`runMockCheckout`). El día que haya
// Stripe/Mercado Pago real, esta función deja de usarse — el webhook de la
// pasarela (ver `stripe-webhook/index.ts`) es quien debe marcar
// `is_premium = true` en ese caso, con la misma Service Role Key.
//
// Desplegar:
//   supabase functions deploy activate-premium-mock
//   (sin --no-verify-jwt: esta función SÍ requiere el JWT de sesión del
//   usuario, es la base de su seguridad)
//
// Variables de entorno: SUPABASE_URL, SUPABASE_ANON_KEY y
// SUPABASE_SERVICE_ROLE_KEY se inyectan automáticamente, no hace falta
// configurarlas.

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

    // No pisa premium_since si el usuario ya era Premium (ej. doble click).
    const { data: existing } = await admin
      .from('profiles')
      .select('premium_since')
      .eq('id', user.id)
      .maybeSingle()

    const { error: updateError } = await admin
      .from('profiles')
      .update({
        is_premium: true,
        premium_since: existing?.premium_since ?? new Date().toISOString().slice(0, 10),
      })
      .eq('id', user.id)

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
