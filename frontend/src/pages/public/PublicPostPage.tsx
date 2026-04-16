import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { publicApi, PublicLodge, PublicPostDetail } from '../../api/public'
import { buildTheme, loadGoogleFont } from '../../theme'
import { PublicHeader, PublicFooter } from './PublicHomePage'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

export function PublicPostPage() {
  const { id } = useParams<{ id: string }>()
  const [lodge, setLodge]   = useState<PublicLodge | null>(null)
  const [post, setPost]     = useState<PublicPostDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!id) return
    Promise.all([
      publicApi.lodge(),
      publicApi.post(id).catch(() => null),
    ]).then(([l, p]) => {
      setLodge(l)
      if (!p) { setNotFound(true) } else { setPost(p) }
      if (l.themeFont) loadGoogleFont(l.themeFont)
      document.title = p ? `${p.title} — ${l.lodgeName}` : l.lodgeName
    }).finally(() => setLoading(false))
  }, [id])

  const theme = buildTheme(lodge ?? {})

  return (
    <div className="min-h-screen bg-white flex flex-col" style={{ fontFamily: theme.fontFamily }}>
      <PublicHeader lodge={lodge} theme={theme} activePath="/public/news" loading={loading} />

      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-12">
        {loading ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-7 bg-slate-200 rounded w-3/4" />
            <div className="h-3 bg-slate-100 rounded w-1/4" />
            <div className="mt-8 space-y-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-3 bg-slate-100 rounded" style={{ width: `${70 + (i % 3) * 10}%` }} />
              ))}
            </div>
          </div>
        ) : notFound ? (
          <div className="py-16 text-center">
            <p className="text-slate-400 text-sm">Post not found.</p>
            <a href="/public/news" className="mt-4 inline-block text-sm text-indigo-600 hover:underline">
              ← Back to news
            </a>
          </div>
        ) : post ? (
          <>
            <a href="/public/news" className="text-xs text-slate-400 hover:text-slate-600 transition-colors">
              ← News
            </a>
            <h1 className="mt-4 text-2xl sm:text-3xl font-bold text-slate-900 leading-tight">
              {post.title}
            </h1>
            <p className="mt-2 text-sm text-slate-400">{formatDate(post.publishedAt)}</p>

            <div
              className="prose prose-slate mt-8"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </>
        ) : null}
      </main>

      <PublicFooter lodge={lodge} theme={theme} />
    </div>
  )
}
