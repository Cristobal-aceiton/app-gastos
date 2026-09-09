import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Tags, Banknote, Waves, Crown, Bell } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { cancelPremiumMock } from '../lib/payments'
import { useNotificationPrefs, useUpdateNotificationPrefs } from '../hooks/useNotificationPrefs'
import { usePushSubscription } from '../hooks/usePushSubscription'
import type { IncomeType } from '../types/profile'
import { TextField, AmountField } from '../components/fields'
import PrimaryButton from '../components/PrimaryButton'
import OptionCard from '../components/OptionCard'
import Toast from '../components/Toast'
import ConfirmDialog from '../components/ConfirmDialog'
import ToggleSwitch from '../components/ToggleSwitch'
import { haptics } from '../lib/haptics'

export default function Settings() {
  const { session, profile, fetchProfile } = useAuthStore()
  const navigate = useNavigate()
  const userId = session?.user.id

  const [toast, setToast] = useState<string | null>(null)

  // --- Datos personales ---
  const [name, setName] = useState(profile?.name ?? '')
  const [savingName, setSavingName] = useState(false)

  async function handleSaveName() {
    if (!userId || !name.trim()) return
    setSavingName(true)
    const { error } = await supabase.from('profiles').update({ name: name.trim() }).eq('id', userId)
    setSavingName(false)
    if (!error) {
      await fetchProfile(userId)
      haptics.success()
      setToast('Nombre actualizado')
    }
  }

  // --- Ingresos ---
  const [incomeType, setIncomeType] = useState<IncomeType>(profile?.income_type ?? 'variable')
  const [fixedSalary, setFixedSalary] = useState(String(profile?.fixed_salary ?? ''))
  const [savingIncome, setSavingIncome] = useState(false)

  async function handleSaveIncome() {
    if (!userId) return
    setSavingIncome(true)
    const { error } = await supabase
      .from('profiles')
      .update({
        income_type: incomeType,
        fixed_salary: incomeType === 'fixed' ? Number(fixedSalary || '0') : 0,
      })
      .eq('id', userId)
    setSavingIncome(false)
    if (!error) {
      await fetchProfile(userId)
      haptics.success()
      setToast('Sueldo actualizado')
    }
  }

  // --- Plan Premium ---
  const [premiumLoading, setPremiumLoading] = useState(false)
  const [confirmCancel, setConfirmCancel] = useState(false)

  async function handleCancelPremium() {
    if (!userId || !session) return
    setPremiumLoading(true)
    // Fase 9 (mock): mientras no haya cuenta de Stripe real, esto solo marca
    // is_premium = false en Supabase. Cuando esté conectado, lo más simple es
    // reemplazar este botón por un link al Customer Portal de Stripe
    // (stripe.customerPortal.sessions.create desde una Edge Function) — ahí
    // el usuario cancela o cambia su tarjeta sin que haya que construir esa
    // pantalla, y es el webhook (customer.subscription.deleted) el que
    // confirma la baja, no el cliente directamente.
    // Fase 11: el UPDATE de is_premium ya no lo hace el cliente — lo hace
    // la Edge Function `cancel-premium-mock` con service_role.
    const result = await cancelPremiumMock(session.access_token)
    setPremiumLoading(false)
    setConfirmCancel(false)
    if (result.success) {
      await fetchProfile(userId)
      haptics.medium()
      setToast('Suscripción cancelada')
    } else {
      setToast(result.error)
    }
  }

  // --- Notificaciones (Fase 13.1-13.3) ---
  const push = usePushSubscription(userId)
  const { data: notificationPrefs } = useNotificationPrefs(userId)
  const updateNotificationPrefs = useUpdateNotificationPrefs(userId)

  async function handleTogglePush(enabled: boolean) {
    if (enabled) {
      await push.enable()
      if (push.error) return
      haptics.success()
      setToast('Notificaciones activadas')
    } else {
      await push.disable()
      if (push.error) return
      haptics.medium()
      setToast('Notificaciones desactivadas')
    }
  }

  function handleToggleNotificationPref(key: 'subscriptions_reminder' | 'category_limit_alert' | 'savings_goal_reminder', value: boolean) {
    updateNotificationPrefs.mutate({ [key]: value })
  }

  return (
    <div className="flex flex-col gap-6 text-(--color-ink)">
      <header className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          aria-label="Volver"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-(--color-border) text-(--color-ink-muted)"
        >
          <ChevronLeft size={18} />
        </button>
        <h1 className="text-2xl font-semibold">Configuración</h1>
      </header>

      {/* Categorías */}
      <Link
        to="/settings/categories"
        className="flex items-center gap-3 rounded-2xl border border-(--color-border) bg-(--color-surface) p-4 transition active:scale-[0.99]"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-(--color-mint-dim) text-(--color-mint)">
          <Tags size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-medium">Categorías</p>
          <p className="truncate text-xs text-(--color-ink-muted)">Crea o elimina tus categorías personalizadas</p>
        </div>
        <ChevronRight size={18} className="shrink-0 text-(--color-ink-faint)" />
      </Link>

      {/* Datos personales */}
      <section className="flex flex-col gap-3 rounded-2xl border border-(--color-border) bg-(--color-surface) p-4">
        <h2 className="text-sm font-semibold text-(--color-ink-muted)">Datos personales</h2>
        <TextField label="Nombre" value={name} onChange={(e) => setName(e.target.value)} />
        <PrimaryButton
          onClick={handleSaveName}
          disabled={!name.trim() || name.trim() === profile?.name}
          loading={savingName}
        >
          Guardar
        </PrimaryButton>
      </section>

      {/* Ingresos */}
      <section className="flex flex-col gap-3 rounded-2xl border border-(--color-border) bg-(--color-surface) p-4">
        <h2 className="text-sm font-semibold text-(--color-ink-muted)">Ingresos</h2>
        <div className="flex flex-col gap-3">
          <OptionCard
            icon={<Banknote size={17} />}
            title="Tengo sueldo fijo"
            selected={incomeType === 'fixed'}
            onClick={() => setIncomeType('fixed')}
          />
          {incomeType === 'fixed' && (
            <AmountField label="Sueldo mensual" value={fixedSalary} onChange={setFixedSalary} />
          )}
          <OptionCard
            icon={<Waves size={17} />}
            title="Mis ingresos son variables"
            selected={incomeType === 'variable'}
            onClick={() => setIncomeType('variable')}
          />
          {incomeType === 'variable' && (
            <p className="rounded-2xl bg-(--color-bg-elevated) p-3 text-xs text-(--color-ink-muted)">
              Tus ingresos se suman automáticamente a medida que registras transacciones de tipo "Sueldo".
            </p>
          )}
        </div>
        <PrimaryButton
          onClick={handleSaveIncome}
          disabled={incomeType === 'fixed' && Number(fixedSalary || '0') <= 0}
          loading={savingIncome}
        >
          Actualizar sueldo
        </PrimaryButton>
      </section>

      {/* Plan Premium */}
      <section className="flex flex-col gap-3 rounded-2xl border border-(--color-border) bg-(--color-surface) p-4">
        <h2 className="text-sm font-semibold text-(--color-ink-muted)">Plan Premium</h2>
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-(--color-mint-dim) text-(--color-mint)">
            <Crown size={18} />
          </span>
          <div>
            <p className="font-medium">{profile?.is_premium ? 'Premium' : 'Gratuito'}</p>
            {profile?.is_premium && profile.premium_since && (
              <p className="text-xs text-(--color-ink-muted)">
                Desde el {new Date(`${profile.premium_since}T00:00:00`).toLocaleDateString('es-CL')}
              </p>
            )}
          </div>
        </div>
        <PrimaryButton onClick={() => navigate('/premium')}>Gestionar suscripción</PrimaryButton>
        {profile?.is_premium && (
          <button
            onClick={() => setConfirmCancel(true)}
            disabled={premiumLoading}
            className="w-full rounded-(--radius-pill) border border-(--color-border) py-3 text-sm font-semibold text-(--color-expense) transition disabled:opacity-60"
          >
            {premiumLoading ? 'Cancelando…' : 'Cancelar suscripción'}
          </button>
        )}
      </section>

      {/* Notificaciones (Fase 13.1-13.3) */}
      <section className="flex flex-col gap-4 rounded-2xl border border-(--color-border) bg-(--color-surface) p-4">
        <h2 className="text-sm font-semibold text-(--color-ink-muted)">Notificaciones</h2>

        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-(--color-mint-dim) text-(--color-mint)">
            <Bell size={18} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-medium">Notificaciones push</p>
            <p className="truncate text-xs text-(--color-ink-muted)">
              {!push.supported
                ? 'No disponibles en este navegador'
                : push.permission === 'denied'
                  ? 'Bloqueadas en los permisos del navegador'
                  : push.subscribed
                    ? 'Activadas en este dispositivo'
                    : 'Desactivadas en este dispositivo'}
            </p>
          </div>
          <ToggleSwitch
            checked={push.subscribed}
            onChange={handleTogglePush}
            disabled={!push.supported || push.checking || push.loading || push.permission === 'denied'}
            label={push.subscribed ? 'Desactivar notificaciones push' : 'Activar notificaciones push'}
          />
        </div>

        {push.error && <p className="text-xs text-(--color-expense)">{push.error}</p>}

        <div className="flex flex-col gap-3 border-t border-(--color-border) pt-3">
          <p className="text-xs text-(--color-ink-muted)">
            Elige qué avisos quieres recibir (solo aplican a las funciones Premium):
          </p>

          <div className="flex items-center justify-between gap-3">
            <p className="text-sm">Cobro de suscripción en 2-3 días</p>
            <ToggleSwitch
              checked={notificationPrefs?.subscriptions_reminder ?? true}
              onChange={(v) => handleToggleNotificationPref('subscriptions_reminder', v)}
              disabled={!push.subscribed}
              label="Avisar antes de cobrar una suscripción"
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            <p className="text-sm">Límite de categoría al 80%</p>
            <ToggleSwitch
              checked={notificationPrefs?.category_limit_alert ?? true}
              onChange={(v) => handleToggleNotificationPref('category_limit_alert', v)}
              disabled={!push.subscribed}
              label="Avisar al llegar al 80% de un límite"
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            <p className="text-sm">Meta de ahorro por vencer</p>
            <ToggleSwitch
              checked={notificationPrefs?.savings_goal_reminder ?? true}
              onChange={(v) => handleToggleNotificationPref('savings_goal_reminder', v)}
              disabled={!push.subscribed}
              label="Avisar cuando una meta esté por vencer"
            />
          </div>
        </div>
      </section>

      <ConfirmDialog
        open={confirmCancel}
        title="¿Cancelar tu suscripción Premium?"
        description="Perderás acceso a metas de ahorro, límites por categoría y suscripciones automáticas al final de este período."
        confirmLabel="Cancelar suscripción"
        loading={premiumLoading}
        onConfirm={handleCancelPremium}
        onCancel={() => setConfirmCancel(false)}
      />

      <Toast message={toast} onDismiss={() => setToast(null)} />
    </div>
  )
}
