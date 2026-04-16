import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { LodgeProvider } from './context/LodgeContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AppLayout } from './components/AppLayout'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { PeoplePage } from './pages/PeoplePage'
import { PersonProfilePage } from './pages/PersonProfilePage'
import { SettingsPage } from './pages/SettingsPage'
import { UsersPage } from './pages/UsersPage'
import { MeetingsPage } from './pages/MeetingsPage'
import { MeetingPage } from './pages/MeetingPage'
import { NewsPage } from './pages/NewsPage'
import { PublicHomePage } from './pages/public/PublicHomePage'
import { PublicEventsPage } from './pages/public/PublicEventsPage'
import { PublicRsvpPage } from './pages/public/PublicRsvpPage'
import { PublicNewsPage } from './pages/public/PublicNewsPage'
import { PublicPostPage } from './pages/public/PublicPostPage'

export default function App() {
  return (
    <BrowserRouter>
      {/* Public routes — no auth, no lodge context needed */}
      <Routes>
        <Route path="/public">
          <Route index element={<PublicHomePage />} />
          <Route path="events" element={<PublicEventsPage />} />
          <Route path="events/:id/rsvp" element={<PublicRsvpPage />} />
          <Route path="news" element={<PublicNewsPage />} />
          <Route path="news/:id" element={<PublicPostPage />} />
        </Route>

        {/* Everything else uses auth + lodge context */}
        <Route
          path="/*"
          element={
            <LodgeProvider>
              <AuthProvider>
                <Routes>
                  <Route path="/login" element={<LoginPage />} />

                  {/* Protected — sidebar layout */}
                  <Route
                    element={
                      <ProtectedRoute>
                        <AppLayout />
                      </ProtectedRoute>
                    }
                  >
                    <Route index element={<DashboardPage />} />
                    <Route path="people" element={<PeoplePage />} />
                    <Route path="people/:id" element={<PersonProfilePage />} />
                    <Route path="meetings" element={<MeetingsPage />} />
                    <Route path="meetings/:id" element={<MeetingPage />} />
                    <Route path="news" element={<NewsPage />} />
                    <Route path="communications" element={<ComingSoon label="Communications" />} />
                    <Route path="users" element={<UsersPage />} />
                    <Route path="settings" element={<SettingsPage />} />
                  </Route>

                  {/* Catch-all for protected area → login */}
                  <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
              </AuthProvider>
            </LodgeProvider>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

function ComingSoon({ label }: { label: string }) {
  return (
    <div className="px-6 py-8 md:px-10 md:py-10">
      <p className="text-xs font-medium text-indigo-500 uppercase tracking-widest mb-1">{label}</p>
      <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{label}</h1>
      <p className="mt-1.5 text-sm text-slate-500">This section is coming soon.</p>
    </div>
  )
}
