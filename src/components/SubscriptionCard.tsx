import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { getCategory } from '../lib/categories'
import { formatCLP } from '../lib/format'
import { nextChargeLabel } from '../lib/premium'
import ConfirmDialog from './ConfirmDialog'
import ToggleSwitch from './ToggleSwitch'
import type { Subscription } from '../types/premium'

export default function SubscriptionCard({
  sub,
  onToggle,
  onDelete,
  deleteLoading,
}: {
  sub: Subscription
  onToggle: (active: boolean) => void
  onDelete: () => void
  deleteLoading?: boolean
}) {
  const category = getCategory(sub.category)
  const Icon = category.icon
  const [confirmOpen, setConfirmOpen] = useState(false)

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-(--color-border) bg-(--color-surface) p-4">
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
        style={{ backgroundColor: `${category.color}22`, color: category.color }}
      >
        <Icon size={18} />
      </span>

      <div className="min-w-0 flex-1">
        <p className={`truncate font-medium ${sub.active ? '' : 'text-(--color-ink-faint) line-through'}`}>
          {sub.name}
        </p>
        <p className="truncate text-xs text-(--color-ink-muted)">
          {formatCLP(sub.amount)} · Día {sub.billing_day}
          {sub.active && ` · Próximo cobro: ${nextChargeLabel(sub.billing_day)}`}
        </p>
      </div>

      <ToggleSwitch
        checked={sub.active}
        onChange={onToggle}
        label={sub.active ? 'Desactivar suscripción' : 'Activar suscripción'}
      />

      <button
        type="button"
        onClick={() => setConfirmOpen(true)}
        aria-label="Eliminar suscripción"
        className="shrink-0 text-(--color-ink-faint) transition hover:text-(--color-expense)"
      >
        <Trash2 size={16} />
      </button>

      <ConfirmDialog
        open={confirmOpen}
        title="¿Eliminar esta suscripción?"
        description={`${sub.name} · ${formatCLP(sub.amount)}`}
        loading={deleteLoading}
        onConfirm={() => {
          onDelete()
          setConfirmOpen(false)
        }}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  )
}
