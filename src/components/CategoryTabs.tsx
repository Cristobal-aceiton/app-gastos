import { CATEGORIES, type CategoryDef } from '../lib/categories'

interface Tab {
  id: string | null
  label: string
}

export default function CategoryTabs({
  categories = CATEGORIES,
  value,
  onChange,
}: {
  categories?: CategoryDef[]
  value: string | null
  onChange: (id: string | null) => void
}) {
  const tabs: Tab[] = [{ id: null, label: 'Todos' }, ...categories.map((c) => ({ id: c.id, label: c.label }))]

  return (
    <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none]">
      {tabs.map((tab) => {
        const active = value === tab.id
        return (
          <button
            key={tab.id ?? 'all'}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`shrink-0 rounded-(--radius-pill) border px-4 py-2 text-sm font-medium transition ${
              active
                ? 'border-(--color-mint) bg-(--color-mint-dim) text-(--color-mint)'
                : 'border-(--color-border) bg-(--color-surface) text-(--color-ink-muted)'
            }`}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
