import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { monthStartISO, shouldChargeToday } from '../lib/premium'
import type { Subscription } from '../types/premium'

/**
 * claude.md, Fase 6: al montar la app, revisa las suscripciones activas del usuario
 * Premium. Si hoy es el día de cobro de alguna y todavía no existe una transacción de
 * ese servicio en el mes actual, la crea automáticamente (descuento automático).
 *
 * Se ejecuta una sola vez por usuario/carga de la pestaña (no en cada re-render).
 */
export function useSubscriptionRunner(userId: string | undefined, isPremium: boolean | undefined) {
  const queryClient = useQueryClient()
  const ranForUser = useRef<string | null>(null)

  useEffect(() => {
    if (!userId || !isPremium) return
    if (ranForUser.current === userId) return
    ranForUser.current = userId

    async function run() {
      const { data: subs, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('active', true)

      if (error || !subs) return

      const today = new Date()
      const monthStart = monthStartISO(today)
      const todayISO = today.toISOString().slice(0, 10)
      let chargedAny = false

      for (const sub of subs as Subscription[]) {
        if (!shouldChargeToday(sub, today)) continue

        const description = `Suscripción: ${sub.name}`

        // ¿Ya existe una transacción de esta suscripción este mes? Evita cobrar dos veces.
        const { data: existing } = await supabase
          .from('transactions')
          .select('id')
          .eq('user_id', userId)
          .eq('type', 'expense')
          .eq('description', description)
          .gte('date', monthStart)
          .limit(1)

        if (existing && existing.length > 0) continue

        const { error: insertError } = await supabase.from('transactions').insert({
          user_id: userId,
          type: 'expense',
          category: sub.category,
          amount: sub.amount,
          description,
          date: todayISO,
        })

        if (!insertError) chargedAny = true
      }

      if (chargedAny) {
        queryClient.invalidateQueries({ queryKey: ['dashboard', userId] })
        queryClient.invalidateQueries({ queryKey: ['transactions'] })
        queryClient.invalidateQueries({ queryKey: ['stats'] })
        queryClient.invalidateQueries({ queryKey: ['category-limits'] })
      }
    }

    run()
  }, [userId, isPremium, queryClient])
}
