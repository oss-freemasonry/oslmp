import { FormEvent, useState } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { useNavigate } from 'react-router-dom'
import { meetingsApi, MeetingType, TYPE_LABELS } from '../api/meetings'

const TYPES: MeetingType[] = ['Meeting', 'LodgeOfInstruction', 'Social', 'Other']

interface Props {
  prefillDate?: string
  onClose: () => void
}

export function AddMeetingModal({ prefillDate, onClose }: Props) {
  const navigate = useNavigate()
  const [type, setType] = useState<MeetingType>('Meeting')
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(prefillDate ?? new Date().toISOString().slice(0, 10))
  const [time, setTime] = useState('')
  const [location, setLocation] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSaving(true)
    try {
      const { id } = await meetingsApi.create({
        type,
        title: title || undefined,
        date,
        time: time || undefined,
        location: location || undefined,
      })
      navigate(`/meetings/${id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-900">Add event</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Type */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Type</label>
            <div className="flex flex-wrap gap-1.5">
              {TYPES.map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={[
                    'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border',
                    type === t
                      ? 'bg-indigo-500 border-indigo-500 text-white'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300',
                  ].join(' ')}
                >
                  {TYPE_LABELS[t]}
                </button>
              ))}
            </div>
          </div>

          {/* Title — only relevant for Social / Other */}
          {(type === 'Social' || type === 'Other') && (
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">Title</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder={type === 'Social' ? 'e.g. Summer Dinner' : 'e.g. Special Visit'}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900
                           focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          )}

          {/* Date + Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">
                Date <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900
                           focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">
                Time <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <input
                type="time"
                value={time}
                onChange={e => setTime(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900
                           focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">
              Location <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="e.g. Freemasons' Hall"
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
              Add event
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
