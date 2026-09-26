import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../lib/store'
import api from '../lib/api'
import type { ClothingItem, Look } from '../lib/types'
import { Button } from '../components/ui/Button'
import { OutfitCanvas } from '../components/ui/OutfitCanvas'

export function Home() {
  const { user } = useAuthStore()
  const [stats, setStats] = useState({ pieces: 0, looks: 0 })
  const [latest, setLatest] = useState<Look | null>(null)
  const [loading, setLoading] = useState(!!user)

  useEffect(() => {
    if (!user) return
    const load = async () => {
      try {
        const [c, l] = await Promise.all([
          api.get<ClothingItem[]>('/clothing'),
          api.get<Look[]>('/looks'),
        ])
        setStats({ pieces: c.data.length, looks: l.data.length })
        setLatest(l.data[0] || null)
      } catch {
        // ok
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user])

  if (user) {
    return (
      <div className="mx-auto max-w-6xl px-5 py-10 sm:py-14">
        <header className="mb-12 sm:mb-16">
          <p className="editorial-kicker mb-3">Hoje</p>
          <h1 className="font-display text-4xl sm:text-5xl text-ink-950 leading-[1.1] mb-3">
            {user.full_name || user.email.split('@')[0]}
          </h1>
          <p className="text-ink-600 max-w-md leading-relaxed text-[15px]">
            Menos decisão às pressas. Mais combinação com o que já é seu.
          </p>
        </header>

        <section className="mb-12">
          {loading ? (
            <div className="card h-64 animate-pulse bg-ink-50/50" />
          ) : latest ? (
            <div className="card overflow-hidden grid md:grid-cols-2">
              <OutfitCanvas
                pieces={latest.items.map((li) => ({
                  id: li.clothing_item.id,
                  name: li.clothing_item.name,
                  category: li.clothing_item.category,
                  dominant_color: li.clothing_item.dominant_color,
                  image: li.clothing_item.image_clean || li.clothing_item.image_front,
                }))}
              />
              <div className="p-6 sm:p-8 flex flex-col justify-center">
                <p className="editorial-kicker mb-2">Último look</p>
                <h2 className="font-display text-2xl sm:text-3xl text-ink-950 mb-2 leading-snug">
                  {latest.title}
                </h2>
                {latest.rationale && (
                  <p className="text-sm text-ink-500 leading-relaxed mb-6 line-clamp-4">
                    {latest.rationale}
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  <Link to="/swipe">
                    <Button size="sm">Avaliar no swipe</Button>
                  </Link>
                  <Link to="/generate">
                    <Button size="sm" variant="secondary">Novo look</Button>
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="card p-8 sm:p-12 text-center">
              <p className="font-display text-2xl text-ink-950 mb-2">Comece pelo closet</p>
              <p className="text-sm text-ink-500 mb-6 max-w-sm mx-auto leading-relaxed">
                Com duas peças já dá para gerar o primeiro look e ver a montagem em flat-lay.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Link to="/wardrobe"><Button>Adicionar peças</Button></Link>
                <Link to="/generate"><Button variant="secondary">Gerar mesmo assim</Button></Link>
              </div>
            </div>
          )}
        </section>

        <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-12">
          <div className="card p-4 sm:p-5">
            <p className="text-[10px] uppercase tracking-[0.16em] text-ink-400 mb-1">Peças</p>
            <p className="font-display text-3xl text-ink-950">{stats.pieces}</p>
          </div>
          <div className="card p-4 sm:p-5">
            <p className="text-[10px] uppercase tracking-[0.16em] text-ink-400 mb-1">Looks</p>
            <p className="font-display text-3xl text-ink-950">{stats.looks}</p>
          </div>
          <Link to="/insights" className="card-lift p-4 sm:p-5 block">
            <p className="text-[10px] uppercase tracking-[0.16em] text-accent mb-1">Análise</p>
            <p className="font-display text-xl text-ink-950">Insights</p>
          </Link>
          <Link to="/community" className="card-lift p-4 sm:p-5 block">
            <p className="text-[10px] uppercase tracking-[0.16em] text-accent mb-1">Social</p>
            <p className="font-display text-xl text-ink-950">Referências</p>
          </Link>
        </section>

        <section className="section-rule">
          <h2 className="font-display text-2xl text-ink-950 mb-6">Atalhos</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { to: '/wardrobe', t: 'Guarda-roupa', d: 'Filtros por cor, categoria e comprimento.' },
              { to: '/generate', t: 'Gerar + swipe', d: 'Clima manual, depois arraste o que gostou.' },
              { to: '/feed', t: 'Para você', d: 'Combinações só com as suas peças.' },
            ].map((x) => (
              <Link key={x.to} to={x.to} className="card-lift p-5 block">
                <p className="font-display text-lg text-ink-950 mb-1">{x.t}</p>
                <p className="text-xs text-ink-500 leading-relaxed">{x.d}</p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-5">
      <section className="pt-16 pb-20 sm:pt-28 sm:pb-32">
        <div className="max-w-2xl">
          <p className="editorial-kicker mb-5">Guarda-roupa com critério</p>
          <h1 className="font-display text-5xl sm:text-7xl leading-[1.05] text-ink-950 mb-6">
            O que você já tem.
            <br />
            <span className="text-accent italic">Bem combinado.</span>
          </h1>
          <p className="text-ink-600 text-lg leading-relaxed mb-10 max-w-md">
            Inventário visual, clima que você define, swipe de looks e referências da comunidade —
            sem pedir sua localização e sem feed de loja.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/register"><Button>Criar conta</Button></Link>
            <Link to="/login"><Button variant="secondary">Entrar</Button></Link>
          </div>
        </div>
      </section>

      <section className="grid md:grid-cols-3 gap-12 pb-24 border-t border-ink-100 pt-16">
        {[
          { n: '01', t: 'Closet editorial', d: 'Foto, cor, categoria e filtros finos — como um lookbook só seu.' },
          { n: '02', t: 'Decisão rápida', d: 'Gere looks, arraste no swipe e treine o que combina com você.' },
          { n: '03', t: 'Referências reais', d: 'Posts de looks montados por pessoas, não por catálogo.' },
        ].map((b) => (
          <div key={b.n}>
            <p className="font-display text-accent text-2xl mb-2">{b.n}</p>
            <h3 className="font-display text-xl text-ink-950 mb-2">{b.t}</h3>
            <p className="text-sm text-ink-600 leading-relaxed">{b.d}</p>
          </div>
        ))}
      </section>
    </div>
  )
}
