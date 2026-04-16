import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    // Root → public homepage. Any other protected path → login (with return URL).
    if (location.pathname === '/') {
      return <Navigate to="/public" replace />
    }
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}
