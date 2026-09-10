/**
 * Fase 13.1 — capa de Web Push en el cliente.
 *
 * El service worker que registra `vite-plugin-pwa` (`src/sw.ts`, estrategia
 * `injectManifest`) ya escucha el evento `push` y muestra la notificación
 * (ver `src/sw.ts`). Este archivo se ocupa de la otra mitad: pedir permiso,
 * crear la suscripción del navegador (`PushSubscription`) y guardarla en
 * Supabase para que `supabase/functions/check-notifications` (el cron
 * diario) sepa a qué endpoints enviarle el push.
 *
 * Un mismo usuario puede tener varias suscripciones (celular, notebook,
 * otro navegador) — por eso `push_subscriptions` no es 1:1 con `profiles`
 * y cada fila se identifica por su `endpoint` (único por navegador/dispositivo).
 */
import { supabase } from './supabase'

export type PushActionResult = { success: true } | { success: false; error: string }

/** true si el navegador soporta Service Worker + Push API (falta en iOS Safari fuera de PWA instalada, por ejemplo). */
export function isPushSupported(): boolean {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window
}

/** 'granted' | 'denied' | 'default' (nunca se pidió, o el navegador no soporta Notification). */
export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (typeof Notification === 'undefined') return 'unsupported'
  return Notification.permission
}

/** Convierte la VAPID public key (base64url) al formato Uint8Array que pide `applicationServerKey`. */
function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const outputArray = new Uint8Array(new ArrayBuffer(rawData.length))
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

/** Suscripción push activa del navegador actual, si existe (sin pedir permiso ni crear una nueva). */
export async function getExistingPushSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null
  const registration = await navigator.serviceWorker.ready
  return registration.pushManager.getSubscription()
}

/**
 * Pide permiso de notificaciones (si hace falta), crea la suscripción push
 * del navegador y la guarda en `push_subscriptions`. Idempotente: si ya
 * existe una suscripción para este navegador, reusa esa en vez de crear
 * otra (evita filas duplicadas de un mismo dispositivo).
 */
export async function subscribeToPush(userId: string): Promise<PushActionResult> {
  if (!isPushSupported()) {
    return { success: false, error: 'Este navegador no soporta notificaciones push.' }
  }

  const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined
  if (!vapidPublicKey) {
    return {
      success: false,
      error: 'Falta configurar VITE_VAPID_PUBLIC_KEY. Revisa la sección "Fase 13" del README.',
    }
  }

  try {
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      return { success: false, error: 'Necesitas aceptar el permiso de notificaciones para activarlas.' }
    }

    const registration = await navigator.serviceWorker.ready
    const existing = await registration.pushManager.getSubscription()
    const subscription =
      existing ??
      (await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      }))

    const json = subscription.toJSON()
    const keys = json.keys
    if (!json.endpoint || !keys?.p256dh || !keys?.auth) {
      return { success: false, error: 'No se pudo leer la suscripción del navegador.' }
    }

    const { error } = await supabase
      .from('push_subscriptions')
      .upsert(
        { user_id: userId, endpoint: json.endpoint, p256dh: keys.p256dh, auth_key: keys.auth },
        { onConflict: 'endpoint' }
      )

    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch {
    return { success: false, error: 'No pudimos activar las notificaciones. Intenta de nuevo.' }
  }
}

/** Cancela la suscripción push del navegador actual y la borra de Supabase. */
export async function unsubscribeFromPush(): Promise<PushActionResult> {
  if (!isPushSupported()) return { success: true }

  try {
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()
    if (!subscription) return { success: true }

    const endpoint = subscription.endpoint
    await subscription.unsubscribe()

    const { error } = await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint)
    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch {
    return { success: false, error: 'No pudimos desactivar las notificaciones. Intenta de nuevo.' }
  }
}
