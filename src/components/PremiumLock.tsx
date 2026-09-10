import { Target, ShieldAlert, BellRing, RefreshCw } from 'lucide-react'
import PrimaryButton from './PrimaryButton'

const benefits = [
  { icon: Target, text: 'Metas de ahorro' },
  { icon: ShieldAlert, text: 'Límites por categoría' },
  { icon: BellRing, text: 'Alertas tempranas' },
  { icon: RefreshCw, text: 'Descuento automático de suscripciones' },
]

export default function PremiumLock({
  onSubscribe,
  loading,
  error,
}: {
  onSubscribe: () => void
  loading?: boolean
  error?: string | null
}) {
  return (
    <div className="glass-balance rounded-(--radius-card) p-6">
      <p className="text-xl font-semibold leading-snug">🚀 Lleva tus finanzas al siguiente nivel</p>

      <ul className="mt-5 flex flex-col gap-3">
        {benefits.map(({ icon: Icon, text }) => (
          <li key={text} className="flex items-center gap-3 text-sm">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black/25 text-(--color-mint)">
              <Icon size={17} />
            </span>
            {text}
          </li>
        ))}
      </ul>

      <div className="mt-6 flex items-baseline gap-1.5">
        <span className="text-2xl font-semibold tabular-nums">$1.500</span>
        <span className="text-sm text-(--color-ink-muted)">CLP / mes (~$1,60 USD)</span>
      </div>

      {error && <p className="mt-4 text-sm text-(--color-expense)">{error}</p>}

      <PrimaryButton onClick={onSubscribe} loading={loading} className="mt-5">
        Adquirir Premium ahora — $1,60 USD
      </PrimaryButton>
    </div>
  )
}
