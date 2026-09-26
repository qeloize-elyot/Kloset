import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../lib/api'
import { Button } from '../components/ui/Button'

interface FeedItem {
  id: string
  name: string | null
  category: string
  dominant_color: string | null
  image: string | null
  pattern: string | null
  fabric: string | null
}

interface FeedCard {
  id: string
  title: string
  mood: string
  score: number
  rationale: string
  items: FeedItem[]
}

export function Feed() {
  const [cards, setCards] = useState<FeedCard[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState<Record<string, boolean>>({})

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await api.get<FeedCard[]>('/looks/feed')
      setCards(data)
    } catch {
      setError('Não foi possível montar o feed. Cadastre pelo menos duas peças.')
      setCards([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
        <div className="max-w-xl">
          <p className="editorial-kicker mb-2">Inspiração</p>
          <h1 className="font-display text-4xl text-ink-950 mb-2">Para você</h1>
          <p className="text-sm text-ink-500 leading-relaxed">
            Combinações a partir do <em>seu</em> guarda-roupa e do que você curtiu antes —
            não um feed genérico de catálogo.
          </p>
        </div>
        <Button variant="secondary" onClick={load} disabled={loading}>
          {loading ? 'Atualizando…' : 'Atualizar feed'}
        </Button>
      </div>

      {loading && cards.length === 0 && (
        <p className="text-sm text-ink-500">Montando ideias a partir das suas peças…</p>
      )}

      {error && (
        <div className="card p-8 text-center">
          <p className="text-ink-600 mb-4">{error}</p>
          <Link to="/wardrobe">
            <Button>Ir ao guarda-roupa</Button>
          </Link>
        </div>
      )}

      {!loading && !error && cards.length === 0 && (
        <div className="card p-12 text-center">
          <p className="font-display text-2xl text-ink-900 mb-2">Ainda vazio</p>
          <p className="text-sm text-ink-500 mb-6 max-w-sm mx-auto">
            Com mais peças e alguns “Gostei” nos looks, o feed fica mais afiado no seu gosto.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/wardrobe"><Button>Adicionar peças</Button></Link>
            <Link to="/generate"><Button variant="secondary">Gerar look</Button></Link>
          </div>
        </div>
      )}

      <div className="masonry">
        {cards.map((card) => (
          <article key={card.id} className="masonry-item card-lift overflow-hidden">
            <div className="p-3 pb-0">
              <div className="grid grid-cols-2 gap-1.5">
                {card.items.slice(0, 4).map((item) => (
                  <div
                    key={item.id}
                    className="aspect-square rounded-sm overflow-hidden flex items-center justify-center"
                    style={{
                      backgroundColor: item.image
                        ? undefined
                        : item.dominant_color || '#e8e4de',
                      backgroundImage: item.image
                        ? 'repeating-conic-gradient(#f2ebe0 0% 25%, #fff 0% 50%)'
                        : undefined,
                      backgroundSize: item.image ? '10px 10px' : undefined,
                    }}
                  >
                    {item.image ? (
                      <img src={item.image} alt="" className="h-full w-full object-contain" />
                    ) : (
                      <span className="text-[9px] uppercase tracking-wider text-white/90 mix-blend-difference px-1 text-center">
                        {item.category}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4">
              <p className="text-[10px] uppercase tracking-[0.16em] text-accent mb-1">
                {card.mood}
              </p>
              <h3 className="font-display text-xl text-ink-950 leading-snug mb-2">
                {card.title}
              </h3>
              <p className="text-xs text-ink-500 leading-relaxed mb-3">
                {card.rationale}
              </p>
              <div className="flex items-center justify-between">
                <p className="text-[11px] text-ink-400">
                  {card.items.map((i) => i.category).join(' · ')}
                </p>
                <button
                  type="button"
                  onClick={() => setSaved((s) => ({ ...s, [card.id]: !s[card.id] }))}
                  className={`text-xs transition-colors ${
                    saved[card.id] ? 'text-accent font-medium' : 'text-ink-400 hover:text-ink-700'
                  }`}
                >
                  {saved[card.id] ? 'Salvo' : 'Salvar'}
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
