import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Bars3Icon } from '@heroicons/react/24/outline'
import { Sidebar } from './Sidebar'
import { useLodge } from '../context/LodgeContext'

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { settings } = useLodge()

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* ── Desktop sidebar ────────────────────────────────────── */}
      <div className="hidden md:flex shrink-0">
        <Sidebar />
      </div>

      {/* ── Mobile sidebar overlay ──────────────────────────────── */}
      {mobileOpen && (
        <div className="md:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-20 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          {/* Drawer */}
          <div className="fixed inset-y-0 left-0 z-30 flex">
            <Sidebar onClose={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* ── Main area ───────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Mobile top bar */}
        <header className="flex items-center h-14 px-4 bg-white border-b border-slate-200 shrink-0 md:hidden">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 -ml-2 rounded-md text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <Bars3Icon className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 ml-2">
            {settings.logoUrl ? (
              <img
                src={settings.logoUrl}
                alt={settings.lodgeName}
                className="w-6 h-6 rounded-md object-cover"
              />
            ) : (
              <div className="w-6 h-6 rounded-md bg-indigo-500 flex items-center justify-center">
                <span className="text-white text-[10px] font-bold">
                  {settings.lodgeName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <span className="font-semibold text-slate-900 text-sm">{settings.lodgeName}</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
