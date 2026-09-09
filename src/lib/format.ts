/** Deja solo dígitos — para ir guardando el monto "crudo" mientras el usuario escribe. */
export function digitsOnly(value: string): string {
  return value.replace(/[^0-9]/g, '')
}

/** Formatea dígitos crudos como CLP con separador de miles, sin símbolo de moneda. */
export function formatAmountDisplay(digits: string): string {
  if (!digits) return ''
  return Number(digits).toLocaleString('es-CL')
}

export function formatCLP(amount: number): string {
  const sign = amount < 0 ? '-' : ''
  return `${sign}$${Math.round(Math.abs(amount)).toLocaleString('es-CL')}`
}

export function dateLabel(iso: string): string {
  const today = new Date().toISOString().slice(0, 10)
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
  if (iso === today) return 'Hoy'
  if (iso === yesterday) return 'Ayer'
  return new Date(`${iso}T00:00:00`).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' })
}
