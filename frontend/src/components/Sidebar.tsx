import { NavLink } from 'react-router-dom'
import {
  HomeIcon,
  UserGroupIcon,
  CalendarDaysIcon,
  EnvelopeIcon,
  NewspaperIcon,
  Cog6ToothIcon,
  UserCircleIcon,
  XMarkIcon,
  ArrowRightStartOnRectangleIcon,
} from '@heroicons/react/24/outline'
import { useAuth } from '../context/AuthContext'
import { useLodge } from '../context/LodgeContext'
import { useNavigate } from 'react-router-dom'

const NAV = [
  { label: 'Dashboard', to: '/', icon: HomeIcon, end: true },
  { label: 'People', to: '/people', icon: UserGroupIcon },
  { label: 'Meetings', to: '/meetings', icon: CalendarDaysIcon },
  { label: 'News', to: '/news', icon: NewspaperIcon },
  { label: 'Communications', to: '/communications', icon: EnvelopeIcon },
]

interface SidebarProps {
  onClose?: () => void
}

function NavItem({
  to,
  icon: Icon,
  label,
  end,
  onClick,
}: {
  to: string
  icon: React.ElementType
  label: string
  end?: boolean
  onClick?: () => void
}) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      className={({ isActive }) =>
        [
          'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
          isActive
            ? 'bg-slate-800 text-white'
            : 'text-slate-400 hover:bg-slate-800/70 hover:text-slate-100',
        ].join(' ')
      }
    >
      {({ isActive }) => (
        <>
          <Icon
            className={[
              'w-[18px] h-[18px] shrink-0',
              isActive ? 'text-indigo-400' : 'text-slate-500',
            ].join(' ')}
          />
          {label}
        </>
      )}
    </NavLink>
  )
}

export function Sidebar({ onClose }: SidebarProps) {
  const { user, logout } = useAuth()
  const { settings } = useLodge()
  const navigate = useNavigate()
  const isAdmin = user?.role === 'admin'

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <aside className="flex flex-col h-full w-64 bg-slate-900 select-none">
      {/* Wordmark */}
      <div className="flex items-center justify-between px-5 h-16 shrink-0">
        <div className="flex items-center gap-2.5">
          {settings.logoUrl ? (
            <img
              src={settings.logoUrl}
              alt={settings.lodgeName}
              className="w-7 h-7 rounded-lg object-cover shrink-0"
            />
          ) : (
            <div className="w-7 h-7 rounded-lg bg-indigo-500 flex items-center justify-center shrink-0">
              <span className="text-white text-xs font-bold tracking-tight">
                {settings.lodgeName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <span className="text-white font-semibold text-sm tracking-tight">{settings.lodgeName}</span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Main navigation */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {NAV.map(({ label, to, icon, end }) => (
          <NavItem key={to} to={to} icon={icon} label={label} end={end} onClick={onClose} />
        ))}
        {isAdmin && (
          <NavItem to="/users" icon={UserCircleIcon} label="Users" onClick={onClose} />
        )}
      </nav>

      {/* Bottom — settings + user card */}
      <div className="px-3 pb-3 shrink-0">
        <div className="space-y-0.5 mb-2">
          <NavItem to="/settings" icon={Cog6ToothIcon} label="Settings" onClick={onClose} />
        </div>

        <div className="border-t border-slate-800 pt-2">
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg">
            <div className="w-7 h-7 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
              <span className="text-indigo-400 text-xs font-semibold uppercase">
                {user?.username.charAt(0)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-200 truncate leading-tight">
                {user?.username}
              </p>
              <p className="text-xs text-slate-500 capitalize leading-tight">{user?.role}</p>
            </div>
            <button
              onClick={handleLogout}
              title="Sign out"
              className="p-1 rounded-md text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors shrink-0"
            >
              <ArrowRightStartOnRectangleIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  )
}
