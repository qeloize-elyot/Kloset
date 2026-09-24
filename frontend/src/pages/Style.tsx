import { useEffect, useState } from 'react'
import api from '../lib/api'
import type { ClothingItem } from '../lib/types'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'

interface Evaluation {
  score: number
  verdict: string
  pros: string[]
  cons: string[]
  suggestions: string[]
}

export function Style() {
  const [items, setItems] = useState<ClothingItem[]>([])
  const [selected, setSelected] = useState<number[]>([])
  const [occasion, setOccasion] = useState('')
  const [temperature, setTemperature] = useState('')
  const [loading, setLoading] = useState(true)
  const [evaluating, setEvaluating] = useState(false)
  const [result, setResult] = useState<Evaluation | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get<ClothingItem[]>('/clothing')
        setItems(data)
      } catch {
        // silencioso
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const toggle = (id: number) => {
    setResult(null)
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const evaluate = async () => {
    if (selected.length < 1) return
    setEvaluating(true)
    setError('')
    setResult(null)
    try {
      const { data } = await api.post<Evaluation>('/looks/evaluate', {
        clothing_item_ids: selected,
        occasion: occasion || null,
        temperature: temperature ? parseFloat(temperature) : null,
      })
      setResult(data)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(
        typeof msg === 'string'
          ? msg
          : 'Nao foi possivel avaliar. Configure GROQ_API_KEY no backend.'
      )
    } finally {
      setEvaluating(false)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-5 py-12">
        <p className="text-sm text-ink-500">Carregando peças…</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <div className="max-w-2xl mb-10">
        <h1 className="font-display text-3xl text-ink-900 mb-2">Montar e avaliar</h1>
        <p className="text-sm text-ink-500 leading-relaxed">
          Selecione as peças que você usaria juntas. A IA devolve nota, veredicto e
          sugestões — sem bajulação. Requer chave Groq no servidor.
        </p>
      </div>

      {items.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-ink-600 mb-4">Cadastre peças no guarda-roupa primeiro.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-10">
            {items.map((item) => {
              const active = selected.includes(item.id)
              const img = item.image_clean || item.image_front
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggle(item.id)}
                  className={`card overflow-hidden text-left transition-all ${
                    active ? 'ring-2 ring-ink-900 border-ink-900' : 'hover:border-ink-300'
                  }`}
                >
                  <div
                    className="aspect-[3/4] flex items-center justify-center"
                    style={{
                      backgroundColor: img ? undefined : item.dominant_color || '#e8e4de',
                      backgroundImage: img
                        ? 'repeating-conic-gradient(#e8e4de 0% 25%, #fff 0% 50%)'
                        : undefined,
                      backgroundSize: img ? '12px 12px' : undefined,
                    }}
                  >
                    {img ? (
                      <img src={img} alt="" className="h-full w-full object-contain" />
                    ) : (
                      <span className="text-[10px] uppercase tracking-wider text-white/80 mix-blend-difference px-2 text-center">
                        {item.category}
                      </span>
                    )}
                  </div>
                  <div className="p-2.5">
                    <p className="text-xs font-medium text-ink-900 truncate">
                      {item.name || item.category}
                    </p>
                    <p className="text-[10px] text-ink-400 capitalize">{item.category}</p>
                  </div>
                </button>
              )
            })}
          </div>

          <div className="card p-6 max-w-xl space-y-4 mb-10">
            <p className="text-sm text-ink-600">
              {selected.length === 0
                ? 'Nenhuma peça selecionada'
                : `${selected.length} peça${selected.length > 1 ? 's' : ''} selecionada${selected.length > 1 ? 's' : ''}`}
            </p>
            <Input
              label="Ocasião (opcional)"
              value={occasion}
              onChange={(e) => setOccasion(e.target.value)}
              placeholder="Trabalho, encontro, casual…"
            />
            <Input
              label="Temperatura °C (opcional)"
              type="number"
              value={temperature}
              onChange={(e) => setTemperature(e.target.value)}
              placeholder="18"
            />
            <Button
              onClick={evaluate}
              disabled={evaluating || selected.length < 1}
            >
              {evaluating ? 'Avaliando…' : 'Perguntar à IA se está bom'}
            </Button>
          </div>

          {error && <p className="text-sm text-red-600 mb-8">{error}</p>}

          {result && (
            <div className="card p-6 max-w-xl space-y-5">
              <div className="flex items-end gap-4">
                <div>
                  <p className="text-xs uppercase tracking-wider text-ink-400 mb-1">Nota</p>
                  <p className="font-display text-5xl text-ink-900">
                    {Math.round(Number(result.score))}
                    <span className="text-2xl text-ink-400">/10</span>
                  </p>
                </div>
                <p className="text-lg text-ink-800 pb-2">{result.verdict}</p>
              </div>
              {result.pros?.length > 0 && (
                <div>
                  <p className="text-xs uppercase tracking-wider text-ink-400 mb-2">O que funciona</p>
                  <ul className="text-sm text-ink-700 space-y-1 list-disc list-inside">
                    {result.pros.map((p, i) => (
                      <li key={i}>{p}</li>
                    ))}
                  </ul>
                </div>
              )}
              {result.cons?.length > 0 && (
                <div>
                  <p className="text-xs uppercase tracking-wider text-ink-400 mb-2">Problemas</p>
                  <ul className="text-sm text-ink-700 space-y-1 list-disc list-inside">
                    {result.cons.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </div>
              )}
              {result.suggestions?.length > 0 && (
                <div>
                  <p className="text-xs uppercase tracking-wider text-ink-400 mb-2">Sugestões</p>
                  <ul className="text-sm text-ink-700 space-y-1 list-disc list-inside">
                    {result.suggestions.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
