import { useEffect, Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import AppLayout from './components/AppLayout'
import ProtectedRoute from './components/ProtectedRoute'
import { useAuthStore } from './store/authStore'

// Fase 7: code-splitting por ruta (evita un solo bundle gigante en el build de producción)
const Login = lazy(() => import('./pages/Login'))
const SignUp = lazy(() => import('./pages/SignUp'))
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'))
const Onboarding = lazy(() => import('./pages/Onboarding'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const AddTransaction = lazy(() => import('./pages/AddTransaction'))
const Transactions = lazy(() => import('./pages/Transactions'))
const Stats = lazy(() => import('./pages/Stats'))
const Profile = lazy(() => import('./pages/Profile'))
const Premium = lazy(() => import('./pages/Premium'))
const Settings = lazy(() => import('./pages/Settings'))
const CategoriesSettings = lazy(() => import('./pages/CategoriesSettings'))

const queryClient = new QueryClient()

function RouteFallback() {
  // Pantalla en blanco del color de fondo (evita parpadeo blanco mientras carga el chunk)
  return <div className="min-h-svh bg-(--color-bg)" />
}

export default function App() {
  const init = useAuthStore((s) => s.init)

  useEffect(() => {
    init()
  }, [init])

  return (
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
              <Route path="/" element={<Dashboard />} />
              <Route path="/add-transaction" element={<AddTransaction />} />
              <Route path="/transactions" element={<Transactions />} />
              <Route path="/stats" element={<Stats />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/premium" element={<Premium />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/settings/categories" element={<CategoriesSettings />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
