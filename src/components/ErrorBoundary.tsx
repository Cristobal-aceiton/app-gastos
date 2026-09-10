import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  message: string
}

/**
 * Red de seguridad para toda la app.
 *
 * Antes de esto, un error de render (o un chunk que no cargó, típico en
 * redes móviles) tumbaba TODO el árbol de React sin que nada lo atajara.
 * Como el fondo de <html> está fijado por CSS plano (ver index.css), lo
 * único que quedaba visible era ese fondo — pantalla "vacía" salvo el
 * color de fondo, que es justo el bug reportado en el APK de PWABuilder
 * en celular (redes móviles fallan más chunks que el wifi de un PC).
 *
 * Con este boundary, cualquier error de render muestra una pantalla real
 * con un botón para reintentar, en vez de dejar la app en blanco sin
 * ninguna pista de qué pasó.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' }

  static getDerivedStateFromError(error: unknown): State {
    return { hasError: true, message: error instanceof Error ? error.message : String(error) }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Visible en chrome://inspect (Android) o Safari Web Inspector (iOS)
    // conectando el celular por USB — es la forma más rápida de ver el
    // error real si esto se dispara en producción.
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  handleRetry = () => {
    // Recarga completa: si el problema fue un chunk viejo en caché de un
    // deploy anterior, esto también lo resuelve (junto con skipWaiting +
    // clientsClaim del service worker).
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
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

    return this.props.children
  }
}
