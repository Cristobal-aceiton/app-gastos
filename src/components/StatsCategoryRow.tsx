import { motion } from 'framer-motion'
import { getCategory } from '../lib/categories'
import { formatCLP } from '../lib/format'
import type { CategoryStat } from '../hooks/useStatsData'

export default function StatsCategoryRow({ stat }: { stat: CategoryStat }) {
  const category = getCategory(stat.category)
  const Icon = category.icon

  return (
    <div className="flex items-center gap-3">
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
        style={{ backgroundColor: `${category.color}22`, color: category.color }}
      >
        <Icon size={16} />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">{category.label}</span>
          <span className="tabular-nums text-(--color-ink-muted)">{formatCLP(stat.amount)}</span>
        </div>
        <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-(--color-surface)">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${stat.pct}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="h-full rounded-full"
            style={{ backgroundColor: category.color }}
          />
        </div>
      </div>

      <span className="w-14 shrink-0 text-right text-xs font-semibold tabular-nums text-(--color-ink-muted)">
        {stat.pct.toFixed(1)}%
      </span>
    </div>
  )
}
