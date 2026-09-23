import { FormEvent, useEffect, useRef, useState } from 'react'
import api from '../lib/api'
import type { ClothingItem } from '../lib/types'
import { fileToDataUrl, removeBackground } from '../lib/image'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'

const CATEGORIES = [
  'camiseta', 'camisa', 'blusa', 'regata', 'moletom', 'sueter',
  'calca', 'shorts', 'saia', 'bermuda',
  'jaqueta', 'casaco', 'blazer', 'sobretudo',
  'tenis', 'sapato', 'sandalia', 'bota', 'chinelo',
  'vestido', 'macacao', 'acessorio',
]

export function Wardrobe() {
  const [items, setItems] = useState<ClothingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [processingBg, setProcessingBg] = useState(false)

  const [name, setName] = useState('')
  const [category, setCategory] = useState('camiseta')
  const [dominantColor, setDominantColor] = useState('#1a1a1a')
  const [fabric, setFabric] = useState('')
  const [pattern, setPattern] = useState('lisa')
  const [imageFront, setImageFront] = useState<string | null>(null)
  const [imageClean, setImageClean] = useState<string | null>(null)
  const [photoError, setPhotoError] = useState('')

  const galleryRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)

  const loadItems = async () => {
    try {
      const { data } = await api.get<ClothingItem[]>('/clothing')
      setItems(data)
    } catch {
      // silencioso
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadItems()
  }, [])

  const onPickFile = async (file: File | undefined) => {
    if (!file) return
    setPhotoError('')
    try {
      const dataUrl = await fileToDataUrl(file)
      setImageFront(dataUrl)
      setImageClean(null)
    } catch {
      setPhotoError('Nao foi possivel ler a imagem.')
    }
  }

  const handleRemoveBg = async () => {
    if (!imageFront) return
    setProcessingBg(true)
    setPhotoError('')
    try {
      const clean = await removeBackground(imageFront)
      setImageClean(clean)
    } catch {
      setPhotoError(
        'Falha ao remover o fundo. Voce ainda pode salvar a foto original.'
      )
    } finally {
      setProcessingBg(false)
    }
  }

  const resetForm = () => {
    setName('')
    setFabric('')
    setImageFront(null)
    setImageClean(null)
    setPhotoError('')
    setCategory('camiseta')
    setDominantColor('#1a1a1a')
    setPattern('lisa')
  }

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/clothing', {
        name: name || null,
        category,
        dominant_color: dominantColor,
        fabric: fabric || null,
        pattern,
        styles: ['casual'],
        seasons: ['meia_estacao'],
        image_front: imageFront,
        image_clean: imageClean || imageFront,
      })
      resetForm()
      setShowForm(false)
      await loadItems()
    } catch {
      alert('Erro ao salvar a peca.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Remover esta peca do guarda-roupa?')) return
    try {
      await api.delete(`/clothing/${id}`)
      setItems((prev) => prev.filter((i) => i.id !== id))
    } catch {
      alert('Erro ao remover.')
    }
  }

  const preview = imageClean || imageFront

  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <div className="flex items-end justify-between mb-10">
        <div>
          <h1 className="font-display text-3xl text-ink-900">Guarda-roupa</h1>
          <p className="text-sm text-ink-500 mt-1">
            {items.length} {items.length === 1 ? 'peca' : 'pecas'} cadastradas
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancelar' : 'Adicionar peca'}
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="card p-6 mb-10 space-y-6">
          <div>
            <p className="label mb-2">Foto da peca</p>
            <div className="flex flex-wrap gap-3 mb-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => galleryRef.current?.click()}
              >
                Escolher da galeria
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => cameraRef.current?.click()}
              >
                Tirar foto
              </Button>
              {imageFront && (
                <Button
                  type="button"
                  variant="ghost"
                  disabled={processingBg}
                  onClick={handleRemoveBg}
                >
                  {processingBg ? 'Removendo fundo…' : 'Remover fundo'}
                </Button>
              )}
            </div>

            <input
              ref={galleryRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => onPickFile(e.target.files?.[0])}
            />
            <input
              ref={cameraRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => onPickFile(e.target.files?.[0])}
            />

            {preview && (
              <div className="relative w-full max-w-xs aspect-[3/4] rounded-sm overflow-hidden border border-ink-100 bg-[repeating-conic-gradient(#e8e4de_0%_25%,#fff_0%_50%)] bg-[length:16px_16px]">
                <img
                  src={preview}
                  alt="Preview"
                  className="h-full w-full object-contain"
                />
                {imageClean && (
                  <span className="absolute top-2 left-2 text-[10px] uppercase tracking-wider bg-ink-900 text-cream-50 px-2 py-1 rounded-sm">
                    Sem fundo
                  </span>
                )}
              </div>
            )}

            {photoError && (
              <p className="text-sm text-red-600 mt-2">{photoError}</p>
            )}
            {processingBg && (
              <p className="text-sm text-ink-500 mt-2">
                Processando no aparelho (pode levar alguns segundos na primeira vez)…
              </p>
            )}
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            <Input
              label="Nome (opcional)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Camiseta basica preta"
            />
            <div>
              <label className="label">Categoria</label>
              <select
                className="input"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Cor predominante</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={dominantColor}
                  onChange={(e) => setDominantColor(e.target.value)}
                  className="h-10 w-14 cursor-pointer rounded-sm border border-ink-200"
                />
                <span className="text-sm text-ink-500 font-mono">{dominantColor}</span>
              </div>
            </div>
            <Input
              label="Tecido"
              value={fabric}
              onChange={(e) => setFabric(e.target.value)}
              placeholder="algodao, linho, jeans…"
            />
            <div>
              <label className="label">Estampa</label>
              <select
                className="input"
                value={pattern}
                onChange={(e) => setPattern(e.target.value)}
              >
                <option value="lisa">Lisa</option>
                <option value="listrada">Listrada</option>
                <option value="xadrez">Xadrez</option>
                <option value="floral">Floral</option>
                <option value="poa">Poa</option>
                <option value="outra">Outra</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={saving || processingBg}>
              {saving ? 'Salvando…' : 'Salvar peca'}
            </Button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-ink-500">Carregando…</p>
      ) : items.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-ink-600 mb-4">Seu guarda-roupa esta vazio.</p>
          <Button onClick={() => setShowForm(true)}>Adicionar primeira peca</Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {items.map((item) => {
            const img = item.image_clean || item.image_front
            return (
              <div key={item.id} className="card overflow-hidden group">
                <div
                  className="aspect-[3/4] flex items-center justify-center relative"
                  style={{
                    backgroundColor: img ? undefined : (item.dominant_color || '#e8e4de'),
                    backgroundImage: img
                      ? 'repeating-conic-gradient(#e8e4de 0% 25%, #fff 0% 50%)'
                      : undefined,
                    backgroundSize: img ? '12px 12px' : undefined,
                  }}
                >
                  {img ? (
                    <img src={img} alt="" className="h-full w-full object-contain" />
                  ) : (
                    <span className="text-xs uppercase tracking-wider text-white/80 mix-blend-difference">
                      {item.category}
                    </span>
                  )}
                </div>
                <div className="p-3">
                  <p className="text-sm font-medium text-ink-900 truncate">
                    {item.name || item.category}
                  </p>
                  <p className="text-xs text-ink-500 mt-0.5 capitalize">
                    {item.pattern || '—'} · {item.fabric || '—'}
                  </p>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="mt-2 text-xs text-ink-400 hover:text-ink-700 transition-colors"
                  >
                    Remover
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
