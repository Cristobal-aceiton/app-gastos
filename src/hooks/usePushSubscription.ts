import { useCallback, useEffect, useState } from 'react'
import {
  getExistingPushSubscription,
  getNotificationPermission,
  isPushSupported,
  subscribeToPush,
  unsubscribeFromPush,
} from '../lib/push'

/**
 * Fase 13.1 — expone el estado de la suscripción push del navegador actual
 * (activa/inactiva, permiso, soporte) y las acciones para activarla o
 * desactivarla, usadas por la sección "Notificaciones" de Settings.tsx.
 */
export function usePushSubscription(userId: string | undefined) {
  const supported = isPushSupported()
  const [subscribed, setSubscribed] = useState(false)
  // Solo hay algo que "chequear" (si ya existe una PushSubscription) cuando el navegador soporta la API.
  const [checking, setChecking] = useState(supported)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!supported) return
    let cancelled = false
    getExistingPushSubscription()
      .then((sub) => {
        if (!cancelled) setSubscribed(!!sub)
      })
      .finally(() => {
        if (!cancelled) setChecking(false)
      })
    return () => {
      cancelled = true
    }
  }, [supported])

  const enable = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    setError(null)
    const result = await subscribeToPush(userId)
    setLoading(false)
    if (result.success) {
      setSubscribed(true)
    } else {
      setError(result.error)
    }
  }, [userId])

  const disable = useCallback(async () => {
    setLoading(true)
    setError(null)
    const result = await unsubscribeFromPush()
    setLoading(false)
    if (result.success) {
      setSubscribed(false)
    } else {
      setError(result.error)
    }
  }, [])

  return {
    supported,
    permission: getNotificationPermission(),
    subscribed,
    checking,
    loading,
    error,
    enable,
    disable,
  }
}
