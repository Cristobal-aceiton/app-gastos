import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { useAllCategories } from '../hooks/useCategories'
import { TextField, AmountField } from '../components/fields'
import PrimaryButton from '../components/PrimaryButton'
import TypeToggle, { type TxType } from '../components/TypeToggle'
import CategoryPicker from '../components/CategoryPicker'
import SuccessOverlay from '../components/SuccessOverlay'

// Sueldo es una categoría de ingreso; el resto son de gasto. "Otros" aplica a ambos.
const INCOME_CATEGORY_IDS = ['sueldo', 'otros']

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

export default function AddTransaction() {
  const { session } = useAuthStore()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: allCategories } = useAllCategories(session?.user.id)

  const [type, setType] = useState<TxType>('expense')
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(todayISO())
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Las categorías personalizadas (Fase 8) son de gasto; "Sueldo" sigue siendo la única de ingreso fijo.
  const categories =
    type === 'income'
      ? allCategories.filter((c) => INCOME_CATEGORY_IDS.includes(c.id))
      : allCategories.filter((c) => !INCOME_CATEGORY_IDS.includes(c.id) || c.id === 'otros')

  function handleTypeChange(next: TxType) {
    setType(next)
    setCategoryId(null)
  }

  const amountNumber = Number(amount || '0')
  const canSave = !!session && amountNumber > 0 && categoryId !== null && date.length > 0 && !saving

  async function handleSave() {
    if (!session || !canSave || !categoryId) return
    setError(null)
    setSaving(true)

    const { error: insertError } = await supabase.from('transactions').insert({
      user_id: session.user.id,
      type,
      category: categoryId,
      amount: amountNumber,
      description: note.trim() || null,
      date,
    })

    setSaving(false)

    if (insertError) {
      setError('No pudimos guardar la transacción. Intenta de nuevo.')
      return
    }

    // Refresca el Dashboard (mismo queryKey que useDashboardData) sin recargar la página.
    await queryClient.invalidateQueries({ queryKey: ['dashboard', session.user.id] })

    setSuccess(true)
    setTimeout(() => navigate('/', { replace: true }), 1100)
  }

  return (
    <div className="flex flex-col gap-6 text-(--color-ink)">
      <header>
        <h1 className="text-2xl font-semibold">Agregar transacción</h1>
        <p className="mt-1 text-sm text-(--color-ink-muted)">Registra un ingreso o un gasto.</p>
      </header>

      <TypeToggle value={type} onChange={handleTypeChange} />

      <AmountField
        label={type === 'expense' ? 'Monto gastado' : 'Monto recibido'}
        value={amount}
        onChange={setAmount}
        autoFocus
      />

      <div>
        <p className="mb-3 text-sm text-(--color-ink-muted)">Categoría</p>
        <CategoryPicker categories={categories} value={categoryId} onChange={setCategoryId} />
      </div>

      <TextField
        label="Fecha"
        type="date"
        value={date}
        max={todayISO()}
        onChange={(e) => setDate(e.target.value)}
      />

      <TextField
        label="Nota (opcional)"
        placeholder="Ej: Almuerzo con amigos"
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />

      {error && <p className="text-sm text-(--color-expense)">{error}</p>}

      <PrimaryButton onClick={handleSave} disabled={!canSave} loading={saving}>
        Guardar
      </PrimaryButton>

      <AnimatePresence>
        {success && <SuccessOverlay message={type === 'expense' ? 'Gasto guardado' : 'Ingreso guardado'} />}
      </AnimatePresence>
    </div>
  )
}
