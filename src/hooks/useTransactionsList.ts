import { useInfiniteQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { resolveWithOfflineCache } from '../lib/offlineCache'
import type { Transaction } from './useDashboardData'

const PAGE_SIZE = 20

export interface TransactionsPage {
  transactions: Transaction[]
  /** true si esta página vino del caché offline (Fase 12.5). Solo se cachea la primera página. */
  fromCache?: boolean
}

export function useTransactionsList(userId: string | undefined, categoryId: string | null) {
  return useInfiniteQuery({
    queryKey: ['transactions', userId, categoryId],
    enabled: !!userId,
    initialPageParam: 0,
    queryFn: async ({ pageParam }): Promise<TransactionsPage> => {
      const fetchPage = async () => {
        const from = pageParam * PAGE_SIZE
        const to = from + PAGE_SIZE - 1

        let query = supabase
          .from('transactions')
          .select('*')
          .eq('user_id', userId)
          .order('date', { ascending: false })
          .order('created_at', { ascending: false })
          .range(from, to)

        if (categoryId) {
          query = query.eq('category', categoryId)
        }

        const { data, error } = await query
        if (error) throw error
        return (data ?? []) as Transaction[]
      }

      // Solo tiene sentido cachear/servir offline la PRIMERA página: es la que
      // se ve al abrir la pantalla. Para páginas siguientes (scroll infinito),
      // si falla la red simplemente se propaga el error — no hay "última
      // página 2 conocida" razonable que mostrar, y React Query ya evita
      // seguir pidiendo más mientras `isFetchingNextPage` está en error.
      if (pageParam !== 0) {
        return { transactions: await fetchPage() }
      }

      const { value, fromCache } = await resolveWithOfflineCache(
        `transactions:${userId}:${categoryId ?? 'todos'}`,
        fetchPage
      )
      return { transactions: value, fromCache }
    },
    getNextPageParam: (lastPage, allPages) =>
      lastPage.transactions.length === PAGE_SIZE ? allPages.length : undefined,
  })
}
