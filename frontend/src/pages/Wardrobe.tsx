import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
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

const CATEGORY_GROUPS: { id: string; label: string; cats: string[] }[] = [
  { id: 'all', label: 'Todas', cats: [] },
  { id: 'tops', label: 'Tops', cats: ['camiseta', 'camisa', 'blusa', 'regata', 'moletom', 'sueter'] },
  { id: 'bottoms', label: 'Calças e saias', cats: ['calca', 'shorts', 'saia', 'bermuda'] },
  { id: 'calca', label: 'Só calças', cats: ['calca'] },
  { id: 'saia', label: 'Só saias', cats: ['saia'] },
  { id: 'shorts', label: 'Shorts / bermuda', cats: ['shorts', 'bermuda'] },
  { id: 'vestido', label: 'Vestidos', cats: ['vestido'] },
  { id: 'outer', label: 'Casacos', cats: ['jaqueta', 'casaco', 'blazer', 'sobretudo'] },
  { id: 'shoes', label: 'Calçados', cats: ['tenis', 'sapato', 'sandalia', 'bota', 'chinelo'] },
  { id: 'other', label: 'Outros', cats: ['macacao', 'acessorio'] },
]

const COLOR_FILTERS: { id: string; label: string; match: (hex: string | null) => boolean }[] = [
  { id: 'all', label: 'Todas as cores', match: () => true },
  {
    id: 'rosa',
    label: 'Rosa',
    match: (hex) => inHue(hex, 320, 360) || inHue(hex, 0, 20),
  },
  { id: 'vermelho', label: 'Vermelho', match: (hex) => inHue(hex, 350, 360) || inHue(hex, 0, 15) },
  { id: 'laranja', label: 'Laranja', match: (hex) => inHue(hex, 15, 40) },
  { id: 'amarelo', label: 'Amarelo', match: (hex) => inHue(hex, 40, 70) },
  { id: 'verde', label: 'Verde', match: (hex) => inHue(hex, 70, 160) },
  { id: 'azul', label: 'Azul', match: (hex) => inHue(hex, 160, 250) },
  { id: 'roxo', label: 'Roxo', match: (hex) => inHue(hex, 250, 320) },
  { id: 'marrom', label: 'Marrom', match: (hex) => isBrown(hex) },
  { id: 'neutro', label: 'Preto / branco / cinza', match: (hex) => isNeutral(hex) },
]

function hexToHsv(hex: string | null): { h: number; s: number; v: number } | null {
  if (!hex || !hex.startsWith('#') || hex.length < 7) return null
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const d = max - min
  let h = 0
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6
    else if (max === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
    h *= 60
    if (h < 0) h += 360
  }
  const s = max === 0 ? 0 : d / max
  return { h, s, v: max }
}

function inHue(hex: string | null, from: number, to: number): boolean {
  const hsv = hexToHsv(hex)
  if (!hsv || hsv.s < 0.12) return false
  if (from <= to) return hsv.h >= from && hsv.h < to
  return hsv.h >= from || hsv.h < to
}

function isNeutral(hex: string | null): boolean {
  const hsv = hexToHsv(hex)
  if (!hsv) return !hex
  return hsv.s < 0.12 || hsv.v < 0.12
}

function isBrown(hex: string | null): boolean {
  const hsv = hexToHsv(hex)
  if (!hsv) return false
  return hsv.h >= 15 && hsv.h < 45 && hsv.s > 0.15 && hsv.v < 0.65
}

const LENGTH_OPTIONS = [
  { id: 'all', label: 'Qualquer comprimento' },
  { id: 'curto', label: 'Curto' },
  { id: 'midi', label: 'Midi' },
  { id: 'longo', label: 'Longo' },
]

export function Wardrobe() {
  const [items, setItems] = useState<ClothingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [processingBg, setProcessingBg] = useState(false)

  const [filterGroup, setFilterGroup] = useState('all')
  const [filterColor, setFilterColor] = useState('all')
  const [filterPattern, setFilterPattern] = useState('all')
  const [filterLength, setFilterLength] = useState('all')
  const [search, setSearch] = useState('')

  const [name, setName] = useState('')
  const [category, setCategory] = useState('camiseta')
  const [subcategory, setSubcategory] = useState('')
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

  const filtered = useMemo(() => {
    const group = CATEGORY_GROUPS.find((g) => g.id === filterGroup)
    const colorFn = COLOR_FILTERS.find((c) => c.id === filterColor)?.match ?? (() => true)

    return items.filter((item) => {
      const cat = (item.category || '').toLowerCase()

      if (group && group.id !== 'all' && group.cats.length > 0) {
        if (!group.cats.includes(cat)) return false
      }

      if (!colorFn(item.dominant_color)) return false

      if (filterPattern !== 'all') {
        const p = (item.pattern || 'lisa').toLowerCase()
        if (p !== filterPattern) return false
      }

      if (filterLength !== 'all') {
        const sub = (item.subcategory || '').toLowerCase()
        const nameL = (item.name || '').toLowerCase()
        const hit =
          sub.includes(filterLength) ||
          nameL.includes(filterLength) ||
          (filterLength === 'longo' && (sub.includes('long') || nameL.includes('long')))
        if (!hit) return false
      }

      if (search.trim()) {
        const q = search.trim().toLowerCase()
        const blob = [item.name, item.category, item.subcategory, item.fabric, item.pattern]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        if (!blob.includes(q)) return false
      }

      return true
    })
  }, [items, filterGroup, filterColor, filterPattern, filterLength, search])

  const countsByGroup = useMemo(() => {
    const map: Record<string, number> = { all: items.length }
    for (const g of CATEGORY_GROUPS) {
      if (g.id === 'all') continue
      map[g.id] = items.filter((i) => g.cats.includes((i.category || '').toLowerCase())).length
    }
    return map
  }, [items])

  const onPickFile = async (file: File | undefined) => {
    if (!file) return
    setPhotoError('')
    try {
      const dataUrl = await fileToDataUrl(file)
      setImageFront(dataUrl)
      setImageClean(null)
    } catch {
      setPhotoError('Não foi possível ler a imagem.')
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
      setPhotoError('Falha ao remover o fundo. Você ainda pode salvar a foto original.')
    } finally {
      setProcessingBg(false)
    }
  }

  const resetForm = () => {
    setName('')
    setFabric('')
    setSubcategory('')
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
        subcategory: subcategory || null,
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
      alert('Erro ao salvar a peça.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Remover esta peça do guarda-roupa?')) return
    try {
      await api.delete(`/clothing/${id}`)
      setItems((prev) => prev.filter((i) => i.id !== id))
    } catch {
      alert('Erro ao remover.')
    }
  }

  const clearFilters = () => {
    setFilterGroup('all')
    setFilterColor('all')
    setFilterPattern('all')
    setFilterLength('all')
    setSearch('')
  }

  const hasActiveFilters =
    filterGroup !== 'all' ||
    filterColor !== 'all' ||
    filterPattern !== 'all' ||
    filterLength !== 'all' ||
    search.trim() !== ''

  const preview = imageClean || imageFront
  const showLengthFilter = filterGroup === 'vestido' || filterGroup === 'saia' || category === 'vestido'

  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="editorial-kicker mb-1">Inventário</p>
          <h1 className="font-display text-3xl text-ink-950">Guarda-roupa</h1>
          <p className="text-sm text-ink-500 mt-1">
            {filtered.length}
            {hasActiveFilters ? ` de ${items.length}` : ''}{' '}
            {filtered.length === 1 ? 'peça' : 'peças'}
            {hasActiveFilters ? ' no filtro' : ' cadastradas'}
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancelar' : 'Adicionar peça'}
        </Button>
      </div>

      {/* Filtros */}
      {!showForm && items.length > 0 && (
        <div className="card p-4 mb-8 space-y-4">
          <div className="flex flex-wrap gap-2">
            {CATEGORY_GROUPS.map((g) => {
              const count = countsByGroup[g.id] ?? 0
              if (g.id !== 'all' && count === 0) return null
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setFilterGroup(g.id)}
                  className={`px-3 py-1.5 text-xs rounded-sm border transition-colors ${
                    filterGroup === g.id
                      ? 'border-ink-900 bg-ink-950 text-cream-50'
                      : 'border-ink-200 text-ink-600 hover:border-ink-400'
                  }`}
                >
                  {g.label}
                  {g.id !== 'all' && (
                    <span className={`ml-1.5 ${filterGroup === g.id ? 'text-cream-300' : 'text-ink-400'}`}>
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="label">Cor</label>
              <select
                className="input"
                value={filterColor}
                onChange={(e) => setFilterColor(e.target.value)}
              >
                {COLOR_FILTERS.map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Estampa</label>
              <select
                className="input"
                value={filterPattern}
                onChange={(e) => setFilterPattern(e.target.value)}
              >
                <option value="all">Todas</option>
                <option value="lisa">Lisa</option>
                <option value="listrada">Listrada</option>
                <option value="xadrez">Xadrez</option>
                <option value="floral">Floral</option>
                <option value="poa">Poá</option>
                <option value="outra">Outra</option>
              </select>
            </div>
            <div>
              <label className="label">Comprimento</label>
              <select
                className="input"
                value={filterLength}
                onChange={(e) => setFilterLength(e.target.value)}
                disabled={!showLengthFilter && filterLength === 'all'}
              >
                {LENGTH_OPTIONS.map((o) => (
                  <option key={o.id} value={o.id}>{o.label}</option>
                ))}
              </select>
              <p className="text-[10px] text-ink-400 mt-1">
                Útil em vestidos e saias (use o campo comprimento ao cadastrar)
              </p>
            </div>
            <div>
              <label className="label">Buscar</label>
              <input
                className="input"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Nome, tecido…"
              />
            </div>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-xs text-ink-500 underline underline-offset-2 hover:text-ink-800"
            >
              Limpar filtros
            </button>
          )}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleCreate} className="card p-6 mb-10 space-y-6">
          <div>
            <p className="label mb-2">Foto da peça</p>
            <div className="flex flex-wrap gap-3 mb-4">
              <Button type="button" variant="secondary" onClick={() => galleryRef.current?.click()}>
                Escolher da galeria
              </Button>
              <Button type="button" variant="secondary" onClick={() => cameraRef.current?.click()}>
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
                <img src={preview} alt="Preview" className="h-full w-full object-contain" />
                {imageClean && (
                  <span className="absolute top-2 left-2 text-[10px] uppercase tracking-wider bg-ink-900 text-cream-50 px-2 py-1 rounded-sm">
                    Sem fundo
                  </span>
                )}
              </div>
            )}

            {photoError && <p className="text-sm text-red-600 mt-2">{photoError}</p>}
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            <Input
              label="Nome (opcional)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Vestido longo amarelo"
            />
            <div>
              <label className="label">Categoria</label>
              <select
                className="input"
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value)
                  setSubcategory('')
                }}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {(category === 'vestido' || category === 'saia') && (
              <div>
                <label className="label">Comprimento</label>
                <select
                  className="input"
                  value={subcategory}
                  onChange={(e) => setSubcategory(e.target.value)}
                >
                  <option value="">Não especificado</option>
                  <option value="curto">Curto</option>
                  <option value="midi">Midi</option>
                  <option value="longo">Longo</option>
                </select>
              </div>
            )}

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
              placeholder="algodão, linho, jeans…"
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
                <option value="poa">Poá</option>
                <option value="outra">Outra</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={saving || processingBg}>
              {saving ? 'Salvando…' : 'Salvar peça'}
            </Button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-ink-500">Carregando…</p>
      ) : items.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-ink-600 mb-4">Seu guarda-roupa está vazio.</p>
          <Button onClick={() => setShowForm(true)}>Adicionar primeira peça</Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-ink-600 mb-2">Nenhuma peça com esse filtro.</p>
          <p className="text-sm text-ink-400 mb-4">
            Ex.: vestidos longos amarelos só aparecem se você cadastrou cor + comprimento.
          </p>
          <Button variant="secondary" onClick={clearFilters}>Limpar filtros</Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {filtered.map((item) => {
            const img = item.image_clean || item.image_front
            return (
              <div key={item.id} className="card overflow-hidden group">
                <div
                  className="aspect-[3/4] flex items-center justify-center relative"
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
                    <span className="text-xs uppercase tracking-wider text-white/80 mix-blend-difference">
                      {item.category}
                    </span>
                  )}
                  {item.dominant_color && (
                    <span
                      className="absolute bottom-2 right-2 h-4 w-4 rounded-full border border-white/80 shadow-sm"
                      style={{ backgroundColor: item.dominant_color }}
                      title={item.dominant_color}
                    />
                  )}
                </div>
                <div className="p-3">
                  <p className="text-sm font-medium text-ink-900 truncate">
                    {item.name || item.category}
                  </p>
                  <p className="text-xs text-ink-500 mt-0.5 capitalize">
                    {item.category}
                    {item.subcategory ? ` · ${item.subcategory}` : ''}
                    {item.pattern ? ` · ${item.pattern}` : ''}
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
