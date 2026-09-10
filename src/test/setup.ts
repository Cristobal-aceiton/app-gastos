import '@testing-library/jest-dom/vitest'
// jsdom no implementa IndexedDB; se usa un polyfill en memoria para poder
// testear src/lib/offlineCache.ts (Fase 12.5) sin tocar un navegador real.
import 'fake-indexeddb/auto'
