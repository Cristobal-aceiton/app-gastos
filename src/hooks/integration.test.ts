import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createSupabaseMock, type SupabaseMock } from '../test/supabaseMock'
import { createTestQueryClient, wrapperWithQueryClient } from '../test/queryClientWrapper'
import { useDashboardData, type Transaction } from './useDashboardData'
import { useCreateCategory, useCustomCategories, useDeleteCategory } from './useCategories'

let supabaseMock: SupabaseMock

vi.mock('../lib/supabase', () => ({
  get supabase() {
    return supabaseMock
  },
}))

beforeEach(() => {
  supabaseMock = createSupabaseMock()
})

/**
 * Estos tests no montan las pantallas reales (AddTransaction, CategoriesSettings):
 * eso implicaría levantar router + framer-motion + estilos, que no aporta nada a
 * la lógica que queremos proteger. En cambio, ejercitan el contrato real entre
 * hooks que sí comparten esas pantallas: el mismo `queryClient`, las mismas
 * `queryKey`, y la invalidación cruzada que hace que una pantalla se entere de
 * lo que hizo otra — que es exactamente lo que se rompería si alguien cambia
 * una queryKey en un solo lugar.
 */
describe('Integración: agregar transacción refleja en el Dashboard', () => {
  it('tras insertar y invalidar ["dashboard", userId], el Dashboard recalcula sus totales', async () => {
    const queryClient = createTestQueryClient()
    const userId = 'user-1'

    const initialTransactions: Transaction[] = [
      {
        id: 't1',
        type: 'expense',
        category: 'comida',
        amount: 10000,
        description: null,
        date: '2026-09-01',
        created_at: '2026-09-01T00:00:00.000Z',
      },
    ]
    supabaseMock.queue('transactions', { data: initialTransactions, error: null })

    const { result } = renderHook(() => useDashboardData(userId), {
      wrapper: wrapperWithQueryClient(queryClient),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.totalExpense).toBe(10000)

    // Simula lo que hace AddTransaction.tsx al guardar: INSERT en Supabase + invalidate.
    const newTransaction: Transaction = {
      id: 't2',
      type: 'expense',
      category: 'transporte',
      amount: 5000,
      description: null,
      date: '2026-09-02',
      created_at: '2026-09-02T00:00:00.000Z',
    }
    supabaseMock.queue('transactions', {
      data: [...initialTransactions, newTransaction],
      error: null,
    })

    await act(async () => {
      await queryClient.invalidateQueries({ queryKey: ['dashboard', userId] })
    })

    await waitFor(() => expect(result.current.data?.totalExpense).toBe(15000))
    expect(result.current.data?.categoryBreakdown).toEqual([
      { category: 'comida', amount: 10000 },
      { category: 'transporte', amount: 5000 },
    ])
  })
})

describe('Integración: alta y baja de categoría personalizada', () => {
  it('crear una categoría invalida la query y useCustomCategories la refleja; borrarla la quita y reasigna transacciones', async () => {
    const queryClient = createTestQueryClient()
    const userId = 'user-1'

    // Estado inicial: sin categorías personalizadas.
    supabaseMock.queue('categories', { data: [], error: null })

    const list = renderHook(() => useCustomCategories(userId), {
      wrapper: wrapperWithQueryClient(queryClient),
    })
    await waitFor(() => expect(list.result.current.isSuccess).toBe(true))
    expect(list.result.current.data).toHaveLength(0)

    // Crear categoría (INSERT) + lo que devuelve el siguiente fetch de la lista tras invalidar.
    const create = renderHook(() => useCreateCategory(userId), {
      wrapper: wrapperWithQueryClient(queryClient),
    })
    supabaseMock.queue('categories', { data: null, error: null }) // INSERT
    supabaseMock.queue('categories', {
      data: [{ id: 'cat-custom-1', name: 'Mascotas', icon: 'paw', created_at: '2026-09-01T00:00:00.000Z' }],
      error: null,
    }) // refetch tras invalidate

    await act(async () => {
      await create.result.current.mutateAsync({ name: 'Mascotas', icon: 'paw' })
    })

    await waitFor(() => expect(list.result.current.data).toHaveLength(1))
    expect(list.result.current.data?.[0].label).toBe('Mascotas')

    // Borrar la categoría: reasigna transacciones a 'otros', borra la fila, y la lista vuelve a vaciarse.
    const del = renderHook(() => useDeleteCategory(userId), {
      wrapper: wrapperWithQueryClient(queryClient),
    })
    supabaseMock.queue('transactions', { data: null, error: null }) // reasignación a 'otros'
    supabaseMock.queue('categories', { data: null, error: null }) // DELETE
    supabaseMock.queue('categories', { data: [], error: null }) // refetch tras invalidate

    await act(async () => {
      await del.result.current.mutateAsync('cat-custom-1')
    })

    await waitFor(() => expect(list.result.current.data).toHaveLength(0))
  })
})
