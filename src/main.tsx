import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Si un chunk (ej. Login.tsx, cargado con lazy()) falla al descargarse —
// típico en redes móviles inestables, o justo después de un deploy nuevo
// cuando el HTML en caché apunta a un archivo con hash viejo que ya no
// existe en el servidor — Vite emite este evento en vez de tirar un error
// silencioso. Antes nada escuchaba esto: el error subía sin capturar y
// tumbaba toda la app (pantalla en blanco, solo el fondo). Recargamos una
// sola vez (con un flag en sessionStorage para no entrar en loop si el
// chunk realmente no existe / no hay red).
window.addEventListener('vite:preloadError', () => {
  const key = 'gastos:reloaded-after-preload-error'
  if (!sessionStorage.getItem(key)) {
    sessionStorage.setItem(key, '1')
    window.location.reload()
  }
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
