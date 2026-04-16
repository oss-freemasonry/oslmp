import { FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLodge } from '../context/LodgeContext'

export function LoginPage() {
  const { login } = useAuth()
  const { settings } = useLodge()
  const navigate = useNavigate()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login(username, password)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4">
      {/* Card */}
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          {settings.logoUrl ? (
            <img
              src={settings.logoUrl}
              alt={settings.lodgeName}
              className="w-12 h-12 rounded-2xl object-cover mb-4 shadow-lg"
            />
          ) : (
            <div className="w-12 h-12 rounded-2xl bg-indigo-500 flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/30">
              <span className="text-white font-bold text-lg tracking-tight">
                {settings.lodgeName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{settings.lodgeName}</h1>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
          <h2 className="text-base font-semibold text-slate-900 mb-6">Sign in to your account</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="username"
                className="block text-xs font-medium text-slate-600 mb-1.5"
              >
                Username
              </label>
              <input
                id="username"
                type="text"
                autoComplete="username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg
                           text-slate-900 placeholder-slate-400
                           focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                           transition-shadow"
                placeholder="Enter your username"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-medium text-slate-600 mb-1.5"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg
                           text-slate-900 placeholder-slate-400
                           focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                           transition-shadow"
                placeholder="Enter your password"
              />
            </div>

            {error && (
              <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg bg-red-50 border border-red-200">
                <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-white text-[9px] font-bold">!</span>
                </div>
                <p className="text-xs text-red-700">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 mt-2
                         bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-700
                         text-white text-sm font-medium rounded-lg
                         focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
                         disabled:opacity-60 disabled:cursor-not-allowed
                         transition-colors"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in…
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          OSLMP · Open Source Lodge Management Platform
        </p>
      </div>
    </div>
  )
}
