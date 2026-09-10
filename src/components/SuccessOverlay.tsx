import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { haptics } from '../lib/haptics'

export default function SuccessOverlay({ message = '¡Guardado!' }: { message?: string }) {
  // Fase 7: haptic de éxito al aparecer (transacción guardada, meta cumplida, etc.)
  useEffect(() => {
    haptics.success()
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-(--color-bg)/95 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className="flex h-24 w-24 items-center justify-center rounded-full bg-(--color-mint)"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.15, type: 'spring', stiffness: 400, damping: 14 }}
        >
          <Check size={44} strokeWidth={3} className="text-(--color-bg)" />
        </motion.div>
      </motion.div>
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-sm font-medium text-(--color-ink-muted)"
      >
        {message}
      </motion.p>
    </motion.div>
  )
}
