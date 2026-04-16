import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeftIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { peopleApi, Person, UpdatePersonPayload } from '../api/people'
import { officesApi, PersonOffice } from '../api/offices'
import { AppointOfficeModal } from '../components/AppointOfficeModal'

// ── Helpers ────────────────────────────────────────────────────────────────────

function initials(first: string, last: string) {
  return `${first[0] ?? ''}${last[0] ?? ''}`.toUpperCase()
}

const AVATAR_COLOURS = [
  'bg-indigo-100 text-indigo-700',
  'bg-violet-100 text-violet-700',
  'bg-sky-100 text-sky-700',
  'bg-teal-100 text-teal-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
]
function avatarColour(name: string) {
  return AVATAR_COLOURS[name.charCodeAt(0) % AVATAR_COLOURS.length]
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
}

function fmtDuration(startedAt: string, endedAt?: string) {
  const ms = (endedAt ? new Date(endedAt) : new Date()).getTime() - new Date(startedAt).getTime()
  const months = Math.floor(ms / (1000 * 60 * 60 * 24 * 30.44))
  if (months < 1) return 'Less than a month'
  const yrs = Math.floor(months / 12)
  const mo  = months % 12
  const parts = []
  if (yrs) parts.push(`${yrs} yr`)
  if (mo)  parts.push(`${mo} mo`)
  return parts.join(' ')
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function Section({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</h2>
        {action}
      </div>
      {children}
    </div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return <dt className="text-xs font-medium text-slate-500 w-32 shrink-0 pt-2">{children}</dt>
}

function Value({ children }: { children: React.ReactNode }) {
  return (
    <dd className="text-sm text-slate-900 pt-2 flex-1 min-w-0">
      {children ?? <span className="text-slate-400">—</span>}
    </dd>
  )
}

function FieldInput({ value, onChange, placeholder, type = 'text' }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string
}) {
  return (
    <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
      className="flex-1 px-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900
                 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent min-w-0" />
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────

export function PersonProfilePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [person,  setPerson]  = useState<Person | null>(null)
  const [offices, setOffices] = useState<PersonOffice[]>([])
  const [loading, setLoading] = useState(true)

  const [editing,  setEditing]  = useState(false)
  const [form,     setForm]     = useState<UpdatePersonPayload | null>(null)
  const [saving,   setSaving]   = useState(false)
  const [saveError,setSaveError]= useState<string | null>(null)

  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting,      setDeleting]      = useState(false)

  const [showAppoint,    setShowAppoint]    = useState(false)
  const [confirmEndId,   setConfirmEndId]   = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    Promise.all([peopleApi.get(id), officesApi.list(id)])
      .then(([p, o]) => { setPerson(p); setForm(toForm(p)); setOffices(o) })
      .catch(() => navigate('/people', { replace: true }))
      .finally(() => setLoading(false))
  }, [id, navigate])

  function toForm(p: Person): UpdatePersonPayload {
    return {
      firstName: p.firstName, lastName: p.lastName,
      type: p.type, status: p.status,
      email: p.email ?? '', phone: p.phone ?? '',
      addressLine1: p.addressLine1 ?? '', addressLine2: p.addressLine2 ?? '',
      city: p.city ?? '', county: p.county ?? '', postcode: p.postcode ?? '',
      notes: p.notes ?? '',
    }
  }

  function setField<K extends keyof UpdatePersonPayload>(k: K, v: UpdatePersonPayload[K]) {
    setForm((f) => f ? { ...f, [k]: v } : f)
  }

  function cancelEdit() {
    if (person) setForm(toForm(person))
    setEditing(false)
    setSaveError(null)
  }

  async function save() {
    if (!id || !form) return
    setSaving(true); setSaveError(null)
    try {
      const nullify = (s?: string) => (s?.trim() || undefined)
      const updated = await peopleApi.update(id, {
        ...form,
        email: nullify(form.email), phone: nullify(form.phone),
        addressLine1: nullify(form.addressLine1), addressLine2: nullify(form.addressLine2),
        city: nullify(form.city), county: nullify(form.county), postcode: nullify(form.postcode),
        notes: nullify(form.notes),
      })
      setPerson(updated); setForm(toForm(updated)); setEditing(false)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!id) return
    setDeleting(true)
    try { await peopleApi.remove(id); navigate('/people', { replace: true }) }
    catch { setConfirmDelete(false); setDeleting(false) }
  }

  async function handleEndOffice(officeId: string) {
    if (!id) return
    try {
      await officesApi.end(id, officeId)
      setOffices((prev) => prev.map((o) =>
        o.id === officeId ? { ...o, endedAt: new Date().toISOString() } : o
      ))
    } finally {
      setConfirmEndId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!person || !form) return null

  const fullName    = `${person.firstName} ${person.lastName}`
  const activeOffices = offices.filter((o) => !o.endedAt)
  const activeRoles   = activeOffices.map((o) => o.role)

  return (
    <div className="px-6 py-5 md:px-8">
      {/* ── Top bar ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-5">
        <button onClick={() => navigate('/people')}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors">
          <ArrowLeftIcon className="w-4 h-4" />
          People
        </button>

        <div className="flex items-center gap-2">
          {editing ? (
            <>
              {saveError && <p className="text-xs text-red-600 mr-1">{saveError}</p>}
              <button onClick={cancelEdit}
                className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                Cancel
              </button>
              <button onClick={save} disabled={saving}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors disabled:opacity-60">
                {saving && <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                Save changes
              </button>
            </>
          ) : confirmDelete ? (
            <>
              <span className="text-xs text-slate-500">Delete {person.firstName}?</span>
              <button onClick={() => setConfirmDelete(false)}
                className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleting}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-60">
                {deleting && <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                Delete
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setConfirmDelete(true)}
                className="px-3 py-1.5 text-sm font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                Delete
              </button>
              <button onClick={() => setEditing(true)}
                className="px-3 py-1.5 text-sm font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors">
                Edit
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Identity card ─────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200 px-5 py-4 flex items-center gap-4 mb-4">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 text-base font-semibold ${avatarColour(fullName)}`}>
          {initials(person.firstName, person.lastName)}
        </div>
        <div className="flex-1 min-w-0">
          {editing ? (
            <div className="flex gap-2">
              <input value={form.firstName} onChange={(e) => setField('firstName', e.target.value)} placeholder="First name"
                className="w-full px-2.5 py-1.5 text-sm font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
              <input value={form.lastName} onChange={(e) => setField('lastName', e.target.value)} placeholder="Last name"
                className="w-full px-2.5 py-1.5 text-sm font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
            </div>
          ) : (
            <p className="font-semibold text-slate-900">{fullName}</p>
          )}
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {editing ? (
              <>
                <div className="flex rounded-md border border-slate-200 p-0.5 bg-slate-50 gap-0.5">
                  {(['Member', 'Guest'] as const).map((t) => (
                    <button key={t} type="button" onClick={() => setField('type', t)}
                      className={['px-3 py-0.5 rounded text-xs font-medium transition-colors capitalize',
                        form.type === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'].join(' ')}>
                      {t}
                    </button>
                  ))}
                </div>
                <div className="flex rounded-md border border-slate-200 p-0.5 bg-slate-50 gap-0.5">
                  {(['Active', 'Inactive'] as const).map((s) => (
                    <button key={s} type="button" onClick={() => setField('status', s)}
                      className={['px-3 py-0.5 rounded text-xs font-medium transition-colors capitalize',
                        form.status === s ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'].join(' ')}>
                      {s}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <span className="text-xs font-medium text-slate-500 capitalize bg-slate-100 px-2 py-0.5 rounded-full">{person.type}</span>
                <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                  person.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${person.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                  {person.status === 'Active' ? 'Active' : 'Inactive'}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Lodge Office ──────────────────────────────────────────── */}
      <Section
        title="Lodge Office"
        action={
          <button onClick={() => setShowAppoint(true)}
            className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors">
            <PlusIcon className="w-3.5 h-3.5" />
            Appoint to office
          </button>
        }
      >
        {activeOffices.length === 0 ? (
          <p className="text-sm text-slate-400">Not currently serving in any office.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {activeOffices.map((office) => (
              confirmEndId === office.id ? (
                <div key={office.id} className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 border border-amber-200 rounded-full text-xs">
                  <span className="text-amber-800 font-medium">Remove from {office.role}?</span>
                  <button onClick={() => handleEndOffice(office.id)}
                    className="text-amber-700 hover:text-red-700 font-semibold transition-colors">Yes</button>
                  <button onClick={() => setConfirmEndId(null)}
                    className="text-amber-600 hover:text-slate-700 transition-colors">No</button>
                </div>
              ) : (
                <div key={office.id}
                  className="inline-flex items-center gap-1.5 pl-3 pr-2 py-1 bg-indigo-50 border border-indigo-100 rounded-full">
                  <span className="text-sm font-medium text-indigo-700">{office.role}</span>
                  <button onClick={() => setConfirmEndId(office.id)}
                    className="p-0.5 rounded-full text-indigo-400 hover:text-indigo-700 hover:bg-indigo-100 transition-colors"
                    title="End tenure">
                    <XMarkIcon className="w-3 h-3" />
                  </button>
                </div>
              )
            ))}
          </div>
        )}
      </Section>

      {/* ── Contact + Address ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <Section title="Contact">
          <dl className="space-y-3">
            <div className="flex gap-4 items-start">
              <Label>Email</Label>
              {editing
                ? <FieldInput value={form.email ?? ''} onChange={(v) => setField('email', v)} type="email" placeholder="email@example.com" />
                : <Value>{person.email ? <a href={`mailto:${person.email}`} className="text-indigo-600 hover:underline">{person.email}</a> : null}</Value>}
            </div>
            <div className="flex gap-4 items-start">
              <Label>Phone</Label>
              {editing
                ? <FieldInput value={form.phone ?? ''} onChange={(v) => setField('phone', v)} type="tel" placeholder="+44 7700 900000" />
                : <Value>{person.phone ? <a href={`tel:${person.phone}`} className="text-indigo-600 hover:underline">{person.phone}</a> : null}</Value>}
            </div>
          </dl>
        </Section>

        <Section title="Address">
          <dl className="space-y-3">
            {([
              { key: 'addressLine1', label: 'Line 1',   placeholder: '12 Lodge Lane'  },
              { key: 'addressLine2', label: 'Line 2',   placeholder: ''               },
              { key: 'city',         label: 'City',     placeholder: 'London'         },
              { key: 'county',       label: 'County',   placeholder: 'Greater London' },
              { key: 'postcode',     label: 'Postcode', placeholder: 'SW1A 1AA'       },
            ] as const).map(({ key, label, placeholder }) => (
              <div key={key} className="flex gap-4 items-start">
                <Label>{label}</Label>
                {editing
                  ? <FieldInput value={form[key] ?? ''} onChange={(v) => setField(key, v)} placeholder={placeholder} />
                  : <Value>{person[key]}</Value>}
              </div>
            ))}
          </dl>
        </Section>
      </div>

      {/* ── Notes ────────────────────────────────────────────────── */}
      <div className="mt-4">
        <Section title="Notes">
          {editing ? (
            <textarea value={form.notes ?? ''} onChange={(e) => setField('notes', e.target.value)}
              rows={3} placeholder="Any additional notes…"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900
                         focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none" />
          ) : (
            <p className="text-sm text-slate-900 whitespace-pre-wrap">
              {person.notes ?? <span className="text-slate-400">No notes added.</span>}
            </p>
          )}
        </Section>
      </div>

      {/* ── Office History ────────────────────────────────────────── */}
      <div className="mt-4">
        <Section title="Office History">
          {offices.length === 0 ? (
            <p className="text-sm text-slate-400">No office history yet.</p>
          ) : (
            <div className="divide-y divide-slate-50">
              {offices.map((office) => {
                const active = !office.endedAt
                return (
                  <div key={office.id} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${active ? 'bg-indigo-500' : 'bg-slate-300'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-slate-900">{office.role}</span>
                        {active && (
                          <span className="text-xs bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded-full font-medium">Active</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {fmtDate(office.startedAt)}
                        {' – '}
                        {active ? 'Present' : fmtDate(office.endedAt!)}
                        {' · '}
                        <span className="text-slate-400">{fmtDuration(office.startedAt, office.endedAt)}</span>
                      </p>
                      {office.notes && (
                        <p className="text-xs text-slate-400 mt-0.5 italic">{office.notes}</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Section>
      </div>

      {/* ── Modals ───────────────────────────────────────────────── */}
      {showAppoint && id && (
        <AppointOfficeModal
          personId={id}
          personName={fullName}
          activeRoles={activeRoles}
          onClose={() => setShowAppoint(false)}
          onAppointed={(office) => setOffices((prev) => [office, ...prev])}
        />
      )}
    </div>
  )
}
