import { FormEvent, useState } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { officesApi, PersonOffice, LODGE_ROLES } from '../api/offices'

interface Props {
  personId: string
  personName: string
  activeRoles: string[]         // roles they're already holding — excluded from the list
  onClose: () => void
  onAppointed: (office: PersonOffice) => void
}

export function AppointOfficeModal({ personId, personName, activeRoles, onClose, onAppointed }: Props) {
  const available = LODGE_ROLES.filter((r) => !activeRoles.includes(r))

  const [role, setRole]     = useState<string>(available[0] ?? '')
  const [notes, setNotes]   = useState('')
  const [error, setError]   = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!role) return
    setError(null)
    setSaving(true)
    try {
      const office = await officesApi.appoint(personId, role, notes || undefined)
      onAppointed(office)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  if (available.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-xl p-6 text-center">
          <p className="text-sm text-slate-600">{personName} is already serving in every available office.</p>
          <button onClick={onClose} className="mt-4 text-sm text-indigo-600 font-medium">Close</button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Appoint to office</h2>
            <p className="text-xs text-slate-500 mt-0.5">{personName}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Office</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900
                         focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              {available.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">
              Notes <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Appointed at Installation meeting"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900
                         focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
            />
          </div>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">{error}</p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors disabled:opacity-60">
              {saving && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              Appoint
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
