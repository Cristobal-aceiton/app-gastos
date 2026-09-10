import type { ReactNode } from 'react'
import { motion } from 'framer-motion'

const variants = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
}

/**
 * Envuelve el contenido de una pantalla para animar su entrada/salida.
 * Pensado para usarse dentro de un <AnimatePresence> con `key` en el
 * pathname de la ruta, de modo que cada navegación tenga una transición
 * suave en vez de un salto brusco (Fase 7: pulido de microinteracciones).
 */
export default function PageTransition({ children }: { children: ReactNode }) {
  return (
    <motion.div
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.22, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}
