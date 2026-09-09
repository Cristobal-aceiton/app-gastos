import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function MonthSelector({
  year,
  month,
  onChange,
}: {
  year: number
  month: number
  onChange: (year: number, month: number) => void
}) {
  const label = new Date(year, month, 1).toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })

  const now = new Date()
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth()

  function goPrev() {
    const d = new Date(year, month - 1, 1)
    onChange(d.getFullYear(), d.getMonth())
  }

  function goNext() {
    if (isCurrentMonth) return
    const d = new Date(year, month + 1, 1)
    onChange(d.getFullYear(), d.getMonth())
  }

  return (
    <div className="flex items-center justify-between rounded-(--radius-pill) border border-(--color-border) bg-(--color-surface) p-1.5">
      <button
        type="button"
        onClick={goPrev}
        aria-label="Mes anterior"
        className="flex h-9 w-9 items-center justify-center rounded-full text-(--color-ink-muted) transition hover:text-(--color-ink)"
      >
        <ChevronLeft size={18} />
      </button>
      <span className="text-sm font-semibold capitalize">{label}</span>
      <button
        type="button"
        onClick={goNext}
        disabled={isCurrentMonth}
        aria-label="Mes siguiente"
        className="flex h-9 w-9 items-center justify-center rounded-full text-(--color-ink-muted) transition hover:text-(--color-ink) disabled:opacity-30"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  )
}
