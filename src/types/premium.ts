export interface SavingsGoal {
  id: string
  user_id: string
  name: string
  target_amount: number
  saved_amount: number
  deadline: string
  created_at: string
}

export interface Subscription {
  id: string
  user_id: string
  name: string
  amount: number
  billing_day: number
  category: string
  active: boolean
}

export interface CategoryLimit {
  id: string
  user_id: string
  category: string
  limit_amount: number
  /** Primer día del mes al que aplica, ej. "2026-09-01". */
  month_year: string
}
