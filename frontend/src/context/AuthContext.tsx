import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react'
import { api } from '../api/client'

interface User {
  id: string
  username: string
  role: string
}

interface AuthContextValue {
  user: User | null
  isLoading: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      setIsLoading(false)
      return
    }
    api
      .get<User>('/auth/me')
      .then(setUser)
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setIsLoading(false))
  }, [])

  async function login(username: string, password: string) {
    const { token } = await api.post<{ token: string }>('/auth/login', {
      username,
      password,
    })
    localStorage.setItem('token', token)
    const me = await api.get<User>('/auth/me')
    setUser(me)
  }

  function logout() {
    localStorage.removeItem('token')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
