import { useEffect, useState } from 'react'
import { publicApi, PublicLodge, PublicPostSummary } from '../../api/public'
import { buildTheme, loadGoogleFont } from '../../theme'
import { PublicHeader, PublicFooter } from './PublicHomePage'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

export function PublicNewsPage() {
  const [lodge, setLodge]   = useState<PublicLodge | null>(null)
  const [posts, setPosts]   = useState<PublicPostSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      publicApi.lodge(),
      publicApi.latestPosts(50),
    ]).then(([l, p]) => {
      setLodge(l)
      setPosts(p)
      if (l.themeFont) loadGoogleFont(l.themeFont)
      document.title = l.lodgeName
    }).finally(() => setLoading(false))
  }, [])

  const theme = buildTheme(lodge ?? {})

  return (
    <div className="min-h-screen bg-white flex flex-col" style={{ fontFamily: theme.fontFamily }}>
      <PublicHeader lodge={lodge} theme={theme} activePath="/public/news" loading={loading} />

      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-12">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">News</h2>

        {loading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="py-5 border-b border-slate-100 animate-pulse space-y-2">
                <div className="h-4 bg-slate-200 rounded w-2/3" />
                <div className="h-3 bg-slate-100 rounded w-1/4" />
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-slate-400 text-sm">No posts published yet.</p>
          </div>
        ) : (
          <div>
            {posts.map(post => (
              <a
                key={post.id}
                href={`/public/news/${post.id}`}
                className="group block py-5 border-b border-slate-200 last:border-0 hover:no-underline"
              >
                <p className="text-base font-semibold text-slate-900 group-hover:text-indigo-700 transition-colors leading-snug">
                  {post.title}
                </p>
                <p className="text-xs text-slate-400 mt-1">{formatDate(post.publishedAt)}</p>
              </a>
            ))}
          </div>
        )}
      </main>

      <PublicFooter lodge={lodge} theme={theme} />
    </div>
  )
}
