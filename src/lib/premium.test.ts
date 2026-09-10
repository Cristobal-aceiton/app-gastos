import { describe, expect, it } from 'vitest'
import {
  effectiveBillingDay,
  getLimitStatus,
  isGoalNearDeadline,
  monthStartISO,
  nextChargeLabel,
  shouldChargeToday,
  willChargeSoon,
} from './premium'

describe('getLimitStatus', () => {
  it('devuelve "ok" por debajo del 80%', () => {
    expect(getLimitStatus(0)).toBe('ok')
    expect(getLimitStatus(79.9)).toBe('ok')
  })

  it('devuelve "warn" entre 80% y 99.99%', () => {
    expect(getLimitStatus(80)).toBe('warn')
    expect(getLimitStatus(99.9)).toBe('warn')
  })

  it('devuelve "over" a partir del 100%', () => {
    expect(getLimitStatus(100)).toBe('over')
    expect(getLimitStatus(150)).toBe('over')
  })
})

describe('monthStartISO', () => {
  it('devuelve el primer día del mes en formato YYYY-MM-01', () => {
    expect(monthStartISO(new Date(2026, 8, 15))).toBe('2026-09-01') // mes 8 = septiembre (0-index)
  })

  it('rellena con cero el mes de un solo dígito', () => {
    expect(monthStartISO(new Date(2026, 0, 5))).toBe('2026-01-01')
  })
})

describe('effectiveBillingDay (clamping)', () => {
  it('devuelve el mismo día si el mes lo tiene', () => {
    expect(effectiveBillingDay(15, new Date(2026, 8, 1))).toBe(15) // septiembre tiene 30 días
  })

  it('clampa el día 31 a 30 en un mes de 30 días', () => {
    expect(effectiveBillingDay(31, new Date(2026, 8, 1))).toBe(30) // septiembre 2026
  })

  it('clampa el día 31 a 28 en febrero de un año no bisiesto', () => {
    expect(effectiveBillingDay(31, new Date(2026, 1, 1))).toBe(28) // 2026 no es bisiesto
  })

  it('clampa el día 31 a 29 en febrero de un año bisiesto', () => {
    expect(effectiveBillingDay(31, new Date(2028, 1, 1))).toBe(29) // 2028 es bisiesto
  })

  it('no altera un día que ya cabe en cualquier mes', () => {
    expect(effectiveBillingDay(5, new Date(2026, 1, 1))).toBe(5)
  })
})

describe('shouldChargeToday', () => {
  it('es true cuando hoy coincide con el día de cobro', () => {
    const today = new Date(2026, 8, 15)
    expect(shouldChargeToday({ billing_day: 15 }, today)).toBe(true)
  })

  it('es false cuando hoy no coincide', () => {
    const today = new Date(2026, 8, 14)
    expect(shouldChargeToday({ billing_day: 15 }, today)).toBe(false)
  })

  it('cobra el último día de febrero (28) para una suscripción con billing_day 31, en año no bisiesto', () => {
    expect(shouldChargeToday({ billing_day: 31 }, new Date(2026, 1, 28))).toBe(true)
    expect(shouldChargeToday({ billing_day: 31 }, new Date(2026, 1, 27))).toBe(false)
  })

  it('cobra el último día de febrero (29) para una suscripción con billing_day 31, en año bisiesto', () => {
    expect(shouldChargeToday({ billing_day: 31 }, new Date(2028, 1, 29))).toBe(true)
    expect(shouldChargeToday({ billing_day: 31 }, new Date(2028, 1, 28))).toBe(false)
  })

  it('cobra el 30 de abril para una suscripción con billing_day 31 (abril tiene 30 días)', () => {
    expect(shouldChargeToday({ billing_day: 31 }, new Date(2026, 3, 30))).toBe(true)
  })
})

describe('nextChargeLabel', () => {
  it('muestra el día de este mes si el cobro todavía no pasó', () => {
    const from = new Date(2026, 8, 10)
    expect(nextChargeLabel(15, from)).toMatch(/15/)
  })

  it('salta al mes siguiente si el día de cobro de este mes ya pasó', () => {
    const from = new Date(2026, 8, 20) // 20 de septiembre
    const label = nextChargeLabel(15, from) // próximo cobro: 15 de octubre
    expect(label).toMatch(/15/)
    expect(label.toLowerCase()).toContain('oct')
  })

  it('el día de cobro del mes actual clampado cuenta como "hoy es el día", no como ya pasado', () => {
    // billing_day=31 en septiembre (30 días): el 30 de septiembre debe mostrarse
    // como el próximo cobro de ESTE mes, no saltar a octubre.
    const from = new Date(2026, 8, 30)
    const label = nextChargeLabel(31, from)
    expect(label).toMatch(/30/)
    expect(label.toLowerCase()).toContain('sept')
  })
})

describe('willChargeSoon (Fase 13.2)', () => {
  it('es true si el cobro cae mañana', () => {
    expect(willChargeSoon({ billing_day: 16 }, new Date(2026, 8, 15))).toBe(true)
  })

  it('es true si el cobro cae dentro de la ventana de 3 días (hoy + 3)', () => {
    expect(willChargeSoon({ billing_day: 18 }, new Date(2026, 8, 15))).toBe(true)
  })

  it('es false si el cobro cae fuera de la ventana', () => {
    expect(willChargeSoon({ billing_day: 25 }, new Date(2026, 8, 15))).toBe(false)
  })

  it('es false el día mismo del cobro (ese aviso ya lo maneja shouldChargeToday, no este)', () => {
    expect(willChargeSoon({ billing_day: 15 }, new Date(2026, 8, 15))).toBe(false)
  })

  it('respeta el clamping de fin de mes: billing_day=31 en septiembre avisa el 27 (cobra el 30)', () => {
    expect(willChargeSoon({ billing_day: 31 }, new Date(2026, 8, 27))).toBe(true)
    expect(willChargeSoon({ billing_day: 31 }, new Date(2026, 8, 26))).toBe(false)
  })

  it('respeta una ventana personalizada de días', () => {
    expect(willChargeSoon({ billing_day: 20 }, new Date(2026, 8, 15), 7)).toBe(true)
    expect(willChargeSoon({ billing_day: 20 }, new Date(2026, 8, 15), 2)).toBe(false)
  })
})

describe('isGoalNearDeadline (Fase 13.2)', () => {
  const base = { target_amount: 100000, saved_amount: 40000, deadline: '2026-09-22' }

  it('es true si faltan pocos días y la meta no está cumplida', () => {
    expect(isGoalNearDeadline(base, new Date(2026, 8, 15))).toBe(true)
  })

  it('es false si faltan muchos días', () => {
    expect(isGoalNearDeadline(base, new Date(2026, 8, 1))).toBe(false)
  })

  it('es false si la meta ya se cumplió, aunque la fecha esté cerca', () => {
    expect(isGoalNearDeadline({ ...base, saved_amount: 100000 }, new Date(2026, 8, 15))).toBe(false)
  })

  it('es true el día mismo de la fecha límite', () => {
    expect(isGoalNearDeadline(base, new Date(2026, 8, 22))).toBe(true)
  })

  it('es false si la fecha límite ya pasó', () => {
    expect(isGoalNearDeadline(base, new Date(2026, 8, 23))).toBe(false)
  })
})
