import type { ButtonHTMLAttributes, MouseEvent } from 'react'
import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { haptics } from '../lib/haptics'

type ConflictingHandlers =
  | 'onDrag'
  | 'onDragStart'
  | 'onDragEnd'
  | 'onAnimationStart'
  | 'onAnimationEnd'
  | 'onAnimationIteration'

interface Props extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, ConflictingHandlers> {
  loading?: boolean
}

interface Ripple {
  id: number
  x: number
  y: number
  size: number
}

export default function PrimaryButton({ children, loading, disabled, className = '', onClick, ...props }: Props) {
  const [ripples, setRipples] = useState<Ripple[]>([])

  // Ripple que nace exactamente donde el usuario tocó el botón, en vez de
  // uno genérico centrado — se siente más "físico". El tamaño se calcula
  // como la diagonal del botón para que siempre alcance a cubrir todo el
  // área sin importar en qué esquina se toque.
  function spawnRipple(e: MouseEvent<HTMLButtonElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    const size = Math.hypot(rect.width, rect.height) * 1.6
    const id = Date.now()
    setRipples((prev) => [...prev, { id, x: e.clientX - rect.left, y: e.clientY - rect.top, size }])
    // Se limpia solo tras la animación; no depende de que el componente
    // permanezca montado más tiempo del necesario.
    setTimeout(() => setRipples((prev) => prev.filter((r) => r.id !== id)), 500)
  }

  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onTapStart={() => !disabled && !loading && haptics.light()}
      onClick={(e) => {
        if (!disabled && !loading) spawnRipple(e)
        onClick?.(e)
      }}
      disabled={disabled || loading}
      className={`btn-gradient-primary flex w-full items-center justify-center gap-2 rounded-(--radius-pill) py-3.5 font-semibold text-(--color-bg) transition disabled:opacity-60 disabled:shadow-none ${className}`}
      {...props}
    >
      <AnimatePresence>
        {ripples.map((r) => (
          <motion.span
            key={r.id}
            className="ripple"
            style={{ left: r.x, top: r.y, width: r.size, height: r.size }}
            initial={{ scale: 0, opacity: 0.5 }}
            animate={{ scale: 1, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        ))}
      </AnimatePresence>
      {loading && <Loader2 size={18} className="animate-spin" />}
      {children}
    </motion.button>
  )
}
