import { FormEvent, useState } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { peopleApi, PersonSummary, CreatePersonPayload } from '../api/people'

interface Props {
  onClose: () => void
  onCreated: (person: PersonSummary) => void
}

export function AddPersonModal({ onClose, onCreated }: Props) {
  const [form, setForm] = useState<CreatePersonPayload>({
    firstName: '',
    lastName: '',
    type: 'Member',
    email: '',
    phone: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  function set(field: keyof CreatePersonPayload, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSaving(true)
    try {
      const person = await peopleApi.create({
        ...form,
        email: form.email || undefined,
        phone: form.phone || undefined,
      })
      onCreated(person)
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
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-900">Add person</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Type toggle */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Type</label>
            <div className="flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 w-fit gap-0.5">
              {(['Member', 'Guest'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => set('type', t)}
                  className={[
                    'px-4 py-1.5 rounded-md text-sm font-medium transition-colors capitalize',
                    form.type === t
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700',
                  ].join(' ')}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Name row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">
                First name <span className="text-red-400">*</span>
              </label>
              <input
                required
                value={form.firstName}
                onChange={(e) => set('firstName', e.target.value)}
                placeholder="James"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900
                           focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">
                Last name <span className="text-red-400">*</span>
              </label>
              <input
                required
                value={form.lastName}
                onChange={(e) => set('lastName', e.target.value)}
                placeholder="Hartley"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900
                           focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
              placeholder="james@example.com"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900
                         focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Phone</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => set('phone', e.target.value)}
              placeholder="+44 7700 900000"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900
                         focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}

          {/* Actions */}
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
              Add person
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
