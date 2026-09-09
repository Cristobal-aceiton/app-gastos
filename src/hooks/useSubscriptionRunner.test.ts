import { renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createSupabaseMock, type SupabaseMock } from '../test/supabaseMock'
import { createTestQueryClient, wrapperWithQueryClient } from '../test/queryClientWrapper'
import { useSubscriptionRunner } from './useSubscriptionRunner'
import type { Subscription } from '../types/premium'

let supabaseMock: SupabaseMock

vi.mock('../lib/supabase', () => ({
  get supabase() {
    return supabaseMock
  },
}))

function sub(overrides: Partial<Subscription> = {}): Subscription {
  return {
    id: 'sub-1',
    user_id: 'user-1',
    name: 'Netflix',
    amount: 9990,
    billing_day: 15,
    category: 'servicios',
    active: true,
    ...overrides,
  }
}

beforeEach(() => {
  supabaseMock = createSupabaseMock()
  // Solo se mockea `Date`: si se fakean también los timers de setTimeout,
  // `waitFor` de Testing Library (que depende de ellos) nunca resuelve.
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 8, 15)) // 15 de septiembre de 2026: día de cobro de Netflix
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useSubscriptionRunner', () => {
  it('crea la transacción cuando hoy es el día de cobro y no existe una este mes', async () => {
    supabaseMock.queue('subscriptions', { data: [sub()], error: null })
    supabaseMock.queue('transactions', { data: [], error: null }) // chequeo: no existe todavía
    supabaseMock.queue('transactions', { data: null, error: null }) // insert

    const queryClient = createTestQueryClient()
    renderHook(() => useSubscriptionRunner('user-1', true), {
      wrapper: wrapperWithQueryClient(queryClient),
    })

    await waitFor(() => expect(supabaseMock.calls.length).toBe(3))

    expect(supabaseMock.calls.map((c) => c.table)).toEqual(['subscriptions', 'transactions', 'transactions'])
  })

  it('NO cobra dos veces: si ya existe una transacción de esa suscripción este mes, no inserta otra', async () => {
    supabaseMock.queue('subscriptions', { data: [sub()], error: null })
    supabaseMock.queue('transactions', {
      data: [{ id: 'existing-tx' }],
      error: null,
    })
    // Si el hook (incorrectamente) insertara igual, esta seria la 3ra llamada a 'transactions' y la detectaríamos.

    const queryClient = createTestQueryClient()
    renderHook(() => useSubscriptionRunner('user-1', true), {
      wrapper: wrapperWithQueryClient(queryClient),
    })

    await waitFor(() => expect(supabaseMock.calls.length).toBe(2))
    expect(supabaseMock.calls.map((c) => c.table)).toEqual(['subscriptions', 'transactions'])
  })

  it('no hace nada si el usuario no es Premium', async () => {
    const queryClient = createTestQueryClient()
    renderHook(() => useSubscriptionRunner('user-1', false), {
      wrapper: wrapperWithQueryClient(queryClient),
    })

    await Promise.resolve()
    expect(supabaseMock.from).not.toHaveBeenCalled()
  })

  it('no hace nada si no hay usuario', async () => {
    const queryClient = createTestQueryClient()
    renderHook(() => useSubscriptionRunner(undefined, true), {
      wrapper: wrapperWithQueryClient(queryClient),
    })

    await Promise.resolve()
    expect(supabaseMock.from).not.toHaveBeenCalled()
  })

  it('respeta el clamping: una suscripción con billing_day 31 cobra el 30 de septiembre', async () => {
    vi.setSystemTime(new Date(2026, 8, 30)) // 30 de septiembre (mes de 30 días)
    supabaseMock.queue('subscriptions', { data: [sub({ billing_day: 31 })], error: null })
    supabaseMock.queue('transactions', { data: [], error: null })
    supabaseMock.queue('transactions', { data: null, error: null })

    const queryClient = createTestQueryClient()
    renderHook(() => useSubscriptionRunner('user-1', true), {
      wrapper: wrapperWithQueryClient(queryClient),
    })

    await waitFor(() => expect(supabaseMock.calls.length).toBe(3))
  })

  it('una suscripción con billing_day 31 NO cobra el 29 de septiembre (todavía no es el día clampado)', async () => {
    vi.setSystemTime(new Date(2026, 8, 29))
    supabaseMock.queue('subscriptions', { data: [sub({ billing_day: 31 })], error: null })

    const queryClient = createTestQueryClient()
    renderHook(() => useSubscriptionRunner('user-1', true), {
      wrapper: wrapperWithQueryClient(queryClient),
    })

    await waitFor(() => expect(supabaseMock.calls.length).toBe(1))
    expect(supabaseMock.calls.map((c) => c.table)).toEqual(['subscriptions'])
  })
})
