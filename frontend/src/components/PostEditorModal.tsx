import { useEffect, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import { postsApi, PostDetail } from '../api/posts'

// ── Toolbar button ─────────────────────────────────────────────────────────────

function ToolBtn({
  active,
  onClick,
  title,
  children,
}: {
  active?: boolean
  onClick: () => void
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={e => { e.preventDefault(); onClick() }}
      className={[
        'px-2 py-1 text-sm rounded transition-colors',
        active
          ? 'bg-slate-700 text-white'
          : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800',
      ].join(' ')}
    >
      {children}
    </button>
  )
}

// ── Modal ─────────────────────────────────────────────────────────────────────

interface Props {
  post: PostDetail | null   // null = new
  onClose: () => void
  onSaved: () => void
}

export function PostEditorModal({ post, onClose, onSaved }: Props) {
  const [title, setTitle]           = useState(post?.title ?? '')
  const [isPublished, setPublished] = useState(post?.isPublished ?? false)
  const [saving, setSaving]         = useState(false)
  const [error, setError]           = useState<string | null>(null)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false }),
    ],
    content: post?.content ?? '',
    editorProps: {
      attributes: {
        class: 'prose prose-slate max-w-none min-h-[240px] px-4 py-3 focus:outline-none text-sm',
      },
    },
  })

  // Sync content when switching posts
  useEffect(() => {
    if (editor && post?.content !== undefined) {
      editor.commands.setContent(post.content)
    }
    setTitle(post?.title ?? '')
    setPublished(post?.isPublished ?? false)
  }, [post?.id])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSaving(true)
    const content = editor?.getHTML() ?? ''
    try {
      if (post) {
        await postsApi.update(post.id, { title, content, isPublished })
      } else {
        await postsApi.create({ title, content, isPublished })
      }
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save post')
    } finally {
      setSaving(false)
    }
  }

  function setLink() {
    const url = window.prompt('URL')
    if (!url) return
    editor?.chain().focus().setLink({ href: url }).run()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-base font-semibold text-slate-900">
            {post ? 'Edit post' : 'New post'}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors text-xl leading-none"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
            {/* Title */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Post title"
                className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg
                           text-slate-900 placeholder-slate-400
                           focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* Rich editor */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Content</label>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                {/* Toolbar */}
                <div className="flex flex-wrap gap-0.5 px-2 py-1.5 border-b border-slate-200 bg-slate-50">
                  <ToolBtn
                    active={editor?.isActive('bold')}
                    onClick={() => editor?.chain().focus().toggleBold().run()}
                    title="Bold"
                  >
                    <strong>B</strong>
                  </ToolBtn>
                  <ToolBtn
                    active={editor?.isActive('italic')}
                    onClick={() => editor?.chain().focus().toggleItalic().run()}
                    title="Italic"
                  >
                    <em>I</em>
                  </ToolBtn>
                  <ToolBtn
                    active={editor?.isActive('underline')}
                    onClick={() => editor?.chain().focus().toggleUnderline().run()}
                    title="Underline"
                  >
                    <span className="underline">U</span>
                  </ToolBtn>
                  <span className="w-px bg-slate-200 mx-1" />
                  <ToolBtn
                    active={editor?.isActive('heading', { level: 2 })}
                    onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
                    title="Heading 2"
                  >
                    H2
                  </ToolBtn>
                  <ToolBtn
                    active={editor?.isActive('heading', { level: 3 })}
                    onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
                    title="Heading 3"
                  >
                    H3
                  </ToolBtn>
                  <span className="w-px bg-slate-200 mx-1" />
                  <ToolBtn
                    active={editor?.isActive('bulletList')}
                    onClick={() => editor?.chain().focus().toggleBulletList().run()}
                    title="Bullet list"
                  >
                    • List
                  </ToolBtn>
                  <ToolBtn
                    active={editor?.isActive('orderedList')}
                    onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                    title="Numbered list"
                  >
                    1. List
                  </ToolBtn>
                  <span className="w-px bg-slate-200 mx-1" />
                  <ToolBtn
                    active={editor?.isActive('blockquote')}
                    onClick={() => editor?.chain().focus().toggleBlockquote().run()}
                    title="Blockquote"
                  >
                    "Quote"
                  </ToolBtn>
                  <ToolBtn
                    active={editor?.isActive('link')}
                    onClick={setLink}
                    title="Link"
                  >
                    Link
                  </ToolBtn>
                  {editor?.isActive('link') && (
                    <ToolBtn
                      onClick={() => editor?.chain().focus().unsetLink().run()}
                      title="Remove link"
                    >
                      Unlink
                    </ToolBtn>
                  )}
                </div>

                {/* Editor area */}
                <EditorContent editor={editor} />
              </div>
            </div>

            {/* Publish toggle */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                role="switch"
                aria-checked={isPublished}
                onClick={() => setPublished(p => !p)}
                className={[
                  'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent',
                  'transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2',
                  isPublished ? 'bg-indigo-500' : 'bg-slate-200',
                ].join(' ')}
              >
                <span
                  className={[
                    'inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform',
                    isPublished ? 'translate-x-4' : 'translate-x-0',
                  ].join(' ')}
                />
              </button>
              <span className="text-sm text-slate-700">
                {isPublished ? 'Published' : 'Draft'}
              </span>
            </div>

            {error && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">{error}</p>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-200 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-500 hover:bg-indigo-600
                         rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving…' : post ? 'Save changes' : 'Create post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
