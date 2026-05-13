# Changelog

Reliable dates were not present for every historical note, so this changelog is grouped by topic.

## Added

- Next.js App Router hospital incident reporting workflow.
- Reporter, UnitManager, RMTeam, Executive, and Admin roles.
- Incident submission, incident log/search/detail, comments, notifications, CSV exports, and audit trail.
- RM triage, RCA request/review, action plan tracking, verification, and closure flow.
- Unit, RM, Executive, Admin, heatmap, analysis, safety-goal, and monthly-report pages.
- Google OAuth login with domain/email allowlist, invite records, account linking, and auth audit events.
- Admin auth settings, audit logs, automation, and governance surfaces.
- Production seed (`npm run seed:prod`) separated from development seed.
- Sensitive-field encryption utilities and backfill script.
- Supabase RLS/storage policy script and PostgreSQL partition strategy notes.
- Storage object, retention run, cache entry, lifecycle, and governance documentation.
- Vitest test setup and focused helper-level regression tests.
- Route-level loading states and performance-oriented compact incident/dashboard query patterns.

## Changed

- SQLite-compatible enum-like fields are stored as strings and validated in TypeScript/Zod.
- Admin menu hierarchy starts with Admin Console, then RM workflow links, then Admin CRUD.
- Dashboard analytics moved toward DB-side aggregation with compact chart-ready payloads.
- Incident/search/triage list flows moved toward server-side pagination and compact select payloads.
- Incident detail loading was trimmed to avoid eager heavy data where possible.
- Google OAuth is identity-only and keeps roles/units controlled by the application.
- Production documentation now centralizes deployment, security, testing, and handoff notes under `/docs`.

## Fixed

- SQLite Prisma enum validation issue.
- Missing `bcryptjs` TypeScript declaration through local declaration file.
- Login form submission/redirect issue where `/api/auth/login` was not reliably called.
- NRLS risk code seed replaced sample records with documented 315-record list and Clinical/General filtering.
- General Level 3-5 high-severity incidents now follow the same escalation expectation as Clinical E-I.
- Sensitive identifier reveal route/UI restricted to RMTeam/Admin.
- Unknown API paths default deny in RBAC according to readiness notes.

## Known Issues / Need Verification

- `npx prisma generate` may fail in restricted Codex sandbox with `spawn EPERM`; run in normal terminal.
- `npm run lint` may fail in restricted sandbox when writing `.next/cache/eslint`; run in normal terminal.
- Live Google OAuth callback requires production credentials and redirect domain.
- Browser E2E tests are not configured.
- Supabase RLS/storage policies require staging verification.
- Full backup/restore procedure requires staging verification.
- Free-text incident fields can still contain identifiers if users type them; training and audit review are required.
- Some historical Thai hotfix notes had mojibake; only verifiable technical content was migrated.

