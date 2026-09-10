import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Mail } from 'lucide-react'
import { supabase } from '../lib/supabase'
import AuthShell from '../components/AuthShell'
import { TextField } from '../components/fields'
import PrimaryButton from '../components/PrimaryButton'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (!email) {
      setError('Ingresa tu correo.')
      return
    }

    setLoading(true)
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email)
    setLoading(false)

    if (resetError) {
      setError('No pudimos enviar el correo. Intenta de nuevo.')
      return
    }
    setSent(true)
  }

  return (
    <AuthShell
      title="Recuperar contraseña"
      subtitle="Te enviaremos un enlace para crear una nueva."
      footer={
        <Link to="/login" className="font-semibold text-(--color-mint)">
          Volver a iniciar sesión
        </Link>
      }
    >
      {sent ? (
        <p className="rounded-2xl bg-(--color-surface) p-4 text-sm text-(--color-ink-muted)">
          Revisa tu correo <span className="text-(--color-ink)">{email}</span> para continuar.
        </p>
      ) : (
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
          {error && <p className="text-sm text-(--color-expense)">{error}</p>}
          <PrimaryButton type="submit" loading={loading}>
            Enviar enlace
          </PrimaryButton>
        </form>
      )}
    </AuthShell>
  )
}
