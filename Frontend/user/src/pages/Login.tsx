import { googleLoginUrl } from '../services/api';

export function Login() {
  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-dawn px-6">
      {/* Signature: warm sun glow rising from the top-right of the sky. */}
      <div className="pointer-events-none absolute inset-0 bg-sun-glow" aria-hidden />

      <div className="relative w-full max-w-sm animate-fade-up rounded-3xl bg-white/70 p-8 shadow-glass-lg ring-1 ring-white/60 backdrop-blur-md">
        <div className="mb-6 flex h-14 w-14 animate-drift items-center justify-center rounded-2xl bg-brand text-3xl shadow-glass">
          🌦️
        </div>
        <h1 className="text-2xl font-semibold text-slate-900">WeatherGuard</h1>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
          Get weather alerts for your city, delivered straight to Telegram.
        </p>
        <a
          href={googleLoginUrl}
          className="mt-7 flex w-full items-center justify-center gap-2.5 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/70"
        >
          <GoogleIcon />
          Continue with Google
        </a>
        <p className="mt-6 text-center text-xs text-slate-400">
          We only use your Google account to sign you in.
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-[18px] w-[18px]" viewBox="0 0 18 18" aria-hidden>
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58Z"
      />
    </svg>
  );
}
