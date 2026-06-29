# WeatherGuard — Full Clickable Demo (User App) Design

**Date:** 2026-06-29
**Status:** Approved (pending spec review)

## Goal

Make the WeatherGuard task fully demonstrable by clicking. Today the backend
implements every required flow, but the only frontend is the **admin** panel.
Two user-facing flows have no UI: **Request Access** and **Connect Telegram**.
We add a dedicated **`Frontend/user`** app for end users and the small backend
changes needed to support two frontends, plus a local Telegram webhook so
`/start` actually links and alerts are delivered.

Decisions locked with the user:
- Full clickable demo (not API-only).
- Separate `Frontend/user` app (not role-aware single app).
- Local Telegram exposure via **cloudflared quick tunnel**.

## Scope

In scope: a new user React app; minimal additive backend changes for OAuth
redirect routing + CORS; a webhook setup runbook/script. Out of scope: schema
changes, business-logic changes, BullMQ migration, GitHub OAuth, httpOnly
cookies, production deploy.

## A. Backend changes (additive, low-risk)

The OAuth callback always redirects to `ADMIN_WEB_URL`
(`auth.controller.ts:32-33`) and CORS allows only that origin (`main.ts:11-14`).
For a second frontend:

1. **`config/configuration.ts`** — add `userWebUrl` field to `AppConfig` and
   load `process.env.USER_WEB_URL ?? 'http://localhost:5174'`.
2. **`main.ts`** — set CORS `origin` to `[adminWebUrl, userWebUrl]`.
3. **OAuth app routing via `state`:**
   - Add a custom guard (e.g. `auth/google-oauth.guard.ts`) extending
     `AuthGuard('google')` and overriding `getAuthenticateOptions` to read
     `req.query.app` (`'user' | 'admin'`) and return it as the OAuth `state`.
   - `GET /auth/google` uses this guard.
   - `GET /auth/google/callback` reads `req.query.state`; if `'user'` redirect to
     `userWebUrl`, otherwise `adminWebUrl`, appending `/auth/callback#token=<JWT>`.
   - Google Cloud console requires **no change** — the callback URL
     `http://localhost:4000/auth/google/callback` is unchanged.
4. **`Backend/api/.env`** — add `USER_WEB_URL=http://localhost:5174`.

No changes to the `users` schema or the alert-recipient query — the guarantee
that only APPROVED + Telegram-linked + located users get alerts is untouched.

## B. New `Frontend/user` app

Fresh Vite + React 18 + TypeScript + Tailwind app, mirroring the admin app's
config and conventions, served on **port 5174**.

```
Frontend/user/
  index.html, package.json, vite.config.ts (port 5174),
  tailwind.config.js, postcss.config.js, tsconfig.json, .env (VITE_API_URL)
  src/
    main.tsx, App.tsx, index.css, vite-env.d.ts
    types/index.ts          # User, UserStatus, MeResponse ({ user, telegramDeepLink? })
    services/api.ts         # axios instance + bearer token; googleLoginUrl (?app=user)
    services/users.api.ts   # getMe(), requestAccess(dto)
    hooks/useAuth.ts        # token in localStorage; loading/isAuthenticated/refresh/logout
    hooks/useMe.ts          # fetches /users/me, refetch on window focus
    pages/Login.tsx         # "Continue with Google" -> /auth/google?app=user
    pages/AuthCallback.tsx  # parse #token=..., store, redirect home
    pages/Home.tsx          # status-aware: request access + connect telegram + status
```

**Routing:** `/login`, `/auth/callback`, `/` (requires auth, else -> /login).

**Home.tsx behavior, by `user.status`:**
- **NEW** → show Request Access form (city required; optional lat/lon).
  Submit → `POST /users/me/request-access` → status becomes PENDING.
- **PENDING** → "Your request is awaiting admin approval" + show saved city.
- **APPROVED** → "You're approved — alerts are active for <city>".
- **REJECTED** → "Your request was declined."
- **Connect Telegram** (shown whenever `telegramChatId` is not set): button opens
  `telegramDeepLink` (`t.me/WeatherGuard460Bot?start=<token>`) in a new tab.
  Once linked, show "✅ Telegram linked". `useMe` refetches on focus so returning
  from Telegram reflects the linked state.

**Type safety:** shared enums/interfaces in `types/index.ts`; the request-access
payload typed to match the backend `RequestAccessDto` (`city: string`,
`lat?: number`, `lon?: number`).

## C. Telegram webhook (cloudflared) — runbook

1. `cloudflared tunnel --url http://localhost:4000` → copy the printed
   `https://<random>.trycloudflare.com`.
2. Register webhook (one-shot script):
   `setWebhook` to `<tunnel>/telegram/webhook/<TELEGRAM_WEBHOOK_SECRET>`.
3. Verify with `getWebhookInfo` (expect the URL populated, no last_error).

Tunnel URL changes each restart; re-run setWebhook after a restart. The bot
token, username, and webhook secret already exist in `Backend/api/.env`.

## D. End-to-end demo flow

1. Start: API (4000), admin (5173), user (5174), cloudflared tunnel, setWebhook.
2. Admin signs in at `:5173` (existing, unchanged).
3. A second Google account signs in at the user app `:5174` → lands as NEW.
4. User submits Request Access with a city → PENDING.
5. User clicks Connect Telegram → `/start` → bot replies "🔗 connected".
6. Admin dashboard shows 1 pending → Approve → user gets approval DM.
7. Admin clicks "Run alerts now" → user receives the (simulated) weather alert.

## Testing / verification

- Backend: `npm run build` (api) compiles with the new config/guard/CORS.
- User app: `npm run build` (tsc -b + vite build) compiles clean.
- Manual: walk the Section D flow; confirm Telegram DMs arrive (connect, approval,
  alert) and that a PENDING/REJECTED user receives no alert ("Run alerts now"
  reports 0 for them).

## Risks / notes

- `ALERT_CRON` is currently `*/30 * * * * *` (every 30s) — acceptable for the demo;
  "Run alerts now" provides deterministic on-demand sends.
- Repo is **not** a git repository, so this spec is not committed to git.
- Live secrets currently sit in committed `.env` files (separate concern; flagged
  earlier — rotate before any public push).
```
