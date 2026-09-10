import { motion } from 'framer-motion'
import { Target, ShieldAlert, BellRing, RefreshCw } from 'lucide-react'
import PrimaryButton from './PrimaryButton'

const benefits = [
  { icon: Target, text: 'Metas de ahorro' },
  { icon: ShieldAlert, text: 'Límites por categoría' },
  { icon: BellRing, text: 'Alertas tempranas' },
  { icon: RefreshCw, text: 'Descuento automático de suscripciones' },
]

export default function PremiumUpsell({
  onSubscribe,
  onSkip,
  loading,
  error,
}: {
  onSubscribe: () => void
  onSkip: () => void
  loading?: boolean
  error?: string | null
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 px-0 sm:items-center sm:px-6">
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', damping: 26, stiffness: 300 }}
        className="glass-balance w-full max-w-sm rounded-t-(--radius-card) p-7 sm:rounded-(--radius-card)"
      >
        <p className="text-2xl font-semibold leading-snug">
          🚀 Lleva tus finanzas al siguiente nivel
        </p>

        <ul className="mt-6 flex flex-col gap-3">
          {benefits.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-center gap-3 text-sm">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black/25 text-(--color-mint)">
                <Icon size={17} />
              </span>
              {text}
            </li>
          ))}
        </ul>

        <div className="mt-7 flex items-baseline gap-1.5">
          <span className="text-3xl font-semibold tabular-nums">$1.500</span>
          <span className="text-sm text-(--color-ink-muted)">CLP / mes (~$1,60 USD)</span>
        </div>

        {error && <p className="mt-4 text-sm text-(--color-expense)">{error}</p>}

        <PrimaryButton onClick={onSubscribe} loading={loading} className="mt-6">
          Adquirir Premium ahora — $1,60 USD
        </PrimaryButton>

        <button
          onClick={onSkip}
          disabled={loading}
          className="mt-3 w-full py-2 text-sm text-(--color-ink-muted) disabled:opacity-60"
        >
          No, gracias. Usar versión gratuita
        </button>
      </motion.div>
    </div>
  )
}
