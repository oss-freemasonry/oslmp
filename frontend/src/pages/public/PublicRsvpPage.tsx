import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { publicApi, PublicEventDetail, PublicLodge, AttendeeStatus, AlreadyRsvpdError, ConflictError } from '../../api/public'
import { buildTheme, loadGoogleFont } from '../../theme'
import { PublicHeader, PublicFooter } from './PublicHomePage'

// ── Helpers ───────────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  Meeting:            'General Meeting',
  LodgeOfInstruction: 'Lodge of Instruction',
  Social:             'Social',
  Other:              'Other',
}

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0])
}

function eventDisplayName(e: PublicEventDetail): string {
  if ((e.type === 'Social' || e.type === 'Other') && e.title) return e.title
  const d = new Date(e.date)
  const day = d.getUTCDate()
  return `${TYPE_LABELS[e.type] ?? e.type} — ${ordinal(day)} ${d.toLocaleDateString('en-GB', { month: 'long' })}`
}

function formatFullDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

function formatPrice(price: number | null): string {
  if (price == null) return ''
  return `£${price.toFixed(2)}`
}

const inputCls = `w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg
  text-slate-900 placeholder-slate-400
  focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow`

// ── Page ─────────────────────────────────────────────────────────────────────

export function PublicRsvpPage() {
  const { id } = useParams<{ id: string }>()

  const [event, setEvent]   = useState<PublicEventDetail | null>(null)
  const [lodge, setLodge]   = useState<PublicLodge | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const [name,  setName]  = useState('')
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<AttendeeStatus>('Attending')
  const [diningAttending, setDiningAttending] = useState(false)
  const [courseSelections, setCourseSelections] = useState<Record<string, string>>({})
  const [upgradeSelections, setUpgradeSelections] = useState<Set<string>>(new Set())

  const [existingRsvp, setExistingRsvp] = useState<AlreadyRsvpdError | null>(null)
  const [submitting,   setSubmitting]   = useState(false)
  const [submitError,  setSubmitError]  = useState<string | null>(null)
  const [success,      setSuccess]      = useState<{ personName: string } | null>(null)

  useEffect(() => {
    if (!id) return
    Promise.all([
      publicApi.event(id).catch(() => null),
      publicApi.lodge().catch(() => null),
    ]).then(([e, l]) => {
      if (!e) setNotFound(true)
      else     setEvent(e)
      if (l) {
        setLodge(l)
        if (l.themeFont) loadGoogleFont(l.themeFont)
        document.title = l.lodgeName
      }
    }).finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (status !== 'Attending') setDiningAttending(false)
  }, [status])

  const theme = buildTheme(lodge ?? {})

  function toggleUpgrade(upgradeId: string) {
    setUpgradeSelections(prev => {
      const next = new Set(prev)
      next.has(upgradeId) ? next.delete(upgradeId) : next.add(upgradeId)
      return next
    })
  }

  const coursesWithOptions = event?.diningCourses.filter(c => c.options.length > 0) ?? []
  const canSubmit = name.trim() && email.trim() && (
    !diningAttending || coursesWithOptions.every(c => courseSelections[c.id])
  )

  async function handleSubmit(e: React.FormEvent, force = false) {
    e.preventDefault()
    if (!event || !id) return
    setSubmitError(null)
    setSubmitting(true)
    try {
      const result = await publicApi.rsvp(id, {
        name: name.trim(),
        email: email.trim(),
        status,
        diningAttending,
        courseSelections: Object.entries(courseSelections).map(([courseId, optionId]) => ({ courseId, optionId })),
        upgradeSelections: Array.from(upgradeSelections),
        force,
      })
      setExistingRsvp(null)
      setSuccess({ personName: result.personName })
    } catch (err) {
      if (err instanceof ConflictError) setExistingRsvp(err.data)
      else setSubmitError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Loading ──

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col" style={{ fontFamily: theme.fontFamily }}>
        <PublicHeader lodge={null} theme={theme} activePath="" loading />
        <main className="flex-1 max-w-xl mx-auto w-full px-6 py-12">
          <div className="space-y-4 animate-pulse">
            <div className="h-6 bg-slate-100 rounded w-3/4" />
            <div className="h-4 bg-slate-100 rounded w-1/2" />
          </div>
        </main>
      </div>
    )
  }

  // ── Not found ──

  if (notFound || !event) {
    return (
      <div className="min-h-screen bg-white flex flex-col" style={{ fontFamily: theme.fontFamily }}>
        <PublicHeader lodge={lodge} theme={theme} activePath="" />
        <main className="flex-1 max-w-xl mx-auto w-full px-6 py-12 text-center">
          <p className="text-slate-500 text-sm">This event could not be found.</p>
          <a href="/public" className="mt-4 inline-block text-sm text-indigo-600 hover:underline">
            Back to homepage
          </a>
        </main>
        <PublicFooter lodge={lodge} theme={theme} />
      </div>
    )
  }

  // ── Success ──

  if (success) {
    return (
      <div className="min-h-screen bg-white flex flex-col" style={{ fontFamily: theme.fontFamily }}>
        <PublicHeader lodge={lodge} theme={theme} activePath="" />
        <main className="flex-1 max-w-xl mx-auto w-full px-6 py-12">
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-8 py-10 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-1">
              {status === 'Attending' ? 'See you there!' : 'Apologies noted'}
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              {status === 'Attending'
                ? `Thanks, ${success.personName}. Your place at ${eventDisplayName(event)} has been confirmed.`
                : `Thanks, ${success.personName}. Your apologies for ${eventDisplayName(event)} have been recorded.`}
            </p>
            {status === 'Attending' && diningAttending && (
              <p className="text-sm text-slate-500 mt-1">Your dining selections have been saved.</p>
            )}
            <a href="/public" className="mt-6 inline-block text-sm text-indigo-600 hover:underline">
              Back to homepage
            </a>
          </div>
        </main>
        <PublicFooter lodge={lodge} theme={theme} />
      </div>
    )
  }

  // ── Form ──

  return (
    <div className="min-h-screen bg-white flex flex-col" style={{ fontFamily: theme.fontFamily }}>
      <PublicHeader lodge={lodge} theme={theme} activePath="" />

      <main className="flex-1 max-w-xl mx-auto w-full px-6 py-10">
        <a href="/public" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-6 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </a>

        {/* Event summary */}
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: theme.accent }}>RSVP</p>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{eventDisplayName(event)}</h1>
          <p className="mt-1.5 text-sm text-slate-500">{formatFullDate(event.date)}</p>
          {(event.time || event.location) && (
            <p className="text-sm text-slate-500 mt-0.5">
              {[event.time, event.location].filter(Boolean).join(' · ')}
            </p>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Personal details */}
          <fieldset className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-xs font-medium text-slate-600 mb-1.5">Full name</label>
              <input id="name" type="text" required autoComplete="name" value={name}
                onChange={e => setName(e.target.value)} placeholder="John Smith" className={inputCls} />
            </div>
            <div>
              <label htmlFor="email" className="block text-xs font-medium text-slate-600 mb-1.5">Email address</label>
              <input id="email" type="email" required autoComplete="email" value={email}
                onChange={e => { setEmail(e.target.value); setExistingRsvp(null) }}
                placeholder="john@example.com" className={inputCls} />
              <p className="mt-1.5 text-xs text-slate-400">Used to identify you if you've attended before.</p>
            </div>
          </fieldset>

          {/* Attendance */}
          <div>
            <p className="text-xs font-medium text-slate-600 mb-2">Will you be attending?</p>
            <div className="flex gap-3">
              {(['Attending', 'Apologies'] as AttendeeStatus[]).map(s => (
                <button key={s} type="button" onClick={() => setStatus(s)}
                  className={`flex-1 py-2.5 text-sm font-medium rounded-lg border transition-colors ${
                    status === s
                      ? s === 'Attending' ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-amber-500 border-amber-500 text-white'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {s === 'Attending' ? 'Yes, attending' : 'Send apologies'}
                </button>
              ))}
            </div>
          </div>

          {/* Dining */}
          {status === 'Attending' && event.diningEnabled && (
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <button type="button" onClick={() => setDiningAttending(v => !v)}
                className="w-full flex items-center justify-between px-5 py-4 bg-slate-50 hover:bg-slate-100 transition-colors text-left">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Dining
                    {event.diningPrice != null && (
                      <span className="ml-2 text-xs font-normal text-slate-500">{formatPrice(event.diningPrice)} per person</span>
                    )}
                  </p>
                  {(event.diningTime || event.diningLocation) && (
                    <p className="text-xs text-slate-500 mt-0.5">
                      {[event.diningTime, event.diningLocation].filter(Boolean).join(' · ')}
                    </p>
                  )}
                </div>
                <span className={`w-10 h-6 rounded-full flex-shrink-0 flex items-center transition-colors px-0.5 ${diningAttending ? 'bg-emerald-500' : 'bg-slate-200'}`}>
                  <span className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${diningAttending ? 'translate-x-4' : 'translate-x-0'}`} />
                </span>
              </button>

              {diningAttending && (
                <div className="px-5 pb-5 pt-4 space-y-5 border-t border-slate-200">
                  {event.diningNotes && <p className="text-sm text-slate-500 italic">{event.diningNotes}</p>}

                  {coursesWithOptions.map(course => (
                    <div key={course.id}>
                      <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">{course.name}</p>
                      <div className="space-y-1.5">
                        {course.options.map(opt => (
                          <label key={opt.id} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-colors ${
                            courseSelections[course.id] === opt.id ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200 hover:border-slate-300'
                          }`}>
                            <input type="radio" name={`course-${course.id}`} value={opt.id}
                              checked={courseSelections[course.id] === opt.id}
                              onChange={() => setCourseSelections(prev => ({ ...prev, [course.id]: opt.id }))}
                              className="accent-indigo-500" />
                            <span className="flex-1 text-sm text-slate-800">{opt.name}</span>
                            {opt.supplement != null && (
                              <span className="text-xs text-slate-500">+{formatPrice(opt.supplement)}</span>
                            )}
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}

                  {event.diningUpgrades.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">Extras</p>
                      <div className="space-y-1.5">
                        {event.diningUpgrades.map(upgrade => (
                          <label key={upgrade.id} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-colors ${
                            upgradeSelections.has(upgrade.id) ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200 hover:border-slate-300'
                          }`}>
                            <input type="checkbox" checked={upgradeSelections.has(upgrade.id)}
                              onChange={() => toggleUpgrade(upgrade.id)} className="accent-indigo-500" />
                            <span className="flex-1 text-sm text-slate-800">{upgrade.name}</span>
                            {upgrade.price != null && <span className="text-xs text-slate-500">{formatPrice(upgrade.price)}</span>}
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Existing RSVP warning */}
          {existingRsvp && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-4 space-y-3">
              <div className="flex gap-3">
                <svg className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-amber-800">
                    {existingRsvp.personName} has already RSVP'd to this event
                    {' '}({existingRsvp.status === 'Attending' ? 'as attending' : 'with apologies'}).
                  </p>
                  <p className="text-xs text-amber-700 mt-0.5">Do you want to overwrite their existing response?</p>
                </div>
              </div>
              <div className="flex gap-2 pl-7">
                <button type="button" disabled={submitting}
                  onClick={e => handleSubmit(e as unknown as React.FormEvent, true)}
                  className="px-3 py-1.5 text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors disabled:opacity-50">
                  Yes, overwrite
                </button>
                <button type="button" onClick={() => setExistingRsvp(null)}
                  className="px-3 py-1.5 text-xs font-medium text-amber-800 hover:text-amber-900 transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {submitError && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">{submitError}</p>
          )}

          <button type="submit" disabled={submitting || !canSubmit}
            style={{ backgroundColor: theme.primary }}
            className="w-full py-3 text-white text-sm font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-opacity hover:opacity-90">
            {submitting ? 'Submitting…' : status === 'Attending' ? 'Confirm attendance' : 'Send apologies'}
          </button>
        </form>
      </main>

      <PublicFooter lodge={lodge} theme={theme} />
    </div>
  )
}
