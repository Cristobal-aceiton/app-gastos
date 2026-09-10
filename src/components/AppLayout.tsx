import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { useLayoutEffect, useRef } from 'react'
import BottomNav from './BottomNav'
import PageTransition from './PageTransition'
import MeshBackground from './MeshBackground'
import { useAuthStore } from '../store/authStore'
import { useSubscriptionRunner } from '../hooks/useSubscriptionRunner'
import { useFeatureFlag } from '../lib/featureFlags'

export default function AppLayout() {
  const { session, profile } = useAuthStore()
  const location = useLocation()
  const mainRef = useRef<HTMLElement>(null)
  // Fase 6: cobra suscripciones automáticas del usuario Premium al abrir la
  // app. Plan de remodelación, Fase 1: pasa por un feature flag remoto — si
  // apareciera un bug de cobros duplicados/incorrectos, se apaga desde
  // Supabase (tabla feature_flags) sin esperar un deploy.
  const subscriptionRunnerEnabled = useFeatureFlag('subscription_runner')
  useSubscriptionRunner(subscriptionRunnerEnabled ? session?.user.id : undefined, profile?.is_premium)

  // Fase 13 (corregido) — fix "la sección nueva arranca a mitad de pantalla
  // / solo se ve el fondo": <main> es UN SOLO contenedor con scroll que
  // persiste entre rutas. Si el usuario scrolleaba hacia abajo en, por
  // ejemplo, "Movimientos" (lista larga) y saltaba a "Inicio" o "Perfil"
  // (contenido más corto), el scrollTop viejo seguía vigente en el primer
  // paint de la sección nueva. Con useEffect el reseteo corre DESPUÉS de
  // que el navegador ya pintó ese primer frame con el contenido nuevo
  // desplazado fuera de vista — en cambios rápidos de tab eso se percibe
  // como "no cargó" o "solo el fondo". useLayoutEffect corre antes del
  // paint del browser, así el scroll ya está en 0 en el primer frame visible.
  useLayoutEffect(() => {
    if (mainRef.current) mainRef.current.scrollTop = 0
  }, [location.pathname])

  return (
    <div className="app-shell-bg relative mx-auto flex min-h-svh max-w-md flex-col isolate">
      <MeshBackground />
      {/* relative + z-10: fija el contexto de posicionamiento para
          AnimatePresence en modo "popLayout" (ver nota abajo) y asegura que
          el contenido quede por encima del <MeshBackground /> decorativo. */}
      <main ref={mainRef} className="relative z-10 flex-1 overflow-y-auto px-5 pb-28 pt-8">
        {/* Fase 7: transición suave entre pantallas del tab bar, sin desmontar BottomNav.
            mode="popLayout" (en vez de "wait"): con "wait" la pantalla saliente
            se desmonta del todo ANTES de montar la entrante, y durante ese hueco
            no hay nada dibujado ahí — solo se ve el fondo casi negro de
            app-shell-bg detrás, que es exactamente el "flash negro" al cambiar
            de sección. Con popLayout la entrante aparece de inmediato y la
            saliente se anima por encima mientras se va, sin ese hueco.

            Fase 11 — fix del "freeze a mitad de transición": popLayout saca la
            pantalla saliente del flujo con position:absolute, posicionada
            respecto al ANCESTRO POSICIONADO MÁS CERCANO. Este <main> es ese
            contenedor con scroll, pero antes no tenía position:relative, así
            que el navegador buscaba más arriba en el árbol; según el resto del
            layout, la pantalla saliente podía terminar posicionada fuera del
            viewport visible o superpuesta de forma incorrecta con el
            BottomNav durante los ~220ms de la animación — visualmente
            indistinguible de una pantalla "trabada". Al declarar `relative`
            aquí, la saliente queda anclada exactamente donde debía estar. */}
        <AnimatePresence mode="popLayout" initial={false}>
          <PageTransition key={location.pathname}>
            <Outlet />
          </PageTransition>
        </AnimatePresence>
      </main>
      <BottomNav />
    </div>
  )
}
