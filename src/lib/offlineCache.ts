/**
 * claude.md, Fase 12.5: caché de SOLO LECTURA en IndexedDB.
 *
 * No es una fuente primaria de datos (esa sigue siendo Supabase, como exige
 * claude.md en sus reglas obligatorias) — solo guarda la última respuesta
 * exitosa de una query para poder mostrar *algo* si la app abre sin red, en
 * vez de una pantalla en blanco o un error. Nunca se escribe hacia Supabase
 * desde acá.
 */

const DB_NAME = 'gastos-offline-cache'
const DB_VERSION = 1
const STORE_NAME = 'kv'

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB no disponible en este entorno'))
      return
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function readCache<T>(key: string): Promise<T | null> {
  try {
    const db = await openDB()
    return await new Promise<T | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const request = tx.objectStore(STORE_NAME).get(key)
      request.onsuccess = () => resolve((request.result as T | undefined) ?? null)
      request.onerror = () => reject(request.error)
    })
  } catch {
    // Entornos sin IndexedDB (SSR, algunos navegadores en modo privado muy restrictivo,
    // o los tests) simplemente no tienen caché disponible: se trata como "sin datos".
    return null
  }
}

export async function writeCache<T>(key: string, value: T): Promise<void> {
  try {
    const db = await openDB()
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      tx.objectStore(STORE_NAME).put(value, key)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  } catch {
    // El caché es una mejora, no un requisito: si falla al escribir, seguimos igual.
  }
}

export interface CachedResult<T> {
  value: T
  /** true si el valor vino del caché de IndexedDB porque el fetch real falló. */
  fromCache: boolean
}

/**
 * Ejecuta `fetcher()`. Si tiene éxito, guarda el resultado en caché bajo `key` y lo
 * devuelve tal cual (`fromCache: false`). Si falla (sin red, Supabase caído, etc.),
 * intenta servir la última respuesta buena guardada para esa `key`. Si tampoco hay
 * caché, relanza el error original para que React Query lo maneje como siempre.
 */
export async function resolveWithOfflineCache<T>(
  key: string,
  fetcher: () => Promise<T>
): Promise<CachedResult<T>> {
  try {
    const value = await fetcher()
    // Se espera a que la escritura termine para que un caller que dispare un
    // refetch inmediatamente después (como puede pasar en tests, o al recuperar
    // la red) ya encuentre el valor nuevo guardado si el próximo fetch fallara.
    await writeCache(key, value)
    return { value, fromCache: false }
  } catch (error) {
    const cached = await readCache<T>(key)
    if (cached !== null) {
      return { value: cached, fromCache: true }
    }
    throw error
  }
}
