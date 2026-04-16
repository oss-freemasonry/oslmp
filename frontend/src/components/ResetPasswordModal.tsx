import { FormEvent, useState } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { api } from '../api/client'

interface Props {
  userId: string
  username: string
  onClose: () => void
}

export function ResetPasswordModal({ userId, username, onClose }: Props) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSaving(true)
    try {
      await api.put(`/users/${userId}/password`, { newPassword: password })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Reset password</h2>
            <p className="text-xs text-slate-500 mt-0.5">{username}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">New password</label>
            <input
              type="password"
              required
              autoFocus
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900
                         focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

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
              Reset password
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
