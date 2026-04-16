import { useEffect, useState } from 'react'
import { publicApi, PublicLodge, PublicEvent } from '../../api/public'
import { buildTheme, loadGoogleFont } from '../../theme'
import { PublicHeader, PublicFooter, EventCard } from './PublicHomePage'

export function PublicEventsPage() {
  const [lodge, setLodge] = useState<PublicLodge | null>(null)
  const [events, setEvents] = useState<PublicEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      publicApi.lodge(),
      publicApi.upcomingEvents(50),
    ]).then(([l, e]) => {
      setLodge(l)
      setEvents(e)
      if (l.themeFont) loadGoogleFont(l.themeFont)
      document.title = l.lodgeName
    }).finally(() => setLoading(false))
  }, [])

  const theme = buildTheme(lodge ?? {})

  return (
    <div className="min-h-screen bg-white flex flex-col" style={{ fontFamily: theme.fontFamily }}>
      <PublicHeader lodge={lodge} theme={theme} activePath="/public/events" loading={loading} />

      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-12">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Upcoming Events</h2>

        {loading ? (
          <div className="space-y-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex gap-5 py-6 border-b border-slate-100 animate-pulse">
                <div className="shrink-0 w-14">
                  <div className="h-3 w-8 bg-slate-200 rounded mx-auto mb-1" />
                  <div className="h-9 w-10 bg-slate-200 rounded mx-auto" />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-3/4" />
                  <div className="h-3 bg-slate-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-slate-400 text-sm">No upcoming events scheduled.</p>
          </div>
        ) : (
          <div>
            {events.map(e => <EventCard key={e.id} event={e} theme={theme} />)}
          </div>
        )}
      </main>

      <PublicFooter lodge={lodge} theme={theme} />
    </div>
  )
}
