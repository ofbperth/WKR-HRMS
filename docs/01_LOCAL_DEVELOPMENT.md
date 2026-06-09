# Local Development

## Requirements

- Node.js 20 LTS or later is recommended.
- npm.
- Local SQLite database through Prisma.
- Windows PowerShell or a normal terminal with access to the project folder.

## Installation

```bash
npm install
cp .env.example .env
npx prisma generate
npx prisma migrate dev
npx prisma db seed
npm run dev
```

Windows PowerShell:

```powershell
Copy-Item .env.example .env
npx prisma generate
npx prisma migrate dev
npx prisma db seed
npm run dev
```

Open `http://localhost:3000`.

## npm Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start local Next.js dev server. |
| `npm run build` | Run `prisma generate` then `next build`. |
| `npm run start` | Start production build locally. |
| `npm run lint` | Run Next lint. |
| `npm run test` | Run Vitest tests. |
| `npm run test:unit` | Run Vitest tests. |
| `npm run test:qa` | Run unit tests and build. |
| `npm run test:e2e` | Placeholder; Playwright E2E is not configured. |
| `npm run test:phase7` | Run Phase 7 API check script against a running app. |
| `npm run seed` | Seed development data. |
| `npm run seed:prod` | Seed production master data only. |
| `npm run prisma:studio` | Open Prisma Studio. |
| `npm run db:reset` | Run Prisma migrate reset. |
| `npm run security:backfill-sensitive` | Encrypt existing sensitive values after `ENCRYPTION_KEY` is set. |
| `npm run retention:run` | Run retention cleanup script. |

## Scheduled Email Summary Setup

Environment variables for weekly email summary:

```env
APP_BASE_URL="http://localhost:3000"
RESEND_API_KEY="re_xxxxxxxxxxxxxxxxxxxxxxxxx"
RESEND_FROM_EMAIL="WKR-HRMS <noreply@example.com>"
CRON_SECRET="replace-with-random-cron-secret"
```

- `APP_BASE_URL` is used to build secure links back into WKR-HRMS.
- `CRON_SECRET` must match the `Authorization: Bearer <CRON_SECRET>` header when testing locally.
- `RESEND_*` should use test/sandbox values in development.

Dry-run example:

```powershell
$headers = @{ Authorization = "Bearer $env:CRON_SECRET" }
Invoke-WebRequest -Uri "http://localhost:3000/api/cron/email-summary?dryRun=true" -Headers $headers
```

Live local send example:

```powershell
$headers = @{ Authorization = "Bearer $env:CRON_SECRET" }
Invoke-WebRequest -Uri "http://localhost:3000/api/cron/email-summary" -Headers $headers -Method POST
```

## Prisma Commands

```bash
npx prisma generate
npx prisma migrate dev
npx prisma db seed
npx prisma studio
```

Production-style migration command:

```bash
npx prisma migrate deploy
```

## SQLite Local Setup

Local development uses:

```env
DATABASE_URL="file:./dev.db"
```

SQLite stores role/status values as strings for compatibility. Prisma native enums are not used with SQLite.

If an old local migration state is broken, reset only local development data:

```powershell
Remove-Item -Recurse -Force .\prisma\migrations -ErrorAction SilentlyContinue
Remove-Item -Force .\prisma\dev.db -ErrorAction SilentlyContinue
Remove-Item -Force .\prisma\dev.db-journal -ErrorAction SilentlyContinue
```

Use the reset command only when you are intentionally deleting local development data.

## Development Seed Users

Development seed users use password `password`.

| Email | Role |
| --- | --- |
| `admin@hospital.local` | Admin |
| `rm@hospital.local` | RMTeam |
| `executive@hospital.local` | Executive |
| `unitmanager@hospital.local` | UnitManager |
| `reporter@hospital.local` | Reporter |

Production seed does not create sample users.

## Windows / VS Code Notes

Recommended workspace path:

```text
C:\DEV\hrms-project\WKR-HRMS
```

If tools fail because temp/profile folders are blocked, run from a normal terminal and set temp paths:

```powershell
$env:TEMP='C:\TMP'
$env:TMP='C:\TMP'
$env:USERPROFILE='C:\TMP'
Set-Location C:\DEV\hrms-project\WKR-HRMS
npm run dev
```

If Git reports dubious ownership, use a per-command safe directory override:

```powershell
git -c safe.directory=C:/DEV/hrms-project/WKR-HRMS -C C:\DEV\hrms-project\WKR-HRMS status
```

## Common Troubleshooting

| Symptom | Notes |
| --- | --- |
| Prisma enum validation fails on SQLite | Keep enum-like values as strings in Prisma and validate in TypeScript/Zod. |
| `npx prisma generate` fails with `spawn EPERM` in Codex sandbox | Likely local permission/sandbox issue. Run in a normal project terminal. |
| `npm run lint` fails writing `.next/cache/eslint` with `EPERM` | Likely environment permission issue. Try a normal terminal or disable cache if needed. |
| Missing `bcryptjs` TypeScript declaration | `types/bcryptjs.d.ts` exists; alternatively install `@types/bcryptjs` if the project chooses to add it. |
| Login submit does not call `/api/auth/login` | Historical fix changed login form behavior and button/input refs. Re-test with DevTools Network if this regresses. |

