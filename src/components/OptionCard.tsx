import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { haptics } from '../lib/haptics'

export default function OptionCard({
  selected,
  onClick,
  icon,
  title,
  description,
}: {
  selected: boolean
  onClick: () => void
  icon?: ReactNode
  title: string
  description?: string
}) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.98 }}
      onTapStart={() => haptics.light()}
      onClick={onClick}
      className={`flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition ${
        selected
          ? 'border-(--color-mint) bg-(--color-mint-dim)'
          : 'border-(--color-border) bg-(--color-surface)'
      }`}
    >
      {icon && (
        <span
          className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
            selected ? 'bg-(--color-mint) text-(--color-bg)' : 'bg-black/20 text-(--color-ink-muted)'
          }`}
        >
          {icon}
        </span>
      )}
      <span>
        <span className={`block font-medium ${selected ? 'text-(--color-mint)' : 'text-(--color-ink)'}`}>
          {title}
        </span>
        {description && <span className="mt-0.5 block text-sm text-(--color-ink-muted)">{description}</span>}
      </span>
    </motion.button>
  )
}
