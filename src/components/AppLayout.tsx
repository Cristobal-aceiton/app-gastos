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
    <div className="app-shell-bg mx-auto flex min-h-dvh max-w-md flex-col">
      <main className="flex-1 overflow-y-auto px-5 pb-28 pt-8">
        {/* Fase 7: transición suave entre pantallas del tab bar, sin desmontar BottomNav */}
        <AnimatePresence mode="wait" initial={false}>
          <PageTransition key={location.pathname}>
            <Outlet />
          </PageTransition>
        </AnimatePresence>
      </main>
      <BottomNav />
    </div>
  )
}
