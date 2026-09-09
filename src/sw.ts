/// <reference lib="webworker" />
/**
 * Fase 13.1 — service worker de la PWA.
 *
 * `vite-plugin-pwa` usa este archivo como fuente (estrategia `injectManifest`,
 * ver vite.config.ts) e inyecta `self.__WB_MANIFEST` en build time con la
 * lista de assets a precachear — reemplaza lo que antes generaba
 * automáticamente la estrategia `generateSW`. Lo nuevo de esta fase son los
 * listeners `push` y `notificationclick` de más abajo, que generateSW no
 * permite personalizar.
 *
 * Vive en `src/` (no en `public/`) porque necesita pasar por el bundler para
 * poder importar `workbox-precaching` y para que Vite le inyecte el manifest.
 * Tiene su propio tsconfig (`tsconfig.sw.json`, lib `WebWorker`) separado del
 * resto de `src/`, que usa lib `DOM` — un mismo archivo no puede tener ambas.
 */
import { precacheAndRoute } from 'workbox-precaching'

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<{ url: string; revision: string | null }>
}

precacheAndRoute(self.__WB_MANIFEST)

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

interface PushPayload {
  title: string
  body: string
  /** Ruta dentro de la app a la que navegar al tocar la notificación, ej. "/premium". */
  url?: string
}

// Enviado por supabase/functions/check-notifications (el cron diario) vía
// Web Push. Si el payload no es JSON válido (no debería pasar, pero un
// tercero mal configurado podría mandar cualquier cosa a este endpoint),
// se cae a un mensaje genérico en vez de que el listener explote.
self.addEventListener('push', (event: PushEvent) => {
  let payload: PushPayload = { title: 'Gastos', body: 'Tienes una notificación nueva.' }
  if (event.data) {
    try {
      payload = { ...payload, ...event.data.json() }
    } catch {
      payload = { ...payload, body: event.data.text() }
    }
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      data: { url: payload.url ?? '/' },
    })
  )
})

// Si ya hay una pestaña de la app abierta, la enfoca y navega en vez de abrir
// una ventana nueva — más natural en desktop y evita duplicar instancias PWA.
self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close()
  const url: string = event.notification.data?.url ?? '/'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientsList) => {
      for (const client of clientsList) {
        if ('focus' in client) {
          client.navigate(url)
          return client.focus()
        }
      }
      return self.clients.openWindow(url)
    })
  )
})
