import { create } from 'zustand'
import type { User } from './types'

interface AuthState {
  user: User | null
  token: string | null
  setAuth: (user: User, token: string) => void
  logout: () => void
  hydrate: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,

  setAuth: (user, token) => {
    localStorage.setItem('kloset_token', token)
    localStorage.setItem('kloset_user', JSON.stringify(user))
    set({ user, token })
  },

  logout: () => {
    localStorage.removeItem('kloset_token')
    localStorage.removeItem('kloset_user')
    set({ user: null, token: null })
  },

  hydrate: () => {
    const token = localStorage.getItem('kloset_token')
    const userStr = localStorage.getItem('kloset_user')
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr) as User
        set({ user, token })
      } catch {
        localStorage.removeItem('kloset_token')
        localStorage.removeItem('kloset_user')
      }
    }
  },
}))
