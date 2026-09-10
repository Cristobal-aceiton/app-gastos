import type { ReactNode } from 'react'
import { Wallet } from 'lucide-react'
import PageTransition from './PageTransition'
import MeshBackground from './MeshBackground'

export default function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string
  subtitle: string
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <div className="app-shell-bg relative isolate flex min-h-svh flex-col justify-center px-6 py-12 text-(--color-ink)">
      <MeshBackground />
      {/* Fase 7: transición de entrada al navegar entre Login / Sign Up / Forgot password */}
      <div className="relative z-10">
        <PageTransition>
          <div className="mx-auto w-full max-w-sm">
            <div className="flex flex-col items-center text-center">
              <div className="glow-mint flex h-14 w-14 items-center justify-center rounded-2xl bg-(--color-mint-dim) text-(--color-mint)">
                <Wallet size={26} strokeWidth={2.2} />
              </div>
              <h1 className="text-gradient-primary mt-4 text-2xl font-bold">{title}</h1>
              <p className="mt-1 text-sm text-(--color-ink-muted)">{subtitle}</p>
            </div>

            <div className="card-glass mt-8 rounded-3xl p-5">{children}</div>

            {footer && <div className="mt-8 text-center text-sm text-(--color-ink-muted)">{footer}</div>}
          </div>
        </PageTransition>
      </div>
    </div>
  )
}
