import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { User, UserRole } from '../types';

interface Props {
  user: User | null;
  loading: boolean;
  children: ReactNode;
}

/** Only authenticated ADMINs may see the dashboard. */
export function ProtectedRoute({ user, loading, children }: Props) {
  if (loading) {
    return <div className="grid min-h-screen place-items-center text-slate-400">Loading…</div>;
  }
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== UserRole.ADMIN) {
    return (
      <div className="grid min-h-screen place-items-center px-6 text-center text-slate-500">
        You’re signed in as {user.email}, but this dashboard is admin-only.
      </div>
    );
  }
  return <>{children}</>;
}
