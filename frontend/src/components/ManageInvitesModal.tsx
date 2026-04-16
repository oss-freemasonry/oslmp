import { useEffect, useMemo, useState } from 'react'
import { XMarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { meetingsApi, Meeting, SyncInvitesResult } from '../api/meetings'
import { peopleApi, PersonSummary } from '../api/people'

interface Props {
  meeting: Meeting
  onClose: () => void
  onSaved: (result: SyncInvitesResult) => void
}

export function ManageInvitesModal({ meeting, onClose, onSaved }: Props) {
  const [people, setPeople] = useState<PersonSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [checked, setChecked] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const invitedIds = useMemo(
    () => new Set(meeting.attendees.map(a => a.personId)),
    [meeting.attendees]
  )

  // Attendees who have RSVP'd — cannot be removed through this modal
  const lockedIds = useMemo(
    () => new Set(meeting.attendees.filter(a => a.status !== 'Invited').map(a => a.personId)),
    [meeting.attendees]
  )

  useEffect(() => {
    peopleApi.list().then(all => {
      const active = all.filter(p => p.status === 'Active')
      setPeople(active)

      // Default checked state: all Members checked, Guests only if already invited
      const initial = new Set<string>()
      for (const p of active) {
        if (p.type === 'Member' || invitedIds.has(p.id)) {
          initial.add(p.id)
        }
      }
      // Also carry forward any existing invites (guests already added)
      for (const id of invitedIds) initial.add(id)

      setChecked(initial)
      setLoading(false)
    })
  }, [invitedIds])

  const members = people.filter(p => p.type === 'Member')
  const guests  = people.filter(p => p.type === 'Guest')

  const filteredMembers = members.filter(p =>
    `${p.firstName} ${p.lastName}`.toLowerCase().includes(search.toLowerCase())
  )
  const filteredGuests = guests.filter(p =>
    `${p.firstName} ${p.lastName}`.toLowerCase().includes(search.toLowerCase())
  )

  function toggle(id: string) {
    if (lockedIds.has(id)) return
    setChecked(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function selectAll() {
    setChecked(new Set(people.map(p => p.id)))
  }

  function selectAllGuests() {
    setChecked(prev => {
      const next = new Set(prev)
      for (const g of guests) next.add(g.id)
      return next
    })
  }

  async function save() {
    setSaving(true); setError(null)
    try {
      const result = await meetingsApi.syncInvites(meeting.id, [...checked])
      onSaved(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
      setSaving(false)
    }
  }

  const checkedCount = checked.size

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-2xl shadow-xl w-full max-w-md flex flex-col"
        style={{ maxHeight: '85vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Manage invites</h2>
            <p className="text-xs text-slate-400 mt-0.5">{checkedCount} selected</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={selectAll}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
            >
              Select all
            </button>
            <button onClick={onClose} className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="px-5 py-3 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg">
            <MagnifyingGlassIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search people…"
              className="flex-1 text-sm bg-transparent border-none outline-none text-slate-900 placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* List */}
        <div className="overflow-y-auto flex-1 px-2 py-2">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Members section */}
              {filteredMembers.length > 0 && (
                <div className="mb-1">
                  <p className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
                    Members ({filteredMembers.filter(p => checked.has(p.id)).length} / {filteredMembers.length})
                  </p>
                  {filteredMembers.map(p => (
                    <PersonRow key={p.id} person={p} checked={checked.has(p.id)} locked={lockedIds.has(p.id)} onToggle={() => toggle(p.id)} />
                  ))}
                </div>
              )}

              {/* Guests section */}
              {filteredGuests.length > 0 && (
                <div className="mt-1">
                  <div className="flex items-center justify-between px-3 py-1.5">
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
                      Guests ({filteredGuests.filter(p => checked.has(p.id)).length} / {filteredGuests.length})
                    </p>
                    <button
                      type="button"
                      onClick={selectAllGuests}
                      className="text-[11px] font-medium text-indigo-500 hover:text-indigo-600 transition-colors"
                    >
                      Select all guests
                    </button>
                  </div>
                  {filteredGuests.map(p => (
                    <PersonRow key={p.id} person={p} checked={checked.has(p.id)} locked={lockedIds.has(p.id)} onToggle={() => toggle(p.id)} />
                  ))}
                </div>
              )}

              {filteredMembers.length === 0 && filteredGuests.length === 0 && (
                <p className="px-3 py-6 text-sm text-center text-slate-400">No results.</p>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-between gap-2 shrink-0">
          <div>
            {error && <p className="text-xs text-red-600">{error}</p>}
            {lockedIds.size > 0 && (
              <p className="text-[11px] text-slate-400">
                {lockedIds.size} {lockedIds.size === 1 ? 'person has' : 'people have'} RSVP'd and cannot be removed here.
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={onClose} className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
              Cancel
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors disabled:opacity-60"
            >
              {saving && <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              Save · {checkedCount} invited
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function PersonRow({ person, checked, locked, onToggle }: {
  person: PersonSummary
  checked: boolean
  locked: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={locked}
      className={[
        'w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left',
        locked ? 'opacity-60 cursor-not-allowed' : 'hover:bg-slate-50',
      ].join(' ')}
    >
      {/* Checkbox */}
      <span className={[
        'flex items-center justify-center w-4 h-4 rounded border shrink-0 transition-colors',
        checked
          ? 'bg-indigo-500 border-indigo-500'
          : 'bg-white border-slate-300',
      ].join(' ')}>
        {checked && (
          <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </span>

      <span className="flex-1 text-sm text-slate-900 min-w-0 truncate">
        {person.firstName} {person.lastName}
      </span>

      {locked && (
        <span className="text-[10px] font-medium text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded shrink-0">
          RSVP'd
        </span>
      )}
    </button>
  )
}
