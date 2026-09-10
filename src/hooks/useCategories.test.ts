import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createSupabaseMock, type SupabaseMock } from '../test/supabaseMock'
import { createTestQueryClient, wrapperWithQueryClient } from '../test/queryClientWrapper'
import { useDeleteCategory } from './useCategories'

let supabaseMock: SupabaseMock

vi.mock('../lib/supabase', () => ({
  get supabase() {
    return supabaseMock
  },
}))

beforeEach(() => {
  supabaseMock = createSupabaseMock()
})

describe('useDeleteCategory', () => {
  it('reasigna las transacciones huérfanas a "otros" ANTES de borrar la categoría', async () => {
    supabaseMock.queue('transactions', { data: null, error: null }) // reassign UPDATE
    supabaseMock.queue('categories', { data: null, error: null }) // DELETE

    const queryClient = createTestQueryClient()
    const { result } = renderHook(() => useDeleteCategory('user-1'), {
      wrapper: wrapperWithQueryClient(queryClient),
    })

    result.current.mutate('cat-custom-1')

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    // El orden de las llamadas a `.from(...)` debe ser: primero transactions (reasignar), luego categories (borrar).
    expect(supabaseMock.calls.map((c) => c.table)).toEqual(['transactions', 'categories'])
  })

  it('si falla la reasignación, NO continúa a borrar la categoría (no deja transacciones huérfanas apuntando a un id inexistente)', async () => {
    supabaseMock.queue('transactions', { data: null, error: { message: 'update failed' } })
    // No se encola nada para 'categories': si el hook igual la llamara, el mock devolvería
    // { data: null, error: null } por defecto, así que además verificamos explícitamente
    // que categories NUNCA se llamó.

    const queryClient = createTestQueryClient()
    const { result } = renderHook(() => useDeleteCategory('user-1'), {
      wrapper: wrapperWithQueryClient(queryClient),
    })

    result.current.mutate('cat-custom-1')

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(supabaseMock.calls.map((c) => c.table)).toEqual(['transactions'])
  })

  it('sin sesión, rechaza la mutación sin llamar a Supabase', async () => {
    const queryClient = createTestQueryClient()
    const { result } = renderHook(() => useDeleteCategory(undefined), {
      wrapper: wrapperWithQueryClient(queryClient),
    })

    result.current.mutate('cat-custom-1')

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(supabaseMock.from).not.toHaveBeenCalled()
  })
})
