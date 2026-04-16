import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MagnifyingGlassIcon, PlusIcon, EllipsisHorizontalIcon } from '@heroicons/react/24/outline'
import { peopleApi, PersonSummary } from '../api/people'
import { LODGE_ROLES } from '../api/offices'
import { AddPersonModal } from '../components/AddPersonModal'

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

// Returns the most senior active office (lowest index in LODGE_ROLES precedence list)
function primaryOffice(offices: string[]): string | null {
  if (!offices.length) return null
  return [...offices].sort(
    (a, b) => (LODGE_ROLES as readonly string[]).indexOf(a) - (LODGE_ROLES as readonly string[]).indexOf(b)
  )[0]
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  return status === 'Active' ? (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
      Active
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500">
      <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
      Inactive
    </span>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────

type Tab = 'Member' | 'Guest'

export function PeoplePage() {
  const navigate = useNavigate()
  const [all, setAll] = useState<PersonSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('Member')
  const [query, setQuery] = useState('')
  const [showAdd, setShowAdd] = useState(false)

  useEffect(() => {
    peopleApi.list()
      .then(setAll)
      .finally(() => setLoading(false))
  }, [])

  const byType = (t: Tab) => all.filter((p) => p.type === t)
  const source = byType(tab)
  const filtered = query.trim()
    ? source.filter((p) =>
        `${p.firstName} ${p.lastName}`.toLowerCase().includes(query.toLowerCase()),
      )
    : source

  function handleCreated(person: PersonSummary) {
    setAll((prev) => [...prev, person])
    setTab(person.type as Tab)
  }

  return (
    <div className="px-6 py-5 md:px-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold text-slate-900">People</h1>
        <button
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium transition-colors"
        >
          <PlusIcon className="w-4 h-4" />
          <span className="hidden sm:inline">Add person</span>
          <span className="sm:hidden">Add</span>
        </button>
      </div>

      {/* Card */}
      <div className="bg-white rounded-xl border border-slate-200">
        {/* Tabs + search */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 px-5 pt-3 pb-0 border-b border-slate-100">
          <div className="flex -mb-px">
            {([
              { key: 'Member', label: 'Members' },
              { key: 'Guest',  label: 'Guests'  },
            ] as const).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => { setTab(key); setQuery('') }}
                className={[
                  'flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 transition-colors',
                  tab === key
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700',
                ].join(' ')}
              >
                {label}
                <span className={[
                  'text-xs px-1.5 py-0.5 rounded-full font-medium',
                  tab === key ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-400',
                ].join(' ')}>
                  {byType(key).length}
                </span>
              </button>
            ))}
          </div>

          <div className="sm:ml-auto pb-3 sm:pb-0">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full sm:w-48 pl-8 pr-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg
                           text-slate-900 placeholder-slate-400
                           focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Body */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-6">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mb-3">
              <MagnifyingGlassIcon className="w-5 h-5 text-slate-400" />
            </div>
            <p className="text-sm font-medium text-slate-600">
              {query ? 'No results' : tab === 'Member' ? 'No members yet' : 'No guests yet'}
            </p>
            <p className="mt-0.5 text-xs text-slate-400">
              {query ? 'Try a different search.' : 'Add someone using the button above.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left px-5 py-2.5 text-xs font-medium text-slate-400 uppercase tracking-wider w-full">Name</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-400 uppercase tracking-wider whitespace-nowrap hidden sm:table-cell">Office</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-400 uppercase tracking-wider whitespace-nowrap">Status</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-400 uppercase tracking-wider whitespace-nowrap hidden md:table-cell">
                    {tab === 'Member' ? 'Joined' : 'Added'}
                  </th>
                  <th className="px-4 py-2.5 w-8" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((person) => {
                  const fullName = `${person.firstName} ${person.lastName}`
                  return (
                    <tr
                      key={person.id}
                      className="group hover:bg-slate-50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/people/${person.id}`)}
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-semibold ${avatarColour(fullName)}`}>
                            {initials(person.firstName, person.lastName)}
                          </div>
                          <div>
                            <span className="font-medium text-slate-900">{fullName}</span>
                            {person.email && (
                              <span className="ml-2 text-xs text-slate-400">{person.email}</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap hidden sm:table-cell">
                        {(() => {
                          const office = primaryOffice(person.activeOffices ?? [])
                          if (!office) return <span className="text-xs text-slate-400">—</span>
                          return (
                            <span className="text-xs font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">
                              {office}
                            </span>
                          )
                        })()}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <StatusBadge status={person.status} />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-500 hidden md:table-cell">
                        {new Date(person.createdAt).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <button className="p-1 rounded-md text-slate-300 hover:text-slate-600 hover:bg-slate-100 opacity-0 group-hover:opacity-100 transition-all">
                          <EllipsisHorizontalIcon className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAdd && (
        <AddPersonModal
          onClose={() => setShowAdd(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  )
}
