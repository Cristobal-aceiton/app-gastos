export type IncomeType = 'fixed' | 'variable'

export interface Profile {
  id: string
  name: string | null
  purpose: string | null
  income_type: IncomeType | null
  fixed_salary: number
  is_premium: boolean
  premium_since: string | null
  created_at: string
  /** Fase 9 — se llenan solo cuando la suscripción viene de Stripe real (no del mock). */
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
}

/** Un perfil se considera "sin onboarding" si todavía no tiene nombre. */
export function needsOnboarding(profile: Profile | null): boolean {
  return !profile?.name
}
