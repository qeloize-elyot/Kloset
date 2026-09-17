import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../lib/api'
import type { Look } from '../lib/types'
import { Button } from '../components/ui/Button'

export function Looks() {
  const [looks, setLooks] = useState<Look[]>([])
  const [loading, setLoading] = useState(true)

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

  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <div className="flex items-end justify-between mb-10">
        <div>
          <h1 className="font-display text-3xl text-ink-900">Looks</h1>
          <p className="text-sm text-ink-500 mt-1">Histórico de combinações geradas</p>
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
            <article key={look.id} className="card p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
                <h3 className="font-display text-lg text-ink-900">{look.title}</h3>
                <time className="text-xs text-ink-400">
                  {new Date(look.created_at).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </time>
              </div>
              <div className="flex flex-wrap gap-2">
                {look.items.map((li) => (
                  <span
                    key={li.id}
                    className="inline-flex items-center gap-2 text-xs border border-ink-100 rounded-sm px-2.5 py-1 bg-cream-50"
                  >
                    <span
                      className="h-3 w-3 rounded-sm"
                      style={{ backgroundColor: li.clothing_item.dominant_color || '#ccc' }}
                    />
                    {li.clothing_item.name || li.clothing_item.category}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
