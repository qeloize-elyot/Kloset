import { FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../lib/api'
import { useAuthStore } from '../lib/store'
import type { TokenResponse, User } from '../lib/types'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'

export function Register() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const setAuth = useAuthStore((s) => s.setAuth)
  const navigate = useNavigate()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.post<User>('/auth/register', {
        email,
        password,
        full_name: fullName || null,
      })

      // Login automático após registro
      const form = new URLSearchParams()
      form.append('username', email)
      form.append('password', password)
      const { data } = await api.post<TokenResponse>('/auth/login', form, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })
      setAuth(data.user, data.access_token)
      navigate('/wardrobe')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(msg || 'Não foi possível criar a conta.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-md px-5 py-20">
      <h1 className="font-display text-3xl text-ink-900 mb-2">Criar conta</h1>
      <p className="text-sm text-ink-500 mb-10">
        Comece a organizar seu guarda-roupa.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Nome"
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          autoComplete="name"
        />
        <Input
          label="E-mail"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
        <Input
          label="Senha"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          autoComplete="new-password"
        />

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Criando…' : 'Criar conta'}
        </Button>
      </form>

      <p className="mt-8 text-sm text-ink-500 text-center">
        Já tem conta?{' '}
        <Link to="/login" className="text-ink-900 underline underline-offset-2">
          Entrar
        </Link>
      </p>
    </div>
  )
}
