import { supabase } from './supabase'

/**
 * Plan de remodelación, Fase 1 — logging real de errores en producción.
 *
 * En vez de sumar un servicio de terceros (Sentry, etc. — requiere cuenta
 * propia y un SDK más pesado), mandamos los errores del cliente a una tabla
 * de Supabase (`client_errors`, ver supabase/schema.sql). Es de solo
 * escritura desde el cliente: la política RLS permite INSERT pero no
 * SELECT, así que ver los errores reportados se hace desde el Table Editor
 * de Supabase (o una vista de admin más adelante), nunca desde el propio
 * cliente. Si en algún momento se prefiere migrar a Sentry, este es el
 * único archivo que habría que tocar.
 */

const MAX_REPORTS_PER_SESSION = 20
const DEDUPE_WINDOW_MS = 30_000

let reportsThisSession = 0
const recentlyReported = new Map<string, number>()

function shouldSkip(key: string): boolean {
  if (reportsThisSession >= MAX_REPORTS_PER_SESSION) return true

  const last = recentlyReported.get(key)
  const now = Date.now()
  if (last && now - last < DEDUPE_WINDOW_MS) return true

  recentlyReported.set(key, now)
  return false
}

export interface ErrorContext {
  /** Dónde ocurrió: 'error-boundary:dashboard', 'window.onerror', 'unhandledrejection', etc. */
  source: string
  /** Datos extra no sensibles (nunca mandar montos, emails, etc. acá). */
  extra?: Record<string, unknown>
}

/**
 * Reporta un error a Supabase. Nunca lanza — si falla el propio reporte
 * (sin red, tabla no migrada todavía, etc.), se ignora en silencio para no
 * generar un segundo error a partir del primero.
 */
export function reportError(error: unknown, context: ErrorContext): void {
  try {
    const message = error instanceof Error ? error.message : String(error)
    const stack = error instanceof Error ? error.stack ?? null : null

    const dedupeKey = `${context.source}:${message}`
    if (shouldSkip(dedupeKey)) return
    reportsThisSession += 1

    void supabase.from('client_errors').insert({
      source: context.source,
      message: message.slice(0, 2000),
      stack: stack?.slice(0, 4000) ?? null,
      context: context.extra ?? null,
      url: typeof window !== 'undefined' ? window.location.pathname : null,
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
    })
  } catch {
    // Ver comentario arriba: reportar un error nunca debe poder tirar otro.
  }
}
