import { useState } from 'react'
import { motion, useAnimation, useMotionValue, type PanInfo } from 'framer-motion'
import { Trash2 } from 'lucide-react'
import { getCategory } from '../lib/categories'
import { formatCLP, dateLabel } from '../lib/format'
import { useDeleteTransaction } from '../hooks/useDeleteTransaction'
import { haptics } from '../lib/haptics'
import type { Transaction } from '../hooks/useDashboardData'
import ConfirmDialog from './ConfirmDialog'

const DELETE_WIDTH = 84

export default function SwipeableTransactionRow({ transaction }: { transaction: Transaction }) {
  const category = getCategory(transaction.category)
  const Icon = category.icon
  const isExpense = transaction.type === 'expense'

  const x = useMotionValue(0)
  const controls = useAnimation()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const deleteMutation = useDeleteTransaction()

  function handleDragEnd(_: unknown, info: PanInfo) {
    if (info.offset.x < -DELETE_WIDTH / 2) {
      haptics.light()
      controls.start({ x: -DELETE_WIDTH })
    } else {
      controls.start({ x: 0 })
    }
  }

  function closeSwipe() {
    controls.start({ x: 0 })
  }

  function handleConfirmDelete() {
    deleteMutation.mutate(transaction.id, {
      onSuccess: () => setConfirmOpen(false),
    })
  }

  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-y-0 right-0 flex w-[84px] items-stretch">
        <button
          type="button"
          aria-label="Eliminar transacción"
          onClick={() => setConfirmOpen(true)}
          className="flex w-full items-center justify-center bg-(--color-expense) text-white"
        >
          <Trash2 size={20} />
        </button>
      </div>

      <motion.div
        drag="x"
        dragDirectionLock
        dragConstraints={{ left: -DELETE_WIDTH, right: 0 }}
        dragElastic={0.02}
        style={{ x }}
        animate={controls}
        onDragEnd={handleDragEnd}
        className="relative flex items-center gap-3 bg-(--color-bg) py-3"
      >
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
      </motion.div>

      <ConfirmDialog
        open={confirmOpen}
        title="¿Eliminar esta transacción?"
        description={`${category.label} · ${formatCLP(transaction.amount)}`}
        error={deleteMutation.isError ? 'No pudimos eliminarla. Intenta de nuevo.' : null}
        loading={deleteMutation.isPending}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setConfirmOpen(false)
          closeSwipe()
        }}
      />
    </div>
  )
}
