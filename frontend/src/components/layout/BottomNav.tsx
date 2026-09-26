import { Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../lib/store'

const tabs = [
  { to: '/', label: 'Início' },
  { to: '/wardrobe', label: 'Closet' },
  { to: '/generate', label: 'Gerar' },
  { to: '/feed', label: 'Ideias' },
  { to: '/community', label: 'Refs' },
]

export function BottomNav() {
  const user = useAuthStore((s) => s.user)
  const location = useLocation()

  if (!user) return null

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-ink-100/80 bg-cream-50/95 backdrop-blur-md lg:hidden safe-bottom">
      <div className="mx-auto max-w-lg flex items-stretch justify-around h-14 px-1">
        {tabs.map((tab) => {
          const active =
            tab.to === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(tab.to)
          return (
            <Link
              key={tab.to}
              to={tab.to}
              className={`flex-1 flex flex-col items-center justify-center text-[10px] tracking-wide transition-colors ${
                active ? 'text-ink-950 font-semibold' : 'text-ink-400'
              }`}
            >
              <span
                className={`mb-0.5 h-1 w-1 rounded-full ${
                  active ? 'bg-accent' : 'bg-transparent'
                }`}
              />
              {tab.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
