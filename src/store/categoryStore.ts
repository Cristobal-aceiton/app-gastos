import { create } from 'zustand'
import type { CategoryDef } from '../lib/categories'

interface CategoryState {
  customCategories: CategoryDef[]
  setCustomCategories: (categories: CategoryDef[]) => void
}

/**
 * Caché en memoria de las categorías personalizadas del usuario actual.
 *
 * `useCategories` (React Query) es la fuente de verdad y sincroniza este store
 * cada vez que refresca; existe para que `getCategory()` (usado en muchos
 * componentes "hoja" como TransactionRow, LimitBar, ExpenseDonut, etc.) pueda
 * resolver el ícono/color de una categoría personalizada de forma síncrona,
 * sin tener que convertir cada uno de esos componentes en consumidores de la
 * query.
 */
export const useCategoryStore = create<CategoryState>((set) => ({
  customCategories: [],
  setCustomCategories: (categories) => set({ customCategories: categories }),
}))
