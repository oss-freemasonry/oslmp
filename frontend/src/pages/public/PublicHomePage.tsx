import { useEffect, useState } from 'react'
import { publicApi, PublicLodge, PublicEvent, PublicEventType, PublicPostSummary } from '../../api/public'
import { buildTheme, loadGoogleFont, PublicTheme } from '../../theme'

// ── Helpers ────────────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<PublicEventType, string> = {
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

function eventDisplayName(e: PublicEvent): string {
  if ((e.type === 'Social' || e.type === 'Other') && e.title) return e.title
  return TYPE_LABELS[e.type]
}

function formatConsecratedAt(iso: string): string {
  const [year, month, day] = iso.split('-').map(Number)
  const d = new Date(year, month - 1, day)
  return `${ordinal(d.getDate())} ${d.toLocaleDateString('en-GB', { month: 'long' })} ${d.getFullYear()}`
}

// ── Shared topbar (used on every public page) ─────────────────────────────────

export function PublicHeader({
  lodge,
  theme,
  activePath,
  loading = false,
}: {
  lodge: PublicLodge | null
  theme: PublicTheme
  activePath: string
  loading?: boolean
}) {
  const lodgeName = lodge?.lodgeName ?? ''
  const logoUrl   = lodge?.logoUrl ?? null

  const links = [
    { href: '/public',        label: 'Home'   },
    { href: '/public/events', label: 'Events' },
    { href: '/public/news',   label: 'News'   },
  ]

  return (
    <header style={{ backgroundColor: theme.primary }} className="text-white">
      <div className="max-w-3xl mx-auto px-6 h-14 flex items-center gap-6">
        {/* Identity */}
        <div className="flex items-center gap-2.5 mr-auto min-w-0">
          {logoUrl && (
            <img
              src={logoUrl}
              alt={lodgeName}
              className="h-7 w-7 rounded-full object-contain ring-1 ring-white/20 shrink-0"
            />
          )}
          {loading ? (
            <div className="h-4 w-32 rounded animate-pulse" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }} />
          ) : (
            <span className="text-sm font-semibold tracking-tight truncate">{lodgeName}</span>
          )}
        </div>

        {/* Nav links */}
        <nav className="hidden sm:flex items-center gap-5">
          {links.map(({ href, label }) => (
            <a
              key={href}
              href={href}
              className="text-sm font-medium transition-colors"
              style={{ color: activePath === href ? '#fff' : 'rgba(255,255,255,0.5)' }}
            >
              {label}
            </a>
          ))}
        </nav>

        {/* Member area */}
        <a
          href="/"
          style={{ backgroundColor: theme.accent, color: theme.accentFg }}
          className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg transition-opacity hover:opacity-80"
        >
          Member area
        </a>
      </div>
    </header>
  )
}

// ── Footer ────────────────────────────────────────────────────────────────────

export function PublicFooter({ lodge, theme }: { lodge: PublicLodge | null; theme: PublicTheme }) {
  return (
    <footer style={{ backgroundColor: theme.primary }} className="text-xs text-center py-5 mt-auto">
      <p style={{ color: 'rgba(255,255,255,0.35)' }}>{lodge?.lodgeName ?? ''}</p>
    </footer>
  )
}

// ── Event card (used on Events page) ─────────────────────────────────────────

export function EventCard({ event, theme }: { event: PublicEvent; theme: PublicTheme }) {
  const d       = new Date(event.date)
  const day     = d.getUTCDate()
  const month   = d.toLocaleDateString('en-GB', { month: 'short' }).toUpperCase()
  const weekday = d.toLocaleDateString('en-GB', { weekday: 'long' })

  return (
    <div className="flex items-center gap-5 py-5 border-b border-slate-200 last:border-0">
      <div className="shrink-0 w-12 text-center">
        <p className="text-[10px] font-bold tracking-widest uppercase" style={{ color: theme.accent }}>{month}</p>
        <p className="text-3xl font-bold text-slate-900 leading-none mt-0.5">{day}</p>
        <p className="text-[10px] text-slate-400 tracking-wide mt-1 uppercase">{weekday.slice(0, 3)}</p>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-900 leading-snug">{eventDisplayName(event)}</p>
        {event.summary && <p className="text-xs text-slate-500 mt-0.5">{event.summary}</p>}
        <div className="flex flex-wrap gap-x-3 mt-1 text-xs text-slate-500">
          {event.time     && <span>{event.time}</span>}
          {event.location && <span>{event.location}</span>}
        </div>
        {event.diningEnabled && (
          <span className="mt-1.5 inline-flex text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-px rounded-full">
            Dining{event.diningTime ? ` · ${event.diningTime}` : ''}{event.diningLocation ? ` · ${event.diningLocation}` : ''}
          </span>
        )}
      </div>
      <a
        href={`/public/events/${event.id}/rsvp`}
        style={{ backgroundColor: theme.accent, color: theme.accentFg }}
        className="shrink-0 px-4 py-2 text-sm font-semibold rounded-lg transition-opacity hover:opacity-80"
      >
        RSVP
      </a>
    </div>
  )
}

// ── Identity hero (homepage only) ─────────────────────────────────────────────

function IdentityHero({ lodge, theme }: { lodge: PublicLodge | null; theme: PublicTheme }) {
  const lodgeName     = lodge?.lodgeName ?? ''
  const logoUrl       = lodge?.logoUrl ?? null
  const summary       = lodge?.summary ?? null
  const consecratedAt = lodge?.consecratedAt ?? null

  return (
    <div className="bg-slate-50 border-b border-slate-200 text-center py-10 px-6">
      {logoUrl && (
        <img
          src={logoUrl}
          alt={`${lodgeName} crest`}
          className="h-16 w-16 object-contain rounded-full mx-auto mb-5 ring-2 ring-white shadow-sm"
        />
      )}
      <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{lodgeName}</h1>
      {consecratedAt && (
        <p className="mt-1 text-xs tracking-widest text-slate-400 uppercase">
          Consecrated {formatConsecratedAt(consecratedAt)}
        </p>
      )}
      {summary && (
        <>
          <div className="mt-4 h-px w-10 mx-auto" style={{ backgroundColor: theme.accent }} />
          <p className="mt-4 text-sm text-slate-500 leading-relaxed max-w-md mx-auto">{summary}</p>
        </>
      )}
    </div>
  )
}

// ── Next meeting section (homepage only) ──────────────────────────────────────

function NextMeeting({ event, theme }: { event: PublicEvent; theme: PublicTheme }) {
  const d       = new Date(event.date)
  const day     = d.getUTCDate()
  const month   = d.toLocaleDateString('en-GB', { month: 'short' }).toUpperCase()
  const year    = d.getUTCFullYear()
  const weekday = d.toLocaleDateString('en-GB', { weekday: 'long' })
  const fullDate = `${weekday} ${ordinal(day)} ${d.toLocaleDateString('en-GB', { month: 'long' })} ${year}`

  return (
    <section>
      <p className="text-[11px] font-bold tracking-widest text-slate-400 uppercase mb-4">Next meeting</p>

      <div className="flex items-start gap-6">
        {/* Calendar block */}
        <div
          className="shrink-0 w-16 rounded-xl overflow-hidden shadow-sm border border-slate-200 text-center"
        >
          <div className="py-1" style={{ backgroundColor: theme.primary }}>
            <p className="text-[10px] font-bold tracking-widest text-white/70 uppercase">{month}</p>
          </div>
          <div className="py-2 bg-white">
            <p className="text-3xl font-bold text-slate-900 leading-none">{day}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{year}</p>
          </div>
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <p className="text-base font-semibold text-slate-900 leading-snug">{eventDisplayName(event)}</p>
          <p className="text-sm text-slate-500 mt-0.5">{fullDate}</p>

          <div className="flex flex-wrap gap-x-4 mt-2 text-sm text-slate-500">
            {event.time     && <span>{event.time}</span>}
            {event.location && <span>{event.location}</span>}
          </div>

          {event.diningEnabled && (
            <span className="mt-2 inline-flex text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
              Dining
              {event.diningTime     ? ` · ${event.diningTime}`     : ''}
              {event.diningLocation ? ` · ${event.diningLocation}` : ''}
            </span>
          )}

          {event.summary && (
            <p className="mt-2 text-sm text-slate-500">{event.summary}</p>
          )}

          <div className="mt-4">
            <a
              href={`/public/events/${event.id}/rsvp`}
              style={{ backgroundColor: theme.accent, color: theme.accentFg }}
              className="inline-flex px-5 py-2 text-sm font-semibold rounded-lg transition-opacity hover:opacity-80"
            >
              RSVP for this meeting
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────

export function PublicHomePage() {
  const [lodge, setLodge]     = useState<PublicLodge | null>(null)
  const [events, setEvents]   = useState<PublicEvent[]>([])
  const [posts, setPosts]     = useState<PublicPostSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      publicApi.lodge(),
      publicApi.upcomingEvents(1),
      publicApi.latestPosts(4),
    ]).then(([l, e, p]) => {
      setLodge(l)
      setEvents(e)
      setPosts(p)
      if (l.themeFont) loadGoogleFont(l.themeFont)
      document.title = l.lodgeName
    }).finally(() => setLoading(false))
  }, [])

  const theme     = buildTheme(lodge ?? {})
  const nextEvent = events[0] ?? null

  return (
    <div className="min-h-screen bg-white flex flex-col" style={{ fontFamily: theme.fontFamily }}>
      <PublicHeader lodge={lodge} theme={theme} activePath="/public" loading={loading} />

      {/* Identity — always shown, skeleton while loading */}
      {loading ? (
        <div className="bg-slate-50 border-b border-slate-200 py-10 px-6 text-center animate-pulse">
          <div className="h-6 w-48 bg-slate-200 rounded mx-auto mb-2" />
          <div className="h-3 w-32 bg-slate-100 rounded mx-auto" />
        </div>
      ) : (
        <IdentityHero lodge={lodge} theme={theme} />
      )}

      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-10 space-y-12">

        {/* Next meeting */}
        {loading ? (
          <section className="animate-pulse">
            <div className="h-3 w-24 bg-slate-200 rounded mb-5" />
            <div className="flex gap-6">
              <div className="w-16 h-20 bg-slate-100 rounded-xl" />
              <div className="flex-1 space-y-2 pt-1">
                <div className="h-5 bg-slate-200 rounded w-2/3" />
                <div className="h-4 bg-slate-100 rounded w-1/2" />
                <div className="h-4 bg-slate-100 rounded w-1/3" />
              </div>
            </div>
          </section>
        ) : nextEvent ? (
          <NextMeeting event={nextEvent} theme={theme} />
        ) : (
          <section>
            <p className="text-[11px] font-bold tracking-widest text-slate-400 uppercase mb-4">Next meeting</p>
            <p className="text-sm text-slate-400">
              No upcoming meetings scheduled. <a href="/public/events" className="underline hover:text-slate-600">View all events</a>
            </p>
          </section>
        )}

        {/* Divider */}
        <hr className="border-slate-200" />

        {/* Latest news */}
        <section>
          <div className="flex items-baseline justify-between mb-5">
            <p className="text-[11px] font-bold tracking-widest text-slate-400 uppercase">Latest News</p>
            {!loading && posts.length > 0 && (
              <a href="/public/news" className="text-xs text-slate-400 hover:text-slate-600 transition-colors">
                All posts →
              </a>
            )}
          </div>

          {loading ? (
            <div className="space-y-4 animate-pulse">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex justify-between">
                  <div className="h-4 bg-slate-100 rounded w-1/2" />
                  <div className="h-4 bg-slate-100 rounded w-20" />
                </div>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <p className="text-sm text-slate-400">No posts published yet.</p>
          ) : (
            <div>
              {posts.map(post => {
                const date = new Date(post.publishedAt).toLocaleDateString('en-GB', {
                  day: 'numeric', month: 'short', year: 'numeric',
                })
                return (
                  <a
                    key={post.id}
                    href={`/public/news/${post.id}`}
                    className="group flex items-baseline justify-between gap-6 py-3.5 border-b border-slate-100 last:border-0"
                  >
                    <span className="text-sm text-slate-800 group-hover:text-slate-600 transition-colors font-medium leading-snug">
                      {post.title}
                    </span>
                    <span className="shrink-0 text-xs text-slate-400 tabular-nums">{date}</span>
                  </a>
                )
              })}
            </div>
          )}
        </section>

      </main>

      <PublicFooter lodge={lodge} theme={theme} />
    </div>
  )
}
