import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CreditCard, Lock, X } from 'lucide-react'
import PrimaryButton from './PrimaryButton'
import { TextField } from './fields'
import SuccessOverlay from './SuccessOverlay'
import { runMockCheckout } from '../lib/payments'
import { haptics } from '../lib/haptics'

type Status = 'idle' | 'processing' | 'success'

/**
 * Fase 9 (MVP sin credenciales de Stripe reales, ver `src/lib/payments.ts`): simula el
 * checkout de una pasarela — campos de tarjeta puramente visuales, sin
 * validación real ni cobro real — y llama a `onSuccess` cuando "termina".
 * Reutilizado por Onboarding (upsell post-registro) y por Premium.tsx
 * (upsell del Dashboard/Estadísticas y "Gestionar suscripción" en Settings).
 */
export default function MockPaymentModal({
  amountLabel = '$1.500 CLP',
  onClose,
  onSuccess,
}: {
  amountLabel?: string
  onClose: () => void
  onSuccess: () => void | Promise<void>
}) {
  const [status, setStatus] = useState<Status>('idle')
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242')
  const [expiry, setExpiry] = useState('12/29')
  const [cvv, setCvv] = useState('123')

  const canPay = cardNumber.replace(/\s/g, '').length >= 12 && expiry.length >= 4 && cvv.length >= 3

  function formatCardNumber(v: string) {
    const digits = v.replace(/\D/g, '').slice(0, 16)
    return digits.replace(/(.{4})/g, '$1 ').trim()
  }

  function formatExpiry(v: string) {
    const digits = v.replace(/\D/g, '').slice(0, 4)
    return digits.length <= 2 ? digits : `${digits.slice(0, 2)}/${digits.slice(2)}`
  }

  async function handlePay() {
    if (!canPay || status !== 'idle') return
    haptics.medium()
    setStatus('processing')
    await runMockCheckout()
    setStatus('success')
    haptics.success()
    setTimeout(() => {
      void onSuccess()
    }, 1100)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 px-0 sm:items-center sm:px-6">
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', damping: 26, stiffness: 300 }}
        className="glass-balance relative w-full max-w-sm overflow-hidden rounded-t-(--radius-card) p-7 sm:rounded-(--radius-card)"
      >
        <AnimatePresence>{status === 'success' && <SuccessOverlay message="¡Pago exitoso!" />}</AnimatePresence>

        {status === 'idle' && (
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="absolute right-5 top-5 text-(--color-ink-faint)"
          >
            <X size={20} />
          </button>
        )}

        <div className="flex items-center gap-2 text-(--color-mint)">
          <CreditCard size={20} />
          <span className="text-sm font-semibold">Pago simulado</span>
        </div>

        <p className="mt-3 text-2xl font-semibold">Pagar {amountLabel}</p>
        <p className="mt-1 text-sm text-(--color-ink-muted)">
          Todavía no hay una pasarela real conectada, así que esto simula el pago para probar el flujo
          Premium. Cuando tengas tu cuenta de Stripe, este paso se reemplaza por el Checkout real
          (ver README, sección "Fase 9").
        </p>

        <div className="mt-6 flex flex-col gap-4">
          <TextField
            label="Número de tarjeta"
            inputMode="numeric"
            value={cardNumber}
            onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
            disabled={status === 'processing'}
          />
          <div className="flex gap-3">
            <div className="flex-1">
              <TextField
                label="Vencimiento"
                placeholder="MM/AA"
                inputMode="numeric"
                value={expiry}
                onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                disabled={status === 'processing'}
              />
            </div>
            <div className="flex-1">
              <TextField
                label="CVV"
                inputMode="numeric"
                maxLength={4}
                value={cvv}
                onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                disabled={status === 'processing'}
              />
            </div>
          </div>
        </div>

        <PrimaryButton onClick={handlePay} disabled={!canPay} loading={status === 'processing'} className="mt-6">
          {status === 'processing' ? 'Procesando…' : `Pagar ${amountLabel}`}
        </PrimaryButton>

        <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs text-(--color-ink-faint)">
          <Lock size={12} /> Pago simulado — no se realiza ningún cobro real
        </p>
      </motion.div>
    </div>
  )
}
