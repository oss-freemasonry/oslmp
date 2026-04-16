import { useState, useEffect } from 'react'
import { PlusIcon, TrashIcon, KeyIcon } from '@heroicons/react/24/outline'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { AddUserModal } from '../components/AddUserModal'
import { ResetPasswordModal } from '../components/ResetPasswordModal'

interface User {
  id: string
  username: string
  role: string
  createdAt: string
}

export function UsersPage() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [resetTarget, setResetTarget] = useState<User | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function loadUsers() {
    try {
      const data = await api.get<User[]>('/users')
      setUsers(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadUsers() }, [])

  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      await api.delete(`/users/${id}`)
      setUsers(u => u.filter(x => x.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user')
    } finally {
      setDeletingId(null)
    }
  }

  if (currentUser?.role !== 'admin') {
    return (
      <div className="px-6 py-8 md:px-10 md:py-10">
        <p className="text-sm text-slate-500">You do not have permission to view this page.</p>
      </div>
    )
  }

  return (
    <div className="px-6 py-5 md:px-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-semibold text-slate-900">Users</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-3 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <PlusIcon className="w-4 h-4" />
          Add user
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-600 mb-4">{error}</p>
      )}

      {loading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : users.length === 0 ? (
        <p className="text-sm text-slate-500">No users found.</p>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Username</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Role</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide hidden sm:table-cell">Created</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-900">{u.username}</td>
                  <td className="px-4 py-3">
                    <span className={[
                      'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium',
                      u.role === 'admin'
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'bg-slate-100 text-slate-600',
                    ].join(' ')}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 hidden sm:table-cell">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setResetTarget(u)}
                        title="Reset password"
                        className="p-1.5 rounded-md text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 transition-colors"
                      >
                        <KeyIcon className="w-4 h-4" />
                      </button>
                      {u.username !== currentUser?.username && (
                        <button
                          onClick={() => handleDelete(u.id)}
                          disabled={deletingId === u.id}
                          title="Delete user"
                          className="p-1.5 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 disabled:opacity-40 transition-colors"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <AddUserModal
          onClose={() => setShowModal(false)}
          onCreated={loadUsers}
        />
      )}

      {resetTarget && (
        <ResetPasswordModal
          userId={resetTarget.id}
          username={resetTarget.username}
          onClose={() => setResetTarget(null)}
        />
      )}
    </div>
  )
}
