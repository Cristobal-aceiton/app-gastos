import { useState } from 'react'
import { motion, type PanInfo } from 'framer-motion'
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

  // Antes esto se manejaba con un useMotionValue (x) pasado por `style` Y,
  // al mismo tiempo, con un useAnimation() pasado por `animate`. Son dos
  // sistemas independientes escribiendo la misma propiedad `x`: cualquier
  // re-render del padre (ej. al invalidar la query después de borrar otro
  // movimiento) podía hacer que la fila "olvidara" el valor y volviera a 0,
  // lo que se sentía como "deslizo y el texto se regresa solo". Ahora hay
  // una sola fuente de verdad (este estado) y `animate` sigue siempre a ella.
  const [isOpen, setIsOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const deleteMutation = useDeleteTransaction()

  function handleDragEnd(_: unknown, info: PanInfo) {
    const shouldOpen = info.offset.x < -DELETE_WIDTH / 2 || info.velocity.x < -500
    if (shouldOpen) haptics.light()
    setIsOpen(shouldOpen)
  }

  function closeSwipe() {
    setIsOpen(false)
  }

  function handleConfirmDelete() {
    deleteMutation.mutate(transaction.id, {
      onSuccess: () => setConfirmOpen(false),
    })
  }

  return (
    <div className="relative w-full overflow-hidden rounded-(--radius-card)">
      <div className="absolute inset-y-0 right-0 flex w-[84px] items-stretch">
        <button
          type="button"
          aria-label="Eliminar transacción"
          onClick={() => setConfirmOpen(true)}
          className="flex w-full items-center justify-center rounded-r-(--radius-card) bg-(--color-expense) text-white"
        >
          <Trash2 size={20} />
        </button>
      </div>

      <motion.div
        drag="x"
        dragDirectionLock
        dragConstraints={{ left: -DELETE_WIDTH, right: 0 }}
        dragElastic={0.02}
        dragMomentum={false}
        animate={{ x: isOpen ? -DELETE_WIDTH : 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 40 }}
        onDragEnd={handleDragEnd}
        onClick={() => isOpen && closeSwipe()}
        className="relative flex w-full min-w-0 select-none items-center gap-3 rounded-(--radius-card) border border-(--color-border) bg-(--color-surface) px-4 py-3.5"
      >
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: `${category.color}22`, color: category.color }}
        >
          <Icon size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{transaction.description || category.label}</p>
          <p className="truncate text-xs text-(--color-ink-muted)">
            {category.label} · {dateLabel(transaction.date)}
          </p>
        </div>
        <p
          className={`shrink-0 tabular-nums font-semibold ${isExpense ? 'text-(--color-expense)' : 'text-(--color-income)'}`}
        >
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
