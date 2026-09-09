import { Link } from 'react-router-dom'
import { Crown, ChevronRight, LogOut, Settings as SettingsIcon } from 'lucide-react'
import { useAuthStore } from '../store/authStore'

export default function Profile() {
  const { profile, session, signOut } = useAuthStore()
  const initial = profile?.name?.trim()?.[0]?.toUpperCase() ?? '?'

  return (
    <div className="flex flex-col gap-6 text-(--color-ink)">
      <header className="flex items-center gap-4">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-(--color-mint-dim) text-xl font-semibold text-(--color-mint)">
          {initial}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-xl font-semibold">{profile?.name ?? 'Tu perfil'}</h1>
            {profile?.is_premium && (
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-(--color-mint-dim) text-(--color-mint)">
                <Crown size={12} />
              </span>
            )}
          </div>
          {session?.user.email && (
            <p className="truncate text-xs text-(--color-ink-faint)">{session.user.email}</p>
          )}
          <p className="text-sm text-(--color-ink-muted)">
            {profile?.is_premium ? 'Cuenta Premium ✨' : 'Cuenta gratuita'}
          </p>
        </div>
        <Link
          to="/settings"
          aria-label="Configuración"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-(--color-border) text-(--color-ink-muted)"
        >
          <SettingsIcon size={18} />
        </Link>
      </header>

      <Link
        to="/premium"
        className="flex items-center gap-3 rounded-2xl border border-(--color-border) bg-(--color-surface) p-4 transition active:scale-[0.99]"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-(--color-mint-dim) text-(--color-mint)">
          <Crown size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-medium">Premium</p>
          <p className="truncate text-xs text-(--color-ink-muted)">
            {profile?.is_premium ? 'Metas, límites y suscripciones' : 'Metas de ahorro, límites y suscripciones automáticas'}
          </p>
        </div>
        <ChevronRight size={18} className="shrink-0 text-(--color-ink-faint)" />
      </Link>

      <Link
        to="/settings"
        className="flex items-center gap-3 rounded-2xl border border-(--color-border) bg-(--color-surface) p-4 transition active:scale-[0.99]"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-(--color-mint-dim) text-(--color-mint)">
          <SettingsIcon size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-medium">Configuración</p>
          <p className="truncate text-xs text-(--color-ink-muted)">Datos personales, ingresos y categorías</p>
        </div>
        <ChevronRight size={18} className="shrink-0 text-(--color-ink-faint)" />
      </Link>

      <button
        onClick={() => signOut()}
        className="mt-2 flex items-center justify-center gap-2 rounded-(--radius-pill) border border-(--color-border) py-3 text-sm font-medium text-(--color-ink-muted)"
      >
        <LogOut size={16} />
        Cerrar sesión
      </button>
    </div>
  )
}
