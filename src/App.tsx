import { useEffect, Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import AppLayout from './components/AppLayout'
import ProtectedRoute from './components/ProtectedRoute'
import ErrorBoundary from './components/ErrorBoundary'
import { useAuthStore } from './store/authStore'
import Dashboard from './pages/Dashboard'
import AddTransaction from './pages/AddTransaction'
import Transactions from './pages/Transactions'
import Stats from './pages/Stats'
import Profile from './pages/Profile'
import Premium from './pages/Premium'
import Settings from './pages/Settings'
import CategoriesSettings from './pages/CategoriesSettings'

// Fase 7: code-splitting solo para las pantallas de antes del login (se
// visitan una sola vez por sesión, así que sí vale la pena diferirlas).
// Las pantallas del tab bar (Dashboard, Transactions, Stats, etc.) se
// importan de forma estática abajo: el service worker las precachea todas
// de entrada (ver injectManifest en vite.config.ts), así que separarlas en
// chunks no ahorraba nada offline y en cambio era la causa de la pantalla
// negra: cada vez que se entraba a una sección nueva de la nav bar cuyo
// chunk aún no había llegado, todo el árbol se suspendía.
const Login = lazy(() => import('./pages/Login'))
const SignUp = lazy(() => import('./pages/SignUp'))
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'))
const Onboarding = lazy(() => import('./pages/Onboarding'))

const queryClient = new QueryClient()

function RouteFallback() {
  // Pantalla en blanco del color de fondo (evita parpadeo blanco mientras carga el chunk)
  return <div className="min-h-svh bg-(--color-bg)" />
}

export default function App() {
  const init = useAuthStore((s) => s.init)

  useEffect(() => {
    init()
    // Si llegamos hasta acá, la app montó bien: limpiamos el flag de
    // "ya recargué una vez por un chunk que falló" para que, si vuelve a
    // fallar más adelante en esta misma sesión, se pueda reintentar de
    // nuevo en vez de quedar bloqueado (ver main.tsx).
    sessionStorage.removeItem('gastos:reloaded-after-preload-error')
  }, [init])

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/onboarding" element={<Onboarding />} />

              <Route
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                {/* Cada pantalla del tab bar tiene su propio boundary de sección
                    (Plan de remodelación, Fase 1): si una explota, el resto de
                    la app (incluido el BottomNav) sigue andando. */}
                <Route
                  path="/"
                  element={
                    <ErrorBoundary level="section" label="dashboard">
                      <Dashboard />
                    </ErrorBoundary>
                  }
                />
                <Route
                  path="/add-transaction"
                  element={
                    <ErrorBoundary level="section" label="add-transaction">
                      <AddTransaction />
                    </ErrorBoundary>
                  }
                />
                <Route
                  path="/transactions"
                  element={
                    <ErrorBoundary level="section" label="transactions">
                      <Transactions />
                    </ErrorBoundary>
                  }
                />
                <Route
                  path="/stats"
                  element={
                    <ErrorBoundary level="section" label="stats">
                      <Stats />
                    </ErrorBoundary>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ErrorBoundary level="section" label="profile">
                      <Profile />
                    </ErrorBoundary>
                  }
                />
                <Route
                  path="/premium"
                  element={
                    <ErrorBoundary level="section" label="premium">
                      <Premium />
                    </ErrorBoundary>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <ErrorBoundary level="section" label="settings">
                      <Settings />
                    </ErrorBoundary>
                  }
                />
                <Route
                  path="/settings/categories"
                  element={
                    <ErrorBoundary level="section" label="categories-settings">
                      <CategoriesSettings />
                    </ErrorBoundary>
                  }
                />
              </Route>
            </Routes>
          </Suspense>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}
