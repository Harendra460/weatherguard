# WeatherGuard 🌦️

An **invite-only** weather alert service. Users sign in with Google, request access, and an admin approves them from a web dashboard. Approved users who have linked Telegram receive scheduled weather alerts via a Telegram bot.

```
/api     → NestJS (modular), MongoDB, Telegram, cron scheduler
/admin   → React + TypeScript + Tailwind admin dashboard
```

---

## 1. System design

### Architecture

```
                ┌──────────────────────────────────────────────┐
                │                 NestJS API                     │
   Google       │                                                │
   OAuth  ─────▶│  AuthModule ── JWT ──▶ JwtStrategy (re-reads    │
                │     │                    role/status from DB)   │
 ┌─────────┐    │     ▼                                           │     ┌──────────┐
 │  React  │◀──▶│  UsersModule  ◀────────────────────────────────┼────▶│ MongoDB  │
 │  Admin  │    │     │  (status: NEW→PENDING→APPROVED/REJECTED)   │     └──────────┘
 └─────────┘    │     ▼                                           │
                │  TelegramModule (send + /start webhook)         │     ┌──────────┐
                │     ▲                                           │────▶│ Telegram │
                │  WeatherModule                                  │     │   Bot    │
                │     └─ AlertsScheduler (cron) ─ queries only     │     └──────────┘
                │        APPROVED+linked users ─▶ Weather ─▶ TG    │◀──── OpenWeatherMap
                └──────────────────────────────────────────────┘
```

Each concern is its own NestJS module with a clean Controller → Service split. Cross-module needs are satisfied by exported providers (e.g. `UsersService`, `TelegramService`), and the Users↔Telegram cycle is resolved with `forwardRef`.

### Database schema

One collection, `users`. Access state and Telegram binding live on the user document — the pragmatic choice for this scope (a separate `access_requests` collection would add an audit trail but duplicate state; the lightweight `requestedAt` / `decidedAt` / `decidedBy` fields cover auditing here).

```ts
// users
{
  _id:               ObjectId,

  // Identity (from social login)
  email:             string,   // unique, lowercase, indexed
  provider:          string,   // 'google' | 'github'
  providerId:        string,
  displayName?:      string,
  avatarUrl?:        string,

  // Access control
  status:            'NEW' | 'PENDING' | 'APPROVED' | 'REJECTED',  // indexed
  role:              'USER' | 'ADMIN',                              // indexed
  requestedAt?:      Date,
  decidedAt?:        Date,
  decidedBy?:        string,   // email of deciding admin (audit)

  // Telegram linking
  telegramLinkToken?: string,  // one-time, embedded in t.me deep link, indexed
  telegramChatId?:    string,  // delivery target, set on /start, indexed

  // Alert config
  preferences?: { city?: string, lat?: number, lon?: number },

  createdAt: Date, updatedAt: Date  // timestamps
}
```

**Status lifecycle:** `NEW` (just signed in) → `PENDING` (requested access) → `APPROVED` or `REJECTED` (admin decision).

---

## 2. Data flow — how only "Approved" users receive alerts

The guarantee is enforced in **two layers**, so a UI bug alone can never leak alerts:

1. **Request layer** — `ApprovedGuard` rejects any approved-only endpoint for non-approved principals. `JwtStrategy.validate()` re-reads `role`/`status` from the DB on every request, so revoking access takes effect immediately rather than waiting for the JWT to expire.
2. **Data layer (the real gate)** — the scheduler never iterates "all users". It calls `UsersService.findAlertRecipients()`, whose query is the single source of truth:

   ```ts
   userModel.find({
     status: UserStatus.APPROVED,
     telegramChatId: { $ne: null },
     'preferences.city': { $exists: true, $ne: null },
   })
   ```

   A `PENDING`/`REJECTED` user is simply never selected, regardless of anything happening at the API surface.

### Social login & "Request Access" flow

```
User clicks "Continue with Google"
  → GET /auth/google              (Passport → Google consent)
  → GET /auth/google/callback     (UsersService.upsertFromSocial → mint JWT)
  → 302 to ADMIN_WEB_URL/auth/callback#token=<JWT>
  → React stores token from URL fragment, loads GET /users/me

User requests access:
  → POST /users/me/request-access  { city, lat?, lon? }
  → status flips NEW → PENDING, location saved
```

> The first admin is bootstrapped via `ADMIN_EMAILS` in `.env` — listed emails are auto-promoted to `ADMIN` + `APPROVED` on login, no manual DB edit needed.

### Admin dashboard — vetting / approving

```
Admin signs in (role=ADMIN) → ProtectedRoute allows /
  → GET /users               (full list; pending highlighted)
  → "Approve" / "Reject"  →  PATCH /users/:id/decision { decision }
  → AdminGuard enforces ADMIN role
  → status set to APPROVED/REJECTED, decidedBy/decidedAt recorded
  → if newly APPROVED and Telegram linked → bot sends approval message
```

### Telegram: linking, approval notice & simulated alert

```
Linking:
  GET /users/me returns a deep link  t.me/<bot>?start=<telegramLinkToken>
  → user opens it, bot receives "/start <token>" at POST /telegram/webhook/:secret
  → UsersService.linkTelegramByToken binds telegramChatId, clears token

Approval notice:
  → on approval, TelegramService.sendApprovalMessage(chatId)

Weather alert (scheduled or on-demand):
  → AlertsScheduler.runAlertCycle()  (cron ALERT_CRON, default 07:00 daily)
  → for each APPROVED+linked recipient: WeatherService.getCurrent(city)
  → TelegramService.sendMessage(chatId, formatted alert)
  → Admin can trigger immediately via POST /weather/run-now ("Run alerts now" button)
```

> **Simulated alerts:** if `OPENWEATHER_API_KEY` is empty, `WeatherService` returns deterministic mock data tagged *(simulated)*, so the entire pipeline is demoable without any external key.

---

## 3. Running locally

**Prerequisites:** Node 18+, a MongoDB instance, a Telegram bot token (from [@BotFather](https://t.me/BotFather)), and Google OAuth credentials.

### API
```bash
cd api
cp .env.example .env        # fill in the values
npm install
npm run start:dev           # http://localhost:4000
```

### Admin
```bash
cd admin
cp .env.example .env        # set VITE_API_URL
npm install
npm run dev                 # http://localhost:5173
```

### Telegram webhook
The bot receives `/start` via a webhook. Point Telegram at your API (use a public URL — e.g. ngrok in dev, your deploy URL in prod):
```bash
curl "https://api.telegram.org/bot<TOKEN>/setWebhook?url=<API_PUBLIC_URL>/telegram/webhook/<TELEGRAM_WEBHOOK_SECRET>"
```

### Quick end-to-end demo
1. Sign in with a Google account listed in `ADMIN_EMAILS` → you land in the dashboard as admin.
2. Sign in with a second Google account (incognito) → click request access with a city.
3. From that account, open the Telegram deep link and `/start` the bot.
4. Back in the admin dashboard, **Approve** the second user → they get an approval DM.
5. Click **Run alerts now** → the approved user receives a (simulated) weather alert.

---

## 4. Key environment variables

| Variable | Purpose |
|---|---|
| `MONGODB_URI` | MongoDB connection string |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `GOOGLE_CALLBACK_URL` | Google OAuth2 |
| `JWT_SECRET` / `JWT_EXPIRES_IN` | Session token signing |
| `ADMIN_EMAILS` | Comma-separated emails auto-promoted to admin |
| `TELEGRAM_BOT_TOKEN` / `TELEGRAM_BOT_USERNAME` / `TELEGRAM_WEBHOOK_SECRET` | Bot send + webhook |
| `OPENWEATHER_API_KEY` | Live weather (omit → simulated) |
| `ALERT_CRON` | Alert schedule (default `0 7 * * *`) |
| `ADMIN_WEB_URL` | Admin app origin (CORS + post-login redirect) |
| `VITE_API_URL` (admin) | API base URL |

---

## 5. Design decisions & trade-offs

- **node-cron via `@nestjs/schedule`, not BullMQ.** For a single-instance service this avoids a Redis dependency (startup pragmatism). The scale path is documented below.
- **JWT in URL fragment after OAuth.** Simple and SPA-friendly; the fragment never reaches a server. For production I'd move to an **httpOnly, SameSite cookie** to remove the token from JS-readable storage (XSS hardening).
- **Status on the user document** rather than a dedicated `access_requests` collection — fewer moving parts at this scope; the `decidedBy`/`decidedAt` fields keep a basic audit trail.
- **Stateless authorization re-checked against the DB** every request, so admin decisions are effective immediately.

### If this grew up
- Swap the cron loop for **BullMQ** so alert sends are queued, retried, and horizontally scalable (per-user repeatable jobs keyed by their schedule).
- Per-user alert frequency & multiple locations.
- httpOnly cookie sessions + CSRF protection.
- Add GitHub as a second OAuth provider (the `SocialProfile` abstraction already makes the strategy pluggable).

---

## 6. Deployment notes

- **API** → Render / Railway as a web service (`npm run build` → `npm run start:prod`). Set all env vars; set the Telegram webhook to the deployed URL.
- **Admin** → Vercel / Netlify static build (`npm run build`, output `dist/`). Set `VITE_API_URL` to the deployed API and add the admin origin to `ADMIN_WEB_URL` for CORS.
- **MongoDB** → MongoDB Atlas free tier.
