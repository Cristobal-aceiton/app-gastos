import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Plane, Wallet, Briefcase, Sparkles, Banknote, Waves } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { needsOnboarding, type IncomeType } from '../types/profile'
import OptionCard from '../components/OptionCard'
import { TextField } from '../components/fields'
import PrimaryButton from '../components/PrimaryButton'
import PremiumUpsell from '../components/PremiumUpsell'
import MockPaymentModal from '../components/MockPaymentModal'
import { activatePremiumMock } from '../lib/payments'

const PURPOSES = [
  { value: 'travel', label: 'Ahorrar para un viaje', icon: <Plane size={17} /> },
  { value: 'daily', label: 'Controlar gastos del día a día', icon: <Wallet size={17} /> },
  { value: 'business', label: 'Administrar mi negocio/freelance', icon: <Briefcase size={17} /> },
  { value: 'curious', label: 'Solo curiosidad', icon: <Sparkles size={17} /> },
]

const TOTAL_STEPS = 3

export default function Onboarding() {
  const { session, profile, fetchProfile } = useAuthStore()
  const navigate = useNavigate()

  const [step, setStep] = useState(1)
  const [name, setName] = useState('')
  const [purpose, setPurpose] = useState<string | null>(null)
  const [incomeType, setIncomeType] = useState<IncomeType | null>(null)
  const [fixedSalary, setFixedSalary] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPremium, setShowPremium] = useState(false)
  const [showPayment, setShowPayment] = useState(false)
  const [premiumLoading, setPremiumLoading] = useState(false)

  if (!session) return <Navigate to="/login" replace />
  if (!needsOnboarding(profile) && !showPremium) return <Navigate to="/" replace />

  const canContinueStep1 = name.trim().length > 0
  const canContinueStep2 = purpose !== null
  const canFinish = incomeType === 'variable' || (incomeType === 'fixed' && Number(fixedSalary) > 0)

  async function handleFinish() {
    setError(null)
    setSaving(true)

    const { error: updateError } = await supabase
      .from('profiles')
      .upsert({
        id: session!.user.id,
        name: name.trim(),
        purpose,
        income_type: incomeType,
        fixed_salary: incomeType === 'fixed' ? Number(fixedSalary) : 0,
      })

    setSaving(false)

    if (updateError) {
      setError('No pudimos guardar tus datos. Intenta de nuevo.')
      return
    }

    await fetchProfile(session!.user.id)

    if (needsOnboarding(useAuthStore.getState().profile)) {
      // El guardado no dejó el perfil con nombre (p.ej. políticas RLS bloqueando
      // el upsert). Avisamos en vez de mandar al usuario a Premium como si
      // hubiera funcionado, para no repetir el loop de "vuelve a pedir todo".
      setError('No pudimos guardar tus datos. Revisa tu conexión e intenta de nuevo.')
      return
    }

    setShowPremium(true)
  }

  // Se llama cuando el pago (mock o real) se confirma — ver src/lib/payments.ts
  // Fase 11: la activación real de `is_premium` ya no la hace el cliente
  // (el trigger `protect_premium_columns` la rechazaría) — la Edge Function
  // `activate-premium-mock` la hace con el service_role, después de
  // verificar el JWT de esta sesión.
  async function activatePremium() {
    setPremiumLoading(true)
    const result = await activatePremiumMock(session!.access_token)
    setPremiumLoading(false)
    setShowPayment(false)
    if (!result.success) {
      setError(result.error)
      return
    }
    setError(null)
    await fetchProfile(session!.user.id)
    navigate('/', { replace: true })
  }

  function handleSkipPremium() {
    navigate('/', { replace: true })
  }

  if (showPremium) {
    return (
      <>
        <PremiumUpsell
          onSubscribe={() => setShowPayment(true)}
          onSkip={handleSkipPremium}
          loading={premiumLoading}
          error={error}
        />
        {showPayment && (
          <MockPaymentModal onClose={() => setShowPayment(false)} onSuccess={activatePremium} />
        )}
      </>
    )
  }

  return (
    <div className="flex min-h-svh flex-col bg-(--color-bg) px-6 pb-10 pt-12 text-(--color-ink)">
      <div className="mx-auto w-full max-w-sm flex-1">
        {/* Barra de progreso — es una secuencia real de 3 pasos, así que el indicador aporta información */}
        <div className="flex gap-1.5">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full ${i < step ? 'bg-(--color-mint)' : 'bg-(--color-border)'}`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              className="mt-8"
            >
              <h1 className="text-2xl font-semibold">¿Cómo te llamas?</h1>
              <p className="mt-1 text-sm text-(--color-ink-muted)">Así te vamos a saludar en la app.</p>
              <div className="mt-6">
                <TextField
                  label="Tu nombre"
                  placeholder="Ej: Cristóbal"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                />
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              className="mt-8"
            >
              <h1 className="text-2xl font-semibold">¿Para qué usarás la app?</h1>
              <p className="mt-1 text-sm text-(--color-ink-muted)">Elige la que más se parezca a tu caso.</p>
              <div className="mt-6 flex flex-col gap-3">
                {PURPOSES.map((p) => (
                  <OptionCard
                    key={p.value}
                    icon={p.icon}
                    title={p.label}
                    selected={purpose === p.value}
                    onClick={() => setPurpose(p.value)}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              className="mt-8"
            >
              <h1 className="text-2xl font-semibold">¿Cómo es tu ingreso?</h1>
              <p className="mt-1 text-sm text-(--color-ink-muted)">
                Esto nos ayuda a calcular tu balance mensual.
              </p>
              <div className="mt-6 flex flex-col gap-3">
                <OptionCard
                  icon={<Banknote size={17} />}
                  title="Tengo sueldo fijo"
                  selected={incomeType === 'fixed'}
                  onClick={() => setIncomeType('fixed')}
                />
                {incomeType === 'fixed' && (
                  <div className="pl-1">
                    <TextField
                      label="Tu ingreso mensual"
                      type="number"
                      inputMode="numeric"
                      placeholder="Ej: 900000"
                      value={fixedSalary}
                      onChange={(e) => setFixedSalary(e.target.value)}
                    />
                  </div>
                )}

                <OptionCard
                  icon={<Waves size={17} />}
                  title="Mis ingresos son variables"
                  selected={incomeType === 'variable'}
                  onClick={() => setIncomeType('variable')}
                />
                {incomeType === 'variable' && (
                  <p className="rounded-2xl bg-(--color-surface) p-4 text-sm text-(--color-ink-muted)">
                    Tranquilo, no necesitas poner un monto ahora. A medida que registres tus ingresos
                    manualmente (por ejemplo, el cobro de un proyecto), la app los va a sumar
                    automáticamente y los va a considerar tu "sueldo dinámico" del mes.
                  </p>
                )}
              </div>

              {error && <p className="mt-4 text-sm text-(--color-expense)">{error}</p>}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mx-auto w-full max-w-sm">
        {step < TOTAL_STEPS ? (
          <PrimaryButton
            onClick={() => setStep((s) => s + 1)}
            disabled={step === 1 ? !canContinueStep1 : !canContinueStep2}
          >
            Continuar
          </PrimaryButton>
        ) : (
          <PrimaryButton onClick={handleFinish} disabled={!canFinish} loading={saving}>
            Terminar
          </PrimaryButton>
        )}
        {step > 1 && (
          <button
            onClick={() => setStep((s) => s - 1)}
            className="mt-3 w-full py-2 text-sm text-(--color-ink-muted)"
          >
            Atrás
          </button>
        )}
      </div>
    </div>
  )
}
