export type LimitStatus = 'ok' | 'warn' | 'over'

/** <80% del límite: normal. 80-99%: alerta amarilla. 100%+: rojo (se muestra con "shake" en la UI). */
export function getLimitStatus(pct: number): LimitStatus {
  if (pct >= 100) return 'over'
  if (pct >= 80) return 'warn'
  return 'ok'
}

/** Primer día del mes de `date` en formato ISO (YYYY-MM-01), como se guarda en `category_limits.month_year`. */
export function monthStartISO(date: Date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

/**
 * El día de cobro se "clampa" al último día del mes: una suscripción con
 * `billing_day = 31` cobra el 28 (o 29) de febrero, no se salta el mes.
 */
export function effectiveBillingDay(billingDay: number, date: Date): number {
  return Math.min(billingDay, daysInMonth(date.getFullYear(), date.getMonth()))
}

/** true si hoy corresponde al día de cobro de la suscripción. */
export function shouldChargeToday(sub: { billing_day: number }, date: Date = new Date()): boolean {
  return date.getDate() === effectiveBillingDay(sub.billing_day, date)
}

/**
 * Fase 13.2 — true si la suscripción se cobrará dentro de los próximos
 * `daysAhead` días (inclusive), contando desde `date`. Usa el mismo
 * clamping que `shouldChargeToday`, así que una suscripción con
 * `billing_day = 31` en un mes de 30 días avisa correctamente sobre el
 * cobro del día 30, no del 31 (que nunca ocurre ese mes).
 */
export function willChargeSoon(sub: { billing_day: number }, date: Date = new Date(), daysAhead = 3): boolean {
  for (let offset = 1; offset <= daysAhead; offset++) {
    const future = new Date(date.getFullYear(), date.getMonth(), date.getDate() + offset)
    if (future.getDate() === effectiveBillingDay(sub.billing_day, future)) return true
  }
  return false
}

/**
 * Fase 13.2 — true si una meta de ahorro está "cerca" de su fecha límite
 * (dentro de `daysAhead` días) y todavía no se alcanzó el monto objetivo.
 * Una meta ya cumplida no necesita recordatorio aunque la fecha esté cerca.
 */
export function isGoalNearDeadline(
  goal: { target_amount: number; saved_amount: number; deadline: string },
  date: Date = new Date(),
  daysAhead = 7
): boolean {
  if (goal.saved_amount >= goal.target_amount) return false
  const deadline = new Date(`${goal.deadline}T00:00:00`)
  const today = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const msPerDay = 24 * 60 * 60 * 1000
  const daysLeft = Math.round((deadline.getTime() - today.getTime()) / msPerDay)
  return daysLeft >= 0 && daysLeft <= daysAhead
}

/** Etiqueta legible de la próxima fecha de cobro (ej. "15 sept"), para mostrar en la UI. */
export function nextChargeLabel(billingDay: number, from: Date = new Date()): string {
  const todayDay = from.getDate()
  const dayThisMonth = effectiveBillingDay(billingDay, from)

  const target =
    dayThisMonth >= todayDay
      ? new Date(from.getFullYear(), from.getMonth(), dayThisMonth)
      : (() => {
          const nextMonth = new Date(from.getFullYear(), from.getMonth() + 1, 1)
          return new Date(nextMonth.getFullYear(), nextMonth.getMonth(), effectiveBillingDay(billingDay, nextMonth))
        })()

  return target.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })
}
