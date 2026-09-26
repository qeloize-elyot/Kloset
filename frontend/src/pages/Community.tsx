import { FormEvent, useEffect, useRef, useState } from 'react'
import api from '../lib/api'
import { fileToDataUrl } from '../lib/image'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { useAuthStore } from '../lib/store'

interface RefPost {
  id: number
  author_id: number
  author_name: string | null
  title: string
  caption: string | null
  occasion: string | null
  climate: string | null
  image: string
  likes_count: number
  created_at: string
}

const CLIMATES = ['frio', 'ameno', 'calor', 'chuva', 'vento']

export function Community() {
  const user = useAuthStore((s) => s.user)
  const [posts, setPosts] = useState<RefPost[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [caption, setCaption] = useState('')
  const [occasion, setOccasion] = useState('')
  const [climate, setClimate] = useState('ameno')
  const [image, setImage] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const load = async () => {
    try {
      const { data } = await api.get<RefPost[]>('/references')
      setPosts(data)
    } catch {
      setPosts([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const onFile = async (file?: File) => {
    if (!file) return
    const dataUrl = await fileToDataUrl(file, 900, 0.82)
    setImage(dataUrl)
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!image || !title.trim()) return
    setSaving(true)
    setError('')
    try {
      await api.post('/references', {
        title: title.trim(),
        caption: caption.trim() || null,
        occasion: occasion.trim() || null,
        climate,
        image,
      })
      setTitle('')
      setCaption('')
      setOccasion('')
      setImage(null)
      setShowForm(false)
      await load()
    } catch {
      setError('Não foi possível publicar. Tente uma foto menor.')
    } finally {
      setSaving(false)
    }
  }

  const like = async (id: number) => {
    try {
      const { data } = await api.post<{ likes_count: number }>(`/references/${id}/like`)
      setPosts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, likes_count: data.likes_count } : p))
      )
    } catch {
      // ok
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
        <div className="max-w-xl">
          <p className="editorial-kicker mb-2">Comunidade</p>
          <h1 className="font-display text-4xl text-ink-950 mb-2">Referências</h1>
          <p className="text-sm text-ink-500 leading-relaxed">
            Looks reais que as pessoas montaram. Publique o seu para inspirar —
            e salve ideias para o seu closet.
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancelar' : 'Postar look'}
        </Button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="card p-6 max-w-xl mb-12 space-y-4">
          <div>
            <p className="label">Foto do look</p>
            <Button type="button" variant="secondary" onClick={() => fileRef.current?.click()}>
              Escolher da galeria
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => void onFile(e.target.files?.[0])}
            />
            {image && (
              <img src={image} alt="" className="mt-3 max-h-64 rounded-sm object-contain border border-ink-100" />
            )}
          </div>
          <Input label="Título" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Ex: Jeans + blazer no escritório" />
          <Input label="Legenda (opcional)" value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="O que funcionou nesse look…" />
          <Input label="Ocasião (opcional)" value={occasion} onChange={(e) => setOccasion(e.target.value)} />
          <div>
            <p className="label">Clima do dia</p>
            <div className="flex flex-wrap gap-2">
              {CLIMATES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setClimate(c)}
                  className={`px-3 py-1.5 text-xs rounded-sm border capitalize ${
                    climate === c
                      ? 'border-ink-900 bg-ink-950 text-cream-50'
                      : 'border-ink-200'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" disabled={saving || !image || !title.trim()}>
            {saving ? 'Publicando…' : 'Publicar referência'}
          </Button>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-ink-500">Carregando…</p>
      ) : posts.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="font-display text-2xl text-ink-950 mb-2">Nada por aqui ainda</p>
          <p className="text-sm text-ink-500 mb-6">Seja a primeira pessoa a postar um look de referência.</p>
          <Button onClick={() => setShowForm(true)}>Postar look</Button>
        </div>
      ) : (
        <div className="masonry">
          {posts.map((post) => (
            <article key={post.id} className="masonry-item card-lift overflow-hidden">
              <div className="bg-ink-50">
                <img src={post.image} alt="" className="w-full object-cover max-h-[28rem]" />
              </div>
              <div className="p-4">
                <p className="text-[10px] uppercase tracking-[0.16em] text-accent mb-1">
                  {post.author_name}
                  {post.climate ? ` · ${post.climate}` : ''}
                </p>
                <h3 className="font-display text-xl text-ink-950 leading-snug mb-1">{post.title}</h3>
                {post.caption && (
                  <p className="text-xs text-ink-500 leading-relaxed mb-3">{post.caption}</p>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-ink-400">
                    {post.occasion || '—'}
                  </span>
                  <button
                    type="button"
                    onClick={() => void like(post.id)}
                    className="text-xs text-ink-500 hover:text-accent transition-colors"
                  >
                    Curtir · {post.likes_count}
                  </button>
                </div>
                {user && post.author_id === user.id && (
                  <p className="text-[10px] text-ink-300 mt-2">Seu post</p>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
