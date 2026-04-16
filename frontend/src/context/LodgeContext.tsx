import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { api } from '../api/client'

interface LodgeSettings {
  lodgeName: string
  logoUrl: string | null
  summary: string | null
  consecratedAt: string | null
  themePrimaryColor: string | null
  themeSecondaryColor: string | null
  themeAccentColor: string | null
  themeFont: string | null
}

interface LodgeContextValue {
  settings: LodgeSettings
  refresh: () => Promise<void>
}

const DEFAULT: LodgeSettings = {
  lodgeName: 'My Lodge', logoUrl: null, summary: null, consecratedAt: null,
  themePrimaryColor: null, themeSecondaryColor: null, themeAccentColor: null, themeFont: null,
}

const LodgeContext = createContext<LodgeContextValue>({
  settings: DEFAULT,
  refresh: async () => {},
})

export function LodgeProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<LodgeSettings>(DEFAULT)

  async function refresh() {
    try {
      const data = await api.get<LodgeSettings>('/lodge-settings')
      setSettings(data)
    } catch {
      // leave defaults in place if the fetch fails
    }
  }

  useEffect(() => { refresh() }, [])

  return (
    <LodgeContext.Provider value={{ settings, refresh }}>
      {children}
    </LodgeContext.Provider>
  )
}

export function useLodge() {
  return useContext(LodgeContext)
}
