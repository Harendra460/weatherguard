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
              <div className="grid min-h-screen place-items-center text-slate-400">Loading…</div>
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
