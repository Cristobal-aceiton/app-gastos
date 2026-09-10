import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { LayoutGrid, Receipt, PieChart, User, Plus } from 'lucide-react'
import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { haptics } from '../lib/haptics'

const links = [
  { to: '/', label: 'Inicio', icon: LayoutGrid, end: true },
  { to: '/transactions', label: 'Movimientos', icon: Receipt, end: false },
  { to: '/add-transaction', label: 'Agregar', icon: Plus, isFab: true, end: false },
  { to: '/stats', label: 'Estadísticas', icon: PieChart, end: false },
  { to: '/profile', label: 'Perfil', icon: User, end: false },
]

// Spring compartido para el ícono al tocar/hacer hover: da la sensación
// "elástica" pedida sin sentirse gomoso ni lento.
const iconSpring = { type: 'spring', stiffness: 500, damping: 22 } as const

// Debe ser >= a la duración de salida de PageTransition (160ms) para que
// nunca puedan quedar dos páginas saliendo a la vez por tapear demasiado
// rápido. Ver nota en handleNavigate más abajo.
const NAV_LOCK_MS = 220

export default function BottomNav() {
  const navigate = useNavigate()
  const location = useLocation()
  const lockedUntil = useRef(0)
  const [, forceRerender] = useState(0)

  // Fase 12 — fix "spam de tabs": antes cada NavLink navegaba directo. Si el
  // usuario tocaba 3-4 tabs en menos de 300ms, React Router encolaba una
  // navegación por tap y AnimatePresence (mode="popLayout") terminaba con
  // varias pantallas "saliendo" superpuestas al mismo tiempo porque cada una
  // dispara su propia animación de exit de ~160ms — visualmente se ve como
  // que la pantalla queda trabada a la mitad. Acá interceptamos el click:
  // si ya hay una navegación en curso, el tap se ignora (con un pequeño
  // haptic de rechazo) hasta que la transición previa termine.
  function handleNavigate(to: string, isFab?: boolean) {
    const now = Date.now()
    if (now < lockedUntil.current) return
    if (to === location.pathname) return
    lockedUntil.current = now + NAV_LOCK_MS
    isFab ? haptics.medium() : haptics.light()
    navigate(to)
    // Fuerza un re-render pasado el lock solo para levantar pointer-events
    // en la UI (el valor real de la verdad es lockedUntil.current).
    setTimeout(() => forceRerender((n) => n + 1), NAV_LOCK_MS)
  }

  const isLocked = Date.now() < lockedUntil.current

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-(--color-border) bg-(--color-bg-elevated)/90 backdrop-blur-lg pb-[env(safe-area-inset-bottom)]">
      <ul
        className="mx-auto flex max-w-md items-center justify-between px-6 py-2"
        style={isLocked ? { pointerEvents: 'none' } : undefined}
      >
        {links.map(({ to, label, icon: Icon, isFab, end }) => (
          <li key={to} className="flex flex-1 justify-center">
            <NavLink
              to={to}
              end={end}
              onClick={(e) => {
                e.preventDefault()
                handleNavigate(to, isFab)
              }}
              className="relative z-0 flex flex-col items-center gap-1 py-1"
              aria-label={label}
            >
              {({ isActive }) =>
                isFab ? (
                  <motion.span
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.9 }}
                    transition={iconSpring}
                    className="fab-pulse btn-gradient-primary relative z-10 -mt-8 flex h-14 w-14 items-center justify-center rounded-full text-(--color-bg) shadow-[0_8px_24px_-6px_rgba(16,185,129,0.55)]"
                  >
                    <Icon size={26} strokeWidth={2.5} />
                  </motion.span>
                ) : (
                  <motion.span
                    whileTap={{ scale: 0.88 }}
                    className="relative flex flex-col items-center gap-1 px-3 py-1"
                  >
                    {/* Fase 12: el resaltado del tab activo ya NO usa un
                        layoutId compartido entre tabs. Antes, al saltar
                        entre dos tabs no vecinos (p.ej. Inicio ↔
                        Estadísticas), Framer Motion animaba ese pill
                        "viajando" en línea recta por toda la barra para
                        pasar de una posición a la otra, y esa animación de
                        layout se renderiza en un plano por encima del resto
                        (para poder cruzar cualquier elemento en su camino)
                        — pasaba literalmente por arriba del botón "+" y se
                        veía como un choque visual. Ahora cada tab anima su
                        propio resaltado in-place (solo opacity + scale, sin
                        moverse de sitio), así nunca hay nada que viaje por
                        encima de otro botón. */}
                    <motion.span
                      initial={false}
                      animate={{ opacity: isActive ? 1 : 0, scale: isActive ? 1 : 0.85 }}
                      transition={{ duration: 0.18, ease: 'easeOut' }}
                      className="absolute inset-0 -z-10 rounded-2xl bg-(--color-mint)/10 ring-1 ring-(--color-mint)/30"
                    />
                    <motion.span
                      animate={isActive ? { scale: [1, 1.15, 1] } : { scale: 1 }}
                      transition={iconSpring}
                    >
                      <Icon
                        size={22}
                        strokeWidth={2}
                        className={isActive ? 'text-(--color-neon-mint)' : 'text-(--color-ink-faint)'}
                        style={isActive ? { filter: 'drop-shadow(0 0 6px rgba(52,211,153,0.65))' } : undefined}
                      />
                    </motion.span>
                    <span
                      className={`text-[11px] font-medium ${
                        isActive ? 'text-(--color-neon-mint)' : 'text-(--color-ink-faint)'
                      }`}
                    >
                      {label}
                    </span>
                  </motion.span>
                )
              }
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
