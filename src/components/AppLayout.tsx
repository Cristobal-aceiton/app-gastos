import { Suspense } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import BottomNav from './BottomNav'
import PageTransition from './PageTransition'
import { useAuthStore } from '../store/authStore'
import { useSubscriptionRunner } from '../hooks/useSubscriptionRunner'

export default function AppLayout() {
  const { session, profile } = useAuthStore()
  const location = useLocation()
  // Fase 6: cobra suscripciones automáticas del usuario Premium al abrir la app.
  useSubscriptionRunner(session?.user.id, profile?.is_premium)

  return (
    <div className="app-shell-bg mx-auto flex min-h-svh max-w-md flex-col">
      <main className="flex-1 overflow-y-auto px-5 pb-28 pt-8">
        {/* Fase 7: transición suave entre pantallas del tab bar, sin desmontar BottomNav */}
        <AnimatePresence mode="wait" initial={false}>
          <PageTransition key={location.pathname}>
            {/* Boundary de Suspense local: si el chunk de la pantalla (lazy)
                todavía no cargó, solo se vacía este contenedor (main sigue
                montado). Antes el único <Suspense> vivía arriba de todo en
                App.tsx, envolviendo también a AppLayout: cada vez que se
                entraba a una sección nueva de la nav bar, React desmontaba
                TODO el layout (incluyendo el BottomNav) y mostraba el
                fallback de pantalla completa (fondo #0a0a0f = pantalla
                "negra") hasta que el chunk terminaba de bajar. */}
            <Suspense fallback={null}>
              <Outlet />
            </Suspense>
          </PageTransition>
        </AnimatePresence>
      </main>
      <BottomNav />
    </div>
  )
}
