import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { tokenStore } from '../services/api';

/**
 * Lands here after the API redirects with `#token=...`. We pull the token out
 * of the URL fragment (never sent to a server), store it, then go home.
 */
export function AuthCallback({ onAuthed }: { onAuthed: () => void }) {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.slice(1));
    const token = params.get('token');
    if (token) {
      tokenStore.set(token);
      onAuthed();
    }
    navigate('/', { replace: true });
  }, [navigate, onAuthed]);

  return (
    <div className="grid min-h-screen place-items-center bg-dawn">
      <div className="flex flex-col items-center gap-4 text-slate-500">
        <span className="grid h-12 w-12 animate-drift place-items-center rounded-2xl bg-brand text-2xl shadow-glass">
          🌦️
        </span>
        <p className="text-sm font-medium">Signing you in…</p>
      </div>
    </div>
  );
}
