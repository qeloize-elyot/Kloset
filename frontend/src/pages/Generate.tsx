import { FormEvent, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../lib/api'
import type { Look } from '../lib/types'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'

export function Generate() {
  const [occasion, setOccasion] = useState('')
  const [temperature, setTemperature] = useState('')
  const [loading, setLoading] = useState(false)
  const [looks, setLooks] = useState<Look[]>([])
  const [error, setError] = useState('')

  const handleGenerate = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    setLooks([])
    try {
      const { data } = await api.post<Look[]>('/looks/generate', {
        occasion,
        temperature: temperature ? parseFloat(temperature) : null,
        count: 3,
      })
      setLooks(data)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(msg || 'Não foi possível gerar os looks. Adicione mais peças ao guarda-roupa.')
    } finally {
      setLoading(false)
    }
  }

  const sendFeedback = async (lookId: number, rating: 'like' | 'dislike' | 'used') => {
    try {
      await api.post(`/looks/${lookId}/feedback`, { rating })
    } catch {
      // silencioso
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <div className="max-w-xl mb-12">
        <h1 className="font-display text-3xl text-ink-900 mb-2">Gerar look</h1>
        <p className="text-sm text-ink-500">
          Informe a ocasião e, se quiser, a temperatura. O sistema filtra as peças adequadas e monta combinações.
        </p>
      </div>

      <form onSubmit={handleGenerate} className="card p-6 max-w-xl mb-12 space-y-5">
        <Input
          label="Ocasião"
          value={occasion}
          onChange={(e) => setOccasion(e.target.value)}
          placeholder="Encontro, trabalho, casual, viagem…"
          required
        />
        <Input
          label="Temperatura (°C) — opcional"
          type="number"
          value={temperature}
          onChange={(e) => setTemperature(e.target.value)}
          placeholder="Ex: 18"
        />
        <Button type="submit" disabled={loading || !occasion.trim()}>
          {loading ? 'Montando…' : 'Montar looks'}
        </Button>
      </form>

      {error && (
        <p className="text-sm text-red-600 mb-8">{error}</p>
      )}

      {looks.length > 0 && (
        <div className="space-y-10">
          <h2 className="font-display text-2xl text-ink-900">Sugestões</h2>
          {looks.map((look) => (
            <article key={look.id} className="card p-6">
              <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
                <div>
                  <h3 className="font-display text-xl text-ink-900">{look.title}</h3>
                  {look.rationale && (
                    <p className="text-sm text-ink-500 mt-1 max-w-2xl leading-relaxed">
                      {look.rationale}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={() => sendFeedback(look.id, 'like')}>
                    Gostei
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => sendFeedback(look.id, 'dislike')}>
                    Não usaria
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => sendFeedback(look.id, 'used')}>
                    Usei
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                {look.items.map((li) => (
                  <div
                    key={li.id}
                    className="flex items-center gap-3 border border-ink-100 rounded-sm px-3 py-2 bg-cream-50"
                  >
                    <div
                      className="h-8 w-8 rounded-sm shrink-0"
                      style={{ backgroundColor: li.clothing_item.dominant_color || '#ccc' }}
                    />
                    <div>
                      <p className="text-sm font-medium text-ink-900 capitalize">
                        {li.clothing_item.name || li.clothing_item.category}
                      </p>
                      <p className="text-xs text-ink-500 capitalize">
                        {li.clothing_item.category}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}

      {!loading && looks.length === 0 && !error && (
        <p className="text-sm text-ink-400">
          Ainda não gerou nenhum look. Preencha o formulário acima ou{' '}
          <Link to="/wardrobe" className="underline underline-offset-2 text-ink-700">
            adicione peças
          </Link>
          .
        </p>
      )}
    </div>
  )
}
