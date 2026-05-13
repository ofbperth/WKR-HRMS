# Deployment Readiness

Version note: `v0.9-local-approved`

## Current App Status

- Local approved version is frozen for production preparation on branch `production-postgres-deploy`.
- Existing features, UI/UX, RBAC, risk workflow, dashboard, incident form, RCA, search, and incident log behavior are not intentionally changed in this phase.
- Current Prisma datasource is still SQLite for local development. PostgreSQL migration is planned but not executed in this phase.
- Local-only files such as `.env`, `.next/`, `node_modules/`, and `prisma/dev.db` are present locally and ignored by git.

## Next Required Steps

- Provision production PostgreSQL database.
- Create production environment variables in the hosting platform or runtime secret store.
- Switch Prisma datasource provider from `sqlite` to `postgresql` in a dedicated migration phase.
- Generate and review PostgreSQL Prisma migrations before applying them to production.
- Run production smoke tests after deployment, including login, incident create/search/detail, RCA, dashboard, role visibility, export links, and retention dry-run behavior.

## Database Migration Plan

- Do not migrate the database in this phase.
- Back up the approved local SQLite database before any conversion work.
- Create a dedicated migration branch after this readiness branch is reviewed.
- Change `prisma/schema.prisma` datasource provider to `postgresql`.
- Generate PostgreSQL migrations with Prisma and review SQL manually.
- Seed only approved master data in production. Do not seed development users unless explicitly approved.
- Validate migrated data counts, incident relationships, RBAC visibility, encrypted sensitive fields, audit logs, retention records, and file references before production cutover.

## Environment Variables Needed

- `DATABASE_URL`
- `AUTH_SECRET`
- `ENCRYPTION_KEY`
- `APP_BASE_URL`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `RETENTION_DRY_RUN`
- `MAX_RETENTION_DELETE_PER_RUN`
- `EXPORT_SIGNED_URL_TTL_SECONDS`
- `NEXT_PUBLIC_APP_NAME`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `SEED_DEV_USERS`

## Security and PDPA Checklist

- Confirm `AUTH_SECRET`, `NEXTAUTH_SECRET`, and `ENCRYPTION_KEY` are strong production-only secrets.
- Keep `.env` and local database files out of git.
- Confirm production cookies are served over HTTPS with secure cookie behavior.
- Verify sensitive patient/reporter fields remain encrypted and readable only through intended app flows.
- Confirm role-based access and unit visibility before production release.
- Keep retention jobs in dry-run until production policy and approval are confirmed.
- Review export signed URL TTL and access control before enabling production exports.
- Confirm audit logging is active for sensitive actions.
