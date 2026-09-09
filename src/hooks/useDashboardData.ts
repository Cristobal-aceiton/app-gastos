import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { resolveWithOfflineCache } from '../lib/offlineCache'

export interface Transaction {
  id: string
  type: 'income' | 'expense'
  category: string
  amount: number
  description: string | null
  date: string
  created_at: string
}

export interface CategoryTotal {
  category: string
  amount: number
}

export interface DashboardData {
  totalIncome: number
  totalExpense: number
  balance: number
  recentTransactions: Transaction[]
  categoryBreakdown: CategoryTotal[]
  /** true si estos datos vienen del caché offline (Fase 12.5), no de una respuesta fresca de Supabase. */
  fromCache?: boolean
}

function currentMonthRange() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  const toISO = (d: Date) => d.toISOString().slice(0, 10)
  return { start: toISO(start), end: toISO(end) }
}

export function useDashboardData(userId: string | undefined) {
  return useQuery<DashboardData>({
    queryKey: ['dashboard', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { value, fromCache } = await resolveWithOfflineCache(`dashboard:${userId}`, async () => {
        const { start, end } = currentMonthRange()
        const { data, error } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', userId)
          .gte('date', start)
          .lte('date', end)
          .order('date', { ascending: false })
          .order('created_at', { ascending: false })

        if (error) throw error
        const transactions = (data ?? []) as Transaction[]

        let totalIncome = 0
        let totalExpense = 0
        const expenseByCategory = new Map<string, number>()

        for (const t of transactions) {
          const amount = Number(t.amount)
          if (t.type === 'income') {
            totalIncome += amount
          } else {
            totalExpense += amount
            expenseByCategory.set(t.category, (expenseByCategory.get(t.category) ?? 0) + amount)
          }
        }

        const categoryBreakdown = Array.from(expenseByCategory.entries())
          .map(([category, amount]) => ({ category, amount }))
          .sort((a, b) => b.amount - a.amount)

        const result: DashboardData = {
          totalIncome,
          totalExpense,
          balance: totalIncome - totalExpense,
          recentTransactions: transactions.slice(0, 5),
          categoryBreakdown,
        }
        return result
      })

      return { ...value, fromCache }
    },
  })
}
