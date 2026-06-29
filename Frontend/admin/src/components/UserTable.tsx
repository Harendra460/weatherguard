import { User, UserStatus } from '../types';
import { StatusBadge } from './StatusBadge';

interface Props {
  users: User[];
  busyId: string | null;
  onDecide: (id: string, decision: UserStatus.APPROVED | UserStatus.REJECTED) => void;
}

export function UserTable({ users, busyId, onDecide }: Props) {
  if (users.length === 0) {
    return (
      <div className="p-12 text-center">
        <p className="text-2xl">🗂️</p>
        <p className="mt-2 text-sm font-medium text-slate-600">No users yet</p>
        <p className="text-sm text-slate-400">Requests will appear here as people sign up.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="sticky top-0 z-10 bg-slate-50/90 text-xs uppercase tracking-wide text-slate-500 backdrop-blur">
          <tr className="border-b border-slate-200">
            <th className="px-4 py-3 font-medium">User</th>
            <th className="px-4 py-3 font-medium">Location</th>
            <th className="px-4 py-3 font-medium">Telegram</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {users.map((u) => {
            const busy = busyId === u._id;
            const actionable = u.status === UserStatus.PENDING;
            return (
              <tr key={u._id} className="transition-colors odd:bg-white even:bg-slate-50/40 hover:bg-sky-50/60">
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-800">{u.displayName ?? '—'}</div>
                  <div className="text-xs text-slate-400">{u.email}</div>
                </td>
                <td className="px-4 py-3 text-slate-600">{u.preferences?.city ?? '—'}</td>
                <td className="px-4 py-3">
                  {u.telegramChatId ? (
                    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Linked
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-sm text-slate-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                      Not linked
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={u.status} />
                </td>
                <td className="px-4 py-3 text-right">
                  {actionable ? (
                    <div className="flex justify-end gap-2">
                      <button
                        disabled={busy}
                        onClick={() => onDecide(u._id, UserStatus.APPROVED)}
                        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {busy ? '…' : 'Approve'}
                      </button>
                      <button
                        disabled={busy}
                        onClick={() => onDecide(u._id, UserStatus.REJECTED)}
                        className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-rose-600 ring-1 ring-inset ring-rose-200 transition hover:bg-rose-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/60 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-300">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
