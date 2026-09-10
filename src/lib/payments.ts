/**
 * Fase 9 — capa de pagos para la suscripción Premium.
 *
 * Hoy no hay cuenta ni credenciales de Stripe, así que la app usa el flujo
 * MOCK de abajo: simula la latencia de una pasarela real y siempre resuelve
 * con éxito. `MockPaymentModal` es el único lugar que lo invoca.
 *
 * Cuando tengas cuenta y credenciales de Stripe (ver sección "Fase 9" en
 * README.md para los pasos — incluye la salvedad de que Stripe no opera
 * cuentas de comerciante en Chile directamente), para activar el cobro
 * real hay que:
 *
 * 1. Desplegar las dos Edge Functions de `supabase/functions/`
 *    (`create-checkout-session` y `stripe-webhook`) con tu Secret Key.
 * 2. En cada lugar donde hoy se abre `<MockPaymentModal />` (Premium.tsx,
 *    Onboarding.tsx), cambiar el flujo para llamar a
 *    `createStripeCheckoutSession(userId)` y redirigir a `url` en vez de
 *    mostrar el modal mock.
 * 3. El webhook (`stripe-webhook`) es el que realmente marca
 *    `is_premium = true` en Supabase cuando Stripe confirma el pago — no
 *    lo hace el cliente, para que no se pueda "activar Premium" con solo
 *    editar el frontend.
 * 4. Para que el usuario pueda cancelar o cambiar su medio de pago, Stripe
 *    ofrece un Customer Portal hospedado (no hay que construir esa pantalla):
 *    ver la nota en Settings.tsx.
 *
 * No hace falta borrar nada de esto para migrar: `runMockCheckout` puede
 * convivir con el flujo real detrás de `PAYMENT_PROVIDER` mientras se prueba.
 */

export type PaymentResult = { success: true } | { success: false; error: string }
export type MockActivationResult = { success: true } | { success: false; error: string }

/** 'mock' (default) o 'stripe', configurable con VITE_PAYMENT_PROVIDER en .env */
export const PAYMENT_PROVIDER: 'mock' | 'stripe' =
  (import.meta.env.VITE_PAYMENT_PROVIDER as 'mock' | 'stripe' | undefined) ?? 'mock'

/**
 * Simula una pasarela de pago real: ~1.8s de "procesando" y éxito garantizado
 * (no hay tarjetas que rechazar todavía, es solo para probar el flujo UI).
 */
export function runMockCheckout(): Promise<PaymentResult> {
  return new Promise((resolve) => {
    setTimeout(() => resolve({ success: true }), 1800)
  })
}

/**
 * Placeholder para cuando haya cuenta de Stripe real y las Edge Functions
 * estén desplegadas. Llama a `create-checkout-session`, que crea una Stripe
 * Checkout Session en modo suscripción usando la Secret Key (nunca en el
 * cliente) y devuelve la URL a la que hay que redirigir al usuario.
 */
export async function createStripeCheckoutSession(userId: string): Promise<{ url: string }> {
  const functionsUrl = resolveFunctionsUrl()
  if (!functionsUrl) {
    throw new Error(
      'Stripe no está configurado todavía. Sigue los pasos de la sección "Fase 9" del README para obtener tus credenciales y desplegar las Edge Functions.'
    )
  }

  const response = await fetch(`${functionsUrl}/create-checkout-session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId }),
  })

  if (!response.ok) {
    throw new Error('No pudimos iniciar el pago con Stripe. Intenta de nuevo.')
  }

  return response.json()
}

/**
 * Fase 11 — desde acá, `is_premium` y los campos de Stripe en `profiles` ya
 * NO se pueden actualizar con un `update()` directo desde el cliente (ver el
 * trigger `protect_premium_columns` en `supabase/schema.sql`): cualquier
 * intento devuelve un error de Postgres. Solo el `service_role`, que usan
 * estas dos Edge Functions, puede tocarlos — así nadie puede "activarse"
 * Premium gratis editando el frontend o la consola del navegador.
 *
 * `accessToken` es `session.access_token` de Supabase Auth (el JWT de la
 * sesión activa); la función usa ese JWT para resolver de quién es la
 * cuenta, así que ignora cualquier id que se le pase por fuera.
 */
function resolveFunctionsUrl(): string | undefined {
  const explicit = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL as string | undefined
  if (explicit) return explicit
  // Fallback: se puede derivar de la URL del proyecto sin configurar nada
  // extra, ya que sigue siempre el mismo patrón en Supabase.
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
  return supabaseUrl ? `${supabaseUrl.replace(/\/$/, '')}/functions/v1` : undefined
}

async function callPremiumMockFunction(name: 'activate-premium-mock' | 'cancel-premium-mock', accessToken: string) {
  const functionsUrl = resolveFunctionsUrl()
  if (!functionsUrl) {
    return {
      success: false,
      error: 'Falta configurar VITE_SUPABASE_URL. Revisa tu archivo .env.',
    } as const
  }

  try {
    const response = await fetch(`${functionsUrl}/${name}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      const body = await response.json().catch(() => null)
      return {
        success: false,
        error:
          body?.error ??
          `No pudimos completar la operación (${response.status}). Si es la primera vez, revisa que hayas desplegado "${name}" (ver README, sección "Fase 11").`,
      } as const
    }

    return { success: true } as const
  } catch {
    return {
      success: false,
      error: 'No pudimos conectar con el servidor. Revisa tu conexión e intenta de nuevo.',
    } as const
  }
}

/** Activa el Premium mock llamando a la Edge Function `activate-premium-mock`. */
export function activatePremiumMock(accessToken: string): Promise<MockActivationResult> {
  return callPremiumMockFunction('activate-premium-mock', accessToken)
}

/** Cancela el Premium mock llamando a la Edge Function `cancel-premium-mock`. */
export function cancelPremiumMock(accessToken: string): Promise<MockActivationResult> {
  return callPremiumMockFunction('cancel-premium-mock', accessToken)
}
