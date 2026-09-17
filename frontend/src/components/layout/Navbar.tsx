import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../lib/store'
import { Button } from '../ui/Button'

export function Navbar() {
  const { user, logout } = useAuthStore()
  const location = useLocation()
  const navigate = useNavigate()

  const links = [
    { to: '/wardrobe', label: 'Guarda-roupa' },
    { to: '/looks', label: 'Looks' },
    { to: '/generate', label: 'Gerar look' },
  ]

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="border-b border-ink-100 bg-cream-50/90 backdrop-blur-sm sticky top-0 z-40">
      <div className="mx-auto max-w-6xl px-5 h-16 flex items-center justify-between">
        <Link to="/" className="font-display text-2xl tracking-tight text-ink-900">
          Kloset
        </Link>

        {user && (
          <nav className="hidden md:flex items-center gap-8">
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

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="hidden sm:block text-sm text-ink-500">
                {user.full_name || user.email.split('@')[0]}
              </span>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                Sair
              </Button>
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
    </header>
  )
}
