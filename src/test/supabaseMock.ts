import { vi } from 'vitest'

/**
 * Mock ligero del query builder de @supabase/supabase-js.
 *
 * El cliente real encadena métodos (`.select().eq().order()...`) y termina
 * resolviendo la promesa al hacer `await` sobre la cadena (postgrest-js
 * implementa `.then()` en el builder). Este mock reproduce ese contrato:
 * cada método de la cadena devuelve `this`, y el builder es "thenable" y se
 * resuelve al `{ data, error }` que se le indique.
 *
 * Uso típico en un test:
 *
 *   const supabaseMock = createSupabaseMock()
 *   supabaseMock.queue('transactions', { data: [...], error: null })
 *   vi.mock('../../lib/supabase', () => ({ supabase: supabaseMock }))
 *
 * Cada tabla tiene su propia cola FIFO: si un hook hace dos llamadas
 * distintas a `.from('transactions')` (ej. un `select` de chequeo y luego un
 * `insert`), se consumen en el orden en que se encolaron con `queue()`.
 */

export interface SupabaseMockResult<T = unknown> {
  data: T | null
  error: { message: string } | null
}

const CHAINABLE_METHODS = [
  'select',
  'insert',
  'update',
  'upsert',
  'delete',
  'eq',
  'neq',
  'gte',
  'lte',
  'gt',
  'lt',
  'like',
  'ilike',
  'in',
  'order',
  'range',
  'limit',
] as const

function buildChainable(result: SupabaseMockResult) {
  const builder: Record<string, unknown> = {}

  for (const method of CHAINABLE_METHODS) {
    builder[method] = vi.fn(() => builder)
  }

  builder.single = vi.fn(() => Promise.resolve(result))
  builder.maybeSingle = vi.fn(() => Promise.resolve(result))
  // Hace que `await builder` (o `.then()`, que es lo mismo) resuelva al resultado mockeado.
  builder.then = (
    onFulfilled?: (value: SupabaseMockResult) => unknown,
    onRejected?: (reason: unknown) => unknown
  ) => Promise.resolve(result).then(onFulfilled, onRejected)

  return builder
}

export function createSupabaseMock() {
  const queues = new Map<string, SupabaseMockResult[]>()
  const calls: Array<{ table: string }> = []

  function queue(table: string, result: SupabaseMockResult) {
    const existing = queues.get(table) ?? []
    existing.push(result)
    queues.set(table, existing)
  }

  const from = vi.fn((table: string) => {
    calls.push({ table })
    const tableQueue = queues.get(table)
    const result: SupabaseMockResult =
      tableQueue && tableQueue.length > 0 ? tableQueue.shift()! : { data: null, error: null }
    return buildChainable(result)
  })

  return { from, queue, calls }
}

export type SupabaseMock = ReturnType<typeof createSupabaseMock>
