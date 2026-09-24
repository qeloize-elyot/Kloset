import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../lib/store'
import api from '../lib/api'
import type { ClothingItem, Look } from '../lib/types'
import { Button } from '../components/ui/Button'

export function Home() {
  const { user } = useAuthStore()
  const [stats, setStats] = useState({ pieces: 0, looks: 0 })
  const [recent, setRecent] = useState<Look[]>([])

  useEffect(() => {
    if (!user) return
    const load = async () => {
      try {
        const [c, l] = await Promise.all([
          api.get<ClothingItem[]>('/clothing'),
          api.get<Look[]>('/looks'),
        ])
        setStats({ pieces: c.data.length, looks: l.data.length })
        setRecent(l.data.slice(0, 3))
      } catch {
        // silencioso
      }
    }
    load()
  }, [user])

  if (user) {
    return (
      <div className="mx-auto max-w-6xl px-5 py-12">
        <div className="mb-12">
          <p className="text-xs uppercase tracking-[0.2em] text-ink-500 mb-2">Bem-vindo</p>
          <h1 className="font-display text-4xl md:text-5xl text-ink-900 mb-3">
            {user.full_name || user.email.split('@')[0]}
          </h1>
          <p className="text-ink-600 max-w-lg">
            Seu guarda-roupa digital. Cadastre peças, consulte o clima e monte looks com intenção.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <div className="card p-5">
            <p className="text-xs uppercase tracking-wider text-ink-400 mb-1">Peças</p>
            <p className="font-display text-3xl text-ink-900">{stats.pieces}</p>
          </div>
          <div className="card p-5">
            <p className="text-xs uppercase tracking-wider text-ink-400 mb-1">Looks</p>
            <p className="font-display text-3xl text-ink-900">{stats.looks}</p>
          </div>
          <Link to="/generate" className="card p-5 hover:border-ink-300 transition-colors">
            <p className="text-xs uppercase tracking-wider text-ink-400 mb-1">Ação</p>
            <p className="font-display text-xl text-ink-900">Gerar look</p>
          </Link>
          <Link to="/style" className="card p-5 hover:border-ink-300 transition-colors">
            <p className="text-xs uppercase tracking-wider text-ink-400 mb-1">Ação</p>
            <p className="font-display text-xl text-ink-900">Avaliar look</p>
          </Link>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <div className="card p-6">
            <h2 className="font-display text-xl text-ink-900 mb-4">Comece por aqui</h2>
            <ol className="space-y-3 text-sm text-ink-600">
              <li className="flex gap-3">
                <span className="text-ink-400 font-mono text-xs mt-0.5">01</span>
                <span>
                  <Link to="/wardrobe" className="underline underline-offset-2 text-ink-800">Adicione peças</Link>
                  {' '}com foto da galeria ou câmera. Remova o fundo se quiser.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-ink-400 font-mono text-xs mt-0.5">02</span>
                <span>
                  Em <Link to="/generate" className="underline underline-offset-2 text-ink-800">Gerar look</Link>,
                  informe ocasião e cidade — o clima entra na combinação.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-ink-400 font-mono text-xs mt-0.5">03</span>
                <span>
                  Em <Link to="/style" className="underline underline-offset-2 text-ink-800">Montar e avaliar</Link>,
                  escolha as peças e peça opinião sincera da IA (com chave Groq).
                </span>
              </li>
            </ol>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl text-ink-900">Últimos looks</h2>
              <Link to="/looks" className="text-xs text-ink-500 underline underline-offset-2">Ver todos</Link>
            </div>
            {recent.length === 0 ? (
              <p className="text-sm text-ink-500">Nenhum look ainda. Gere o primeiro.</p>
            ) : (
              <ul className="space-y-3">
                {recent.map((look) => (
                  <li key={look.id} className="border-b border-ink-50 pb-3 last:border-0">
                    <p className="text-sm font-medium text-ink-900">{look.title}</p>
                    <p className="text-xs text-ink-400 mt-0.5">
                      {look.items.map((i) => i.clothing_item.category).join(' · ')}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link to="/wardrobe"><Button variant="secondary">Guarda-roupa</Button></Link>
          <Link to="/generate"><Button>Gerar look</Button></Link>
          <Link to="/style"><Button variant="ghost">Montar e avaliar</Button></Link>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-5">
      <section className="pt-20 pb-24 md:pt-28 md:pb-32">
        <div className="max-w-2xl">
          <p className="text-xs uppercase tracking-[0.2em] text-ink-500 mb-4">
            Guarda-roupa digital
          </p>
          <h1 className="font-display text-5xl md:text-6xl leading-[1.1] text-ink-900 mb-6">
            Vista-se com<br />intenção.
          </h1>
          <p className="text-ink-600 text-lg leading-relaxed mb-10 max-w-lg">
            Cadastre suas peças, consulte o clima da cidade e monte combinações
            que fazem sentido para o dia — não só para o feed.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/register"><Button>Começar</Button></Link>
            <Link to="/login"><Button variant="secondary">Já tenho conta</Button></Link>
          </div>
        </div>
      </section>

      <section className="grid md:grid-cols-3 gap-10 pb-24 border-t border-ink-100 pt-16">
        <div>
          <p className="text-xs font-mono text-ink-400 mb-2">01</p>
          <h3 className="font-display text-xl text-ink-900 mb-2">Inventário real</h3>
          <p className="text-sm text-ink-600 leading-relaxed">
            Foto da galeria ou câmera, categoria, cor e tecido. Remova o fundo no próprio celular.
          </p>
        </div>
        <div>
          <p className="text-xs font-mono text-ink-400 mb-2">02</p>
          <h3 className="font-display text-xl text-ink-900 mb-2">Clima e ocasião</h3>
          <p className="text-sm text-ink-600 leading-relaxed">
            Digite a cidade: temperatura e condição entram no filtro das peças.
          </p>
        </div>
        <div>
          <p className="text-xs font-mono text-ink-400 mb-2">03</p>
          <h3 className="font-display text-xl text-ink-900 mb-2">Opinião sincera</h3>
          <p className="text-sm text-ink-600 leading-relaxed">
            Monte um look e peça avaliação — nota, prós, contras e sugestões, sem bajulação.
          </p>
        </div>
      </section>
    </div>
  )
}
