import { useEffect, useRef, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { useTransactionsList } from '../hooks/useTransactionsList'
import { useAllCategories } from '../hooks/useCategories'
import CategoryTabs from '../components/CategoryTabs'
import SwipeableTransactionRow from '../components/SwipeableTransactionRow'
import OfflineBanner from '../components/OfflineBanner'

export default function Transactions() {
  const { session } = useAuthStore()
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const { data: categories } = useAllCategories(session?.user.id)

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useTransactionsList(
    session?.user.id,
    categoryId
  )

  const sentinelRef = useRef<HTMLDivElement>(null)

  // Scroll infinito: cuando el sentinel entra en viewport, pide la siguiente página.
  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      },
      { rootMargin: '200px' }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [fetchNextPage, hasNextPage, isFetchingNextPage])

  const transactions = data?.pages.flatMap((p) => p.transactions) ?? []
  const isFromCache = data?.pages[0]?.fromCache === true

  return (
    <div className="flex flex-col gap-5 text-(--color-ink)">
      <header>
        <h1 className="text-2xl font-semibold">Movimientos</h1>
        <p className="mt-1 text-sm text-(--color-ink-muted)">Todos tus ingresos y gastos. Desliza un ítem para eliminarlo.</p>
      </header>

      <OfflineBanner show={isFromCache} />

      <CategoryTabs categories={categories} value={categoryId} onChange={setCategoryId} />

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-2xl bg-(--color-surface)" />
          ))}
        </div>
      ) : transactions.length === 0 ? (
        <div className="rounded-(--radius-card) border border-dashed border-(--color-border) p-8 text-center text-sm text-(--color-ink-faint)">
          No hay movimientos {categoryId ? 'en esta categoría' : 'todavía'}.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {transactions.map((t) => (
            <SwipeableTransactionRow key={t.id} transaction={t} />
          ))}
        </div>
      )}

      <div ref={sentinelRef} className="flex justify-center py-2">
        {isFetchingNextPage && <Loader2 size={18} className="animate-spin text-(--color-ink-faint)" />}
      </div>
    </div>
  )
}
