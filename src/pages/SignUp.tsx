import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Mail, Lock } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import AuthShell from '../components/AuthShell'
import { TextField, PasswordField } from '../components/fields'
import PrimaryButton from '../components/PrimaryButton'
import GoogleButton from '../components/GoogleButton'

export default function SignUp() {
  const session = useAuthStore((s) => s.session)
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  if (session) return <Navigate to="/" replace />

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (!email || !password || !confirmPassword) {
      setError('Completa todos los campos.')
      return
    }
    if (password.length < 6) {
      setError('Tu contraseña debe tener al menos 6 caracteres.')
      return
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setLoading(true)
    const { data, error: signUpError } = await supabase.auth.signUp({ email, password })
    setLoading(false)

    if (signUpError) {
      setError(
        signUpError.message.toLowerCase().includes('already')
          ? 'Ya existe una cuenta con ese correo.'
          : 'No pudimos crear tu cuenta. Intenta de nuevo.'
      )
      return
    }

    if (!data.session) {
      // Confirmación de correo activada en el proyecto de Supabase.
      setError(null)
      navigate('/login', {
        replace: true,
        state: { justSignedUp: true },
      })
      return
    }

    navigate('/onboarding', { replace: true })
  }

  return (
    <AuthShell
      title="Crea tu cuenta"
      subtitle="Empieza a ordenar tus finanzas en un par de minutos."
      footer={
        <>
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="font-semibold text-(--color-mint)">
            Inicia sesión
          </Link>
        </>
      }
    >
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
          autoComplete="new-password"
          placeholder="Mínimo 6 caracteres"
          icon={<Lock size={18} />}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <PasswordField
          label="Confirma tu contraseña"
          autoComplete="new-password"
          placeholder="Repite tu contraseña"
          icon={<Lock size={18} />}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        {error && <p className="text-sm text-(--color-expense)">{error}</p>}

        <PrimaryButton type="submit" loading={loading} className="mt-2">
          Crear cuenta
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
