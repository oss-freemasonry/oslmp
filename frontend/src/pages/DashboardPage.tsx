import { useAuth } from '../context/AuthContext'
import {
  UsersIcon,
  CalendarDaysIcon,
  ClipboardDocumentListIcon,
} from '@heroicons/react/24/outline'

const STATS = [
  { label: 'Members',           value: '—', icon: UsersIcon,                  color: 'text-indigo-500', bg: 'bg-indigo-50' },
  { label: 'Upcoming Meetings', value: '—', icon: CalendarDaysIcon,            color: 'text-violet-500', bg: 'bg-violet-50' },
  { label: 'Pending Actions',   value: '—', icon: ClipboardDocumentListIcon,   color: 'text-sky-500',    bg: 'bg-sky-50'    },
]

export function DashboardPage() {
  const { user } = useAuth()

  return (
    <div className="px-6 py-5 md:px-8">
      <h1 className="text-lg font-semibold text-slate-900 mb-4">
        Welcome back, {user?.username}
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        {STATS.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center shrink-0`}>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <div>
              <p className="text-xs text-slate-500">{label}</p>
              <p className="text-xl font-bold text-slate-900 leading-tight">{value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200">
        <div className="px-5 py-3 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-900">Recent Activity</h2>
        </div>
        <div className="flex flex-col items-center justify-center py-14 text-center px-6">
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mb-3">
            <ClipboardDocumentListIcon className="w-5 h-5 text-slate-400" />
          </div>
          <p className="text-sm font-medium text-slate-600">Nothing here yet</p>
          <p className="mt-0.5 text-xs text-slate-400">Activity will appear once you start using the platform.</p>
        </div>
      </div>
    </div>
  )
}
