import { Component, type ErrorInfo, type ReactNode } from 'react'
import { reportError } from '../lib/errorReporting'

interface Props {
  children: ReactNode
  /**
   * 'app' (default): pantalla completa, para el boundary raíz. Un error acá
   * es lo más grave posible — ni el shell de la app pudo montar.
   * 'section': fallback chico e inline, para envolver cada pantalla del tab
   * bar por separado. Si Stats explota por un dato raro, el resto de la app
   * (BottomNav, Dashboard, etc.) sigue andando — solo esa sección se cae.
   */
  level?: 'app' | 'section'
  /** Nombre corto de la sección (ej. 'dashboard', 'stats') para logging. */
  label?: string
}

interface State {
  hasError: boolean
  message: string
}

/**
 * Red de seguridad de la app (Plan de remodelación, Fase 1).
 *
 * Antes de esto, un error de render (o un chunk que no cargó, típico en
 * redes móviles) tumbaba TODO el árbol de React sin que nada lo atajara.
 * Como el fondo de <html> está fijado por CSS plano (ver index.css), lo
 * único que quedaba visible era ese fondo — pantalla "vacía" salvo el
 * color de fondo, que es justo el bug original reportado en el APK de
 * PWABuilder en celular (redes móviles fallan más chunks que el wifi de
 * un PC).
 *
 * Cada error capturado también se reporta a Supabase (ver
 * src/lib/errorReporting.ts) para poder verlo sin necesidad de tener el
 * celular conectado por USB en el momento exacto en que pasa.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' }

  static getDerivedStateFromError(error: unknown): State {
    return { hasError: true, message: error instanceof Error ? error.message : String(error) }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    const { level = 'app', label } = this.props
    const source = level === 'section' ? `error-boundary:section:${label ?? 'unknown'}` : 'error-boundary:app'

    // También visible en chrome://inspect (Android) o Safari Web Inspector
    // (iOS) conectando el celular por USB.
    console.error(`[ErrorBoundary:${source}]`, error, info.componentStack)
    reportError(error, { source, extra: { componentStack: info.componentStack } })
  }

  handleRetry = () => {
    if (this.props.level === 'section') {
      // Reintento liviano: solo vuelve a montar la sección. Sirve si el
      // error fue transitorio (ej. un dato inesperado en esa carga puntual).
      this.setState({ hasError: false, message: '' })
      return
    }
    // Nivel app: recarga completa. Si el problema fue un chunk viejo en
    // caché de un deploy anterior, esto también lo resuelve (junto con
    // skipWaiting + clientsClaim del service worker).
    window.location.reload()
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children
    }

    if (this.props.level === 'section') {
      return (
        <div className="flex flex-col items-center gap-3 rounded-(--radius-card) border border-(--color-border) bg-(--color-surface) px-6 py-10 text-center">
          <p className="text-sm font-semibold text-(--color-ink)">Esta sección no pudo cargar</p>
          <p className="max-w-xs text-xs text-(--color-ink-muted)">
            El resto de la app sigue funcionando. Probá de nuevo.
          </p>
          <button
            onClick={this.handleRetry}
            className="rounded-full bg-(--color-mint) px-5 py-2 text-sm font-semibold text-black"
          >
            Reintentar
          </button>
        </div>
      )
    }

    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-4 bg-(--color-bg) px-6 text-center text-(--color-ink)">
        <p className="text-lg font-semibold">Algo salió mal</p>
        <p className="max-w-xs text-sm text-(--color-ink-muted)">
          Hubo un problema al cargar la app. Probá de nuevo — si persiste, revisá tu conexión.
        </p>
        <button
          onClick={this.handleRetry}
          className="rounded-full bg-(--color-mint) px-6 py-2.5 text-sm font-semibold text-black"
        >
          Reintentar
        </button>
      </div>
    )
  }
}
