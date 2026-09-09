import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2 } from 'lucide-react'

/** Toast simple de confirmación (ej. "Nombre actualizado"), se autooculta. */
export default function Toast({
  message,
  onDismiss,
  duration = 2200,
}: {
  message: string | null
  onDismiss: () => void
  duration?: number
}) {
  useEffect(() => {
    if (!message) return
    const timer = setTimeout(onDismiss, duration)
    return () => clearTimeout(timer)
  }, [message, duration, onDismiss])

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          className="fixed inset-x-0 bottom-24 z-50 flex justify-center px-5"
        >
          <div className="flex items-center gap-2 rounded-(--radius-pill) border border-(--color-border) bg-(--color-bg-elevated) px-4 py-2.5 text-sm font-medium text-(--color-ink) shadow-lg">
            <CheckCircle2 size={16} className="text-(--color-mint)" />
            {message}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
