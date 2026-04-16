import { useEffect, useState } from 'react'
import { postsApi, PostSummary, PostDetail } from '../api/posts'
import { PostEditorModal } from '../components/PostEditorModal'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

export function NewsPage() {
  const [posts, setPosts]         = useState<PostSummary[]>([])
  const [loading, setLoading]     = useState(true)
  const [modalPost, setModalPost] = useState<PostDetail | null | undefined>(undefined) // undefined = closed
  const [deleting, setDeleting]   = useState<string | null>(null)

  async function load() {
    setLoading(true)
    try {
      setPosts(await postsApi.list())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function openEdit(id: string) {
    const full = await postsApi.get(id)
    setModalPost(full)
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this post?')) return
    setDeleting(id)
    try {
      await postsApi.delete(id)
      setPosts(p => p.filter(x => x.id !== id))
    } finally {
      setDeleting(null)
    }
  }

  const isOpen = modalPost !== undefined

  return (
    <div className="px-6 py-5 md:px-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs font-medium text-indigo-500 uppercase tracking-widest mb-0.5">Admin</p>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">News</h1>
        </div>
        <button
          onClick={() => setModalPost(null)}
          className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-700
                     text-white text-sm font-medium rounded-lg transition-colors"
        >
          New post
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-slate-400 text-sm">No posts yet. Create your first one.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {posts.map(post => (
            <div
              key={post.id}
              className="flex items-center gap-4 px-4 py-3.5 bg-white border border-slate-200 rounded-xl"
            >
              {/* Status dot */}
              <span
                className={[
                  'shrink-0 w-2 h-2 rounded-full',
                  post.isPublished ? 'bg-emerald-400' : 'bg-slate-300',
                ].join(' ')}
                title={post.isPublished ? 'Published' : 'Draft'}
              />

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{post.title}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {post.isPublished && post.publishedAt
                    ? `Published ${formatDate(post.publishedAt)}`
                    : `Draft · Updated ${formatDate(post.updatedAt)}`}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => openEdit(post.id)}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors px-2 py-1 rounded hover:bg-indigo-50"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(post.id)}
                  disabled={deleting === post.id}
                  className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors px-2 py-1 rounded hover:bg-red-50 disabled:opacity-50"
                >
                  {deleting === post.id ? '…' : 'Delete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isOpen && (
        <PostEditorModal
          post={modalPost}
          onClose={() => setModalPost(undefined)}
          onSaved={() => { setModalPost(undefined); load() }}
        />
      )}
    </div>
  )
}
