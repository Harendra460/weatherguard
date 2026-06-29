import { FormEvent, ReactNode, useState } from 'react';
import { useMe } from '../hooks/useMe';
import { usersApi } from '../services/users.api';
import { StatusBadge } from '../components/StatusBadge';
import { UserStatus } from '../types';

export function Home({ onLogout }: { onLogout: () => void }) {
  const { me, loading, error, reload } = useMe();
  const [city, setCity] = useState('');
  const [lat, setLat] = useState('');
  const [lon, setLon] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const submitRequest = async (e: FormEvent) => {
    e.preventDefault();
    if (!city.trim()) {
      setFormError('Please enter a city.');
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      await usersApi.requestAccess({
        city: city.trim(),
        lat: lat ? Number(lat) : undefined,
        lon: lon ? Number(lon) : undefined,
      });
      await reload();
    } catch {
      setFormError('Could not submit your request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-dawn">
      {/* Gradient hero header — the brand sky carries across the top. */}
      <header className="relative overflow-hidden bg-brand text-white">
        <div className="pointer-events-none absolute inset-0 bg-sun-glow" aria-hidden />
        <div className="relative mx-auto flex max-w-2xl items-center justify-between px-6 py-6">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/15 text-xl ring-1 ring-white/25 backdrop-blur-sm">
              🌦️
            </span>
            <div>
              <h1 className="text-lg font-semibold leading-tight">WeatherGuard</h1>
              <p className="text-xs text-sky-100/90">{me?.user.email}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-sky-50 transition hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="mx-auto -mt-6 max-w-2xl px-6 pb-12">
        {loading ? (
          <Card>
            <p className="text-center text-sm text-slate-400">Loading your account…</p>
          </Card>
        ) : error || !me ? (
          <Card>
            <p className="text-sm text-rose-600">{error ?? 'Something went wrong.'}</p>
          </Card>
        ) : (
          <div className="space-y-5">
            {/* Status card */}
            <Card>
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-slate-800">Your access</h2>
                <StatusBadge status={me.user.status} />
              </div>
              <StatusMessage status={me.user.status} city={me.user.preferences?.city} />
            </Card>

            {/* Request access (only before a request exists) */}
            {me.user.status === UserStatus.NEW && (
              <Card>
                <h2 className="text-base font-semibold text-slate-800">Request access</h2>
                <p className="mt-1 text-sm leading-relaxed text-slate-500">
                  Tell us where you want weather alerts for. An admin will review your request.
                </p>
                <form onSubmit={submitRequest} className="mt-5 space-y-3">
                  <Field
                    label="City"
                    value={city}
                    onChange={setCity}
                    placeholder="e.g. London"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Field
                      label="Latitude"
                      optional
                      value={lat}
                      onChange={setLat}
                      placeholder="51.5074"
                      inputMode="decimal"
                    />
                    <Field
                      label="Longitude"
                      optional
                      value={lon}
                      onChange={setLon}
                      placeholder="-0.1278"
                      inputMode="decimal"
                    />
                  </div>
                  {formError && <p className="text-sm text-rose-600">{formError}</p>}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center justify-center rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-glass transition hover:brightness-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/70 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting ? 'Submitting…' : 'Request access'}
                  </button>
                </form>
              </Card>
            )}

            {/* Telegram linking */}
            <Card>
              <h2 className="text-base font-semibold text-slate-800">Telegram</h2>
              {me.user.telegramChatId ? (
                <p className="mt-2 flex items-center gap-2 text-sm font-medium text-emerald-700">
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-emerald-100 text-xs">
                    ✓
                  </span>
                  Telegram linked — you'll receive alerts here.
                </p>
              ) : (
                <>
                  <p className="mt-1 text-sm leading-relaxed text-slate-500">
                    Connect Telegram so we can deliver your alerts. Opens the bot — tap{' '}
                    <span className="font-medium text-slate-700">Start</span>, then return here.
                  </p>
                  {me.telegramDeepLink ? (
                    <a
                      href={me.telegramDeepLink}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-glass transition hover:brightness-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/70"
                    >
                      Connect Telegram
                    </a>
                  ) : (
                    <p className="mt-2 text-sm text-slate-400">Link unavailable — try refreshing.</p>
                  )}
                </>
              )}
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}

function Card({ children }: { children: ReactNode }) {
  return (
    <section className="animate-fade-up rounded-2xl bg-white/80 p-6 shadow-glass ring-1 ring-white/60 backdrop-blur-sm">
      {children}
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  optional,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  optional?: boolean;
  inputMode?: 'decimal';
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-500">
        {label}
        {optional && <span className="ml-1 font-normal text-slate-400">(optional)</span>}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 shadow-sm transition placeholder:text-slate-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
      />
    </label>
  );
}

function StatusMessage({ status, city }: { status: UserStatus; city?: string }) {
  const where = city ? ` for ${city}` : '';
  const messages: Record<UserStatus, string> = {
    [UserStatus.NEW]: 'You haven’t requested access yet. Submit a request below to get started.',
    [UserStatus.PENDING]: `Your request${where} is awaiting admin approval.`,
    [UserStatus.APPROVED]: `You’re approved — weather alerts are active${where}.`,
    [UserStatus.REJECTED]:
      'Your request was declined. Contact an admin if you think this is a mistake.',
  };
  return <p className="mt-2 text-sm leading-relaxed text-slate-600">{messages[status]}</p>;
}
