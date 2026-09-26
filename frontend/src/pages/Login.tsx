import { FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../lib/api'
import { useAuthStore } from '../lib/store'
import type { TokenResponse } from '../lib/types'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'

export function Login() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await api.post<TokenResponse>('/auth/login', { email, password })
      setAuth(data.access_token, data.user)
      navigate('/')
    } catch {
      setError('E-mail ou senha incorretos.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-md px-5 py-16 sm:py-24">
      <p className="editorial-kicker mb-3">Conta</p>
      <h1 className="font-display text-4xl text-ink-950 mb-2">Entrar</h1>
      <p className="text-sm text-ink-500 mb-10">
        Sem conta?{' '}
        <Link to="/register" className="text-ink-800 underline underline-offset-4 decoration-ink-200">
          Criar agora
        </Link>
      </p>

      <form onSubmit={handleSubmit} className="card p-6 sm:p-8 space-y-5">
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
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Entrando…' : 'Entrar'}
        </Button>
      </form>
    </div>
  )
}
