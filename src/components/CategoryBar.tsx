import { getCategory } from '../lib/categories'
import { formatCLP } from '../lib/format'

export default function CategoryBar({
  category,
  amount,
  total,
}: {
  category: string
  amount: number
  total: number
}) {
  const def = getCategory(category)
  const pct = total > 0 ? Math.min(100, Math.round((amount / total) * 100)) : 0

  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-(--color-ink-muted)">{def.label}</span>
        <span className="tabular-nums font-medium">{formatCLP(amount)}</span>
      </div>
      <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-(--color-surface)">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: def.color }}
        />
      </div>
    </div>
  )
}
