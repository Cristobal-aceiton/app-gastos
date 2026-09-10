import { useEffect, useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import {
  CATEGORIES,
  colorForCustomCategory,
  getIconComponent,
  type CategoryDef,
} from '../lib/categories'
import { useCategoryStore } from '../store/categoryStore'

interface CategoryRow {
  id: string
  name: string
  icon: string | null
  created_at: string
}

function toCategoryDef(row: CategoryRow): CategoryDef {
  return {
    id: row.id,
    label: row.name,
    icon: getIconComponent(row.icon),
    color: colorForCustomCategory(row.id),
    isDefault: false,
  }
}

/** Categorías personalizadas del usuario (Fase 8), cargadas en tiempo real desde Supabase. */
export function useCustomCategories(userId: string | undefined) {
  const setCustomCategories = useCategoryStore((s) => s.setCustomCategories)

  const query = useQuery<CategoryDef[]>({
    queryKey: ['categories', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, icon, created_at')
        .eq('user_id', userId)
        .eq('is_default', false)
        .order('created_at', { ascending: true })

      if (error) throw error
      return (data ?? []).map(toCategoryDef)
    },
  })

  // Mantiene el store sincronizado para que getCategory() (lookup síncrono
  // usado en componentes hoja) siempre tenga las categorías personalizadas al día.
  useEffect(() => {
    setCustomCategories(query.data ?? [])
  }, [query.data, setCustomCategories])

  return query
}

/** Default + personalizadas del usuario, listas para pintar en un grid/tabs. */
export function useAllCategories(userId: string | undefined) {
  const { data: custom, isLoading } = useCustomCategories(userId)
  const all = useMemo(() => [...CATEGORIES, ...(custom ?? [])], [custom])
  return { data: all, custom: custom ?? [], isLoading }
}

export function useCreateCategory(userId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: { name: string; icon: string }) => {
      if (!userId) throw new Error('Sin sesión')
      const { error } = await supabase.from('categories').insert({
        user_id: userId,
        name: input.name,
        icon: input.icon,
        is_default: false,
      })
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories', userId] }),
  })
}

export function useDeleteCategory(userId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (categoryId: string) => {
      if (!userId) throw new Error('Sin sesión')

      // 8.3: las transacciones que usaban esta categoría personalizada pasan a "Otros".
      const { error: reassignError } = await supabase
        .from('transactions')
        .update({ category: 'otros' })
        .eq('user_id', userId)
        .eq('category', categoryId)
      if (reassignError) throw reassignError

      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId)
        .eq('user_id', userId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', userId] })
      queryClient.invalidateQueries({ queryKey: ['transactions', userId] })
      queryClient.invalidateQueries({ queryKey: ['dashboard', userId] })
      queryClient.invalidateQueries({ queryKey: ['stats', userId] })
    },
  })
}
