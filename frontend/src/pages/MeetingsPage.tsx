import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  PlusIcon,
  ListBulletIcon,
  CalendarDaysIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  TrashIcon,
  MapPinIcon,
  ClockIcon,
} from '@heroicons/react/24/outline'
import { meetingsApi, MeetingSummary, TYPE_LABELS, TYPE_COLOURS, meetingDisplayName } from '../api/meetings'
import { AddMeetingModal } from '../components/AddMeetingModal'

// ── Helpers ────────────────────────────────────────────────────────────────────

function monthKey(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function monthLabel(key: string) {
  const [year, month] = key.split('-').map(Number)
  return new Date(year, month - 1, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
}

// ── List view ─────────────────────────────────────────────────────────────────

function ListView({
  meetings,
  onDelete,
  emptyMessage = 'No events yet',
}: {
  meetings: MeetingSummary[]
  onDelete: (m: MeetingSummary) => void
  emptyMessage?: string
}) {
  const navigate = useNavigate()

  if (meetings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-6">
        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mb-3">
          <CalendarDaysIcon className="w-5 h-5 text-slate-400" />
        </div>
        <p className="text-sm font-medium text-slate-600">{emptyMessage}</p>
      </div>
    )
  }

  const groups = new Map<string, MeetingSummary[]>()
  for (const m of meetings) {
    const k = monthKey(m.date)
    if (!groups.has(k)) groups.set(k, [])
    groups.get(k)!.push(m)
  }

  return (
    <div className="space-y-6">
      {[...groups.entries()].map(([key, items]) => (
        <div key={key}>
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2 px-1">
            {monthLabel(key)}
          </h3>
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            {items.map((m, i) => (
              <div
                key={m.id}
                onClick={() => navigate(`/meetings/${m.id}`)}
                className={[
                  'flex items-start gap-4 px-5 py-4 group cursor-pointer hover:bg-slate-50 transition-colors',
                  i > 0 ? 'border-t border-slate-100' : '',
                ].join(' ')}
              >
                {/* Date block */}
                <div className="shrink-0 w-10 text-center">
                  <p className="text-lg font-bold text-slate-900 leading-none">
                    {new Date(m.date).getUTCDate()}
                  </p>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wide mt-0.5">
                    {new Date(m.date).toLocaleDateString('en-GB', { weekday: 'short' })}
                  </p>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-slate-900">{meetingDisplayName(m)}</span>
                  </div>
                  {m.summary && (
                    <p className="text-xs text-slate-500 mt-0.5">{m.summary}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 mt-1.5">
                    {m.time && (
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <ClockIcon className="w-3 h-3" /> {m.time}
                      </span>
                    )}
                    {m.location && (
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <MapPinIcon className="w-3 h-3" /> {m.location}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 mt-1.5">
                    <span className="text-[11px] text-slate-400">{m.invitedCount} invited</span>
                    {m.attendingCount > 0 && (
                      <span className="text-[11px] font-medium text-emerald-600">{m.attendingCount} attending</span>
                    )}
                    {m.apologiesCount > 0 && (
                      <span className="text-[11px] font-medium text-amber-500">{m.apologiesCount} apologies</span>
                    )}
                    {m.awaitingCount > 0 && (
                      <span className="text-[11px] text-slate-400">{m.awaitingCount} awaiting</span>
                    )}
                  </div>
                </div>

                {/* Delete */}
                <button
                  onClick={e => { e.stopPropagation(); onDelete(m) }}
                  className="p-1.5 rounded-md text-slate-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                  title="Delete"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Calendar view ─────────────────────────────────────────────────────────────

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function CalendarView({
  meetings,
  onAdd,
}: {
  meetings: MeetingSummary[]
  onAdd: (date: string) => void
}) {
  const navigate = useNavigate()
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  const firstDay = new Date(year, month, 1)
  const startOffset = (firstDay.getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7
  const cells: (number | null)[] = Array(totalCells).fill(null)
  for (let d = 1; d <= daysInMonth; d++) cells[startOffset + d - 1] = d

  const byDay = new Map<number, MeetingSummary[]>()
  for (const m of meetings) {
    const d = new Date(m.date)
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getUTCDate()
      if (!byDay.has(day)) byDay.set(day, [])
      byDay.get(day)!.push(m)
    }
  }

  const todayDay = today.getFullYear() === year && today.getMonth() === month ? today.getDate() : null

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
        <button onClick={prevMonth} className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
          <ChevronLeftIcon className="w-4 h-4" />
        </button>
        <h3 className="text-sm font-semibold text-slate-900">
          {new Date(year, month, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
        </h3>
        <button onClick={nextMonth} className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
          <ChevronRightIcon className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 border-b border-slate-100">
        {WEEKDAYS.map(d => (
          <div key={d} className="py-2 text-center text-[11px] font-semibold text-slate-400 uppercase tracking-wide">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {cells.map((day, i) => {
          const eventsOnDay = day ? (byDay.get(day) ?? []) : []
          const isToday = day === todayDay
          const isWeekend = i % 7 >= 5
          const dateStr = day
            ? `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
            : ''

          return (
            <div
              key={i}
              onClick={() => day && onAdd(dateStr)}
              className={[
                'min-h-[80px] p-1.5 border-b border-r border-slate-100 last:border-r-0',
                day ? 'cursor-pointer hover:bg-slate-50 transition-colors' : 'bg-slate-50/50',
                isWeekend && day ? 'bg-slate-50/70' : '',
              ].join(' ')}
            >
              {day && (
                <>
                  <span className={[
                    'inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium mb-1',
                    isToday ? 'bg-indigo-500 text-white' : 'text-slate-600',
                  ].join(' ')}>
                    {day}
                  </span>
                  <div className="space-y-0.5">
                    {eventsOnDay.slice(0, 3).map(m => {
                      const c = TYPE_COLOURS[m.type]
                      return (
                        <div
                          key={m.id}
                          onClick={e => { e.stopPropagation(); navigate(`/meetings/${m.id}`) }}
                          title={m.title ?? TYPE_LABELS[m.type]}
                          className={`truncate text-[11px] font-medium px-1.5 py-0.5 rounded cursor-pointer ${c.bg} ${c.text}`}
                        >
                          {meetingDisplayName(m)}
                          {m.attendingCount > 0 && (
                            <span className="ml-1 opacity-60">·{m.attendingCount}</span>
                          )}
                        </div>
                      )
                    })}
                    {eventsOnDay.length > 3 && (
                      <p className="text-[10px] text-slate-400 pl-1">+{eventsOnDay.length - 3} more</p>
                    )}
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────

type View = 'list' | 'calendar'
type Tab  = 'upcoming' | 'past'

function todayIso() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function MeetingsPage() {
  const [meetings, setMeetings] = useState<MeetingSummary[]>([])
  const [loading, setLoading]   = useState(true)
  const [view, setView]         = useState<View>('list')
  const [tab, setTab]           = useState<Tab>('upcoming')
  const [showModal, setShowModal]   = useState(false)
  const [prefillDate, setPrefillDate] = useState<string | undefined>()

  useEffect(() => {
    meetingsApi.list()
      .then(setMeetings)
      .finally(() => setLoading(false))
  }, [])

  async function handleDelete(m: MeetingSummary) {
    await meetingsApi.remove(m.id)
    setMeetings(prev => prev.filter(x => x.id !== m.id))
  }

  function openAdd(date?: string) {
    setPrefillDate(date)
    setShowModal(true)
  }

  const today = todayIso()
  const upcoming = meetings.filter(m => m.date >= today)
  const past     = [...meetings.filter(m => m.date < today)].reverse()
  const listMeetings = tab === 'upcoming' ? upcoming : past

  return (
    <div className="px-6 py-5 md:px-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-semibold text-slate-900">Meetings</h1>

        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 gap-0.5">
            <button
              onClick={() => setView('list')}
              title="List view"
              className={[
                'p-1.5 rounded-md transition-colors',
                view === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600',
              ].join(' ')}
            >
              <ListBulletIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setView('calendar')}
              title="Calendar view"
              className={[
                'p-1.5 rounded-md transition-colors',
                view === 'calendar' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600',
              ].join(' ')}
            >
              <CalendarDaysIcon className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => openAdd()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium transition-colors"
          >
            <PlusIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Add event</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>
      </div>

      {/* Tabs — list view only */}
      {view === 'list' && (
        <div className="flex gap-5 border-b border-slate-200 mb-6">
          {(['upcoming', 'past'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={[
                'pb-2.5 text-sm font-medium capitalize transition-colors border-b-2 -mb-px',
                tab === t
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700',
              ].join(' ')}
            >
              {t}
              {!loading && (
                <span className={[
                  'ml-2 text-xs px-1.5 py-0.5 rounded-full',
                  tab === t ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-400',
                ].join(' ')}>
                  {t === 'upcoming' ? upcoming.length : past.length}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : view === 'list' ? (
        <ListView
          meetings={listMeetings}
          onDelete={handleDelete}
          emptyMessage={tab === 'upcoming' ? 'No upcoming meetings' : 'No past meetings'}
        />
      ) : (
        <CalendarView meetings={meetings} onAdd={openAdd} />
      )}

      {showModal && (
        <AddMeetingModal
          prefillDate={prefillDate}
          onClose={() => { setShowModal(false); setPrefillDate(undefined) }}
        />
      )}
    </div>
  )
}
