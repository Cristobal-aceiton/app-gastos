import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { getCategory } from '../lib/categories'
import { formatCLP } from '../lib/format'
import { getLimitStatus, type LimitStatus } from '../lib/premium'
import { haptics } from '../lib/haptics'

const STATUS_COLOR: Record<LimitStatus, string> = {
  ok: 'var(--color-mint)',
  warn: '#F2C94C',
  over: 'var(--color-expense)',
}

/** Barra de progreso de un límite mensual. Al llegar al 100% se pone roja y "tiembla". */
export default function LimitBar({ category, spent, limit }: { category: string; spent: number; limit: number }) {
  const def = getCategory(category)
  const Icon = def.icon
  const pct = limit > 0 ? (spent / limit) * 100 : 0
  const status = getLimitStatus(pct)
  const color = STATUS_COLOR[status]

  // Fase 7: aviso háptico solo cuando el estado cambia a "superado", no en cada render
  useEffect(() => {
    if (status === 'over') haptics.warning()
  }, [status])

  return (
    <motion.div
      animate={status === 'over' ? { x: [0, -3, 3, -3, 3, 0] } : { x: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex items-center justify-between gap-2 text-sm">
        <span className="flex min-w-0 items-center gap-1.5 text-(--color-ink-muted)">
          <Icon size={14} style={{ color }} />
          <span className="truncate">{def.label}</span>
        </span>
        <span className="shrink-0 tabular-nums font-medium" style={{ color: status === 'ok' ? undefined : color }}>
          {formatCLP(spent)} <span className="text-(--color-ink-faint)">/ {formatCLP(limit)}</span>
        </span>
      </div>

      <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-(--color-surface)">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, pct)}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>

      {status !== 'ok' && (
        <p className="mt-1 text-[11px] font-medium" style={{ color }}>
          {status === 'over' ? '¡Superaste el límite de este mes!' : `Vas en el ${Math.round(pct)}% del límite`}
        </p>
      )}
    </motion.div>
  )
}
