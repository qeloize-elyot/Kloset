import { FormEvent, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../lib/api'
import type { Look } from '../lib/types'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'

interface WeatherInfo {
  city: string
  temperature: number
  feels_like?: number
  condition: string
}

export function Generate() {
  const [occasion, setOccasion] = useState('')
  const [city, setCity] = useState('')
  const [temperature, setTemperature] = useState('')
  const [weather, setWeather] = useState<WeatherInfo | null>(null)
  const [loadingWeather, setLoadingWeather] = useState(false)
  const [loading, setLoading] = useState(false)
  const [looks, setLooks] = useState<Look[]>([])
  const [error, setError] = useState('')

  const fetchWeather = async () => {
    if (!city.trim()) return
    setLoadingWeather(true)
    setError('')
    try {
      const { data } = await api.get<WeatherInfo>('/weather', {
        params: { city: city.trim() },
      })
      setWeather(data)
      if (data.temperature != null) {
        setTemperature(String(Math.round(data.temperature)))
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setWeather(null)
      setError(msg || 'Nao foi possivel obter o clima desta cidade.')
    } finally {
      setLoadingWeather(false)
    }
  }

  const handleGenerate = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    setLooks([])
    try {
      const { data } = await api.post<Look[]>('/looks/generate', {
        occasion,
        city: city.trim() || null,
        temperature: temperature ? parseFloat(temperature) : null,
        count: 3,
      })
      setLooks(data)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(msg || 'Nao foi possivel gerar os looks. Adicione mais pecas ao guarda-roupa.')
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
          Informe a ocasiao e a cidade. O clima local e usado para filtrar as pecas.
        </p>
      </div>

      <form onSubmit={handleGenerate} className="card p-6 max-w-xl mb-12 space-y-5">
        <Input
          label="Ocasiao"
          value={occasion}
          onChange={(e) => setOccasion(e.target.value)}
          placeholder="Encontro, trabalho, casual, viagem…"
          required
        />

        <div>
          <label className="label">Cidade</label>
          <div className="flex gap-2">
            <input
              className="input flex-1"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Ex: Curitiba, Sao Paulo, Lisboa"
            />
            <Button
              type="button"
              variant="secondary"
              disabled={loadingWeather || !city.trim()}
              onClick={fetchWeather}
            >
              {loadingWeather ? 'Buscando…' : 'Ver clima'}
            </Button>
          </div>
          {weather && (
            <p className="text-sm text-ink-600 mt-2">
              {weather.city}: <strong>{Math.round(weather.temperature)}°C</strong>
              {weather.condition ? ` · ${weather.condition}` : ''}
              {weather.feels_like != null
                ? ` (sensacao ${Math.round(weather.feels_like)}°C)`
                : ''}
            </p>
          )}
        </div>

        <Input
          label="Temperatura (°C) — preenchida pelo clima ou manual"
          type="number"
          value={temperature}
          onChange={(e) => setTemperature(e.target.value)}
          placeholder="Ex: 18"
        />

        <Button type="submit" disabled={loading || !occasion.trim()}>
          {loading ? 'Montando…' : 'Montar looks'}
        </Button>
      </form>

      {error && <p className="text-sm text-red-600 mb-8">{error}</p>}

      {looks.length > 0 && (
        <div className="space-y-10">
          <h2 className="font-display text-2xl text-ink-900">Sugestoes</h2>
          {looks.map((look) => (
            <article key={look.id} className="card p-6">
              <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
                <div>
                  <h3 className="font-display text-xl text-ink-900">{look.title}</h3>
                  {look.weather_condition && (
                    <p className="text-xs text-ink-400 mt-1 uppercase tracking-wider">
                      {look.temperature != null ? `${Math.round(look.temperature)}°C · ` : ''}
                      {look.weather_condition}
                    </p>
                  )}
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
                    Nao usaria
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
          Ainda nao gerou nenhum look. Preencha o formulario ou{' '}
          <Link to="/wardrobe" className="underline underline-offset-2 text-ink-700">
            adicione pecas
          </Link>
          .
        </p>
      )}
    </div>
  )
}
