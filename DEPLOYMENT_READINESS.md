# Deployment Readiness

Version note: `v0.9-local-approved`

## Current App Status

- Local approved version is frozen for production preparation on branch `production-postgres-deploy`.
- Existing features, UI/UX, RBAC, risk workflow, dashboard, incident form, RCA, search, and incident log behavior are not intentionally changed in this phase.
- Prisma datasource is configured for PostgreSQL. Local SQLite is no longer a supported production path.
- Local-only files such as `.env`, `.next/`, `node_modules/`, and `prisma/dev.db` are present locally and ignored by git. Never commit database files.
- Current local verification used temporary process-only `DATABASE_URL` and `ENCRYPTION_KEY` values where needed. No production secrets were written to repo files.

## Next Required Steps

- Provision production PostgreSQL database.
- Create production environment variables in the hosting platform or runtime secret store.
- Set a production PostgreSQL `DATABASE_URL` before running any migration or seed command.
- Replace any local SQLite-style `DATABASE_URL` before running Prisma production commands.
- Review the PostgreSQL baseline migration before applying it to production.
- Run production smoke tests after deployment, including login, incident create/search/detail, RCA, dashboard, role visibility, export links, and retention dry-run behavior.
- Resolve dependency audit findings before online deployment. Current audit reports high-severity Next.js advisories; automatic `npm audit fix --force` proposes a breaking major upgrade and must be handled as a deliberate framework upgrade.

## Database Migration Plan

- Never use SQLite for online production. SQLite database files are local-only development artifacts.
- The current migration set is a PostgreSQL baseline for a new production database.
- Existing SQLite migration SQL was replaced because it cannot be safely deployed to PostgreSQL.
- If converting real data from an approved local SQLite file, back it up first and use a deliberate data migration/import run after the PostgreSQL schema is deployed.
- Production migration command: `npx prisma migrate deploy`.
- Local development migration command, only with a local PostgreSQL database: `npx prisma migrate dev`.
- Production seed command: `SEED_DEV_USERS=false npm run seed:prod`.
- The development seed creates sample users only when `SEED_DEV_USERS=true`.
- Baseline seed data includes units, NRLS risk codes, safety goal risk codes, and auth settings. Roles and permissions are code-defined constants, not database tables.
- Admin bootstrap users are not created by production seed; create the first production admin through an approved operational path.
- Validate migrated data counts, incident relationships, RBAC visibility, encrypted sensitive fields, audit logs, retention records, and file references before production cutover.

## Environment Variables Needed

- `DATABASE_URL`: Supabase/PostgreSQL connection string for the server runtime. Use SSL and keep it server-only.
- `AUTH_SECRET`: production-only random secret for signing the app session cookie.
- `NEXTAUTH_SECRET`: production-only random secret kept for auth compatibility. Do not reuse the development value.
- `NEXTAUTH_URL`: canonical HTTPS app URL, for example the Vercel production URL or custom domain.
- `APP_BASE_URL`: canonical HTTPS app URL used for Google OAuth callback construction.
- `RESEND_API_KEY`: API key for scheduled summary email delivery through Resend.
- `RESEND_FROM_EMAIL`: verified sender identity used for scheduled summary emails.
- `CRON_SECRET`: bearer secret used by Vercel Cron when calling protected cron routes.
- `ENCRYPTION_KEY`: 32 random bytes encoded as base64 or hex. Required in production for HN, AN, reporter name, and RCA narrative encryption.
- `GOOGLE_CLIENT_ID`: Google OAuth web client ID.
- `GOOGLE_CLIENT_SECRET`: Google OAuth web client secret.
- `RETENTION_DRY_RUN`: keep `true` for pilot unless governance approval allows deletion.
- `MAX_RETENTION_DELETE_PER_RUN`: deletion failsafe limit. Start conservative, for example `100`.
- `EXPORT_SIGNED_URL_TTL_SECONDS`: short export URL lifetime, for example `1800`.
- `NEXT_PUBLIC_APP_NAME`: public display name only. Do not put secrets in `NEXT_PUBLIC_*`.
- `SEED_DEV_USERS`: must be `false` in production.

## Vercel Setup Steps

1. Create or select the Vercel project for this repo.
2. Add all required environment variables in Vercel Project Settings for Production. Do not commit `.env`.
3. Set `NEXTAUTH_URL` and `APP_BASE_URL` to the final HTTPS production URL.
4. Add the Google OAuth callback URL in Google Cloud: `<APP_BASE_URL>/api/auth/callback/google`.
5. Configure scheduled email envs in Vercel: `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, and `CRON_SECRET`.
6. Confirm `vercel.json` includes the `/api/cron/email-summary` schedule `30 1 * * 1,3` for Monday/Wednesday 08:30 Asia/Bangkok.
5. Keep Google login disabled in app settings until the Google client ID/secret, allowed domains/emails, and first admin path are confirmed.
6. Deploy only after `npx prisma validate`, `npx prisma generate`, `npm run build`, `npm run test:qa`, and `npm run test:phase7` are completed or blockers are documented.

## Supabase/PostgreSQL Setup Steps

1. Create a new Supabase project and copy the PostgreSQL connection string for server use.
2. Use a server-side connection string only. Never expose the database URL to the browser.
3. Confirm SSL mode is enabled in `DATABASE_URL`.
4. Review `prisma/migrations/20260513000000_postgresql_baseline/migration.sql` before applying it to a new production database.
5. Optional hardening reference: review `prisma/supabase_rls_storage.sql` before enabling direct Supabase policies. The app should still access data through server-side routes.

## Security and PDPA Checklist

- Confirm `AUTH_SECRET`, `NEXTAUTH_SECRET`, and `ENCRYPTION_KEY` are strong production-only secrets.
- Confirm production startup fails when `ENCRYPTION_KEY`, `AUTH_SECRET`, or `DATABASE_URL` are missing.
- Keep `.env` and local database files out of git.
- Confirm production cookies are served over HTTPS with secure cookie behavior.
- Verify HN, AN, reporter name, and RCA narrative are encrypted at rest or removed from general API responses.
- Confirm sensitive identifiers are visible only through the role-limited sensitive endpoint with PDPA confirmation and audit logging.
- Do not log HN, AN, reporter name, RCA narrative, patient-identifiable text, OAuth secrets, session tokens, or raw database URLs.
- Apply data minimization: collect only necessary patient identifiers, keep narrative fields free of patient names where possible, and use role-limited access for review workflows.
- Confirm role-based access and unit visibility before production release.
- Confirm scheduled summary emails contain only aggregate counts, non-identifiable RCA reminder fields, and secure app links.
- Keep retention jobs in dry-run until production policy and approval are confirmed.
- Review export signed URL TTL and access control before enabling production exports.
- Confirm audit logging is active for sensitive actions.

## API Readiness Checklist

- All non-public API routes must require an authenticated server-side user through middleware and route-level guards where data is returned or mutated.
- Reporter/User data must be scoped by `reportedById`.
- Unit manager data must be scoped by `incidentUnitId`.
- RM team/Admin may access authorized cross-unit data.
- Executive routes should stay aggregate/reporting-oriented and should not expose incident list/detail APIs.
- Inputs should be parsed through Zod schemas or explicit type/range checks.
- Error responses should use stable codes such as `UNAUTHORIZED`, `FORBIDDEN`, `VALIDATION_ERROR`, or `INTERNAL_SERVER_ERROR`, without sensitive payload details.
- List/export routes must keep bounded result sizes and scoped filters.

## Pilot Go-Live Checklist

1. Run migrations against production PostgreSQL: `npx prisma migrate deploy`.
2. Run safe baseline seed only: `SEED_DEV_USERS=false npm run seed:prod`.
3. Confirm first admin account creation through an approved operational path.
4. Configure Google auth settings in the Admin screen: allowed domains/emails, auto-provision off unless approved, and default inactive for new users.
5. Smoke test login, PDPA consent, report creation, my reports, unit incident log, RM search/detail, RCA submit/approval, action verification, dashboards, exports, and logout.
6. Verify Reporter sees only own reports, Unit Manager sees only own unit data, RM/Admin sees authorized data, and Executive sees aggregate dashboards only.
7. Keep retention cleanup in dry-run for pilot and review the dry-run output before enabling deletion.
8. Record deployment date, migration version, seed result, test result, and any accepted risks.

## Latest Local Verification Notes

- `npm install`: completed, but `npm audit` reports 5 vulnerabilities: 1 moderate and 4 high.
- `npx prisma validate`: fails with the current local `.env` because `DATABASE_URL` is not PostgreSQL; passes when run with a PostgreSQL-format temporary process env.
- `npx prisma generate`: currently blocked on Windows by `EPERM` while renaming `node_modules/.prisma/client/query_engine-windows.dll.node`.
- `npm run build`: blocked at the same `prisma generate` `EPERM` step before Next.js build starts.
- `npm run test:qa`: unit tests pass, then fails at `npm run build` because of the same `EPERM` blocker.
- `npm run test:phase7`: reaches the local API server but login returns HTTP 500. The Google settings endpoint also returns `needsMigration: true`, so likely causes are an unmigrated/local database, wrong local database URL, or a server started with incomplete environment.
- `npx tsc --noEmit --incremental false`: passes with temporary process-only PostgreSQL `DATABASE_URL` and `ENCRYPTION_KEY`.
