import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { resolveWithOfflineCache } from '../lib/offlineCache'
import type { Transaction } from './useDashboardData'

export interface CategoryStat {
  category: string
  amount: number
  pct: number
}

export interface StatsData {
  totalExpense: number
  totalIncome: number
  breakdown: CategoryStat[]
  /** true si estos datos vienen del caché offline (Fase 12.5), no de una respuesta fresca de Supabase. */
  fromCache?: boolean
}

function monthRange(year: number, month: number) {
  const start = new Date(year, month, 1)
  const end = new Date(year, month + 1, 0)
  const toISO = (d: Date) => d.toISOString().slice(0, 10)
  return { start: toISO(start), end: toISO(end) }
}

export function useStatsData(userId: string | undefined, year: number, month: number) {
  return useQuery<StatsData>({
    queryKey: ['stats', userId, year, month],
    enabled: !!userId,
    queryFn: async () => {
      const { value, fromCache } = await resolveWithOfflineCache(
        `stats:${userId}:${year}-${month}`,
        async () => {
          const { start, end } = monthRange(year, month)
          const { data, error } = await supabase
            .from('transactions')
            .select('*')
            .eq('user_id', userId)
            .gte('date', start)
            .lte('date', end)

          if (error) throw error
          const transactions = (data ?? []) as Transaction[]

          let totalExpense = 0
          let totalIncome = 0
          const byCategory = new Map<string, number>()

          for (const t of transactions) {
            const amount = Number(t.amount)
            if (t.type === 'expense') {
              totalExpense += amount
              byCategory.set(t.category, (byCategory.get(t.category) ?? 0) + amount)
            } else {
              totalIncome += amount
            }
          }

          const breakdown = Array.from(byCategory.entries())
            .map(([category, amount]) => ({
              category,
              amount,
              pct: totalExpense > 0 ? (amount / totalExpense) * 100 : 0,
            }))
            .sort((a, b) => b.amount - a.amount)

          const result: StatsData = { totalExpense, totalIncome, breakdown }
          return result
        }
      )

      return { ...value, fromCache }
    },
  })
}
