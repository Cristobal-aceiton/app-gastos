import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Subscription } from '../types/premium'

export function useSubscriptions(userId: string | undefined) {
  return useQuery<Subscription[]>({
    queryKey: ['subscriptions', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .order('billing_day', { ascending: true })

      if (error) throw error
      return (data ?? []) as Subscription[]
    },
  })
}

export function useCreateSubscription(userId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: { name: string; amount: number; billing_day: number; category: string }) => {
      if (!userId) throw new Error('Sin sesión')
      const { error } = await supabase.from('subscriptions').insert({ user_id: userId, ...input })
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['subscriptions', userId] }),
  })
}

export function useToggleSubscription(userId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from('subscriptions').update({ active }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['subscriptions', userId] }),
  })
}

export function useDeleteSubscription(userId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('subscriptions').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['subscriptions', userId] }),
  })
}
