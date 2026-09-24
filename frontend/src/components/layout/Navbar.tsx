import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../lib/store'
import { Button } from '../ui/Button'

export function Navbar() {
  const { user, logout } = useAuthStore()
  const location = useLocation()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const links = [
    { to: '/wardrobe', label: 'Guarda-roupa' },
    { to: '/generate', label: 'Gerar look' },
    { to: '/style', label: 'Montar e avaliar' },
    { to: '/looks', label: 'Histórico' },
  ]

  const handleLogout = () => {
    logout()
    setOpen(false)
    navigate('/login')
  }

  return (
    <header className="border-b border-ink-100 bg-cream-50/95 backdrop-blur-sm sticky top-0 z-40">
      <div className="mx-auto max-w-6xl px-5 h-16 flex items-center justify-between">
        <Link to="/" className="font-display text-2xl tracking-tight text-ink-900" onClick={() => setOpen(false)}>
          Kloset
        </Link>

        {user && (
          <nav className="hidden md:flex items-center gap-7">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`text-sm tracking-wide transition-colors ${
                  location.pathname === link.to
                    ? 'text-ink-900 font-medium'
                    : 'text-ink-500 hover:text-ink-800'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        )}

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <span className="hidden sm:block text-sm text-ink-500 max-w-[10rem] truncate">
                {user.full_name || user.email.split('@')[0]}
              </span>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="hidden md:inline-flex">
                Sair
              </Button>
              <button
                type="button"
                className="md:hidden p-2 text-ink-700"
                aria-label="Menu"
                onClick={() => setOpen((v) => !v)}
              >
                <span className="block w-5 h-0.5 bg-ink-800 mb-1.5" />
                <span className="block w-5 h-0.5 bg-ink-800 mb-1.5" />
                <span className="block w-5 h-0.5 bg-ink-800" />
              </button>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm">Entrar</Button>
              </Link>
              <Link to="/register">
                <Button size="sm">Criar conta</Button>
              </Link>
            </>
          )}
        </div>
      </div>

      {user && open && (
        <div className="md:hidden border-t border-ink-100 bg-cream-50 px-5 py-4 space-y-3">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setOpen(false)}
              className={`block text-sm py-1 ${
                location.pathname === link.to ? 'text-ink-900 font-medium' : 'text-ink-600'
              }`}
            >
              {link.label}
            </Link>
          ))}
          <button type="button" onClick={handleLogout} className="block text-sm text-ink-500 py-1">
            Sair
          </button>
        </div>
      )}
    </header>
  )
}
