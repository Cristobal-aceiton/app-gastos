import { motion } from 'framer-motion'
import { CATEGORIES, type CategoryDef } from '../lib/categories'
import { haptics } from '../lib/haptics'

export default function CategoryPicker({
  categories = CATEGORIES,
  value,
  onChange,
}: {
  categories?: CategoryDef[]
  value: string | null
  onChange: (id: string) => void
}) {
  return (
    <div className="grid grid-cols-4 gap-3">
      {categories.map((cat) => {
        const Icon = cat.icon
        const selected = value === cat.id
        return (
          <motion.button
            key={cat.id}
            type="button"
            whileTap={{ scale: 0.94 }}
            onTapStart={() => haptics.light()}
            onClick={() => onChange(cat.id)}
            className="flex flex-col items-center gap-1.5"
          >
            <span
              className={`flex h-14 w-14 items-center justify-center rounded-2xl border transition ${
                selected ? '' : 'border-(--color-border) bg-(--color-surface) text-(--color-ink-faint)'
              }`}
              style={selected ? { backgroundColor: `${cat.color}22`, borderColor: cat.color, color: cat.color } : undefined}
            >
              <Icon size={22} />
            </span>
            <span className={`text-[11px] font-medium ${selected ? 'text-(--color-ink)' : 'text-(--color-ink-faint)'}`}>
              {cat.label}
            </span>
          </motion.button>
        )
      })}
    </div>
  )
}
