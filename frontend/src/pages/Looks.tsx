import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../lib/api'
import type { Look } from '../lib/types'
import { Button } from '../components/ui/Button'

export function Looks() {
  const [looks, setLooks] = useState<Look[]>([])
  const [loading, setLoading] = useState(true)
  const [feedbackDone, setFeedbackDone] = useState<Record<number, string>>({})

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get<Look[]>('/looks')
        setLooks(data)
      } catch {
        // silencioso
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const sendFeedback = async (lookId: number, rating: 'like' | 'dislike' | 'used') => {
    try {
      await api.post(`/looks/${lookId}/feedback`, { rating })
      setFeedbackDone((prev) => ({ ...prev, [lookId]: rating }))
    } catch {
      // silencioso
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <div className="flex items-end justify-between mb-10">
        <div>
          <h1 className="font-display text-3xl text-ink-900">Histórico</h1>
          <p className="text-sm text-ink-500 mt-1">Looks gerados e o que você achou deles</p>
        </div>
        <Link to="/generate">
          <Button>Gerar novo</Button>
        </Link>
      </div>

      {loading ? (
        <p className="text-sm text-ink-500">Carregando…</p>
      ) : looks.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-ink-600 mb-4">Nenhum look gerado ainda.</p>
          <Link to="/generate">
            <Button>Gerar o primeiro</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {looks.map((look) => (
            <article key={look.id} className="card p-5 md:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                <div>
                  <h3 className="font-display text-lg text-ink-900">{look.title}</h3>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-xs text-ink-400">
                    <time>
                      {new Date(look.created_at).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </time>
                    {look.temperature != null && (
                      <span>{Math.round(look.temperature)}°C</span>
                    )}
                    {look.weather_condition && <span>{look.weather_condition}</span>}
                    {look.occasion && <span className="capitalize">{look.occasion}</span>}
                  </div>
                </div>
                <div className="flex gap-2">
                  {(['like', 'dislike', 'used'] as const).map((r) => (
                    <Button
                      key={r}
                      variant={feedbackDone[look.id] === r ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={() => sendFeedback(look.id, r)}
                    >
                      {r === 'like' ? 'Gostei' : r === 'dislike' ? 'Não usaria' : 'Usei'}
                    </Button>
                  ))}
                </div>
              </div>

              {look.rationale && (
                <p className="text-sm text-ink-500 mb-4 leading-relaxed max-w-2xl">
                  {look.rationale}
                </p>
              )}

              <div className="flex flex-wrap gap-2">
                {look.items.map((li) => {
                  const img = li.clothing_item.image_clean || li.clothing_item.image_front
                  return (
                    <div
                      key={li.id}
                      className="inline-flex items-center gap-2 text-xs border border-ink-100 rounded-sm px-2.5 py-1.5 bg-cream-50"
                    >
                      {img ? (
                        <img src={img} alt="" className="h-8 w-8 object-contain rounded-sm" />
                      ) : (
                        <span
                          className="h-3 w-3 rounded-sm shrink-0"
                          style={{ backgroundColor: li.clothing_item.dominant_color || '#ccc' }}
                        />
                      )}
                      {li.clothing_item.name || li.clothing_item.category}
                    </div>
                  )
                })}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
