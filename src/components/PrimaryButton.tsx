import type { ButtonHTMLAttributes } from 'react'
import { motion } from 'framer-motion'
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

export default function PrimaryButton({ children, loading, disabled, className = '', ...props }: Props) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onTapStart={() => !disabled && !loading && haptics.light()}
      disabled={disabled || loading}
      className={`btn-gradient-primary flex w-full items-center justify-center gap-2 rounded-(--radius-pill) py-3.5 font-semibold text-(--color-bg) transition disabled:opacity-60 disabled:shadow-none ${className}`}
      {...props}
    >
      {loading && <Loader2 size={18} className="animate-spin" />}
      {children}
    </motion.button>
  )
}
