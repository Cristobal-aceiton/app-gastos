import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { getCategory } from '../lib/categories'
import { formatCLP } from '../lib/format'
import type { CategoryStat } from '../hooks/useStatsData'

export default function ExpenseDonut({ breakdown, total }: { breakdown: CategoryStat[]; total: number }) {
  return (
    <div className="relative mx-auto h-56 w-56">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={breakdown}
            dataKey="amount"
            nameKey="category"
            innerRadius={70}
            outerRadius={100}
            paddingAngle={breakdown.length > 1 ? 3 : 0}
            stroke="none"
            isAnimationActive
            animationDuration={700}
          >
            {breakdown.map((entry) => (
              <Cell key={entry.category} fill={getCategory(entry.category).color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>

      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xs text-(--color-ink-muted)">Gasto total</span>
        <span className="mt-1 text-xl font-semibold tabular-nums">{formatCLP(total)}</span>
      </div>
    </div>
  )
}
