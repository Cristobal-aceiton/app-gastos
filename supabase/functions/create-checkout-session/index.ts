// Fase 9 — Edge Function de Supabase: crea una Stripe Checkout Session en
// modo suscripción para un usuario y devuelve la URL a la que hay que
// redirigirlo para pagar.
//
// TODAVÍA NO ESTÁ DESPLEGADA. Es un punto de partida listo para cuando
// tengas cuenta y credenciales de Stripe (ver README, sección "Fase 9" —
// incluye la salvedad de que Stripe no opera cuentas de comerciante en
// Chile directamente).
//
// Desplegar (cuando tengas cuenta):
//   supabase functions deploy create-checkout-session
//   supabase secrets set STRIPE_SECRET_KEY=sk_live_... (o sk_test_... mientras pruebas)
//   supabase secrets set STRIPE_PRICE_ID=price_...
//   supabase secrets set STRIPE_SUCCESS_URL=https://tu-dominio.com/premium-success
//   supabase secrets set STRIPE_CANCEL_URL=https://tu-dominio.com/premium
//
// STRIPE_PRICE_ID sale de crear, en el Dashboard de Stripe, un Producto
// "Gastos Premium" con un Precio recurrente mensual (Products -> Add
// product -> Recurring -> Monthly). Ojo: CLP es una moneda "de cero
// decimales" en Stripe (como JPY), así que si usas CLP el monto se ingresa
// tal cual (1500), sin multiplicar por 100 como con USD/EUR.
//
// Variables de entorno que necesita esta función (se configuran como
// "Secrets" del proyecto de Supabase, no en el código ni en el .env del
// cliente):
//   STRIPE_SECRET_KEY     -> Secret Key de Stripe (sk_...)
//   STRIPE_PRICE_ID       -> id del Precio recurrente creado en el Dashboard
//   STRIPE_SUCCESS_URL / STRIPE_CANCEL_URL -> a dónde vuelve el usuario
//   SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY -> se inyectan automáticamente

// deno-lint-ignore-file no-explicit-any
import Stripe from 'npm:stripe@17'
import { createClient } from 'jsr:@supabase/supabase-js@2'

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const { user_id } = await req.json()
    if (!user_id) {
      return new Response(JSON.stringify({ error: 'user_id es requerido' }), { status: 400 })
    }

    const secretKey = Deno.env.get('STRIPE_SECRET_KEY')
    const priceId = Deno.env.get('STRIPE_PRICE_ID')
    const successUrl = Deno.env.get('STRIPE_SUCCESS_URL')
    const cancelUrl = Deno.env.get('STRIPE_CANCEL_URL')
    if (!secretKey || !priceId || !successUrl || !cancelUrl) {
      return new Response(JSON.stringify({ error: 'Faltan secrets de Stripe en la función' }), { status: 500 })
    }

    const stripe = new Stripe(secretKey, { apiVersion: '2024-12-18.acacia' })
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(user_id)
    if (userError || !userData?.user?.email) {
      return new Response(JSON.stringify({ error: 'No se encontró el usuario' }), { status: 404 })
    }

    // Si el usuario ya tiene un customer de Stripe de un intento anterior, lo
    // reusamos en vez de crear uno nuevo cada vez que abre el checkout.
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user_id)
      .maybeSingle()

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      customer: profile?.stripe_customer_id ?? undefined,
      customer_email: profile?.stripe_customer_id ? undefined : userData.user.email,
      client_reference_id: user_id,
      subscription_data: { metadata: { user_id } },
      success_url: successUrl,
      cancel_url: cancelUrl,
    })

    if (!session.url) {
      return new Response(JSON.stringify({ error: 'Stripe no devolvió una URL de checkout' }), { status: 502 })
    }

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message ?? 'Error desconocido' }), { status: 500 })
  }
})
