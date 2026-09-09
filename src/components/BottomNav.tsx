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

export default function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-(--color-border) bg-(--color-bg-elevated)/90 backdrop-blur-lg pb-[env(safe-area-inset-bottom)]">
      <ul className="mx-auto flex max-w-md items-center justify-between px-6 py-2">
        {links.map(({ to, label, icon: Icon, isFab, end }) => (
          <li key={to} className="flex flex-1 justify-center">
            <NavLink to={to} end={end} className="flex flex-col items-center gap-1 py-1" aria-label={label}>
              {({ isActive }) =>
                isFab ? (
                  <motion.span
                    whileTap={{ scale: 0.9 }}
                    onTapStart={() => haptics.medium()}
                    className="fab-pulse btn-gradient-primary relative -mt-8 flex h-14 w-14 items-center justify-center rounded-full text-(--color-bg) shadow-[0_8px_24px_-6px_rgba(0,212,170,0.55)]"
                  >
                    <Icon size={26} strokeWidth={2.5} />
                  </motion.span>
                ) : (
                  <motion.span
                    whileTap={{ scale: 0.88 }}
                    onTapStart={() => haptics.light()}
                    className="flex flex-col items-center gap-1"
                  >
                    <Icon
                      size={22}
                      strokeWidth={2}
                      className={isActive ? 'text-(--color-mint)' : 'text-(--color-ink-faint)'}
                    />
                    <span
                      className={`text-[11px] font-medium ${
                        isActive ? 'text-(--color-mint)' : 'text-(--color-ink-faint)'
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
