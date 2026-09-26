import { FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../lib/api'
import { useAuthStore } from '../lib/store'
import type { TokenResponse } from '../lib/types'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'

export function Register() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (password.length < 6) {
      setError('A senha precisa ter pelo menos 6 caracteres.')
      return
    }
    setLoading(true)
    try {
      const { data } = await api.post<TokenResponse>('/auth/register', {
        email,
        password,
        full_name: fullName || null,
      })
      setAuth(data.user, data.access_token)
      navigate('/wardrobe')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(typeof msg === 'string' ? msg : 'Não foi possível criar a conta. Tente outro e-mail.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-md px-5 py-16 sm:py-24">
      <p className="editorial-kicker mb-3">Começar</p>
      <h1 className="font-display text-4xl text-ink-950 mb-2">Criar conta</h1>
      <p className="text-sm text-ink-500 mb-10">
        Já tem conta?{' '}
        <Link to="/login" className="text-ink-800 underline underline-offset-4 decoration-ink-200">
          Entrar
        </Link>
      </p>

      <form onSubmit={handleSubmit} className="card p-6 sm:p-8 space-y-5">
        <Input
          label="Nome (opcional)"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Como prefere ser chamada"
        />
        <Input
          label="E-mail"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          label="Senha"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          placeholder="Mínimo 6 caracteres"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Criando…' : 'Criar conta'}
        </Button>
      </form>
    </div>
  )
}
