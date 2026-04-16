import { FormEvent, useState, useEffect } from 'react'
import { api } from '../api/client'
import { useLodge } from '../context/LodgeContext'
import { useAuth } from '../context/AuthContext'
import { THEME_PRESETS, FONT_OPTIONS, buildTheme, loadGoogleFont } from '../theme'

const inputCls = `w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg
  text-slate-900 placeholder-slate-400
  focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow`

export function SettingsPage() {
  const { settings, refresh } = useLodge()
  const { user } = useAuth()

  // Lodge settings (admin only)
  const [lodgeName,     setLodgeName]     = useState(settings.lodgeName)
  const [logoUrl,       setLogoUrl]       = useState(settings.logoUrl ?? '')
  const [summary,       setSummary]       = useState(settings.summary ?? '')
  const [consecratedAt, setConsecratedAt] = useState(settings.consecratedAt ?? '')

  // Theme
  const DEFAULT_PRIMARY   = '#0f172a'
  const DEFAULT_SECONDARY = '#1e293b'
  const DEFAULT_ACCENT    = '#fbbf24'

  const [primaryColor,   setPrimaryColor]   = useState(settings.themePrimaryColor   ?? DEFAULT_PRIMARY)
  const [secondaryColor, setSecondaryColor] = useState(settings.themeSecondaryColor ?? DEFAULT_SECONDARY)
  const [accentColor,    setAccentColor]    = useState(settings.themeAccentColor    ?? DEFAULT_ACCENT)
  const [themeFont,      setThemeFont]      = useState(settings.themeFont           ?? '')

  const [saving,     setSaving]     = useState(false)
  const [saved,      setSaved]      = useState(false)
  const [lodgeError, setLodgeError] = useState<string | null>(null)

  useEffect(() => {
    setLodgeName(settings.lodgeName)
    setLogoUrl(settings.logoUrl ?? '')
    setSummary(settings.summary ?? '')
    setConsecratedAt(settings.consecratedAt ?? '')
    setPrimaryColor(settings.themePrimaryColor   ?? DEFAULT_PRIMARY)
    setSecondaryColor(settings.themeSecondaryColor ?? DEFAULT_SECONDARY)
    setAccentColor(settings.themeAccentColor    ?? DEFAULT_ACCENT)
    setThemeFont(settings.themeFont ?? '')
  }, [settings])

  // Load Google Font for preview when font changes
  useEffect(() => { if (themeFont) loadGoogleFont(themeFont) }, [themeFont])

  // Change own password (DB users only — not the admin account)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword,     setNewPassword]     = useState('')
  const [changingPassword, setChangingPassword] = useState(false)
  const [passwordSaved,    setPasswordSaved]    = useState(false)
  const [passwordError,    setPasswordError]    = useState<string | null>(null)

  const isAdmin        = user?.role === 'admin'
  const isBuiltInAdmin = user?.username === 'admin'

  const previewTheme = buildTheme({
    themePrimaryColor:   primaryColor,
    themeSecondaryColor: secondaryColor,
    themeAccentColor:    accentColor,
    themeFont,
  })

  async function handleLodgeSubmit(e: FormEvent) {
    e.preventDefault()
    setLodgeError(null)
    setSaved(false)
    setSaving(true)
    try {
      await api.put('/lodge-settings', {
        lodgeName,
        logoUrl: logoUrl || null,
        summary: summary || null,
        consecratedAt: consecratedAt || null,
        themePrimaryColor:   primaryColor   !== DEFAULT_PRIMARY   ? primaryColor   : null,
        themeSecondaryColor: secondaryColor !== DEFAULT_SECONDARY ? secondaryColor : null,
        themeAccentColor:    accentColor    !== DEFAULT_ACCENT    ? accentColor    : null,
        themeFont: themeFont || null,
      })
      await refresh()
      setSaved(true)
    } catch (err) {
      setLodgeError(err instanceof Error ? err.message : 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  async function handlePasswordSubmit(e: FormEvent) {
    e.preventDefault()
    setPasswordError(null)
    setPasswordSaved(false)
    setChangingPassword(true)
    try {
      await api.put('/auth/password', { currentPassword, newPassword })
      setCurrentPassword('')
      setNewPassword('')
      setPasswordSaved(true)
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Failed to change password')
    } finally {
      setChangingPassword(false)
    }
  }

  return (
    <div className="px-6 py-5 md:px-8 max-w-xl space-y-10">
      {/* Lodge settings — admin only */}
      <section>
        <h1 className="text-lg font-semibold text-slate-900 mb-6">Lodge settings</h1>

        {!isAdmin ? (
          <p className="text-sm text-slate-500">Only administrators can change lodge settings.</p>
        ) : (
          <form onSubmit={handleLodgeSubmit} className="space-y-5">
            {/* Lodge name */}
            <div>
              <label htmlFor="lodgeName" className="block text-xs font-medium text-slate-600 mb-1.5">Lodge name</label>
              <input id="lodgeName" type="text" required value={lodgeName}
                onChange={e => setLodgeName(e.target.value)}
                className={inputCls} placeholder="e.g. Lodge of Harmony No. 123" />
            </div>

            {/* Logo URL */}
            <div>
              <label htmlFor="logoUrl" className="block text-xs font-medium text-slate-600 mb-1.5">
                Logo URL <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <input id="logoUrl" type="url" value={logoUrl}
                onChange={e => setLogoUrl(e.target.value)}
                className={inputCls} placeholder="https://example.com/lodge-crest.png" />
              {logoUrl && (
                <div className="mt-3 flex items-center gap-3">
                  <img src={logoUrl} alt="Logo preview"
                    className="w-10 h-10 rounded-lg object-cover border border-slate-200"
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                  <span className="text-xs text-slate-400">Preview</span>
                </div>
              )}
            </div>

            {/* Summary */}
            <div>
              <label htmlFor="summary" className="block text-xs font-medium text-slate-600 mb-1.5">
                Summary <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <textarea id="summary" rows={4} value={summary}
                onChange={e => setSummary(e.target.value)}
                className={`${inputCls} resize-y`}
                placeholder="A brief description of your lodge shown on the public homepage." />
            </div>

            {/* Consecration date */}
            <div>
              <label htmlFor="consecratedAt" className="block text-xs font-medium text-slate-600 mb-1.5">
                Consecration date <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <input id="consecratedAt" type="date" value={consecratedAt}
                onChange={e => setConsecratedAt(e.target.value)} className={inputCls} />
            </div>

            {/* ── Appearance ────────────────────────────────────────────── */}
            <div className="border-t border-slate-200 pt-5 space-y-5">
              <div>
                <p className="text-xs font-semibold text-slate-700 mb-0.5">Public site appearance</p>
                <p className="text-xs text-slate-400">Customise how your public lodge page looks.</p>
              </div>

              {/* Presets */}
              <div>
                <p className="text-xs font-medium text-slate-600 mb-2">Presets</p>
                <div className="flex flex-wrap gap-2">
                  {THEME_PRESETS.map(preset => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => {
                        setPrimaryColor(preset.primary)
                        setSecondaryColor(preset.secondary)
                        setAccentColor(preset.accent)
                      }}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 text-xs font-medium text-slate-700 transition-colors"
                    >
                      {/* Swatch */}
                      <span className="flex gap-0.5">
                        <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: preset.primary }} />
                        <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: preset.secondary }} />
                        <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: preset.accent }} />
                      </span>
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Colour pickers */}
              <div>
                <p className="text-xs font-medium text-slate-600 mb-2">Colours</p>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Primary',   value: primaryColor,   set: setPrimaryColor },
                    { label: 'Secondary', value: secondaryColor, set: setSecondaryColor },
                    { label: 'Accent',    value: accentColor,    set: setAccentColor },
                  ].map(({ label, value, set }) => (
                    <div key={label}>
                      <p className="text-[10px] text-slate-500 mb-1">{label}</p>
                      <label className="flex items-center gap-2 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer hover:border-slate-300 transition-colors">
                        <span className="w-5 h-5 rounded shrink-0 border border-white/50 shadow-sm" style={{ backgroundColor: value }} />
                        <span className="text-xs font-mono text-slate-600">{value}</span>
                        <input type="color" value={value} onChange={e => set(e.target.value)}
                          className="sr-only" />
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Live preview strip */}
              <div className="rounded-lg overflow-hidden border border-slate-200">
                <div style={{ backgroundColor: previewTheme.primary }} className="px-4 py-3 flex items-center justify-between">
                  <span className="text-sm font-bold text-white">{lodgeName || 'Lodge Name'}</span>
                  <span style={{ backgroundColor: previewTheme.accent, color: previewTheme.accentFg }}
                    className="text-xs font-semibold px-2.5 py-1 rounded-md">
                    RSVP
                  </span>
                </div>
                <div style={{ backgroundColor: previewTheme.secondary }} className="px-4 py-2 flex gap-4">
                  <span className="text-xs text-white font-medium">Home</span>
                  <span className="text-xs text-white/50">Events</span>
                </div>
              </div>

              {/* Font */}
              <div>
                <p className="text-xs font-medium text-slate-600 mb-2">Font</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {FONT_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setThemeFont(opt.value)}
                      className={`px-3 py-2.5 text-sm rounded-lg border text-left transition-colors ${
                        themeFont === opt.value
                          ? 'border-indigo-400 bg-indigo-50 text-indigo-700'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                      style={{ fontFamily: opt.fontFamily }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {lodgeError && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">{lodgeError}</p>
            )}
            {saved && <p className="text-xs text-emerald-600 font-medium">Settings saved.</p>}

            <button type="submit" disabled={saving}
              className="px-4 py-2.5 bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-700
                         text-white text-sm font-medium rounded-lg
                         focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
                         disabled:opacity-60 disabled:cursor-not-allowed transition-colors">
              {saving ? 'Saving…' : 'Save settings'}
            </button>
          </form>
        )}
      </section>

      {/* Change password — DB users only */}
      {!isBuiltInAdmin && (
        <section>
          <div className="border-t border-slate-200 pt-8">
            <h2 className="text-base font-semibold text-slate-900 mb-1">Change password</h2>
            <p className="text-sm text-slate-500 mb-5">Update your login password.</p>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Current password</label>
                <input type="password" required value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">New password</label>
                <input type="password" required value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters" className={inputCls} />
              </div>

              {passwordError && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">{passwordError}</p>
              )}
              {passwordSaved && <p className="text-xs text-emerald-600 font-medium">Password updated.</p>}

              <button type="submit" disabled={changingPassword}
                className="px-4 py-2.5 bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-700
                           text-white text-sm font-medium rounded-lg
                           focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
                           disabled:opacity-60 disabled:cursor-not-allowed transition-colors">
                {changingPassword ? 'Updating…' : 'Update password'}
              </button>
            </form>
          </div>
        </section>
      )}
    </div>
  )
}
