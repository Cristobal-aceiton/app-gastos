import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { needsOnboarding } from '../types/profile'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, profile, isLoading } = useAuthStore()

  if (isLoading) {
    return (
      <div className="flex h-dvh items-center justify-center bg-(--color-bg) text-(--color-ink-muted)">
        Cargando…
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  if (needsOnboarding(profile)) {
    return <Navigate to="/onboarding" replace />
  }

  return <>{children}</>
}
