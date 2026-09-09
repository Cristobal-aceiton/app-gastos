/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: false,
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      // Fase 13.1: se cambia de la estrategia por defecto (generateSW) a
      // injectManifest para poder escribir el service worker a mano
      // (src/sw.ts) y agregarle los listeners de `push`/`notificationclick`
      // que generateSW no permite personalizar. `injectManifest` sigue
      // generando el precache de assets igual que antes (globPatterns abajo),
      // solo que ahora vive dentro de nuestro propio archivo.
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
      },
      includeAssets: ['favicon.svg'],
      manifest: {
        id: '/',
        name: 'Gastos',
        short_name: 'Gastos',
        description: 'Controla tus ingresos y gastos, sin vueltas.',
        theme_color: '#0a100d',
        background_color: '#0a100d',
        display: 'standalone',
        display_override: ['standalone', 'minimal-ui', 'browser'],
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        lang: 'es',
        dir: 'ltr',
        categories: ['finance', 'productivity'],
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        shortcuts: [
          {
            name: 'Agregar movimiento',
            short_name: 'Agregar',
            url: '/add-transaction',
            icons: [{ src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }],
          },
        ],
      },
    }),
  ],
})
