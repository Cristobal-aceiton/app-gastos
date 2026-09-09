import { useState } from 'react'
import { useAuthStore } from '../store/authStore'
import { useStatsData } from '../hooks/useStatsData'
import MonthSelector from '../components/MonthSelector'
import ExpenseDonut from '../components/ExpenseDonut'
import StatsCategoryRow from '../components/StatsCategoryRow'
import OfflineBanner from '../components/OfflineBanner'

export default function Stats() {
  const { session } = useAuthStore()
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())

  const { data, isLoading } = useStatsData(session?.user.id, year, month)
  const breakdown = data?.breakdown ?? []
  const totalExpense = data?.totalExpense ?? 0

  function handleMonthChange(nextYear: number, nextMonth: number) {
    setYear(nextYear)
    setMonth(nextMonth)
  }

  return (
    <div className="flex flex-col gap-6 text-(--color-ink)">
      <header>
        <h1 className="text-2xl font-semibold">Estadísticas</h1>
        <p className="mt-1 text-sm text-(--color-ink-muted)">Desglose de tus gastos por categoría.</p>
      </header>

      <MonthSelector year={year} month={month} onChange={handleMonthChange} />

      <OfflineBanner show={data?.fromCache === true} />

      {isLoading ? (
        <div className="flex flex-col items-center gap-6 py-4">
          <div className="h-56 w-56 animate-pulse rounded-full bg-(--color-surface)" />
          <div className="flex w-full flex-col gap-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-9 animate-pulse rounded-2xl bg-(--color-surface)" />
            ))}
          </div>
        </div>
      ) : breakdown.length === 0 ? (
        <div className="rounded-(--radius-card) border border-dashed border-(--color-border) p-8 text-center text-sm text-(--color-ink-faint)">
          No hubo gastos este mes.
        </div>
      ) : (
        // key fuerza el remount al cambiar de mes, para que las barras y la dona vuelvan a animarse desde cero.
        <div key={`${year}-${month}`} className="flex flex-col gap-6">
          <div className="card-glass rounded-(--radius-card) p-5">
            <ExpenseDonut breakdown={breakdown} total={totalExpense} />
          </div>

          <div className="card-glass flex flex-col gap-4 rounded-(--radius-card) p-5">
            {breakdown.map((stat) => (
              <StatsCategoryRow key={stat.category} stat={stat} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
