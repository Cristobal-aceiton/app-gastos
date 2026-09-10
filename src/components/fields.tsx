import { forwardRef, useEffect, useRef, useState } from 'react'
import type { InputHTMLAttributes, ReactNode } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { digitsOnly, formatAmountDisplay } from '../lib/format'

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  /** Ícono decorativo a la izquierda del campo (ej. `<Mail size={18} />`). */
  icon?: ReactNode
}

export const TextField = forwardRef<HTMLInputElement, FieldProps>(function TextField(
  { label, error, id, icon, ...props },
  ref
) {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, '-')
  return (
    <div>
      <label htmlFor={inputId} className="mb-1.5 block text-sm text-(--color-ink-muted)">
        {label}
      </label>
      <div
        className={`flex items-center gap-2.5 rounded-(--radius-pill) border bg-(--color-surface) px-4 py-3 transition focus-within:border-(--color-mint) ${
          error ? 'border-(--color-expense)' : 'border-(--color-border)'
        }`}
      >
        {icon && <span className="shrink-0 text-(--color-ink-faint)">{icon}</span>}
        <input
          id={inputId}
          ref={ref}
          className="w-full bg-transparent text-(--color-ink) outline-none placeholder:text-(--color-ink-faint)"
          {...props}
        />
      </div>
      {error && <p className="mt-1.5 text-xs text-(--color-expense)">{error}</p>}
    </div>
  )
})

interface AmountFieldProps {
  label?: string
  /** Dígitos crudos (sin formato), ej: "12000". */
  value: string
  /** Recibe los dígitos crudos ya limpios, listo para guardar como número. */
  onChange: (digits: string) => void
  error?: string
  autoFocus?: boolean
}

/** Campo grande de monto: muestra separador de miles mientras se escribe, guarda solo dígitos. */
export function AmountField({ label = 'Monto', value, onChange, error, autoFocus }: AmountFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!autoFocus) return
    // No usamos el atributo nativo `autoFocus`: dispara el teclado en el
    // mismo frame que el mount, justo cuando la animación de entrada de
    // página (framer-motion, ~220ms) también está corriendo. Dos cambios
    // de layout a la vez = el "parpadeo" del fondo. Esperamos a que la
    // transición termine antes de enfocar, para que el teclado suba solo,
    // sin pelear con la animación.
    const timer = setTimeout(() => inputRef.current?.focus(), 260)
    return () => clearTimeout(timer)
  }, [autoFocus])

  return (
    <div>
      <label className="mb-1.5 block text-sm text-(--color-ink-muted)">{label}</label>
      <div
        className={`flex items-center gap-1 rounded-2xl border bg-(--color-surface) px-4 py-3.5 transition focus-within:border-(--color-mint) ${
          error ? 'border-(--color-expense)' : 'border-(--color-border)'
        }`}
      >
        <span className="text-2xl font-semibold text-(--color-ink-muted)">$</span>
        <input
          ref={inputRef}
          inputMode="numeric"
          value={formatAmountDisplay(value)}
          onChange={(e) => onChange(digitsOnly(e.target.value))}
          placeholder="0"
          aria-label={label}
          className="w-full bg-transparent text-2xl font-semibold tabular-nums text-(--color-ink) outline-none placeholder:text-(--color-ink-faint)"
        />
      </div>
      {error && <p className="mt-1.5 text-xs text-(--color-expense)">{error}</p>}
    </div>
  )
}

export const PasswordField = forwardRef<HTMLInputElement, FieldProps>(function PasswordField(
  { label, error, id, icon, ...props },
  ref
) {
  const [visible, setVisible] = useState(false)
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, '-')
  return (
    <div>
      <label htmlFor={inputId} className="mb-1.5 block text-sm text-(--color-ink-muted)">
        {label}
      </label>
      <div
        className={`flex items-center gap-2.5 rounded-(--radius-pill) border bg-(--color-surface) px-4 py-3 transition focus-within:border-(--color-mint) ${
          error ? 'border-(--color-expense)' : 'border-(--color-border)'
        }`}
      >
        {icon && <span className="shrink-0 text-(--color-ink-faint)">{icon}</span>}
        <input
          id={inputId}
          ref={ref}
          type={visible ? 'text' : 'password'}
          className="w-full bg-transparent text-(--color-ink) outline-none placeholder:text-(--color-ink-faint)"
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="shrink-0 text-(--color-ink-faint)"
          aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      {error && <p className="mt-1.5 text-xs text-(--color-expense)">{error}</p>}
    </div>
  )
})
