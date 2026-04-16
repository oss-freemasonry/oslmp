import { useRef, useState } from 'react'
import { XMarkIcon, ArrowUpTrayIcon, GlobeAltIcon, LockClosedIcon } from '@heroicons/react/24/outline'
import {
  meetingsApi, MeetingDocument, DocumentType,
  DOCUMENT_TYPES, DOCUMENT_TYPE_LABELS,
} from '../api/meetings'

interface Props {
  meetingId: string
  onClose: () => void
  onUploaded: (doc: MeetingDocument) => void
}

export function AddDocumentModal({ meetingId, onClose, onUploaded }: Props) {
  const [file, setFile] = useState<File | null>(null)
  const [docType, setDocType] = useState<DocumentType>('Summons')
  const [name, setName] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null
    setFile(f)
    if (f && !name) setName(f.name.replace(/\.[^.]+$/, ''))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) { setError('Please select a file.'); return }
    setUploading(true); setError(null)
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('type', docType)
      if (name.trim()) form.append('name', name.trim())
      form.append('isPublic', String(isPublic))
      const doc = await meetingsApi.uploadDocument(meetingId, form)
      onUploaded(doc)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const inputClass = "w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-900">Add document</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Type */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-2">Type</label>
            <div className="flex flex-wrap gap-1.5">
              {DOCUMENT_TYPES.map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setDocType(t)}
                  className={[
                    'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border',
                    docType === t
                      ? 'bg-indigo-500 border-indigo-500 text-white'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300',
                  ].join(' ')}
                >
                  {DOCUMENT_TYPE_LABELS[t]}
                </button>
              ))}
            </div>
          </div>

          {/* File picker */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-2">File</label>
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.png,.jpg,.jpeg"
            />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className={[
                'w-full flex items-center gap-3 px-4 py-3 rounded-lg border-2 border-dashed transition-colors text-left',
                file
                  ? 'border-indigo-300 bg-indigo-50'
                  : 'border-slate-200 hover:border-slate-300 bg-slate-50',
              ].join(' ')}
            >
              <ArrowUpTrayIcon className={['w-5 h-5 shrink-0', file ? 'text-indigo-500' : 'text-slate-400'].join(' ')} />
              <div className="min-w-0">
                {file ? (
                  <>
                    <p className="text-sm font-medium text-slate-900 truncate">{file.name}</p>
                    <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(0)} KB</p>
                  </>
                ) : (
                  <p className="text-sm text-slate-500">Click to select a file</p>
                )}
              </div>
            </button>
          </div>

          {/* Name */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-2">
              Name <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. October 2025 Summons"
              className={inputClass}
            />
          </div>

          {/* Visibility */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-2">Visibility</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsPublic(false)}
                className={[
                  'flex-1 flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm transition-colors',
                  !isPublic
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300',
                ].join(' ')}
              >
                <LockClosedIcon className="w-4 h-4 shrink-0" />
                <div className="text-left">
                  <p className="text-xs font-medium">Private</p>
                  <p className="text-[10px] leading-tight text-current opacity-60">Members only</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setIsPublic(true)}
                className={[
                  'flex-1 flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm transition-colors',
                  isPublic
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300',
                ].join(' ')}
              >
                <GlobeAltIcon className="w-4 h-4 shrink-0" />
                <div className="text-left">
                  <p className="text-xs font-medium">Public</p>
                  <p className="text-[10px] leading-tight text-current opacity-60">Anyone with the link</p>
                </div>
              </button>
            </div>
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading || !file}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors disabled:opacity-60"
            >
              {uploading && <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              Upload
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
