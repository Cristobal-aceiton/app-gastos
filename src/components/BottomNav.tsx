import { NavLink } from 'react-router-dom'
import { LayoutGrid, Receipt, PieChart, User, Plus } from 'lucide-react'
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

export default function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-(--color-border) bg-(--color-bg-elevated)/90 backdrop-blur-lg pb-[env(safe-area-inset-bottom)]">
      <ul className="mx-auto flex max-w-md items-center justify-between px-6 py-2">
        {links.map(({ to, label, icon: Icon, isFab, end }) => (
          <li key={to} className="flex flex-1 justify-center">
            <NavLink to={to} end={end} className="relative flex flex-col items-center gap-1 py-1" aria-label={label}>
              {({ isActive }) =>
                isFab ? (
                  <motion.span
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.9 }}
                    onTapStart={() => haptics.medium()}
                    transition={iconSpring}
                    className="fab-pulse btn-gradient-primary relative -mt-8 flex h-14 w-14 items-center justify-center rounded-full text-(--color-bg) shadow-[0_8px_24px_-6px_rgba(16,185,129,0.55)]"
                  >
                    <Icon size={26} strokeWidth={2.5} />
                  </motion.span>
                ) : (
                  <motion.span
                    whileTap={{ scale: 0.88 }}
                    onTapStart={() => haptics.light()}
                    className="relative flex flex-col items-center gap-1 px-3 py-1"
                  >
                    {/* Fondo tipo "pill" que se desliza entre tabs activos.
                        layoutId compartido entre los 4 items no-FAB: Framer
                        Motion anima automáticamente su posición/tamaño de un
                        montaje al siguiente (FLIP), sin que nosotros
                        calculemos coordenadas. Vive DENTRO de cada NavLink
                        (no en un solo elemento global) porque solo el activo
                        lo renderiza; al cambiar de tab, el viejo se
                        desmonta y el nuevo se monta con el mismo layoutId,
                        y Motion interpola entre ambas posiciones. */}
                    {isActive && (
                      <motion.span
                        layoutId="nav-active-pill"
                        className="absolute inset-0 -z-10 rounded-2xl bg-(--color-mint)/10 ring-1 ring-(--color-mint)/30"
                        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                      />
                    )}
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
