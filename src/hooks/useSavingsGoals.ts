import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { SavingsGoal } from '../types/premium'

export function useSavingsGoals(userId: string | undefined) {
  return useQuery<SavingsGoal[]>({
    queryKey: ['savings-goals', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('savings_goals')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return (data ?? []) as SavingsGoal[]
    },
  })
}

export function useCreateSavingsGoal(userId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: { name: string; target_amount: number; deadline: string }) => {
      if (!userId) throw new Error('Sin sesión')
      const { error } = await supabase.from('savings_goals').insert({ user_id: userId, ...input })
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['savings-goals', userId] }),
  })
}

export function useAddToSavingsGoal(userId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ goal, amount }: { goal: SavingsGoal; amount: number }) => {
      const saved_amount = Math.min(goal.target_amount, goal.saved_amount + amount)
      const { error } = await supabase.from('savings_goals').update({ saved_amount }).eq('id', goal.id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['savings-goals', userId] }),
  })
}

export function useDeleteSavingsGoal(userId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('savings_goals').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['savings-goals', userId] }),
  })
}
