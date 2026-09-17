import { FormEvent, useEffect, useState } from 'react'
import api from '../lib/api'
import type { ClothingItem } from '../lib/types'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'

const CATEGORIES = [
  'camiseta', 'camisa', 'blusa', 'regata', 'moletom', 'suéter',
  'calça', 'shorts', 'saia', 'bermuda',
  'jaqueta', 'casaco', 'blazer', 'sobretudo',
  'tênis', 'sapato', 'sandália', 'bota', 'chinelo',
  'vestido', 'macacão', 'acessório',
]

export function Wardrobe() {
  const [items, setItems] = useState<ClothingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)

  // Form state
  const [name, setName] = useState('')
  const [category, setCategory] = useState('camiseta')
  const [dominantColor, setDominantColor] = useState('#1a1a1a')
  const [fabric, setFabric] = useState('')
  const [pattern, setPattern] = useState('lisa')

  const loadItems = async () => {
    try {
      const { data } = await api.get<ClothingItem[]>('/clothing')
      setItems(data)
    } catch {
      // silencioso por enquanto
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadItems()
  }, [])

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
      })
      setName('')
      setFabric('')
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

  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <div className="flex items-end justify-between mb-10">
        <div>
          <h1 className="font-display text-3xl text-ink-900">Guarda-roupa</h1>
          <p className="text-sm text-ink-500 mt-1">
            {items.length} {items.length === 1 ? 'peça' : 'peças'} cadastradas
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancelar' : 'Adicionar peça'}
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="card p-6 mb-10 grid sm:grid-cols-2 gap-5">
          <Input
            label="Nome (opcional)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Camiseta básica preta"
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
              <option value="poá">Poá</option>
              <option value="outra">Outra</option>
            </select>
          </div>
          <div className="sm:col-span-2 flex justify-end">
            <Button type="submit" disabled={saving}>
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
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {items.map((item) => (
            <div key={item.id} className="card overflow-hidden group">
              <div
                className="aspect-[3/4] flex items-center justify-center"
                style={{ backgroundColor: item.dominant_color || '#e8e4de' }}
              >
                <span className="text-xs uppercase tracking-wider text-white/80 mix-blend-difference">
                  {item.category}
                </span>
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
          ))}
        </div>
      )}
    </div>
  )
}
