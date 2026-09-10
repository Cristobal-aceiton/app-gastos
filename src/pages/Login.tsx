import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Mail, Lock } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import AuthShell from '../components/AuthShell'
import { TextField, PasswordField } from '../components/fields'
import PrimaryButton from '../components/PrimaryButton'
import GoogleButton from '../components/GoogleButton'

export default function Login() {
  const session = useAuthStore((s) => s.session)
  const navigate = useNavigate()
  const location = useLocation()
  const justSignedUp = (location.state as { justSignedUp?: boolean } | null)?.justSignedUp

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  if (session) return <Navigate to="/" replace />

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (!email || !password) {
      setError('Completa tu correo y tu contraseña.')
      return
    }

    setLoading(true)
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)

    if (signInError) {
      setError('Correo o contraseña incorrectos.')
      return
    }
    navigate('/', { replace: true })
  }

  return (
    <AuthShell
      title="Bienvenido de vuelta"
      subtitle="Ingresa a tu cuenta para seguir controlando tus gastos."
      footer={
        <>
          ¿No tienes cuenta?{' '}
          <Link to="/signup" className="font-semibold text-(--color-mint)">
            Regístrate
          </Link>
        </>
      }
    >
      {justSignedUp && (
        <p className="mb-4 rounded-2xl bg-(--color-mint-dim) p-4 text-sm text-(--color-mint)">
          Revisa tu correo para confirmar tu cuenta antes de iniciar sesión.
        </p>
      )}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <TextField
          label="Correo"
          type="email"
          autoComplete="email"
          placeholder="tucorreo@ejemplo.com"
          icon={<Mail size={18} />}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <PasswordField
          label="Contraseña"
          autoComplete="current-password"
          placeholder="••••••••"
          icon={<Lock size={18} />}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <div className="-mt-1 text-right">
          <Link to="/forgot-password" className="text-sm text-(--color-ink-muted)">
            ¿Olvidaste tu contraseña?
          </Link>
        </div>

        {error && <p className="text-sm text-(--color-expense)">{error}</p>}

        <PrimaryButton type="submit" loading={loading} className="mt-2">
          Iniciar sesión
        </PrimaryButton>

        <div className="my-1 flex items-center gap-3 text-xs text-(--color-ink-faint)">
          <span className="h-px flex-1 bg-(--color-border)" />
          o continúa con
          <span className="h-px flex-1 bg-(--color-border)" />
        </div>

        <GoogleButton />
      </form>
    </AuthShell>
  )
}
