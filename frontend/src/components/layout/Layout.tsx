import { Outlet } from 'react-router-dom'
import { Navbar } from './Navbar'

export function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-ink-100 py-8">
        <div className="mx-auto max-w-6xl px-5 text-center text-xs text-ink-400 tracking-wide">
          Kloset — guarda-roupa com intenção
        </div>
      </footer>
    </div>
  )
}
