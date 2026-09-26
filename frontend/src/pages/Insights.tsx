import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../lib/api'
import type { ClothingItem, Look } from '../lib/types'
import { Button } from '../components/ui/Button'

export function Insights() {
  const [items, setItems] = useState<ClothingItem[]>([])
  const [looks, setLooks] = useState<Look[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [c, l] = await Promise.all([
          api.get<ClothingItem[]>('/clothing'),
          api.get<Look[]>('/looks'),
        ])
        setItems(c.data)
        setLooks(l.data)
      } catch {
        // ok
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const stats = useMemo(() => {
    const byCat: Record<string, number> = {}
    const colors: Record<string, number> = {}
    for (const i of items) {
      const cat = (i.category || 'outro').toLowerCase()
      byCat[cat] = (byCat[cat] || 0) + 1
      const hex = (i.dominant_color || '').toLowerCase()
      if (hex) colors[hex] = (colors[hex] || 0) + 1
    }
    const topCats = Object.entries(byCat).sort((a, b) => b[1] - a[1]).slice(0, 6)
    const topColors = Object.entries(colors).sort((a, b) => b[1] - a[1]).slice(0, 8)

    // peças que mais aparecem em looks
    const wear: Record<number, { count: number; item: ClothingItem | null }> = {}
    for (const look of looks) {
      for (const li of look.items) {
        const id = li.clothing_item.id
        if (!wear[id]) wear[id] = { count: 0, item: li.clothing_item }
        wear[id].count += 1
      }
    }
    const mostWorn = Object.values(wear).sort((a, b) => b.count - a.count).slice(0, 5)
    const neverInLook = items.filter((i) => !wear[i.id]).slice(0, 6)

    const balance =
      items.length === 0
        ? 'Vazio'
        : topCats[0] && topCats[0][1] / items.length > 0.45
          ? `Muita concentração em ${topCats[0][0]}`
          : 'Distribuição razoável entre categorias'

    return { topCats, topColors, mostWorn, neverInLook, balance, lookCount: looks.length }
  }, [items, looks])

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-5 py-12">
        <p className="text-sm text-ink-500">Calculando o closet…</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <div className="max-w-xl mb-10">
        <p className="editorial-kicker mb-2">Análise</p>
        <h1 className="page-title mb-2">Insights</h1>
        <p className="text-sm text-ink-500 leading-relaxed">
          Como Stylebook e Whering: números do <em>seu</em> inventário — sem loja, sem anúncio.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
        <div className="card p-5">
          <p className="text-[10px] uppercase tracking-[0.16em] text-ink-400 mb-1">Peças</p>
          <p className="font-display text-3xl text-ink-950">{items.length}</p>
        </div>
        <div className="card p-5">
          <p className="text-[10px] uppercase tracking-[0.16em] text-ink-400 mb-1">Looks</p>
          <p className="font-display text-3xl text-ink-950">{stats.lookCount}</p>
        </div>
        <div className="card p-5 col-span-2">
          <p className="text-[10px] uppercase tracking-[0.16em] text-ink-400 mb-1">Equilíbrio</p>
          <p className="font-display text-lg text-ink-950 leading-snug">{stats.balance}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-10">
        <div className="card p-6">
          <h2 className="font-display text-xl text-ink-950 mb-4">Por categoria</h2>
          {stats.topCats.length === 0 ? (
            <p className="text-sm text-ink-500">Cadastre peças para ver o gráfico.</p>
          ) : (
            <ul className="space-y-3">
              {stats.topCats.map(([cat, n]) => (
                <li key={cat}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="capitalize text-ink-800">{cat}</span>
                    <span className="text-ink-400">{n}</span>
                  </div>
                  <div className="h-1.5 bg-ink-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent/80 rounded-full"
                      style={{ width: `${Math.min(100, (n / items.length) * 100)}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card p-6">
          <h2 className="font-display text-xl text-ink-950 mb-4">Paleta</h2>
          {stats.topColors.length === 0 ? (
            <p className="text-sm text-ink-500">Defina cores ao cadastrar peças.</p>
          ) : (
            <div className="flex flex-wrap gap-3">
              {stats.topColors.map(([hex, n]) => (
                <div key={hex} className="flex flex-col items-center gap-1">
                  <span
                    className="h-10 w-10 rounded-sm border border-ink-100 shadow-sm"
                    style={{ backgroundColor: hex }}
                    title={`${hex} · ${n}`}
                  />
                  <span className="text-[10px] text-ink-400">{n}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-10">
        <div className="card p-6">
          <h2 className="font-display text-xl text-ink-950 mb-4">Mais usadas em looks</h2>
          {stats.mostWorn.length === 0 ? (
            <p className="text-sm text-ink-500 mb-4">Gere looks para ver o ranking.</p>
          ) : (
            <ul className="space-y-3">
              {stats.mostWorn.map(({ item, count }) =>
                item ? (
                  <li key={item.id} className="flex items-center gap-3">
                    <span
                      className="h-8 w-8 rounded-sm shrink-0 border border-ink-100"
                      style={{ backgroundColor: item.dominant_color || '#ddd' }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-ink-900 truncate">{item.name || item.category}</p>
                      <p className="text-[11px] text-ink-400 capitalize">{item.category}</p>
                    </div>
                    <span className="text-xs text-ink-500">{count}x</span>
                  </li>
                ) : null
              )}
            </ul>
          )}
        </div>

        <div className="card p-6">
          <h2 className="font-display text-xl text-ink-950 mb-4">Ainda não entraram em look</h2>
          {stats.neverInLook.length === 0 ? (
            <p className="text-sm text-ink-500">Todas as peças já apareceram em algum look — ou o closet está vazio.</p>
          ) : (
            <>
              <ul className="space-y-2 mb-4">
                {stats.neverInLook.map((item) => (
                  <li key={item.id} className="text-sm text-ink-700 capitalize">
                    {item.name || item.category}
                    <span className="text-ink-400"> · {item.category}</span>
                  </li>
                ))}
              </ul>
              <Link to="/generate">
                <Button size="sm" variant="secondary">Gerar look incluindo essas</Button>
              </Link>
            </>
          )}
        </div>
      </div>

      <Link to="/wardrobe">
        <Button variant="ghost">Voltar ao guarda-roupa</Button>
      </Link>
    </div>
  )
}
