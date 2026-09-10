import { getCategory } from '../lib/categories'
import { formatCLP, dateLabel } from '../lib/format'
import type { Transaction } from '../hooks/useDashboardData'

export default function TransactionRow({ transaction }: { transaction: Transaction }) {
  const category = getCategory(transaction.category)
  const Icon = category.icon
  const isExpense = transaction.type === 'expense'

  return (
    <div className="flex items-center gap-3 py-3">
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
        style={{ backgroundColor: `${category.color}22`, color: category.color }}
      >
        <Icon size={18} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{transaction.description || category.label}</p>
        <p className="text-xs text-(--color-ink-muted)">
          {category.label} · {dateLabel(transaction.date)}
        </p>
      </div>
      <p className={`tabular-nums font-semibold ${isExpense ? 'text-(--color-expense)' : 'text-(--color-income)'}`}>
        {isExpense ? '-' : '+'}
        {formatCLP(transaction.amount)}
      </p>
    </div>
  )
}
