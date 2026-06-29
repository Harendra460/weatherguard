import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { Login } from './pages/Login';
import { Home } from './pages/Home';
import { AuthCallback } from './pages/AuthCallback';

export default function App() {
  const { loading, isAuthenticated, refresh, logout } = useAuth();

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/" replace /> : <Login />}
        />
        <Route path="/auth/callback" element={<AuthCallback onAuthed={refresh} />} />
        <Route
          path="/"
          element={
            loading ? (
              <div className="grid min-h-screen place-items-center bg-dawn">
                <div className="flex flex-col items-center gap-4 text-slate-500">
                  <span className="grid h-12 w-12 animate-drift place-items-center rounded-2xl bg-brand text-2xl shadow-glass">
                    🌦️
                  </span>
                  <p className="text-sm font-medium">Loading…</p>
                </div>
              </div>
            ) : isAuthenticated ? (
              <Home onLogout={logout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
