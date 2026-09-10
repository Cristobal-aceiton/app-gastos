import type { ReactNode } from 'react'
import { motion, type Variants } from 'framer-motion'

const variants: Variants = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.22, ease: 'easeOut' } },
  // Solo transform + opacity (nunca top/left/height) para que la animación
  // corra en el compositor a 60fps, sin recalcular layout en cada frame.
  // pointerEvents no se anima, pero Framer Motion lo aplica igual como
  // estilo directo al entrar a este variant (ver nota más abajo).
  exit: { opacity: 0, y: -10, pointerEvents: 'none', transition: { duration: 0.16, ease: 'easeOut' } },
}

/**
 * Envuelve el contenido de una pantalla para animar su entrada/salida.
 * Pensado para usarse dentro de un <AnimatePresence mode="popLayout"> con
 * `key` en el pathname de la ruta, de modo que cada navegación tenga una
 * transición suave en vez de un salto brusco (Fase 7: pulido de
 * microinteracciones; Fase 11: hardening contra el freeze de navegación).
 */
export default function PageTransition({ children }: { children: ReactNode }) {
  return (
    <motion.div
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="h-full"
      style={{ willChange: 'transform, opacity' }}
    >
      {children}
    </motion.div>
  )
}
