import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import BottomNav from './BottomNav'
import PageTransition from './PageTransition'
import MeshBackground from './MeshBackground'
import { useAuthStore } from '../store/authStore'
import { useSubscriptionRunner } from '../hooks/useSubscriptionRunner'
import { useFeatureFlag } from '../lib/featureFlags'

export default function AppLayout() {
  const { session, profile } = useAuthStore()
  const location = useLocation()
  // Fase 6: cobra suscripciones automáticas del usuario Premium al abrir la
  // app. Plan de remodelación, Fase 1: pasa por un feature flag remoto — si
  // apareciera un bug de cobros duplicados/incorrectos, se apaga desde
  // Supabase (tabla feature_flags) sin esperar un deploy.
  const subscriptionRunnerEnabled = useFeatureFlag('subscription_runner')
  useSubscriptionRunner(subscriptionRunnerEnabled ? session?.user.id : undefined, profile?.is_premium)

  // Fase 14 — fix definitivo del scroll fantasma entre secciones: antes
  // <main> era el contenedor con scroll (overflow-y-auto) Y ADEMÁS el
  // ancestro posicionado que usa AnimatePresence mode="popLayout" para
  // calcular dónde queda la pantalla saliente. Ese cálculo lo hace Framer
  // Motion en un useLayoutEffect de un componente HIJO, y React siempre
  // corre los layout effects de los hijos ANTES que los del padre — así
  // que el reseteo de scrollTop en <main> (que vivía acá, en AppLayout)
  // corría DESPUÉS de que Framer ya había capturado la posición de la
  // pantalla saliente usando el scroll viejo. Resultado: la sección nueva
  // podía quedar desplazada hacia abajo, a mitad de pantalla, o
  // directamente fuera de vista — y cambiar de tab rápido lo hacía más
  // frecuente porque encadenaba más resets compitiendo con esa captura.
  //
  // La solución no es ganarle la carrera al timing (frágil), sino sacar el
  // scroll de <main> por completo. Ahora <main> nunca scrollea
  // (overflow-hidden) y el scroll vive en un <div> DENTRO de
  // PageTransition, que se desmonta y monta de cero en cada cambio de
  // ruta (porque está bajo el key={pathname}). Un nodo del DOM recién
  // creado siempre arranca con scrollTop 0 de forma nativa, sin necesitar
  // ningún reseteo manual ni depender del orden de efectos.
  return (
    <div className="app-shell-bg relative mx-auto flex min-h-svh max-w-md flex-col isolate">
      <MeshBackground />
      {/* relative + z-10: fija el contexto de posicionamiento para
          AnimatePresence en modo "popLayout" (ver nota abajo) y asegura que
          el contenido quede por encima del <MeshBackground /> decorativo. */}
      <main className="relative z-10 flex-1 overflow-hidden">
        {/* Fase 7: transición suave entre pantallas del tab bar, sin desmontar BottomNav.
            mode="popLayout" (en vez de "wait"): con "wait" la pantalla saliente
            se desmonta del todo ANTES de montar la entrante, y durante ese hueco
            no hay nada dibujado ahí — solo se ve el fondo casi negro de
            app-shell-bg detrás, que es exactamente el "flash negro" al cambiar
            de sección. Con popLayout la entrante aparece de inmediato y la
            saliente se anima por encima mientras se va, sin ese hueco.

            Fase 11 — fix del "freeze a mitad de transición": popLayout saca la
            pantalla saliente del flujo con position:absolute, posicionada
            respecto al ANCESTRO POSICIONADO MÁS CERCANO, que es este <main>.
            Antes <main> no tenía position:relative, así que el navegador
            buscaba más arriba en el árbol; según el resto del layout, la
            pantalla saliente podía terminar posicionada fuera del viewport
            visible o superpuesta de forma incorrecta con el BottomNav
            durante los ~220ms de la animación — visualmente indistinguible
            de una pantalla "trabada". Al declarar `relative` aquí, la
            saliente queda anclada exactamente donde debía estar.

            Importante (ver Fase 14 más arriba): <main> ya NO tiene scroll
            propio (es overflow-hidden), así que este cálculo de posición
            siempre corre sobre un ancestro con scrollTop fijo en 0 — no hay
            forma de que quede "corrido" por un scroll viejo. */}
        <AnimatePresence mode="popLayout" initial={false}>
          <PageTransition key={location.pathname}>
            {/* Este div es el que scrollea (no <main>). Al vivir dentro del
                key={location.pathname}, es un nodo del DOM nuevo en cada
                navegación, así que siempre arranca con scrollTop 0. */}
            <div className="h-full overflow-y-auto px-5 pb-28 pt-8">
              <Outlet />
            </div>
          </PageTransition>
        </AnimatePresence>
      </main>
      <BottomNav />
    </div>
  )
}
