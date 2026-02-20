import Navigation from './Navigation'
import { ReactNode } from 'react'

interface LayoutProps {
  children: ReactNode
  title?: string
  subtitle?: string
}

export default function Layout({ children, title, subtitle }: LayoutProps) {
  return (
    <div className="min-h-screen" style={{ background: 'rgb(10 11 18)' }}>
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 py-8">
        {title && (
          <div className="mb-8">
            <h1 className="text-2xl font-bold" style={{ color: 'rgb(226 232 240)' }}>{title}</h1>
            {subtitle && (
              <p className="mt-1 text-sm" style={{ color: 'rgb(100 116 139)' }}>{subtitle}</p>
            )}
          </div>
        )}
        {children}
      </main>
    </div>
  )
}
