import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Trash2 } from 'lucide-react'
import { formatCLP } from '../lib/format'
import { AmountField } from './fields'
import ConfirmDialog from './ConfirmDialog'
import TiltCard from './TiltCard'
import { haptics } from '../lib/haptics'
import type { SavingsGoal } from '../types/premium'

export default function GoalCard({
  goal,
  onAddFunds,
  onDelete,
  addLoading,
  deleteLoading,
}: {
  goal: SavingsGoal
  onAddFunds: (amount: number) => void
  onDelete: () => void
  addLoading?: boolean
  deleteLoading?: boolean
}) {
  const [adding, setAdding] = useState(false)
  const [amount, setAmount] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)

  const pct = goal.target_amount > 0 ? Math.min(100, (goal.saved_amount / goal.target_amount) * 100) : 0
  const complete = goal.saved_amount >= goal.target_amount
  const deadlineLabel = new Date(`${goal.deadline}T00:00:00`).toLocaleDateString('es-CL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  function submitAdd() {
    const value = Number(amount || '0')
    if (value <= 0) return
    haptics.success()
    onAddFunds(value)
    setAmount('')
    setAdding(false)
  }

  return (
    <TiltCard className="p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-medium">{goal.name}</p>
          <p className="text-xs text-(--color-ink-muted)">Meta al {deadlineLabel}</p>
        </div>
        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          aria-label="Eliminar meta"
          className="shrink-0 text-(--color-ink-faint) transition hover:text-(--color-expense)"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <div className="mt-3 flex items-baseline justify-between text-sm">
        <span className="font-semibold tabular-nums text-(--color-mint)">{formatCLP(goal.saved_amount)}</span>
        <span className="tabular-nums text-(--color-ink-faint)">de {formatCLP(goal.target_amount)}</span>
      </div>
      <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-(--color-bg-elevated)">
        <motion.div
          className="h-full rounded-full bg-(--color-mint)"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>

      {complete ? (
        <p className="mt-3 text-center text-sm font-medium text-(--color-mint)">🎉 ¡Meta cumplida!</p>
      ) : adding ? (
        <div className="mt-3 flex items-end gap-2">
          <div className="flex-1">
            <AmountField label="Agregar fondos" value={amount} onChange={setAmount} autoFocus />
          </div>
          <button
            type="button"
            onClick={submitAdd}
            disabled={addLoading}
            aria-label="Confirmar aporte"
            className="mb-0.5 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-(--color-mint) text-(--color-bg) disabled:opacity-60"
          >
            <Plus size={18} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="mt-3 w-full rounded-(--radius-pill) border border-(--color-border) py-2 text-sm font-medium text-(--color-ink-muted)"
        >
          + Agregar fondos
        </button>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title="¿Eliminar esta meta?"
        description={goal.name}
        loading={deleteLoading}
        onConfirm={() => {
          onDelete()
          setConfirmOpen(false)
        }}
        onCancel={() => setConfirmOpen(false)}
      />
    </TiltCard>
  )
}
