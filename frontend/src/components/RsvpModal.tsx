import { useEffect, useState } from 'react'
import { XMarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { meetingsApi, Meeting, Attendee, AttendeeStatus, RsvpPayload } from '../api/meetings'
import { peopleApi, PersonSummary } from '../api/people'

interface Props {
  meeting: Meeting
  editAttendee?: Attendee
  existingAttendeePersonIds: string[]
  onClose: () => void
  onSaved: (attendee: Attendee) => void
  onDeleted?: (attendeeId: string) => void
}

export function RsvpModal({ meeting, editAttendee, existingAttendeePersonIds, onClose, onSaved, onDeleted }: Props) {
  const isEdit = !!editAttendee

  // Person picker state (add mode only)
  const [people, setPeople] = useState<PersonSummary[]>([])
  const [search, setSearch] = useState('')
  const [selectedPerson, setSelectedPerson] = useState<PersonSummary | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)

  // RSVP fields
  const [status, setStatus] = useState<AttendeeStatus>(editAttendee?.status ?? 'Invited')
  const [diningAttending, setDiningAttending] = useState(editAttendee?.diningAttending ?? false)
  const [courseSelections, setCourseSelections] = useState<Record<string, string>>(
    Object.fromEntries((editAttendee?.courseSelections ?? []).map(s => [s.courseId, s.optionId]))
  )
  const [selectedUpgrades, setSelectedUpgrades] = useState<Set<string>>(
    new Set(editAttendee?.upgradeSelections ?? [])
  )

  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isEdit) {
      peopleApi.list().then(all => {
        const active = all.filter(
          p => p.status === 'Active' && !existingAttendeePersonIds.includes(p.id)
        )
        setPeople(active)
      })
    }
  }, [isEdit, existingAttendeePersonIds])

  const filteredPeople = people.filter(p => {
    const q = search.toLowerCase()
    return `${p.firstName} ${p.lastName}`.toLowerCase().includes(q)
  })

  const hasDining = meeting.diningEnabled
  const coursesWithOptions = meeting.diningCourses.filter(c => c.options.length > 0)
  const showDining = (status === 'Attending') && hasDining

  function toggleUpgrade(id: string) {
    setSelectedUpgrades(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  async function handleSave() {
    const personId = isEdit ? editAttendee!.personId : selectedPerson?.id
    if (!personId) { setError('Please select a person.'); return }

    if (status === 'Attending' && diningAttending && hasDining) {
      const missing = coursesWithOptions.find(c => !courseSelections[c.id])
      if (missing) { setError(`Please select an option for "${missing.name}".`); return }
    }

    setSaving(true); setError(null)
    try {
      const payload: RsvpPayload = {
        personId,
        status,
        diningAttending: status === 'Attending' ? diningAttending : false,
        courseSelections: Object.entries(courseSelections).map(([courseId, optionId]) => ({ courseId, optionId })),
        upgradeSelections: [...selectedUpgrades],
      }
      const saved = await meetingsApi.rsvp(meeting.id, payload)
      onSaved(saved)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save RSVP')
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!editAttendee || !onDeleted) return
    setDeleting(true)
    try {
      await meetingsApi.removeRsvp(meeting.id, editAttendee.id)
      onDeleted(editAttendee.id)
    } catch {
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  const inputClass = "w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-900">
            {isEdit ? 'Edit RSVP' : 'Add RSVP'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Person (add mode) */}
          {!isEdit && (
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Member</label>
              <div className="relative">
                <div
                  className={`flex items-center gap-2 px-3 py-2 text-sm bg-slate-50 border rounded-lg cursor-pointer ${
                    pickerOpen ? 'border-indigo-500 ring-2 ring-indigo-500' : 'border-slate-200'
                  }`}
                  onClick={() => setPickerOpen(o => !o)}
                >
                  {selectedPerson
                    ? <span className="text-slate-900">{selectedPerson.firstName} {selectedPerson.lastName}</span>
                    : <span className="text-slate-400">Select a person…</span>
                  }
                </div>

                {pickerOpen && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden">
                    <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-100">
                      <MagnifyingGlassIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search…"
                        className="flex-1 text-sm bg-transparent border-none outline-none text-slate-900 placeholder:text-slate-400"
                        autoFocus
                      />
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                      {filteredPeople.length === 0 ? (
                        <p className="px-3 py-3 text-sm text-slate-400">No members found.</p>
                      ) : (
                        filteredPeople.map(p => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => { setSelectedPerson(p); setPickerOpen(false); setSearch('') }}
                            className="w-full text-left px-3 py-2 text-sm text-slate-900 hover:bg-slate-50 transition-colors flex items-center justify-between gap-2"
                          >
                            <span>{p.firstName} {p.lastName}</span>
                            {p.type === 'Guest' && (
                              <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded shrink-0">Guest</span>
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Person (edit mode — read-only) */}
          {isEdit && (
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Member</label>
              <p className="px-3 py-2 text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-lg">
                {editAttendee.personFirstName} {editAttendee.personLastName}
              </p>
            </div>
          )}

          {/* Status */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Status</label>
            <div className="flex gap-2">
              {([
                { value: 'Invited'   as AttendeeStatus, label: 'Invited',   activeClass: 'bg-slate-600 border-slate-600 text-white' },
                { value: 'Attending' as AttendeeStatus, label: 'Attending', activeClass: 'bg-emerald-500 border-emerald-500 text-white' },
                { value: 'Apologies' as AttendeeStatus, label: 'Apologies', activeClass: 'bg-amber-500 border-amber-500 text-white' },
              ]).map(({ value, label, activeClass }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setStatus(value)}
                  className={[
                    'flex-1 py-2 rounded-lg text-sm font-medium border transition-colors',
                    status === value
                      ? activeClass
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300',
                  ].join(' ')}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Dining (only if attending + dining enabled) */}
          {showDining && (
            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-slate-50">
                <div>
                  <p className="text-sm font-medium text-slate-900">Joining for dining?</p>
                  {meeting.diningTime && (
                    <p className="text-xs text-slate-500 mt-0.5">{meeting.diningTime}{meeting.diningLocation ? ` · ${meeting.diningLocation}` : ''}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setDiningAttending(d => !d)}
                  className={[
                    'relative w-9 h-5 rounded-full transition-colors shrink-0',
                    diningAttending ? 'bg-indigo-500' : 'bg-slate-200',
                  ].join(' ')}
                >
                  <span className={[
                    'absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform',
                    diningAttending ? 'translate-x-4' : 'translate-x-0',
                  ].join(' ')} />
                </button>
              </div>

              {diningAttending && (
                <div className="px-4 py-3 space-y-3 border-t border-slate-100">
                  {/* Course selections */}
                  {coursesWithOptions.map(course => (
                    <div key={course.id}>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        {course.name}
                        <span className="text-red-500 ml-0.5">*</span>
                      </label>
                      <select
                        value={courseSelections[course.id] ?? ''}
                        onChange={e => setCourseSelections(s => ({ ...s, [course.id]: e.target.value }))}
                        className={inputClass}
                      >
                        <option value="">Select an option…</option>
                        {course.options.map(o => (
                          <option key={o.id} value={o.id}>{o.name}</option>
                        ))}
                      </select>
                    </div>
                  ))}

                  {/* Upgrade selections */}
                  {meeting.diningUpgrades.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-slate-600 mb-1.5">Upgrades</p>
                      <div className="space-y-1.5">
                        {meeting.diningUpgrades.map(u => (
                          <label key={u.id} className="flex items-center gap-2.5 cursor-pointer group">
                            <input
                              type="checkbox"
                              checked={selectedUpgrades.has(u.id)}
                              onChange={() => toggleUpgrade(u.id)}
                              className="w-4 h-4 rounded border-slate-300 text-indigo-500 focus:ring-indigo-500 cursor-pointer"
                            />
                            <span className="text-sm text-slate-700 group-hover:text-slate-900 transition-colors">
                              {u.name}
                              {u.price != null && (
                                <span className="ml-1.5 text-xs text-slate-400">£{u.price.toFixed(2)}</span>
                              )}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-between gap-2">
          {/* Delete (edit mode) */}
          {isEdit && onDeleted && (
            confirmDelete ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Remove RSVP?</span>
                <button onClick={() => setConfirmDelete(false)}
                  className="px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                  Cancel
                </button>
                <button onClick={handleDelete} disabled={deleting}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-60">
                  {deleting && <span className="w-2.5 h-2.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  Remove
                </button>
              </div>
            ) : (
              <button onClick={() => setConfirmDelete(true)}
                className="px-3 py-1.5 text-sm font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                Remove RSVP
              </button>
            )
          )}
          {!isEdit || !onDeleted ? <div /> : null}

          <div className="flex items-center gap-2">
            <button onClick={onClose}
              className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || (!isEdit && !selectedPerson)}
              className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors disabled:opacity-60"
            >
              {saving && <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {isEdit ? 'Save changes' : 'Add RSVP'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
