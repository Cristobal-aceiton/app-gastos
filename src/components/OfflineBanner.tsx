import { AnimatePresence, motion } from 'framer-motion'
import { WifiOff } from 'lucide-react'

/**
 * claude.md, Fase 12.5: se muestra cuando la pantalla está pintando datos que
 * vienen del caché de IndexedDB (`fromCache: true`) en vez de la respuesta
 * fresca de Supabase — típicamente porque la app abrió sin conexión.
 */
export default function OfflineBanner({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="overflow-hidden"
        >
          <div className="mb-4 flex items-center gap-2 rounded-(--radius-card) border border-(--color-border) bg-(--color-bg-elevated) px-4 py-2.5 text-xs font-medium text-(--color-ink-muted)">
            <WifiOff size={14} className="shrink-0 text-(--color-ink-faint)" />
            Sin conexión — mostrando datos guardados
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
