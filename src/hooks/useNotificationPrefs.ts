import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { DEFAULT_NOTIFICATION_PREFS, type NotificationPrefs } from '../types/notifications'

/**
 * Fase 13.3 — preferencias de notificación. Si el usuario nunca guardó nada
 * (fila inexistente en `notification_prefs`), se devuelven los defaults
 * (todo activado) en vez de forzar un INSERT solo por leer la pantalla.
 */
export function useNotificationPrefs(userId: string | undefined) {
  return useQuery<NotificationPrefs>({
    queryKey: ['notification-prefs', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notification_prefs')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()

      if (error) throw error

      return (
        (data as NotificationPrefs | null) ?? {
          user_id: userId!,
          updated_at: '',
          ...DEFAULT_NOTIFICATION_PREFS,
        }
      )
    },
  })
}

/** Crea o actualiza (upsert por `user_id`) una o más preferencias de notificación. */
export function useUpdateNotificationPrefs(userId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (
      patch: Partial<
        Pick<NotificationPrefs, 'subscriptions_reminder' | 'category_limit_alert' | 'savings_goal_reminder'>
      >
    ) => {
      if (!userId) throw new Error('Sin sesión')

      // Se parte de los defaults (no de lo que haya en caché) para que el
      // upsert siempre mande una fila completa: si la fila no existía
      // todavía, un upsert parcial dejaría NULL en las columnas `not null`
      // que no se estén tocando en este cambio puntual.
      const current = queryClient.getQueryData<NotificationPrefs>(['notification-prefs', userId])
      const { error } = await supabase.from('notification_prefs').upsert(
        {
          user_id: userId,
          subscriptions_reminder: current?.subscriptions_reminder ?? DEFAULT_NOTIFICATION_PREFS.subscriptions_reminder,
          category_limit_alert: current?.category_limit_alert ?? DEFAULT_NOTIFICATION_PREFS.category_limit_alert,
          savings_goal_reminder: current?.savings_goal_reminder ?? DEFAULT_NOTIFICATION_PREFS.savings_goal_reminder,
          updated_at: new Date().toISOString(),
          ...patch,
        },
        { onConflict: 'user_id' }
      )
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notification-prefs', userId] }),
  })
}
