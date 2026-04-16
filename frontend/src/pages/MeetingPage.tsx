import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeftIcon, PlusIcon, TrashIcon, ChevronDownIcon, DocumentIcon, ArrowDownTrayIcon, GlobeAltIcon, LockClosedIcon } from '@heroicons/react/24/outline'
import {
  meetingsApi, Meeting, Attendee, MeetingType, MeetingPayload, DiningPayload,
  DiningCourse, MeetingDocument, TYPE_LABELS, TYPE_COLOURS, meetingDisplayName,
  DOCUMENT_TYPE_LABELS, DOCUMENT_TYPE_COLOURS,
} from '../api/meetings'
import { RsvpModal } from '../components/RsvpModal'
import { ManageInvitesModal } from '../components/ManageInvitesModal'
import { AddDocumentModal } from '../components/AddDocumentModal'

// ── Helpers ────────────────────────────────────────────────────────────────────

const TYPES: MeetingType[] = ['Meeting', 'LodgeOfInstruction', 'Social', 'Other']

function FieldInput({ value, onChange, placeholder, type = 'text' }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="flex-1 px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900
                 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent min-w-0"
    />
  )
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4 items-start">
      <dt className="text-xs font-medium text-slate-500 w-24 shrink-0 pt-2.5">{label}</dt>
      <dd className="flex-1 min-w-0 pt-1">{children}</dd>
    </div>
  )
}

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      className={[
        'relative w-9 h-5 rounded-full transition-colors shrink-0',
        enabled ? 'bg-indigo-500' : 'bg-slate-200',
      ].join(' ')}
    >
      <span className={[
        'absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform',
        enabled ? 'translate-x-4' : 'translate-x-0',
      ].join(' ')} />
    </button>
  )
}

// ── Details tab ───────────────────────────────────────────────────────────────

function DetailsTab({ meeting, onSaved }: { meeting: Meeting; onSaved: (m: Meeting) => void }) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<MeetingPayload>(toForm(meeting))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function toForm(m: Meeting): MeetingPayload {
    return {
      type: m.type,
      title: m.title ?? '',
      date: m.date.slice(0, 10),
      time: m.time ?? '',
      location: m.location ?? '',
      summary: m.summary ?? '',
      notes: m.notes ?? '',
    }
  }

  function set<K extends keyof MeetingPayload>(k: K, v: MeetingPayload[K]) {
    setForm(f => ({ ...f, [k]: v }))
  }

  function cancel() {
    setForm(toForm(meeting))
    setEditing(false)
    setError(null)
  }

  async function save() {
    setSaving(true); setError(null)
    try {
      const updated = await meetingsApi.update(meeting.id, {
        ...form,
        title: form.title || undefined,
        time: form.time || undefined,
        location: form.location || undefined,
        summary: (form.summary as string) || undefined,
        notes: (form.notes as string) || undefined,
      })
      onSaved({ ...meeting, ...updated })
      setEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const inputClass = "w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"

  return (
    <div>
      {/* Tab toolbar */}
      <div className="flex items-center justify-end mb-4">
        {editing ? (
          <div className="flex items-center gap-2">
            {error && <p className="text-xs text-red-600">{error}</p>}
            <button onClick={cancel} className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
              Cancel
            </button>
            <button onClick={save} disabled={saving}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors disabled:opacity-60">
              {saving && <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              Save changes
            </button>
          </div>
        ) : (
          <button onClick={() => setEditing(true)}
            className="px-3 py-1.5 text-sm font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors">
            Edit
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <dl className="space-y-4">
          <FieldRow label="Type">
            {editing ? (
              <div className="flex flex-wrap gap-1.5">
                {TYPES.map(t => (
                  <button key={t} type="button" onClick={() => set('type', t)}
                    className={[
                      'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border',
                      form.type === t
                        ? 'bg-indigo-500 border-indigo-500 text-white'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300',
                    ].join(' ')}>
                    {TYPE_LABELS[t]}
                  </button>
                ))}
              </div>
            ) : (
              (() => {
                const c = TYPE_COLOURS[meeting.type]
                return (
                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
                    {TYPE_LABELS[meeting.type]}
                  </span>
                )
              })()
            )}
          </FieldRow>

          {(form.type === 'Social' || form.type === 'Other') && (
            <FieldRow label="Title">
              {editing
                ? <FieldInput value={form.title as string ?? ''} onChange={v => set('title', v)}
                    placeholder={form.type === 'Social' ? 'e.g. Summer Dinner' : 'e.g. Special Visit'} />
                : <span className="text-sm text-slate-900 pt-1 block">{meeting.title ?? <span className="text-slate-400">—</span>}</span>}
            </FieldRow>
          )}

          <FieldRow label="Date">
            {editing
              ? <FieldInput type="date" value={form.date} onChange={v => set('date', v)} />
              : <span className="text-sm text-slate-900 pt-1 block">
                  {new Date(meeting.date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </span>}
          </FieldRow>

          <FieldRow label="Time">
            {editing
              ? <FieldInput type="time" value={form.time as string ?? ''} onChange={v => set('time', v)} />
              : <span className="text-sm text-slate-900 pt-1 block">{meeting.time ?? <span className="text-slate-400">—</span>}</span>}
          </FieldRow>

          <FieldRow label="Location">
            {editing
              ? <FieldInput value={form.location as string ?? ''} onChange={v => set('location', v)} placeholder="e.g. Freemasons' Hall" />
              : <span className="text-sm text-slate-900 pt-1 block">{meeting.location ?? <span className="text-slate-400">—</span>}</span>}
          </FieldRow>

          {(form.type === 'Meeting' || form.type === 'LodgeOfInstruction') && (
            <FieldRow label="Summary">
              {editing
                ? <FieldInput
                    value={form.summary as string ?? ''}
                    onChange={v => set('summary', v)}
                    placeholder={
                      form.type === 'LodgeOfInstruction'
                        ? 'e.g. Practising for raising a Brother Smith'
                        : 'e.g. Raising a Brother Smith'
                    }
                  />
                : <span className="text-sm text-slate-900 pt-1 block">
                    {meeting.summary ?? <span className="text-slate-400">—</span>}
                  </span>}
            </FieldRow>
          )}

          <FieldRow label="Notes">
            {editing
              ? <textarea rows={3} value={form.notes as string ?? ''} onChange={e => set('notes', e.target.value)}
                  className={`${inputClass} resize-none`} placeholder="Any additional notes…" />
              : <span className="text-sm text-slate-900 pt-1 block whitespace-pre-wrap">
                  {meeting.notes ?? <span className="text-slate-400">—</span>}
                </span>}
          </FieldRow>
        </dl>
      </div>
    </div>
  )
}

// ── Dining tab ────────────────────────────────────────────────────────────────

type LocalOption = { name: string; supplement: string }
type LocalCourse = { name: string; options: LocalOption[] }
type LocalUpgrade = { name: string; price: string }

const COURSE_NAMES = ['Starter', 'Main', 'Dessert', 'Cheese', 'Coffee']

function fromApiCourses(courses: DiningCourse[]): LocalCourse[] {
  return courses.map(c => ({
    name: c.name,
    options: c.options.map(o => ({
      name: o.name,
      supplement: o.supplement != null ? String(o.supplement) : '',
    })),
  }))
}

function CourseCard({
  course,
  index,
  onChange,
  onRemove,
}: {
  course: LocalCourse
  index: number
  onChange: (c: LocalCourse) => void
  onRemove: () => void
}) {
  function setName(v: string) { onChange({ ...course, name: v }) }
  function setOptionField(i: number, field: keyof LocalOption, v: string) {
    const opts = course.options.map((o, idx) => idx === i ? { ...o, [field]: v } : o)
    onChange({ ...course, options: opts })
  }
  function addOption() { onChange({ ...course, options: [...course.options, { name: '', supplement: '' }] }) }
  function removeOption(i: number) {
    onChange({ ...course, options: course.options.filter((_, idx) => idx !== i) })
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/50 overflow-hidden">
      {/* Course header */}
      <div className="flex items-center gap-2 px-3 py-2 bg-white border-b border-slate-200">
        <ChevronDownIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <input
          type="text"
          value={course.name}
          onChange={e => setName(e.target.value)}
          placeholder={COURSE_NAMES[index] ?? `Course ${index + 1}`}
          className="flex-1 text-sm font-medium text-slate-900 bg-transparent border-none outline-none placeholder:text-slate-400"
        />
        <button type="button" onClick={onRemove}
          className="p-1 rounded-md text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0">
          <TrashIcon className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Options */}
      <div className="px-3 py-2 space-y-1.5">
        {course.options.map((opt, i) => (
          <div key={i} className="flex items-center gap-2 pl-4">
            <span className="text-slate-300 text-xs select-none">—</span>
            <input
              type="text"
              value={opt.name}
              onChange={e => setOptionField(i, 'name', e.target.value)}
              placeholder={`Option ${i + 1} (e.g. Soup of the Day)`}
              className="flex-1 px-2.5 py-1.5 text-sm bg-white border border-slate-200 rounded-md text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <div className="relative shrink-0">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none">+£</span>
              <input
                type="number"
                min="0"
                step="0.50"
                value={opt.supplement}
                onChange={e => setOptionField(i, 'supplement', e.target.value)}
                placeholder="0.00"
                className="w-20 pl-7 pr-2 py-1.5 text-sm bg-white border border-slate-200 rounded-md text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <button type="button" onClick={() => removeOption(i)}
              className="p-1 rounded-md text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0">
              <TrashIcon className="w-3 h-3" />
            </button>
          </div>
        ))}
        <button type="button" onClick={addOption}
          className="ml-4 inline-flex items-center gap-1 text-xs text-slate-400 hover:text-indigo-600 transition-colors mt-0.5">
          <PlusIcon className="w-3 h-3" />
          Add option
        </button>
      </div>
    </div>
  )
}

function DiningTab({ meeting, onSaved }: { meeting: Meeting; onSaved: (m: Meeting) => void }) {
  const [enabled, setEnabled] = useState(meeting.diningEnabled)
  const [time, setTime] = useState(meeting.diningTime ?? '')
  const [location, setLocation] = useState(meeting.diningLocation ?? '')
  const [price, setPrice] = useState(meeting.diningPrice?.toString() ?? '')
  const [notes, setNotes] = useState(meeting.diningNotes ?? '')
  const [upgrades, setUpgrades] = useState<LocalUpgrade[]>(
    meeting.diningUpgrades.map(u => ({ name: u.name, price: u.price?.toString() ?? '' }))
  )
  const [courses, setCourses] = useState<LocalCourse[]>(
    fromApiCourses(meeting.diningCourses)
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  function addUpgrade() { setUpgrades(u => [...u, { name: '', price: '' }]) }
  function updateUpgrade(i: number, field: 'name' | 'price', value: string) {
    setUpgrades(u => u.map((x, idx) => idx === i ? { ...x, [field]: value } : x))
  }
  function removeUpgrade(i: number) { setUpgrades(u => u.filter((_, idx) => idx !== i)) }

  function addCourse() {
    setCourses(c => [...c, { name: COURSE_NAMES[c.length] ?? '', options: [{ name: '', supplement: '' }] }])
  }
  function updateCourse(i: number, c: LocalCourse) { setCourses(cs => cs.map((x, idx) => idx === i ? c : x)) }
  function removeCourse(i: number) { setCourses(cs => cs.filter((_, idx) => idx !== i)) }

  async function save() {
    setSaving(true); setError(null); setSaved(false)
    try {
      const payload: DiningPayload = {
        enabled,
        time: time || undefined,
        location: location || undefined,
        price: price ? parseFloat(price) : undefined,
        notes: notes || undefined,
        upgrades: upgrades
          .filter(u => u.name.trim())
          .map(u => ({ name: u.name, price: u.price ? parseFloat(u.price) : undefined })),
        courses: courses
          .filter(c => c.name.trim())
          .map(c => ({
            name: c.name,
            options: c.options
              .filter(o => o.name.trim())
              .map(o => ({
                name: o.name,
                supplement: o.supplement ? parseFloat(o.supplement) : null,
              })),
          })),
      }
      const updated = await meetingsApi.updateDining(meeting.id, payload)
      onSaved({ ...meeting, ...updated })
      setCourses(fromApiCourses(updated.diningCourses ?? []))
      setSaved(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const inputClass = "w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"

  return (
    <div className="space-y-4">
      {/* Enable toggle */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-900">Dining</p>
            <p className="text-xs text-slate-500 mt-0.5">Enable dining for this event</p>
          </div>
          <Toggle enabled={enabled} onChange={setEnabled} />
        </div>
      </div>

      {enabled && (
        <>
          {/* Logistics */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Logistics</h3>
            <dl className="space-y-3">
              <FieldRow label="Time">
                <input type="time" value={time} onChange={e => setTime(e.target.value)} className={inputClass} />
              </FieldRow>
              <FieldRow label="Location">
                <input type="text" value={location} onChange={e => setLocation(e.target.value)}
                  placeholder="e.g. Dining Room" className={inputClass} />
              </FieldRow>
              <FieldRow label="Price / head">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">£</span>
                  <input type="number" min="0" step="0.01" value={price} onChange={e => setPrice(e.target.value)}
                    placeholder="0.00" className={`${inputClass} pl-7`} />
                </div>
              </FieldRow>
            </dl>
          </div>

          {/* Menu (courses) */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Menu</h3>
              <button type="button" onClick={addCourse}
                className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors">
                <PlusIcon className="w-3.5 h-3.5" />
                Add course
              </button>
            </div>

            {courses.length === 0 ? (
              <p className="text-sm text-slate-400">No courses added yet. Add a course to build the menu.</p>
            ) : (
              <div className="space-y-2">
                {courses.map((c, i) => (
                  <CourseCard
                    key={i}
                    index={i}
                    course={c}
                    onChange={updated => updateCourse(i, updated)}
                    onRemove={() => removeCourse(i)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Upgrades */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Upgrades</h3>
              <button type="button" onClick={addUpgrade}
                className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors">
                <PlusIcon className="w-3.5 h-3.5" />
                Add upgrade
              </button>
            </div>

            {upgrades.length === 0 ? (
              <p className="text-sm text-slate-400">No upgrades added.</p>
            ) : (
              <div className="space-y-2">
                {upgrades.map((u, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={u.name}
                      onChange={e => updateUpgrade(i, 'name', e.target.value)}
                      placeholder="e.g. Wine package"
                      className="flex-1 px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    <div className="relative w-28 shrink-0">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">£</span>
                      <input
                        type="number" min="0" step="0.01"
                        value={u.price}
                        onChange={e => updateUpgrade(i, 'price', e.target.value)}
                        placeholder="0.00"
                        className="w-full pl-7 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>
                    <button type="button" onClick={() => removeUpgrade(i)}
                      className="p-1.5 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0">
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Notes</h3>
            <textarea
              rows={3}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Any additional dining notes…"
              className={`${inputClass} resize-none`}
            />
          </div>
        </>
      )}

      {/* Save */}
      <div className="flex items-center justify-end gap-3">
        {error && <p className="text-xs text-red-600">{error}</p>}
        {saved && <p className="text-xs text-emerald-600 font-medium">Saved.</p>}
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors disabled:opacity-60"
        >
          {saving && <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
          Save dining
        </button>
      </div>
    </div>
  )
}

// ── Attendees tab ─────────────────────────────────────────────────────────────

function AttendeesTab({ meeting, onMeetingUpdated }: { meeting: Meeting; onMeetingUpdated: (m: Meeting) => void }) {
  const [showModal, setShowModal] = useState(false)
  const [showManageModal, setShowManageModal] = useState(false)
  const [editAttendee, setEditAttendee] = useState<Attendee | undefined>()

  const attending  = meeting.attendees.filter(a => a.status === 'Attending')
  const apologies  = meeting.attendees.filter(a => a.status === 'Apologies')
  const existingIds = meeting.attendees.map(a => a.personId)

  function withRecomputedCounts(m: Meeting, attendees: Attendee[]): Meeting {
    const attendingCount  = attendees.filter(a => a.status === 'Attending').length
    const apologiesCount  = attendees.filter(a => a.status === 'Apologies').length
    const awaitingCount   = Math.max(0, m.invitedCount - attendingCount - apologiesCount)
    return { ...m, attendees, attendingCount, apologiesCount, awaitingCount }
  }

  function handleSaved(saved: Attendee) {
    const isNew = !meeting.attendees.some(a => a.id === saved.id)
    const updatedAttendees = isNew
      ? [...meeting.attendees, saved]
      : meeting.attendees.map(a => a.id === saved.id ? saved : a)
    onMeetingUpdated(withRecomputedCounts(meeting, updatedAttendees))
    setShowModal(false)
    setEditAttendee(undefined)
  }

  function handleDeleted(attendeeId: string) {
    const updatedAttendees = meeting.attendees.filter(a => a.id !== attendeeId)
    onMeetingUpdated(withRecomputedCounts(meeting, updatedAttendees))
    setShowModal(false)
    setEditAttendee(undefined)
  }

  function handleInvitesSaved(result: import('../api/meetings').SyncInvitesResult) {
    onMeetingUpdated({
      ...meeting,
      attendees: result.attendees,
      invitedCount: result.invitedCount,
      attendingCount: result.attendingCount,
      apologiesCount: result.apologiesCount,
      awaitingCount: result.awaitingCount,
    })
    setShowManageModal(false)
  }

  function openEdit(a: Attendee) {
    setEditAttendee(a)
    setShowModal(true)
  }

  const stats = [
    { label: 'Invited',   value: meeting.invitedCount,   cls: 'text-slate-700' },
    { label: 'Attending', value: meeting.attendingCount,  cls: 'text-emerald-600 font-semibold' },
    { label: 'Apologies', value: meeting.apologiesCount,  cls: 'text-amber-600 font-semibold' },
    { label: 'Awaiting',  value: meeting.awaitingCount,   cls: 'text-slate-500' },
  ]

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="grid grid-cols-4 divide-x divide-slate-100 text-center">
          {stats.map(s => (
            <div key={s.label} className="px-3">
              <p className={`text-xl font-bold ${s.cls}`}>{s.value}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* List header */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          {meeting.attendees.length === 0 ? 'No one invited yet' : `${meeting.attendees.length} ${meeting.attendees.length === 1 ? 'person' : 'people'} invited`}
        </p>
        <button
          onClick={() => setShowManageModal(true)}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
        >
          <PlusIcon className="w-3.5 h-3.5" />
          Manage invites
        </button>
      </div>

      {/* Attending group */}
      {attending.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-4 py-2 bg-emerald-50 border-b border-slate-100">
            <p className="text-xs font-semibold text-emerald-700">Attending</p>
          </div>
          {attending.map((a, i) => (
            <AttendeeRow key={a.id} attendee={a} meeting={meeting} isLast={i === attending.length - 1} onClick={() => openEdit(a)} />
          ))}
        </div>
      )}

      {/* Apologies group */}
      {apologies.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-4 py-2 bg-amber-50 border-b border-slate-100">
            <p className="text-xs font-semibold text-amber-700">Apologies</p>
          </div>
          {apologies.map((a, i) => (
            <AttendeeRow key={a.id} attendee={a} meeting={meeting} isLast={i === apologies.length - 1} onClick={() => openEdit(a)} />
          ))}
        </div>
      )}

      {showManageModal && (
        <ManageInvitesModal
          meeting={meeting}
          onClose={() => setShowManageModal(false)}
          onSaved={handleInvitesSaved}
        />
      )}

      {showModal && (
        <RsvpModal
          meeting={meeting}
          editAttendee={editAttendee}
          existingAttendeePersonIds={existingIds}
          onClose={() => { setShowModal(false); setEditAttendee(undefined) }}
          onSaved={handleSaved}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  )
}

function AttendeeRow({ attendee, meeting, isLast, onClick }: {
  attendee: Attendee
  meeting: Meeting
  isLast: boolean
  onClick: () => void
}) {
  const courseNames = attendee.courseSelections.map(sel => {
    const course = meeting.diningCourses.find(c => c.id === sel.courseId)
    const option = course?.options.find(o => o.id === sel.optionId)
    return option?.name
  }).filter(Boolean)

  const upgradeNames = attendee.upgradeSelections.map(uid =>
    meeting.diningUpgrades.find(u => u.id === uid)?.name
  ).filter(Boolean)

  return (
    <button
      onClick={onClick}
      className={[
        'w-full flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left',
        !isLast ? 'border-b border-slate-100' : '',
      ].join(' ')}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-900">
          {attendee.personFirstName} {attendee.personLastName}
        </p>
        {attendee.diningAttending && (
          <p className="text-xs text-slate-500 mt-0.5">
            Dining
            {courseNames.length > 0 && ` · ${courseNames.join(' · ')}`}
            {upgradeNames.length > 0 && ` · ${upgradeNames.join(', ')}`}
          </p>
        )}
      </div>
      {attendee.diningAttending && (
        <span className="text-[10px] font-medium text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded shrink-0">Dining</span>
      )}
    </button>
  )
}

// ── Documents tab ─────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function DocumentsTab({ meeting, onMeetingUpdated }: { meeting: Meeting; onMeetingUpdated: (m: Meeting) => void }) {
  const [showModal, setShowModal] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  function handleUploaded(doc: MeetingDocument) {
    onMeetingUpdated({ ...meeting, documents: [...meeting.documents, doc] })
    setShowModal(false)
  }

  async function handleToggleVisibility(doc: MeetingDocument) {
    setTogglingId(doc.id)
    try {
      const updated = await meetingsApi.updateDocument(meeting.id, doc.id, !doc.isPublic)
      onMeetingUpdated({
        ...meeting,
        documents: meeting.documents.map(d => d.id === doc.id ? updated : d),
      })
    } catch {
      // silent
    } finally {
      setTogglingId(null)
    }
  }

  async function handleDelete(docId: string) {
    setDeletingId(docId)
    try {
      await meetingsApi.deleteDocument(meeting.id, docId)
      onMeetingUpdated({ ...meeting, documents: meeting.documents.filter(d => d.id !== docId) })
      setConfirmDeleteId(null)
    } catch {
      // leave confirm state so user sees it failed
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          {meeting.documents.length === 0
            ? 'No documents'
            : `${meeting.documents.length} ${meeting.documents.length === 1 ? 'document' : 'documents'}`}
        </p>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
        >
          <PlusIcon className="w-3.5 h-3.5" />
          Add document
        </button>
      </div>

      {meeting.documents.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <DocumentIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-400">No documents attached yet.</p>
          <p className="text-xs text-slate-400 mt-0.5">Upload a summons, agenda, or other file.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
          {meeting.documents.map(doc => {
            const colours = DOCUMENT_TYPE_COLOURS[doc.type]
            const isConfirming = confirmDeleteId === doc.id
            const isDeleting = deletingId === doc.id
            const isToggling = togglingId === doc.id

            return (
              <div key={doc.id} className="flex items-center gap-3 px-4 py-3">
                <DocumentIcon className="w-5 h-5 text-slate-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-slate-900 truncate">{doc.name}</p>
                    <span className={`shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${colours.bg} ${colours.text}`}>
                      {DOCUMENT_TYPE_LABELS[doc.type]}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 truncate">{doc.originalFileName} · {formatBytes(doc.fileSize)}</p>
                </div>

                {isConfirming ? (
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-slate-500">Delete?</span>
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      className="text-xs text-slate-500 hover:text-slate-700 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleDelete(doc.id)}
                      disabled={isDeleting}
                      className="flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700 transition-colors disabled:opacity-60"
                    >
                      {isDeleting && <span className="w-2.5 h-2.5 border border-red-600/30 border-t-red-600 rounded-full animate-spin" />}
                      Delete
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 shrink-0">
                    {/* Visibility toggle */}
                    <button
                      onClick={() => handleToggleVisibility(doc)}
                      disabled={isToggling}
                      title={doc.isPublic ? 'Public — click to make private' : 'Private — click to make public'}
                      className={[
                        'inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium transition-colors disabled:opacity-60',
                        doc.isPublic
                          ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200',
                      ].join(' ')}
                    >
                      {isToggling
                        ? <span className="w-2.5 h-2.5 border border-current/30 border-t-current rounded-full animate-spin" />
                        : doc.isPublic
                          ? <GlobeAltIcon className="w-3 h-3" />
                          : <LockClosedIcon className="w-3 h-3" />
                      }
                      {doc.isPublic ? 'Public' : 'Private'}
                    </button>
                    <a
                      href={meetingsApi.documentFileUrl(meeting.id, doc.id)}
                      download={doc.originalFileName}
                      className="p-1.5 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                      title="Download"
                    >
                      <ArrowDownTrayIcon className="w-4 h-4" />
                    </a>
                    <button
                      onClick={() => setConfirmDeleteId(doc.id)}
                      className="p-1.5 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      title="Delete"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {showModal && (
        <AddDocumentModal
          meetingId={meeting.id}
          onClose={() => setShowModal(false)}
          onUploaded={handleUploaded}
        />
      )}
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────

type Tab = 'details' | 'dining' | 'attendees' | 'documents'

export function MeetingPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [meeting, setMeeting] = useState<Meeting | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('details')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!id) return
    meetingsApi.get(id)
      .then(setMeeting)
      .catch(() => navigate('/meetings', { replace: true }))
      .finally(() => setLoading(false))
  }, [id, navigate])

  async function handleDelete() {
    if (!id) return
    setDeleting(true)
    try { await meetingsApi.remove(id); navigate('/meetings', { replace: true }) }
    catch { setDeleting(false); setConfirmDelete(false) }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!meeting) return null

  const c = TYPE_COLOURS[meeting.type]

  return (
    <div className="px-6 py-5 md:px-8">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-5">
        <button onClick={() => navigate('/meetings')}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors">
          <ArrowLeftIcon className="w-4 h-4" />
          Meetings
        </button>

        {confirmDelete ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Delete this event?</span>
            <button onClick={() => setConfirmDelete(false)}
              className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
              Cancel
            </button>
            <button onClick={handleDelete} disabled={deleting}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-60">
              {deleting && <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              Delete
            </button>
          </div>
        ) : (
          <button onClick={() => setConfirmDelete(true)}
            className="px-3 py-1.5 text-sm font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
            Delete
          </button>
        )}
      </div>

      {/* Header card */}
      <div className="bg-white rounded-xl border border-slate-200 px-5 py-4 mb-1">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${c.bg} ${c.text} mb-2`}>
              <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
              {TYPE_LABELS[meeting.type]}
            </span>
            <p className="text-lg font-semibold text-slate-900">{meetingDisplayName(meeting)}</p>
            {meeting.summary && (
              <p className="text-sm text-slate-500 mt-0.5">{meeting.summary}</p>
            )}
          </div>
          <p className="text-sm text-slate-500 shrink-0 mt-1">
            {new Date(meeting.date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-5">
        {([
          { key: 'details',   label: 'Details' },
          { key: 'dining',    label: 'Dining' },
          { key: 'attendees', label: 'Attendees' },
          { key: 'documents', label: 'Documents' },
        ] as const).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={[
              'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px',
              tab === key
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700',
            ].join(' ')}
          >
            {label}
            {key === 'dining' && meeting.diningEnabled && (
              <span className="ml-1.5 inline-flex items-center justify-center w-1.5 h-1.5 rounded-full bg-indigo-500" />
            )}
            {key === 'attendees' && meeting.attendees.length > 0 && (
              <span className="ml-1.5 text-[11px] font-normal text-slate-400">({meeting.attendees.length})</span>
            )}
            {key === 'documents' && meeting.documents.length > 0 && (
              <span className="ml-1.5 text-[11px] font-normal text-slate-400">({meeting.documents.length})</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'details'   && <DetailsTab   meeting={meeting} onSaved={setMeeting} />}
      {tab === 'dining'    && <DiningTab    meeting={meeting} onSaved={setMeeting} />}
      {tab === 'attendees' && <AttendeesTab meeting={meeting} onMeetingUpdated={setMeeting} />}
      {tab === 'documents' && <DocumentsTab meeting={meeting} onMeetingUpdated={setMeeting} />}
    </div>
  )
}
