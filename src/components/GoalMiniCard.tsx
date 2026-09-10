import { formatCLP } from '../lib/format'
import GoalRing from './GoalRing'
import type { SavingsGoal } from '../types/premium'

export default function GoalMiniCard({ goal }: { goal: SavingsGoal }) {
  const pct = goal.target_amount > 0 ? (goal.saved_amount / goal.target_amount) * 100 : 0

  return (
    <div className="flex w-28 shrink-0 flex-col items-center gap-2 rounded-2xl border border-(--color-border) bg-(--color-surface) p-3 text-center">
      <div className="relative flex h-14 w-14 items-center justify-center">
        <GoalRing pct={pct} />
        <span className="absolute text-xs font-semibold tabular-nums">{Math.round(pct)}%</span>
      </div>
      <p className="w-full truncate text-xs font-medium">{goal.name}</p>
      <p className="text-[10px] tabular-nums text-(--color-ink-muted)">{formatCLP(goal.saved_amount)}</p>
    </div>
  )
}
