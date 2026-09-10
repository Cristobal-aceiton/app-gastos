import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle } from 'lucide-react'
import { haptics } from '../lib/haptics'

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Eliminar',
  error,
  loading,
  onConfirm,
  onCancel,
}: {
  open: boolean
  title: string
  description?: string
  confirmLabel?: string
  error?: string | null
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  // Fase 7: aviso háptico al abrir una confirmación destructiva
  useEffect(() => {
    if (open) haptics.warning()
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center"
          onClick={onCancel}
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-t-(--radius-card) border border-(--color-border) bg-(--color-bg-elevated) p-6 sm:rounded-(--radius-card)"
          >
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-(--color-expense)/15 text-(--color-expense)">
              <AlertTriangle size={20} />
            </div>
            <h2 className="mt-3 text-center text-lg font-semibold text-(--color-ink)">{title}</h2>
            {description && <p className="mt-1 text-center text-sm text-(--color-ink-muted)">{description}</p>}
            {error && <p className="mt-3 text-center text-sm text-(--color-expense)">{error}</p>}

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => {
                  haptics.light()
                  onCancel()
                }}
                className="flex-1 rounded-(--radius-pill) border border-(--color-border) py-3 text-sm font-semibold text-(--color-ink)"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  haptics.error()
                  onConfirm()
                }}
                disabled={loading}
                className="flex-1 rounded-(--radius-pill) bg-(--color-expense) py-3 text-sm font-semibold text-white transition disabled:opacity-60"
              >
                {loading ? 'Eliminando…' : confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
