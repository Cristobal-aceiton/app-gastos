// Fase 9 — Edge Function de Supabase: recibe los webhooks de Stripe y
// actualiza el perfil del usuario. Este es el único lugar que debe marcar
// is_premium = true/false para pagos reales — nunca el cliente
// directamente, porque si no cualquiera podría "activarse" Premium editando
// el frontend.
//
// TODAVÍA NO ESTÁ DESPLEGADA. Es un punto de partida listo para cuando
// tengas cuenta y credenciales de Stripe (ver README, sección "Fase 9").
//
// Desplegar (cuando tengas cuenta):
//   supabase functions deploy stripe-webhook --no-verify-jwt
//   (--no-verify-jwt porque Stripe llama a esta URL sin el JWT de Supabase)
//   supabase secrets set STRIPE_SECRET_KEY=sk_...
//   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
//
// Después, registra la URL pública de esta función
// (https://tu-proyecto.supabase.co/functions/v1/stripe-webhook) en el
// Dashboard de Stripe -> Developers -> Webhooks -> Add endpoint, escuchando
// al menos: checkout.session.completed, invoice.paid,
// customer.subscription.deleted. Stripe te da el STRIPE_WEBHOOK_SECRET
// (whsec_...) al crear ese endpoint — es lo que prueba que la notificación
// vino de verdad de Stripe y no de cualquiera.
//
// Variables de entorno (Secrets del proyecto):
//   STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET
//   SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY -> inyectadas automáticamente

// deno-lint-ignore-file no-explicit-any
import Stripe from 'npm:stripe@17'
import { createClient } from 'jsr:@supabase/supabase-js@2'

Deno.serve(async (req: Request) => {
  const secretKey = Deno.env.get('STRIPE_SECRET_KEY')!
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!
  const stripe = new Stripe(secretKey, { apiVersion: '2024-12-18.acacia' })
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

  const signature = req.headers.get('stripe-signature')
  const body = await req.text()

  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature!, webhookSecret)
  } catch (err: any) {
    console.error('Firma de Stripe inválida:', err?.message)
    return new Response('firma inválida', { status: 400 })
  }

  try {
    switch (event.type) {
      // Se dispara justo cuando el usuario termina el Checkout. Todavía no
      // significa que el primer cobro esté aprobado (eso lo confirma
      // invoice.paid) — aquí solo guardamos a qué customer/suscripción de
      // Stripe corresponde este usuario.
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.client_reference_id
        if (userId) {
          await supabase
            .from('profiles')
            .update({
              stripe_customer_id: session.customer as string,
              stripe_subscription_id: session.subscription as string,
            })
            .eq('id', userId)
        }
        break
      }

      // El pago (inicial o de una renovación mensual) fue aprobado: acá es
      // donde de verdad se activa Premium.
      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice
        const subscriptionId = invoice.subscription as string | null
        if (subscriptionId) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, premium_since')
            .eq('stripe_subscription_id', subscriptionId)
            .maybeSingle()

          if (profile) {
            await supabase
              .from('profiles')
              .update({
                is_premium: true,
                // No pisa la fecha original en cada renovación mensual.
                premium_since: profile.premium_since ?? new Date().toISOString().slice(0, 10),
                stripe_last_payment_id: invoice.payment_intent as string,
              })
              .eq('id', profile.id)
          }
        }
        break
      }

      // La suscripción se canceló (ya sea porque el usuario la canceló desde
      // el Customer Portal, ya sea por un pago fallido que Stripe reintentó
      // y no pudo cobrar).
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        await supabase
          .from('profiles')
          .update({ is_premium: false })
          .eq('stripe_subscription_id', subscription.id)
        break
      }
    }
  } catch (err: any) {
    // Devolvemos 200 igual: Stripe reintenta agresivamente notificaciones
    // que fallan, y un error puntual de nuestro lado no debería generar una
    // tormenta de reintentos. El detalle queda en los logs de la función.
    console.error('stripe-webhook error:', err?.message ?? err)
  }

  return new Response('ok', { status: 200 })
})
