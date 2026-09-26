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
        <div className="mb-12 md:mb-16">
          <p className="editorial-kicker mb-3">O seu closet</p>
          <h1 className="font-display text-4xl md:text-5xl text-ink-950 mb-3 leading-tight">
            {user.full_name || user.email.split('@')[0]}
          </h1>
          <p className="text-ink-600 max-w-md leading-relaxed">
            Menos “não tenho o que vestir”. Mais combinação com o que já é seu.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-12">
          <div className="card p-5">
            <p className="text-[10px] uppercase tracking-[0.16em] text-ink-400 mb-1">Peças</p>
            <p className="font-display text-3xl text-ink-950">{stats.pieces}</p>
          </div>
          <div className="card p-5">
            <p className="text-[10px] uppercase tracking-[0.16em] text-ink-400 mb-1">Looks</p>
            <p className="font-display text-3xl text-ink-950">{stats.looks}</p>
          </div>
          <Link to="/feed" className="card-lift p-5 block">
            <p className="text-[10px] uppercase tracking-[0.16em] text-accent mb-1">Feed</p>
            <p className="font-display text-xl text-ink-950">Para você</p>
          </Link>
          <Link to="/generate" className="card-lift p-5 block">
            <p className="text-[10px] uppercase tracking-[0.16em] text-accent mb-1">Agora</p>
            <p className="font-display text-xl text-ink-950">Gerar look</p>
          </Link>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-14">
          <div className="card p-6 md:p-8">
            <h2 className="font-display text-2xl text-ink-950 mb-5">Rituais</h2>
            <ol className="space-y-4 text-sm text-ink-600">
              <li className="flex gap-4">
                <span className="font-display text-accent text-lg leading-none">01</span>
                <span>
                  <Link to="/wardrobe" className="text-ink-900 underline underline-offset-4 decoration-ink-200">Peças com foto</Link>
                  {' '}da galeria. Remover fundo é opcional e mais rápido agora.
                </span>
              </li>
              <li className="flex gap-4">
                <span className="font-display text-accent text-lg leading-none">02</span>
                <span>
                  <Link to="/feed" className="text-ink-900 underline underline-offset-4 decoration-ink-200">Feed Para você</Link>
                  {' '}mistura suas peças com o que você já curtiu.
                </span>
              </li>
              <li className="flex gap-4">
                <span className="font-display text-accent text-lg leading-none">03</span>
                <span>
                  <Link to="/generate" className="text-ink-900 underline underline-offset-4 decoration-ink-200">Clima da cidade</Link>
                  {' '}entra na montagem — não só a ocasião.
                </span>
              </li>
            </ol>
          </div>

          <div className="card p-6 md:p-8">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-2xl text-ink-950">Recentes</h2>
              <Link to="/looks" className="text-xs text-ink-400 hover:text-ink-700">Ver todos</Link>
            </div>
            {recent.length === 0 ? (
              <p className="text-sm text-ink-500">Nenhum look ainda. O feed e o gerador esperam por peças.</p>
            ) : (
              <ul className="space-y-4">
                {recent.map((look) => (
                  <li key={look.id} className="border-b border-ink-50 pb-3 last:border-0 last:pb-0">
                    <p className="text-sm font-medium text-ink-900">{look.title}</p>
                    <p className="text-xs text-ink-400 mt-1">
                      {look.items.map((i) => i.clothing_item.category).join(' · ')}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link to="/feed"><Button>Abrir feed</Button></Link>
          <Link to="/wardrobe"><Button variant="secondary">Guarda-roupa</Button></Link>
          <Link to="/style"><Button variant="ghost">Avaliar look</Button></Link>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-5">
      <section className="pt-16 pb-20 md:pt-28 md:pb-32">
        <div className="max-w-2xl">
          <p className="editorial-kicker mb-5">Guarda-roupa com critério</p>
          <h1 className="font-display text-5xl md:text-7xl leading-[1.05] text-ink-950 mb-6">
            O que você já tem.<br />
            <span className="text-accent">Bem combinado.</span>
          </h1>
          <p className="text-ink-600 text-lg leading-relaxed mb-10 max-w-md">
            Cadastre peças, veja o clima, receba um feed só com o seu closet
            e monte o dia sem scroll infinito de loja.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/register"><Button>Criar conta</Button></Link>
            <Link to="/login"><Button variant="secondary">Entrar</Button></Link>
          </div>
        </div>
      </section>

      <section className="grid md:grid-cols-3 gap-10 pb-24 border-t border-ink-100 pt-16">
        <div>
          <p className="font-display text-accent text-2xl mb-2">01</p>
          <h3 className="font-display text-xl text-ink-950 mb-2">Inventário seu</h3>
          <p className="text-sm text-ink-600 leading-relaxed">
            Foto da galeria ou câmera. Fundo opcional, processado no aparelho — mais leve do que antes.
          </p>
        </div>
        <div>
          <p className="font-display text-accent text-2xl mb-2">02</p>
          <h3 className="font-display text-xl text-ink-950 mb-2">Feed Para você</h3>
          <p className="text-sm text-ink-600 leading-relaxed">
            Estilo Pinterest, mas só com combinações do seu armário e do que você marca como gostei.
          </p>
        </div>
        <div>
          <p className="font-display text-accent text-2xl mb-2">03</p>
          <h3 className="font-display text-xl text-ink-950 mb-2">Clima na conta</h3>
          <p className="text-sm text-ink-600 leading-relaxed">
            Cidade entra na temperatura real. Menos short no frio, menos casaco no calor.
          </p>
        </div>
      </section>
    </div>
  )
}
