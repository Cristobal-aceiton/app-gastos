import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { CUSTOM_ICON_LIBRARY } from '../lib/categories'
import { TextField } from './fields'
import PrimaryButton from './PrimaryButton'
import { haptics } from '../lib/haptics'

const ICON_KEYS = Object.keys(CUSTOM_ICON_LIBRARY)

export default function AddCategoryModal({
  open,
  onClose,
  onCreate,
  loading,
  error,
}: {
  open: boolean
  onClose: () => void
  onCreate: (input: { name: string; icon: string }) => void
  loading?: boolean
  error?: string | null
}) {
  const [name, setName] = useState('')
  const [icon, setIcon] = useState(ICON_KEYS[0])

  function handleClose() {
    setName('')
    setIcon(ICON_KEYS[0])
    onClose()
  }

  const canCreate = name.trim().length > 0 && !loading

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center"
          onClick={handleClose}
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-t-(--radius-card) border border-(--color-border) bg-(--color-bg-elevated) p-6 sm:rounded-(--radius-card)"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-(--color-ink)">Nueva categoría</h2>
              <button
                onClick={handleClose}
                aria-label="Cerrar"
                className="flex h-8 w-8 items-center justify-center rounded-full text-(--color-ink-faint)"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 flex flex-col gap-4">
              <TextField
                label="Nombre"
                placeholder="Ej: Mascotas"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />

              <div>
                <p className="mb-3 text-sm text-(--color-ink-muted)">Ícono</p>
                <div className="grid grid-cols-6 gap-2">
                  {ICON_KEYS.map((key) => {
                    const Icon = CUSTOM_ICON_LIBRARY[key]
                    const selected = icon === key
                    return (
                      <motion.button
                        key={key}
                        type="button"
                        whileTap={{ scale: 0.9 }}
                        onTapStart={() => haptics.light()}
                        onClick={() => setIcon(key)}
                        aria-label={key}
                        className={`flex h-10 w-10 items-center justify-center rounded-xl border transition ${
                          selected
                            ? 'border-(--color-mint) bg-(--color-mint-dim) text-(--color-mint)'
                            : 'border-(--color-border) bg-(--color-surface) text-(--color-ink-faint)'
                        }`}
                      >
                        <Icon size={18} />
                      </motion.button>
                    )
                  })}
                </div>
              </div>

              {error && <p className="text-sm text-(--color-expense)">{error}</p>}

              <PrimaryButton
                onClick={() => canCreate && onCreate({ name: name.trim(), icon })}
                disabled={!canCreate}
                loading={loading}
              >
                Crear
              </PrimaryButton>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
