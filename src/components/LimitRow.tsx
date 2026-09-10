import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import LimitBar from './LimitBar'
import ConfirmDialog from './ConfirmDialog'
import { formatCLP } from '../lib/format'
import type { CategoryLimit } from '../types/premium'

export default function LimitRow({
  limit,
  spent,
  onDelete,
  deleteLoading,
}: {
  limit: CategoryLimit
  spent: number
  onDelete: () => void
  deleteLoading?: boolean
}) {
  const [confirmOpen, setConfirmOpen] = useState(false)

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-(--color-border) bg-(--color-surface) p-4">
      <div className="min-w-0 flex-1">
        <LimitBar category={limit.category} spent={spent} limit={limit.limit_amount} />
      </div>
      <button
        type="button"
        onClick={() => setConfirmOpen(true)}
        aria-label="Eliminar límite"
        className="shrink-0 text-(--color-ink-faint) transition hover:text-(--color-expense)"
      >
        <Trash2 size={16} />
      </button>

      <ConfirmDialog
        open={confirmOpen}
        title="¿Eliminar este límite?"
        description={formatCLP(limit.limit_amount)}
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
