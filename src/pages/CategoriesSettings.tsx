import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Lock, Trash2 } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { useAllCategories, useCreateCategory, useDeleteCategory } from '../hooks/useCategories'
import type { CategoryDef } from '../lib/categories'
import ConfirmDialog from '../components/ConfirmDialog'
import AddCategoryModal from '../components/AddCategoryModal'
import { haptics } from '../lib/haptics'

function CategoryRow({ category, onDelete }: { category: CategoryDef; onDelete?: () => void }) {
  const Icon = category.icon
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-(--color-border) bg-(--color-surface) p-3">
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
        style={{ backgroundColor: `${category.color}22`, color: category.color }}
      >
        <Icon size={18} />
      </span>
      <p className="flex-1 font-medium text-(--color-ink)">{category.label}</p>
      {onDelete ? (
        <button
          onClick={onDelete}
          aria-label={`Eliminar ${category.label}`}
          className="flex h-9 w-9 items-center justify-center rounded-full text-(--color-ink-faint) transition active:bg-(--color-expense)/10 active:text-(--color-expense)"
        >
          <Trash2 size={16} />
        </button>
      ) : (
        <span className="flex h-9 w-9 items-center justify-center text-(--color-ink-faint)" title="Categoría predeterminada">
          <Lock size={15} />
        </span>
      )}
    </div>
  )
}

export default function CategoriesSettings() {
  const { session } = useAuthStore()
  const navigate = useNavigate()
  const userId = session?.user.id

  const { data: allCategories, custom } = useAllCategories(userId)
  const defaultCategories = allCategories.filter((c) => c.isDefault)
  const createCategory = useCreateCategory(userId)
  const deleteCategory = useDeleteCategory(userId)

  const [showAdd, setShowAdd] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<CategoryDef | null>(null)

  function handleCreate(input: { name: string; icon: string }) {
    createCategory.mutate(input, {
      onSuccess: () => {
        haptics.success()
        setShowAdd(false)
      },
    })
  }

  function handleConfirmDelete() {
    if (!pendingDelete) return
    deleteCategory.mutate(pendingDelete.id, {
      onSuccess: () => {
        haptics.error()
        setPendingDelete(null)
      },
    })
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
        <div>
          <h1 className="text-xl font-semibold">Categorías</h1>
          <p className="text-xs text-(--color-ink-muted)">Las predeterminadas no se pueden eliminar.</p>
        </div>
      </header>

      <button
        type="button"
        onClick={() => setShowAdd(true)}
        className="w-full rounded-2xl border border-dashed border-(--color-border) py-4 text-sm font-medium text-(--color-ink-muted)"
      >
        + Agregar categoría
      </button>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-(--color-ink-muted)">Tus categorías</h2>
        {custom.length > 0 ? (
          <div className="flex flex-col gap-2">
            {custom.map((c) => (
              <CategoryRow key={c.id} category={c} onDelete={() => setPendingDelete(c)} />
            ))}
          </div>
        ) : (
          <p className="rounded-2xl border border-dashed border-(--color-border) p-6 text-center text-sm text-(--color-ink-faint)">
            Todavía no tienes categorías personalizadas.
          </p>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-(--color-ink-muted)">Predeterminadas</h2>
        <div className="flex flex-col gap-2">
          {defaultCategories.map((c) => (
            <CategoryRow key={c.id} category={c} />
          ))}
        </div>
      </section>

      <AddCategoryModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onCreate={handleCreate}
        loading={createCategory.isPending}
        error={createCategory.isError ? 'No pudimos crear la categoría. Intenta de nuevo.' : null}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        title={`¿Eliminar "${pendingDelete?.label}"?`}
        description='Las transacciones que usan esta categoría pasarán a "Otros".'
        error={deleteCategory.isError ? 'No pudimos eliminar la categoría. Intenta de nuevo.' : null}
        loading={deleteCategory.isPending}
        onConfirm={handleConfirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  )
}
