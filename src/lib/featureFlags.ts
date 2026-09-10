import { useQuery } from '@tanstack/react-query'
import { supabase } from './supabase'

/**
 * Plan de remodelación, Fase 1 — kill switch sin deploy.
 *
 * Flags remotos guardados en la tabla `feature_flags` de Supabase
 * (ver supabase/schema.sql). Se puede apagar una función desde el Table
 * Editor de Supabase (cambiar `enabled` a false) y el cambio llega a los
 * clientes en como mucho `STALE_TIME_MS` sin necesidad de un deploy nuevo.
 *
 * `DEFAULT_FLAGS` es el fallback si la tabla todavía no existe (proyectos
 * que no corrieron la migración nueva) o si falla el fetch (sin red): la
 * app sigue funcionando con el comportamiento de siempre, nunca se rompe
 * por depender de este mecanismo.
 */

export const DEFAULT_FLAGS = {
  // Cobro automático de suscripciones Premium al abrir la app (Fase 6).
  // Es el candidato más claro a kill switch: si por un bug empezara a
  // cobrar de más o duplicado, se apaga acá sin esperar un deploy.
  subscription_runner: true,
  // Notificaciones push (Fase 13.1-13.3).
  push_notifications: true,
} as const

export type FeatureFlagKey = keyof typeof DEFAULT_FLAGS

const STALE_TIME_MS = 5 * 60 * 1000

async function fetchFlags(): Promise<Record<string, boolean>> {
  const { data, error } = await supabase.from('feature_flags').select('key, enabled')

  if (error || !data) {
    // Tabla no migrada todavía, sin red, etc. — nos quedamos con los
    // defaults locales en vez de romper la app.
    return {}
  }

  return Object.fromEntries(data.map((row) => [row.key, row.enabled]))
}

/**
 * `useFeatureFlag('subscription_runner')` → true/false.
 * Si el flag remoto no está definido (todavía), usa `DEFAULT_FLAGS`.
 */
export function useFeatureFlag(key: FeatureFlagKey): boolean {
  const { data } = useQuery({
    queryKey: ['feature-flags'],
    queryFn: fetchFlags,
    staleTime: STALE_TIME_MS,
    // Si falla, no reintentamos agresivo — no es crítico y no vale la
    // pena gastar requests por un flag.
    retry: 1,
  })

  return data?.[key] ?? DEFAULT_FLAGS[key]
}
