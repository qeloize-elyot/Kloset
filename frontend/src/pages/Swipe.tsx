import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../lib/api'
import type { Look } from '../lib/types'
import { Button } from '../components/ui/Button'
import { OutfitCanvas } from '../components/ui/OutfitCanvas'

export function Swipe() {
  const navigate = useNavigate()
  const [looks, setLooks] = useState<Look[]>([])
  const [index, setIndex] = useState(0)
  const [dragX, setDragX] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [done, setDone] = useState(false)
  const [stats, setStats] = useState({ like: 0, dislike: 0 })
  const startX = useRef(0)

  useEffect(() => {
    const raw = sessionStorage.getItem('kloset_swipe_looks')
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as Look[]
        setLooks(parsed)
        return
      } catch {
        // fall through
      }
    }
    api
      .get<Look[]>('/looks')
      .then(({ data }) => {
        if (data.length) setLooks(data.slice(0, 8))
        else setDone(true)
      })
      .catch(() => setDone(true))
  }, [])

  const current = looks[index]

  const decide = async (rating: 'like' | 'dislike') => {
    if (!current) return
    try {
      await api.post(`/looks/${current.id}/feedback`, { rating })
    } catch {
      // ok
    }
    setStats((s) => ({ ...s, [rating]: s[rating] + 1 }))
    setDragX(0)
    if (index + 1 >= looks.length) {
      setDone(true)
      sessionStorage.removeItem('kloset_swipe_looks')
    } else {
      setIndex((i) => i + 1)
    }
  }

  const onPointerDown = (clientX: number) => {
    setDragging(true)
    startX.current = clientX
  }

  const onPointerMove = (clientX: number) => {
    if (!dragging) return
    setDragX(clientX - startX.current)
  }

  const onPointerUp = () => {
    if (!dragging) return
    setDragging(false)
    if (dragX > 100) void decide('like')
    else if (dragX < -100) void decide('dislike')
    else setDragX(0)
  }

  if (done || (!current && looks.length === 0)) {
    return (
      <div className="mx-auto max-w-lg px-5 py-16 text-center">
        <p className="editorial-kicker mb-2">Pronto</p>
        <h1 className="font-display text-4xl text-ink-950 mb-3">Fim do deck</h1>
        <p className="text-sm text-ink-500 mb-2">
          Gostei: {stats.like} · Passou: {stats.dislike}
        </p>
        <p className="text-sm text-ink-500 mb-8">Seu feedback treina as próximas sugestões.</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button onClick={() => navigate('/generate')}>Gerar de novo</Button>
          <Link to="/feed">
            <Button variant="secondary">Ver feed</Button>
          </Link>
        </div>
      </div>
    )
  }

  if (!current) {
    return (
      <div className="mx-auto max-w-lg px-5 py-16">
        <p className="text-sm text-ink-500">Carregando looks…</p>
      </div>
    )
  }

  const rotation = dragX / 20
  const likeOpacity = Math.min(1, Math.max(0, dragX / 120))
  const nopeOpacity = Math.min(1, Math.max(0, -dragX / 120))

  return (
    <div className="mx-auto max-w-lg px-5 py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="editorial-kicker mb-1">Swipe</p>
          <h1 className="font-display text-3xl text-ink-950">Gostei ou não</h1>
        </div>
        <p className="text-xs text-ink-400">
          {index + 1}/{looks.length}
        </p>
      </div>

      <p className="text-sm text-ink-500 mb-6">
        Arraste para a direita se gostou, esquerda se não. Ou use os botões.
      </p>

      <div
        className="relative select-none touch-none"
        onMouseDown={(e) => onPointerDown(e.clientX)}
        onMouseMove={(e) => onPointerMove(e.clientX)}
        onMouseUp={onPointerUp}
        onMouseLeave={onPointerUp}
        onTouchStart={(e) => onPointerDown(e.touches[0].clientX)}
        onTouchMove={(e) => onPointerMove(e.touches[0].clientX)}
        onTouchEnd={onPointerUp}
      >
        <article
          className="card overflow-hidden cursor-grab active:cursor-grabbing"
          style={{
            transform: `translateX(${dragX}px) rotate(${rotation}deg)`,
            transition: dragging ? 'none' : 'transform 0.25s ease',
          }}
        >
          <div
            className="absolute top-4 left-4 z-10 px-3 py-1 border-2 border-emerald-700/80 text-emerald-800 text-xs font-semibold uppercase tracking-wider rounded-sm bg-white/95"
            style={{ opacity: likeOpacity }}
          >
            Gostei
          </div>
          <div
            className="absolute top-4 right-4 z-10 px-3 py-1 border-2 border-red-500/80 text-red-600 text-xs font-semibold uppercase tracking-wider rounded-sm bg-white/95"
            style={{ opacity: nopeOpacity }}
          >
            Passar
          </div>

          <OutfitCanvas
            pieces={current.items.map((li) => ({
              id: li.clothing_item.id,
              name: li.clothing_item.name,
              category: li.clothing_item.category,
              dominant_color: li.clothing_item.dominant_color,
              image: li.clothing_item.image_clean || li.clothing_item.image_front,
            }))}
          />

          <div className="p-5 border-t border-ink-50">
            <h2 className="font-display text-2xl text-ink-950 mb-1">{current.title}</h2>
            {(current.weather_condition || current.temperature != null) && (
              <p className="text-xs text-ink-400 mb-2 uppercase tracking-wider">
                {current.temperature != null ? `${Math.round(current.temperature)}°C` : ''}
                {current.weather_condition
                  ? `${current.temperature != null ? ' · ' : ''}${current.weather_condition}`
                  : ''}
              </p>
            )}
            {current.rationale && (
              <p className="text-sm text-ink-500 leading-relaxed">{current.rationale}</p>
            )}
          </div>
        </article>
      </div>

      <div className="flex justify-center gap-6 mt-8">
        <button
          type="button"
          onClick={() => void decide('dislike')}
          className="h-14 w-14 rounded-full border border-ink-200 bg-white text-ink-600 text-[11px] font-medium hover:border-red-300 hover:text-red-600 transition-colors shadow-sm"
        >
          Passar
        </button>
        <button
          type="button"
          onClick={() => void decide('like')}
          className="h-14 w-14 rounded-full bg-ink-950 text-cream-50 text-[11px] font-medium hover:bg-ink-800 transition-colors shadow-sm"
        >
          Gostei
        </button>
      </div>
    </div>
  )
}
