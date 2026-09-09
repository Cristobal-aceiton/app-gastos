import { forwardRef, useState } from 'react'
import type { InputHTMLAttributes } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { digitsOnly, formatAmountDisplay } from '../lib/format'

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
}

export const TextField = forwardRef<HTMLInputElement, FieldProps>(function TextField(
  { label, error, id, ...props },
  ref
) {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, '-')
  return (
    <div>
      <label htmlFor={inputId} className="mb-1.5 block text-sm text-(--color-ink-muted)">
        {label}
      </label>
      <input
        id={inputId}
        ref={ref}
        className={`w-full rounded-2xl border bg-(--color-surface) px-4 py-3 text-(--color-ink) outline-none transition placeholder:text-(--color-ink-faint) focus:border-(--color-mint) ${
          error ? 'border-(--color-expense)' : 'border-(--color-border)'
        }`}
        {...props}
      />
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
          inputMode="numeric"
          autoFocus={autoFocus}
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
  { label, error, id, ...props },
  ref
) {
  const [visible, setVisible] = useState(false)
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, '-')
  return (
    <div>
      <label htmlFor={inputId} className="mb-1.5 block text-sm text-(--color-ink-muted)">
        {label}
      </label>
      <div className="relative">
        <input
          id={inputId}
          ref={ref}
          type={visible ? 'text' : 'password'}
          className={`w-full rounded-2xl border bg-(--color-surface) px-4 py-3 pr-11 text-(--color-ink) outline-none transition placeholder:text-(--color-ink-faint) focus:border-(--color-mint) ${
            error ? 'border-(--color-expense)' : 'border-(--color-border)'
          }`}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute inset-y-0 right-3 flex items-center text-(--color-ink-faint)"
          aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      {error && <p className="mt-1.5 text-xs text-(--color-expense)">{error}</p>}
    </div>
  )
})
