import { FormEvent, useState } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { api } from '../api/client'

interface Props {
  onClose: () => void
  onCreated: () => void
}

export function AddUserModal({ onClose, onCreated }: Props) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSaving(true)
    try {
      await api.post('/users', { username, password, role: isAdmin ? 'admin' : 'member' })
      onCreated()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-900">Add user</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Username</label>
            <input
              required
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="e.g. jsmith"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900
                         focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Set a password"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900
                         focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <label className="flex items-center gap-3 cursor-pointer select-none">
            <div
              onClick={() => setIsAdmin(v => !v)}
              className={[
                'relative w-9 h-5 rounded-full transition-colors shrink-0',
                isAdmin ? 'bg-indigo-500' : 'bg-slate-200',
              ].join(' ')}
            >
              <span className={[
                'absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform',
                isAdmin ? 'translate-x-4' : 'translate-x-0',
              ].join(' ')} />
            </div>
            <span className="text-sm font-medium text-slate-700">Administrator</span>
          </label>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors disabled:opacity-60"
            >
              {saving && (
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              Add user
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
