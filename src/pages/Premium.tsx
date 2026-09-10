import { useState } from 'react'
import { useAuthStore } from '../store/authStore'
import { monthStartISO } from '../lib/premium'
import { activatePremiumMock } from '../lib/payments'
import { useAllCategories } from '../hooks/useCategories'
import { useStatsData } from '../hooks/useStatsData'
import {
  useSavingsGoals,
  useCreateSavingsGoal,
  useAddToSavingsGoal,
  useDeleteSavingsGoal,
} from '../hooks/useSavingsGoals'
import { useCategoryLimits, useSetCategoryLimit, useDeleteCategoryLimit } from '../hooks/useCategoryLimits'
import {
  useSubscriptions,
  useCreateSubscription,
  useToggleSubscription,
  useDeleteSubscription,
} from '../hooks/useSubscriptions'
import { TextField, AmountField } from '../components/fields'
import PrimaryButton from '../components/PrimaryButton'
import CategoryPicker from '../components/CategoryPicker'
import PremiumLock from '../components/PremiumLock'
import MockPaymentModal from '../components/MockPaymentModal'
import GoalCard from '../components/GoalCard'
import LimitRow from '../components/LimitRow'
import SubscriptionCard from '../components/SubscriptionCard'

type Tab = 'goals' | 'limits' | 'subscriptions'
const TABS: { id: Tab; label: string }[] = [
  { id: 'goals', label: 'Metas' },
  { id: 'limits', label: 'Límites' },
  { id: 'subscriptions', label: 'Suscripciones' },
]

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

export default function Premium() {
  const { session, profile, fetchProfile } = useAuthStore()
  const userId = session?.user.id
  const [tab, setTab] = useState<Tab>('goals')
  const [subscribing, setSubscribing] = useState(false)
  const [showPayment, setShowPayment] = useState(false)
  const [premiumError, setPremiumError] = useState<string | null>(null)

  // Se llama cuando el pago (mock o real) se confirma — ver src/lib/payments.ts
  // Fase 11: igual que en Onboarding.tsx, la Edge Function `activate-premium-mock`
  // hace el UPDATE real con service_role — el cliente ya no puede.
  async function activatePremium() {
    if (!userId || !session) return
    setSubscribing(true)
    const result = await activatePremiumMock(session.access_token)
    setSubscribing(false)
    setShowPayment(false)
    if (!result.success) {
      setPremiumError(result.error)
      return
    }
    setPremiumError(null)
    await fetchProfile(userId)
  }

  return (
    <div className="flex flex-col gap-6 text-(--color-ink)">
      <header>
        <h1 className="text-2xl font-semibold">Premium</h1>
        <p className="mt-1 text-sm text-(--color-ink-muted)">Metas de ahorro, límites por categoría y suscripciones.</p>
      </header>

      {!profile?.is_premium ? (
        <PremiumLock onSubscribe={() => setShowPayment(true)} loading={subscribing} error={premiumError} />
      ) : (
        <>
          <div className="grid grid-cols-3 gap-1 rounded-(--radius-pill) bg-(--color-surface) p-1">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`rounded-(--radius-pill) py-2 text-sm font-semibold transition ${
                  tab === t.id ? 'bg-(--color-mint) text-(--color-bg)' : 'text-(--color-ink-muted)'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === 'goals' && <GoalsTab userId={userId} />}
          {tab === 'limits' && <LimitsTab userId={userId} />}
          {tab === 'subscriptions' && <SubscriptionsTab userId={userId} />}
        </>
      )}

      {showPayment && (
        <MockPaymentModal onClose={() => setShowPayment(false)} onSuccess={activatePremium} />
      )}
    </div>
  )
}

function GoalsTab({ userId }: { userId: string | undefined }) {
  const { data: goals, isLoading } = useSavingsGoals(userId)
  const createGoal = useCreateSavingsGoal(userId)
  const addFunds = useAddToSavingsGoal(userId)
  const deleteGoal = useDeleteSavingsGoal(userId)

  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [deadline, setDeadline] = useState('')

  const canCreate = name.trim().length > 0 && Number(amount || '0') > 0 && deadline.length > 0

  function handleCreate() {
    if (!canCreate) return
    createGoal.mutate(
      { name: name.trim(), target_amount: Number(amount), deadline },
      {
        onSuccess: () => {
          setName('')
          setAmount('')
          setDeadline('')
          setShowForm(false)
        },
      }
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {showForm ? (
        <div className="flex flex-col gap-4 rounded-2xl border border-(--color-border) bg-(--color-surface) p-4">
          <TextField label="Nombre de la meta" placeholder="Ej: Viaje al sur" value={name} onChange={(e) => setName(e.target.value)} />
          <AmountField label="Monto objetivo" value={amount} onChange={setAmount} />
          <TextField label="Fecha límite" type="date" min={todayISO()} value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          {createGoal.isError && <p className="text-sm text-(--color-expense)">No pudimos crear la meta. Intenta de nuevo.</p>}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="flex-1 rounded-(--radius-pill) border border-(--color-border) py-3 text-sm font-semibold"
            >
              Cancelar
            </button>
            <PrimaryButton onClick={handleCreate} disabled={!canCreate} loading={createGoal.isPending} className="flex-1">
              Crear meta
            </PrimaryButton>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="w-full rounded-2xl border border-dashed border-(--color-border) py-4 text-sm font-medium text-(--color-ink-muted)"
        >
          + Nueva meta de ahorro
        </button>
      )}

      {isLoading ? (
        <div className="h-24 animate-pulse rounded-2xl bg-(--color-surface)" />
      ) : goals && goals.length > 0 ? (
        <div className="flex flex-col gap-3">
          {goals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              addLoading={addFunds.isPending}
              deleteLoading={deleteGoal.isPending}
              onAddFunds={(value) => addFunds.mutate({ goal, amount: value })}
              onDelete={() => deleteGoal.mutate(goal.id)}
            />
          ))}
        </div>
      ) : (
        <p className="rounded-2xl border border-dashed border-(--color-border) p-6 text-center text-sm text-(--color-ink-faint)">
          Todavía no tienes metas de ahorro.
        </p>
      )}
    </div>
  )
}

function LimitsTab({ userId }: { userId: string | undefined }) {
  const now = new Date()
  const monthYear = monthStartISO(now)

  const { data: limits, isLoading } = useCategoryLimits(userId, monthYear)
  const { data: stats } = useStatsData(userId, now.getFullYear(), now.getMonth())
  const setLimit = useSetCategoryLimit(userId, monthYear)
  const deleteLimit = useDeleteCategoryLimit(userId, monthYear)
  // "Sueldo" es una categoría de ingreso; no aplica a límites (son de gasto).
  const { data: allCategories } = useAllCategories(userId)
  const expenseCategories = allCategories.filter((c) => c.id !== 'sueldo')

  const [showForm, setShowForm] = useState(false)
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [amount, setAmount] = useState('')

  const availableCategories = expenseCategories.filter((c) => !limits?.some((l) => l.category === c.id))
  const canSave = categoryId !== null && Number(amount || '0') > 0

  function handleSave() {
    if (!canSave || !categoryId) return
    setLimit.mutate(
      { category: categoryId, limit_amount: Number(amount) },
      {
        onSuccess: () => {
          setCategoryId(null)
          setAmount('')
          setShowForm(false)
        },
      }
    )
  }

  function spentFor(category: string) {
    return stats?.breakdown.find((b) => b.category === category)?.amount ?? 0
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-(--color-ink-faint)">
        Los límites aplican al mes actual ({now.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })}).
      </p>

      {showForm ? (
        <div className="flex flex-col gap-4 rounded-2xl border border-(--color-border) bg-(--color-surface) p-4">
          {availableCategories.length === 0 ? (
            <p className="text-sm text-(--color-ink-muted)">Ya configuraste un límite para todas las categorías de gasto.</p>
          ) : (
            <>
              <div>
                <p className="mb-3 text-sm text-(--color-ink-muted)">Categoría</p>
                <CategoryPicker categories={availableCategories} value={categoryId} onChange={setCategoryId} />
              </div>
              <AmountField label="Tope mensual" value={amount} onChange={setAmount} />
            </>
          )}
          {setLimit.isError && <p className="text-sm text-(--color-expense)">No pudimos guardar el límite. Intenta de nuevo.</p>}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="flex-1 rounded-(--radius-pill) border border-(--color-border) py-3 text-sm font-semibold"
            >
              Cancelar
            </button>
            {availableCategories.length > 0 && (
              <PrimaryButton onClick={handleSave} disabled={!canSave} loading={setLimit.isPending} className="flex-1">
                Guardar límite
              </PrimaryButton>
            )}
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="w-full rounded-2xl border border-dashed border-(--color-border) py-4 text-sm font-medium text-(--color-ink-muted)"
        >
          + Nuevo límite por categoría
        </button>
      )}

      {isLoading ? (
        <div className="h-16 animate-pulse rounded-2xl bg-(--color-surface)" />
      ) : limits && limits.length > 0 ? (
        <div className="flex flex-col gap-3">
          {limits.map((limit) => (
            <LimitRow
              key={limit.id}
              limit={limit}
              spent={spentFor(limit.category)}
              deleteLoading={deleteLimit.isPending}
              onDelete={() => deleteLimit.mutate(limit.id)}
            />
          ))}
        </div>
      ) : (
        <p className="rounded-2xl border border-dashed border-(--color-border) p-6 text-center text-sm text-(--color-ink-faint)">
          No has configurado límites este mes.
        </p>
      )}
    </div>
  )
}

function SubscriptionsTab({ userId }: { userId: string | undefined }) {
  const { data: subs, isLoading } = useSubscriptions(userId)
  const createSub = useCreateSubscription(userId)
  const toggleSub = useToggleSubscription(userId)
  const deleteSub = useDeleteSubscription(userId)
  const { data: allCategories } = useAllCategories(userId)
  const expenseCategories = allCategories.filter((c) => c.id !== 'sueldo')

  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [billingDay, setBillingDay] = useState('1')
  const [categoryId, setCategoryId] = useState<string | null>('servicios')

  const dayNumber = Number(billingDay || '0')
  const canCreate = name.trim().length > 0 && Number(amount || '0') > 0 && dayNumber >= 1 && dayNumber <= 31 && categoryId !== null

  function handleCreate() {
    if (!canCreate || !categoryId) return
    createSub.mutate(
      { name: name.trim(), amount: Number(amount), billing_day: dayNumber, category: categoryId },
      {
        onSuccess: () => {
          setName('')
          setAmount('')
          setBillingDay('1')
          setCategoryId('servicios')
          setShowForm(false)
        },
      }
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-(--color-ink-faint)">
        Al abrir la app, si hoy es el día de cobro y aún no existe el gasto de ese mes, se agrega automáticamente.
      </p>

      {showForm ? (
        <div className="flex flex-col gap-4 rounded-2xl border border-(--color-border) bg-(--color-surface) p-4">
          <TextField label="Nombre" placeholder="Ej: Netflix" value={name} onChange={(e) => setName(e.target.value)} />
          <AmountField label="Monto mensual" value={amount} onChange={setAmount} />
          <TextField
            label="Día de cobro (1-31)"
            type="number"
            min={1}
            max={31}
            value={billingDay}
            onChange={(e) => setBillingDay(e.target.value)}
          />
          <div>
            <p className="mb-3 text-sm text-(--color-ink-muted)">Categoría</p>
            <CategoryPicker categories={expenseCategories} value={categoryId} onChange={setCategoryId} />
          </div>
          {createSub.isError && <p className="text-sm text-(--color-expense)">No pudimos agregar la suscripción. Intenta de nuevo.</p>}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="flex-1 rounded-(--radius-pill) border border-(--color-border) py-3 text-sm font-semibold"
            >
              Cancelar
            </button>
            <PrimaryButton onClick={handleCreate} disabled={!canCreate} loading={createSub.isPending} className="flex-1">
              Agregar
            </PrimaryButton>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="w-full rounded-2xl border border-dashed border-(--color-border) py-4 text-sm font-medium text-(--color-ink-muted)"
        >
          + Nueva suscripción
        </button>
      )}

      {isLoading ? (
        <div className="h-16 animate-pulse rounded-2xl bg-(--color-surface)" />
      ) : subs && subs.length > 0 ? (
        <div className="flex flex-col gap-3">
          {subs.map((sub) => (
            <SubscriptionCard
              key={sub.id}
              sub={sub}
              deleteLoading={deleteSub.isPending}
              onToggle={(active) => toggleSub.mutate({ id: sub.id, active })}
              onDelete={() => deleteSub.mutate(sub.id)}
            />
          ))}
        </div>
      ) : (
        <p className="rounded-2xl border border-dashed border-(--color-border) p-6 text-center text-sm text-(--color-ink-faint)">
          No tienes suscripciones registradas.
        </p>
      )}
    </div>
  )
}
