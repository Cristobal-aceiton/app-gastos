import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createSupabaseMock, type SupabaseMock } from '../test/supabaseMock'
import { createTestQueryClient, wrapperWithQueryClient } from '../test/queryClientWrapper'
import { useDashboardData, type Transaction } from './useDashboardData'

let supabaseMock: SupabaseMock

vi.mock('../lib/supabase', () => ({
  get supabase() {
    return supabaseMock
  },
}))

function tx(overrides: Partial<Transaction>): Transaction {
  return {
    id: crypto.randomUUID(),
    type: 'expense',
    category: 'comida',
    amount: 0,
    description: null,
    date: '2026-09-05',
    created_at: '2026-09-05T12:00:00.000Z',
    ...overrides,
  }
}

beforeEach(() => {
  supabaseMock = createSupabaseMock()
})

describe('useDashboardData', () => {
  it('calcula ingresos, gastos, balance y desglose por categoría', async () => {
    const transactions: Transaction[] = [
      tx({ type: 'income', category: 'sueldo', amount: 500000 }),
      tx({ type: 'expense', category: 'comida', amount: 20000 }),
      tx({ type: 'expense', category: 'comida', amount: 15000 }),
      tx({ type: 'expense', category: 'transporte', amount: 10000 }),
    ]
    supabaseMock.queue('transactions', { data: transactions, error: null })

    const queryClient = createTestQueryClient()
    const { result } = renderHook(() => useDashboardData('user-calc-1'), {
      wrapper: wrapperWithQueryClient(queryClient),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data?.totalIncome).toBe(500000)
    expect(result.current.data?.totalExpense).toBe(45000)
    expect(result.current.data?.balance).toBe(455000)
    expect(result.current.data?.categoryBreakdown).toEqual([
      { category: 'comida', amount: 35000 },
      { category: 'transporte', amount: 10000 },
    ])
  })

  it('el desglose por categoría solo considera gastos, no ingresos', async () => {
    const transactions: Transaction[] = [
      tx({ type: 'income', category: 'sueldo', amount: 100000 }),
      tx({ type: 'expense', category: 'salud', amount: 5000 }),
    ]
    supabaseMock.queue('transactions', { data: transactions, error: null })

    const queryClient = createTestQueryClient()
    const { result } = renderHook(() => useDashboardData('user-calc-2'), {
      wrapper: wrapperWithQueryClient(queryClient),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.categoryBreakdown).toEqual([{ category: 'salud', amount: 5000 }])
  })

  it('recentTransactions se limita a las últimas 5, en el orden ya devuelto por Supabase', async () => {
    const transactions: Transaction[] = Array.from({ length: 8 }, (_, i) =>
      tx({ id: `t${i}`, type: 'expense', amount: 1000 })
    )
    supabaseMock.queue('transactions', { data: transactions, error: null })

    const queryClient = createTestQueryClient()
    const { result } = renderHook(() => useDashboardData('user-recent'), {
      wrapper: wrapperWithQueryClient(queryClient),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.recentTransactions).toHaveLength(5)
    expect(result.current.data?.recentTransactions.map((t) => t.id)).toEqual([
      't0',
      't1',
      't2',
      't3',
      't4',
    ])
  })

  it('sin transacciones, devuelve todo en cero y arreglos vacíos', async () => {
    supabaseMock.queue('transactions', { data: [], error: null })

    const queryClient = createTestQueryClient()
    const { result } = renderHook(() => useDashboardData('user-empty'), {
      wrapper: wrapperWithQueryClient(queryClient),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual({
      totalIncome: 0,
      totalExpense: 0,
      balance: 0,
      recentTransactions: [],
      categoryBreakdown: [],
      fromCache: false,
    })
  })

  it('propaga el error de Supabase como error de la query', async () => {
    supabaseMock.queue('transactions', { data: null, error: { message: 'boom' } })

    const queryClient = createTestQueryClient()
    const { result } = renderHook(() => useDashboardData('user-error'), {
      wrapper: wrapperWithQueryClient(queryClient),
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })

  it('no ejecuta la query si no hay userId (enabled: false)', () => {
    const queryClient = createTestQueryClient()
    const { result } = renderHook(() => useDashboardData(undefined), {
      wrapper: wrapperWithQueryClient(queryClient),
    })

    expect(result.current.fetchStatus).toBe('idle')
    expect(supabaseMock.from).not.toHaveBeenCalled()
  })

  it('Fase 12.5: si Supabase falla pero hay una respuesta previa en caché, la sirve marcada con fromCache', async () => {
    // Primera carga: exitosa, se guarda en caché.
    const firstLoad: Transaction[] = [tx({ type: 'income', amount: 100000 })]
    supabaseMock.queue('transactions', { data: firstLoad, error: null })

    const queryClient = createTestQueryClient()
    const { result, rerender } = renderHook(({ userId }) => useDashboardData(userId), {
      wrapper: wrapperWithQueryClient(queryClient),
      initialProps: { userId: 'user-cache-test' },
    })

    await waitFor(() => expect(result.current.data?.fromCache).toBe(false))
    expect(result.current.data?.totalIncome).toBe(100000)

    // Segunda carga (ej. tras reabrir la app sin red): Supabase falla.
    supabaseMock.queue('transactions', { data: null, error: { message: 'network error' } })
    await queryClient.invalidateQueries({ queryKey: ['dashboard', 'user-cache-test'] })
    rerender({ userId: 'user-cache-test' })

    await waitFor(() => expect(result.current.data?.fromCache).toBe(true))
    // Sigue mostrando el último balance conocido, no una pantalla en blanco.
    expect(result.current.data?.totalIncome).toBe(100000)
  })
})
