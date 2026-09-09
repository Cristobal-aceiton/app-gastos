import { motion } from 'framer-motion'
import { haptics } from '../lib/haptics'

/** Switch on/off reutilizable — mismo look & feel que el toggle de activo/inactivo de SubscriptionCard. */
export default function ToggleSwitch({
  checked,
  onChange,
  disabled,
  label,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  label: string
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => {
        haptics.light()
        onChange(!checked)
      }}
      aria-label={label}
      aria-pressed={checked}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50 ${
        checked ? 'bg-(--color-mint)' : 'bg-(--color-bg-elevated)'
      }`}
    >
      <motion.span
        className="absolute top-0.5 h-5 w-5 rounded-full bg-white"
        animate={{ left: checked ? 22 : 2 }}
        transition={{ type: 'spring', stiffness: 500, damping: 32 }}
      />
    </button>
  )
}
