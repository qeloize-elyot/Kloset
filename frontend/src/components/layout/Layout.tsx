import { Outlet } from 'react-router-dom'
import { Navbar } from './Navbar'
import { BottomNav } from './BottomNav'

export function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pb-20 lg:pb-8">
        <Outlet />
      </main>
      <BottomNav />
      <footer className="hidden lg:block border-t border-ink-100 py-8">
        <div className="mx-auto max-w-6xl px-5 flex flex-wrap items-center justify-between gap-4">
          <p className="font-display text-lg text-ink-950">Kloset</p>
          <p className="text-xs text-ink-400 tracking-wide">
            O que você já tem. Bem combinado.
          </p>
        </div>
      </footer>
    </div>
  )
}
