import { FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../lib/api'
import type { Look } from '../lib/types'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'

const CLIMATES = [
  { id: 'frio', label: 'Frio', hint: '~12°C' },
  { id: 'ameno', label: 'Ameno', hint: '~20°C' },
  { id: 'calor', label: 'Calor', hint: '~30°C' },
  { id: 'chuva', label: 'Chuva', hint: 'úmido' },
  { id: 'vento', label: 'Vento', hint: 'fresco' },
]

export function Generate() {
  const navigate = useNavigate()
  const [occasion, setOccasion] = useState('')
  const [climate, setClimate] = useState('ameno')
  const [temperature, setTemperature] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleGenerate = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await api.post<Look[]>('/looks/generate', {
        occasion,
        climate,
        temperature: temperature ? parseFloat(temperature) : null,
        count: 6,
      })
      // vai direto pro swipe com os looks gerados
      sessionStorage.setItem('kloset_swipe_looks', JSON.stringify(data))
      navigate('/swipe')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(
        typeof msg === 'string'
          ? msg
          : 'Não foi possível gerar. Adicione mais peças ao guarda-roupa.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <div className="max-w-xl mb-10">
        <p className="editorial-kicker mb-2">Roleta</p>
        <h1 className="font-display text-4xl text-ink-950 mb-2">Gerar looks</h1>
        <p className="text-sm text-ink-500 leading-relaxed">
          Você define a ocasião e como está o clima. Sem cidade, sem localização —
          só o que você sentir lá fora.
        </p>
      </div>

      <form onSubmit={handleGenerate} className="card p-6 max-w-xl space-y-6">
        <Input
          label="Ocasião"
          value={occasion}
          onChange={(e) => setOccasion(e.target.value)}
          placeholder="Trabalho, encontro, casual, viagem…"
          required
        />

        <div>
          <p className="label">Como está o clima?</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {CLIMATES.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setClimate(c.id)}
                className={`rounded-sm border px-3 py-3 text-left transition-colors ${
                  climate === c.id
                    ? 'border-ink-900 bg-ink-950 text-cream-50'
                    : 'border-ink-200 bg-white hover:border-ink-400'
                }`}
              >
                <span className="block text-sm font-medium">{c.label}</span>
                <span
                  className={`text-[11px] ${
                    climate === c.id ? 'text-cream-200' : 'text-ink-400'
                  }`}
                >
                  {c.hint}
                </span>
              </button>
            ))}
          </div>
        </div>

        <Input
          label="Temperatura °C (opcional, se quiser precisar)"
          type="number"
          value={temperature}
          onChange={(e) => setTemperature(e.target.value)}
          placeholder="Ex: 17"
        />

        <Button type="submit" disabled={loading || !occasion.trim()}>
          {loading ? 'Montando…' : 'Gerar e avaliar no swipe'}
        </Button>
      </form>

      {error && <p className="text-sm text-red-600 mt-6">{error}</p>}

      <p className="text-sm text-ink-400 mt-8">
        Ou vá ao{' '}
        <Link to="/wardrobe" className="underline underline-offset-2 text-ink-700">
          guarda-roupa
        </Link>{' '}
        se ainda faltar peça.
      </p>
    </div>
  )
}
