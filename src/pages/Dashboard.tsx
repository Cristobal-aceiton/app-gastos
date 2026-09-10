import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowDownLeft, ArrowUpRight, ChevronRight } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { useDashboardData } from '../hooks/useDashboardData'
import { useSavingsGoals } from '../hooks/useSavingsGoals'
import { useCategoryLimits } from '../hooks/useCategoryLimits'
import { monthStartISO } from '../lib/premium'
import AnimatedCounter from '../components/AnimatedCounter'
import TransactionRow from '../components/TransactionRow'
import CategoryBar from '../components/CategoryBar'
import GoalMiniCard from '../components/GoalMiniCard'
import LimitBar from '../components/LimitBar'
import OfflineBanner from '../components/OfflineBanner'

const monthLabel = new Date().toLocaleDateString('es-CL', { month: 'long' })
const monthYear = monthStartISO()

export default function Dashboard() {
  const { profile, session } = useAuthStore()
  const userId = session?.user.id
  const firstName = profile?.name?.split(' ')[0]
  const isPremium = !!profile?.is_premium

  const { data, isLoading } = useDashboardData(userId)
  const { data: goals } = useSavingsGoals(isPremium ? userId : undefined)
  const { data: limits } = useCategoryLimits(isPremium ? userId : undefined, monthYear)

  const totalIncome = data?.totalIncome ?? 0
  const totalExpense = data?.totalExpense ?? 0
  const balance = data?.balance ?? 0
  const recent = data?.recentTransactions ?? []
  const breakdown = data?.categoryBreakdown ?? []
  const breakdownTotal = breakdown.reduce((sum, b) => sum + b.amount, 0)

  function spentFor(category: string) {
    return breakdown.find((b) => b.category === category)?.amount ?? 0
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="text-sm text-(--color-ink-muted)">Hola{firstName ? `, ${firstName}` : ''} 👋</p>
        <h1 className="text-xl font-semibold capitalize">Tu resumen de {monthLabel}</h1>
      </header>

      <OfflineBanner show={data?.fromCache === true} />

      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="glass-balance balance-hero rounded-(--radius-card) p-6"
      >
        <p className="text-sm text-(--color-ink-muted)">Balance del mes</p>
        <p className="mt-1 text-4xl font-semibold tracking-tight">
          <AnimatedCounter value={balance} />
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-black/20 p-3">
            <div className="flex items-center gap-1.5 text-(--color-income)">
              <ArrowDownLeft size={16} />
              <span className="text-xs font-medium">Ingresos</span>
            </div>
            <p className="mt-1 font-semibold">
              <AnimatedCounter value={totalIncome} />
            </p>
          </div>
          <div className="rounded-2xl bg-black/20 p-3">
            <div className="flex items-center gap-1.5 text-(--color-expense)">
              <ArrowUpRight size={16} />
              <span className="text-xs font-medium">Gastos</span>
            </div>
            <p className="mt-1 font-semibold">
              <AnimatedCounter value={totalExpense} />
            </p>
          </div>
        </div>
      </motion.section>

      {isPremium && goals && goals.length > 0 && (
        <section>
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Metas de ahorro</h2>
            <Link to="/premium" className="flex items-center text-xs text-(--color-ink-muted)">
              Ver todo <ChevronRight size={14} />
            </Link>
          </div>
          <div className="-mx-5 mt-3 flex gap-3 overflow-x-auto px-5 pb-1 [scrollbar-width:none]">
            {goals.map((goal) => (
              <GoalMiniCard key={goal.id} goal={goal} />
            ))}
          </div>
        </section>
      )}

      {isPremium && limits && limits.length > 0 && (
        <section>
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Límites del mes</h2>
            <Link to="/premium" className="flex items-center text-xs text-(--color-ink-muted)">
              Gestionar <ChevronRight size={14} />
            </Link>
          </div>
          <div className="mt-3 flex flex-col gap-4">
            {limits.map((limit) => (
              <LimitBar key={limit.id} category={limit.category} spent={spentFor(limit.category)} limit={limit.limit_amount} />
            ))}
          </div>
        </section>
      )}

      {breakdown.length > 0 && (
        <section>
          <h2 className="font-semibold">Gastos por categoría</h2>
          <div className="mt-3 flex flex-col gap-4">
            {breakdown.slice(0, 5).map((b) => (
              <CategoryBar key={b.category} category={b.category} amount={b.amount} total={breakdownTotal} />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="font-semibold">Últimos movimientos</h2>

        {isLoading ? (
          <div className="mt-3 flex flex-col gap-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-14 animate-pulse rounded-2xl bg-(--color-surface)" />
            ))}
          </div>
        ) : recent.length === 0 ? (
          <div className="mt-3 rounded-(--radius-card) border border-dashed border-(--color-border) p-8 text-center text-sm text-(--color-ink-faint)">
            Todavía no hay movimientos este mes.
          </div>
        ) : (
          <div className="card-glass mt-3 divide-y divide-(--color-border) rounded-(--radius-card) px-4">
            {recent.map((t) => (
              <TransactionRow key={t.id} transaction={t} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
