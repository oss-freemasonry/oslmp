// ── Theme types ───────────────────────────────────────────────────────────────

export interface PublicTheme {
  primary:    string   // header / footer background
  secondary:  string   // nav strip background
  accent:     string   // gold / highlight colour
  accentFg:   string   // text colour on accent background (dark or light)
  fontFamily: string   // CSS font-family string
}

// ── Presets ───────────────────────────────────────────────────────────────────

export interface ThemePreset {
  name:      string
  primary:   string
  secondary: string
  accent:    string
}

export const THEME_PRESETS: ThemePreset[] = [
  { name: 'Slate',    primary: '#0f172a', secondary: '#1e293b', accent: '#fbbf24' },
  { name: 'Navy',     primary: '#0c1b33', secondary: '#163352', accent: '#c9a227' },
  { name: 'Forest',   primary: '#14302a', secondary: '#1d4035', accent: '#d4a820' },
  { name: 'Burgundy', primary: '#2d0a1a', secondary: '#3d1426', accent: '#c9a227' },
  { name: 'Midnight', primary: '#13111c', secondary: '#1e1b2e', accent: '#e2b714' },
  { name: 'Charcoal', primary: '#1c1c1c', secondary: '#2d2d2d', accent: '#d4a017' },
]

// ── Fonts ─────────────────────────────────────────────────────────────────────

export interface FontOption {
  label:      string
  value:      string        // stored in DB (empty string = default)
  fontFamily: string        // CSS font-family declaration
  google:     string | null // Google Fonts URL query param
}

export const FONT_OPTIONS: FontOption[] = [
  {
    label: 'Default',
    value: '',
    fontFamily: 'system-ui, sans-serif',
    google: null,
  },
  {
    label: 'EB Garamond',
    value: 'EB Garamond',
    fontFamily: '"EB Garamond", Georgia, serif',
    google: 'EB+Garamond:ital,wght@0,400;0,600;1,400',
  },
  {
    label: 'Playfair Display',
    value: 'Playfair Display',
    fontFamily: '"Playfair Display", Georgia, serif',
    google: 'Playfair+Display:ital,wght@0,400;0,700;1,400',
  },
  {
    label: 'Crimson Text',
    value: 'Crimson Text',
    fontFamily: '"Crimson Text", Georgia, serif',
    google: 'Crimson+Text:ital,wght@0,400;0,600;1,400',
  },
  {
    label: 'Lato',
    value: 'Lato',
    fontFamily: '"Lato", system-ui, sans-serif',
    google: 'Lato:wght@300;400;700',
  },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function luma(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return (r * 299 + g * 587 + b * 114) / 1000
}

export function buildTheme(opts: {
  themePrimaryColor?:   string | null
  themeSecondaryColor?: string | null
  themeAccentColor?:    string | null
  themeFont?:           string | null
}): PublicTheme {
  const primary   = opts.themePrimaryColor   ?? '#0f172a'
  const secondary = opts.themeSecondaryColor ?? '#1e293b'
  const accent    = opts.themeAccentColor    ?? '#fbbf24'
  const accentFg  = luma(accent) > 140 ? '#292524' : '#ffffff'
  const fontOpt   = FONT_OPTIONS.find(f => f.value === (opts.themeFont ?? '')) ?? FONT_OPTIONS[0]
  return { primary, secondary, accent, accentFg, fontFamily: fontOpt.fontFamily }
}

export function loadGoogleFont(fontValue: string): void {
  const opt = FONT_OPTIONS.find(f => f.value === fontValue)
  if (!opt?.google) return
  const id = `gf-${fontValue.replace(/\s+/g, '-').toLowerCase()}`
  if (document.getElementById(id)) return
  const link = document.createElement('link')
  link.id   = id
  link.rel  = 'stylesheet'
  link.href = `https://fonts.googleapis.com/css2?family=${opt.google}&display=swap`
  document.head.appendChild(link)
}
