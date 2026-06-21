# PainMap

A privacy-first pain tracking app for chronic pain sufferers. See your pain more clearly.

## Features

- **Login-free `/track`** — start tracking immediately, no account required. Data is saved under an anonymous session and can be recovered on any device using a recovery code.
- **Google sign-in** — full account with history, trends, and multi-device sync.
- Pain level + body-region logging, history view, CSV export, and trend charts.

## Tech Stack

- Next.js 15 (App Router)
- TypeScript
- React 18
- Tailwind CSS
- shadcn/ui
- Supabase (auth & cloud sync)
- Recharts (trends visualization)

## Getting Started

```sh
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Start development server
npm run dev
```

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm test` | Run unit tests (Vitest, no external deps needed) |
| `npm run test:watch` | Unit tests in watch mode |
| `npm run test:coverage` | Unit tests with V8 coverage report |
| `npm run test:e2e` | Playwright E2E tests (requires running app + Supabase) |

## Environment Variables

See `.env.example` for the full list. Required variables:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (server-side only) |
| `RECOVERY_SYNTHETIC_EMAIL_DOMAIN` | Domain for anonymous user synthetic emails (e.g. `anon.yourdomain.com`) |

## Login-free `/track`

Users who visit `/track` are signed in anonymously — no account needed. Their data persists in Supabase under an anonymous user ID stored in a session cookie.

To recover data on another device:
1. Go to `/track/settings` → **Save your recovery code**
2. On the new device, go to `/track/restore` and enter the code

See [`docs/login-free-plan.md`](docs/login-free-plan.md) for the full design and [`docs/login-free-progress.md`](docs/login-free-progress.md) for implementation history.

## Database Migrations

```sh
# Apply all migrations to your Supabase project
supabase db push
```

Key tables added for login-free support:
- `recovery_codes` — bcrypt-hashed recovery codes per user
- `recovery_redeem_attempts` — rate-limiting log per hashed IP

## Deployment

Deployed on Vercel. Push to main branch to trigger automatic deployment.

See [`docs/production-rollout.md`](docs/production-rollout.md) for the production go-live checklist.
