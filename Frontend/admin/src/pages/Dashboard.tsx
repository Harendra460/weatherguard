import { useState } from 'react';
import { useUsers } from '../hooks/useUsers';
import { UserTable } from '../components/UserTable';
import { usersApi } from '../services/users.api';
import { User, UserStatus } from '../types';

export function Dashboard({ admin, onLogout }: { admin: User; onLogout: () => void }) {
  const { users, loading, error, busyId, pendingCount, decide } = useUsers();
  const [alertMsg, setAlertMsg] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  const approvedCount = users.filter((u) => u.status === UserStatus.APPROVED).length;

  const runAlerts = async () => {
    setRunning(true);
    setAlertMsg('Sending…');
    try {
      const { sent } = await usersApi.runAlertsNow();
      setAlertMsg(`Sent ${sent} alert(s) to approved users.`);
    } catch {
      setAlertMsg('Failed to trigger alerts.');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-dawn">
      {/* Solid header with a thin brand accent line — utilitarian, not glassy. */}
      <header className="border-b border-slate-200 bg-white">
        <div className="h-0.5 w-full bg-brand" />
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand text-lg shadow-glass">
              🌦️
            </span>
            <div>
              <h1 className="flex items-center gap-2 text-base font-semibold leading-tight text-slate-900">
                WeatherGuard
                <span className="rounded bg-slate-900/5 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  Admin
                </span>
              </h1>
              <p className="text-xs text-slate-400">{admin.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={runAlerts}
              disabled={running}
              className="rounded-lg bg-brand px-3.5 py-2 text-sm font-semibold text-white shadow-glass transition hover:brightness-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/70 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {running ? 'Sending…' : 'Run alerts now'}
            </button>
            <button
              onClick={onLogout}
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        {/* Metric strip — derived from the same data, no extra request. */}
        <div className="mb-6 grid grid-cols-3 gap-3">
          <Metric label="Total users" value={users.length} />
          <Metric label="Pending" value={pendingCount} tone="amber" />
          <Metric label="Approved" value={approvedCount} tone="emerald" />
        </div>

        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Access requests &amp; users
          </h2>
          {alertMsg && (
            <span className="rounded-lg bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700 ring-1 ring-inset ring-sky-200">
              {alertMsg}
            </span>
          )}
        </div>

        {error && (
          <p className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-inset ring-rose-200">
            {error}
          </p>
        )}

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-glass">
          {loading ? (
            <p className="p-10 text-center text-sm text-slate-400">Loading users…</p>
          ) : (
            <UserTable users={users} busyId={busyId} onDecide={decide} />
          )}
        </div>
      </main>
    </div>
  );
}

const TONES = {
  slate: 'text-slate-900',
  amber: 'text-amber-600',
  emerald: 'text-emerald-600',
} as const;

function Metric({
  label,
  value,
  tone = 'slate',
}: {
  label: string;
  value: number;
  tone?: keyof typeof TONES;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`mt-1 font-display text-2xl font-semibold tabular-nums ${TONES[tone]}`}>
        {value}
      </p>
    </div>
  );
}
