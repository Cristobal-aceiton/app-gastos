import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { CategoryLimit } from '../types/premium'

export function useCategoryLimits(userId: string | undefined, monthYear: string) {
  return useQuery<CategoryLimit[]>({
    queryKey: ['category-limits', userId, monthYear],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('category_limits')
        .select('*')
        .eq('user_id', userId)
        .eq('month_year', monthYear)

      if (error) throw error
      return (data ?? []) as CategoryLimit[]
    },
  })
}

/** Crea o actualiza el límite de una categoría para el mes indicado (upsert por user+categoría+mes). */
export function useSetCategoryLimit(userId: string | undefined, monthYear: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: { category: string; limit_amount: number }) => {
      if (!userId) throw new Error('Sin sesión')
      const { error } = await supabase
        .from('category_limits')
        .upsert(
          { user_id: userId, month_year: monthYear, ...input },
          { onConflict: 'user_id,category,month_year' }
        )
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['category-limits', userId, monthYear] }),
  })
}

export function useDeleteCategoryLimit(userId: string | undefined, monthYear: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('category_limits').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['category-limits', userId, monthYear] }),
  })
}
