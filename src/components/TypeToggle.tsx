import { motion } from 'framer-motion'
import { haptics } from '../lib/haptics'

export type TxType = 'expense' | 'income'

const OPTIONS: { value: TxType; label: string }[] = [
  { value: 'expense', label: 'Gasto' },
  { value: 'income', label: 'Ingreso' },
]

export default function TypeToggle({ value, onChange }: { value: TxType; onChange: (v: TxType) => void }) {
  return (
    <div className="grid grid-cols-2 gap-1 rounded-(--radius-pill) bg-(--color-surface) p-1">
      {OPTIONS.map((opt) => {
        const active = value === opt.value
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => {
              if (!active) haptics.light()
              onChange(opt.value)
            }}
            className="relative rounded-(--radius-pill) py-2.5 text-sm font-semibold"
          >
            {active && (
              <motion.span
                layoutId="type-toggle-highlight"
                transition={{ type: 'spring', stiffness: 500, damping: 34 }}
                className={`absolute inset-0 rounded-(--radius-pill) ${
                  opt.value === 'expense' ? 'bg-(--color-expense)' : 'bg-(--color-income)'
                }`}
              />
            )}
            <span className={`relative z-10 ${active ? 'text-(--color-bg)' : 'text-(--color-ink-muted)'}`}>
              {opt.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
