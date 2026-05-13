# Hospital Risk Report & Management System

Hospital incident reporting and risk-management workflow built with Next.js App Router, Prisma, SQLite, TypeScript, Tailwind CSS, React Hook Form, Zod, and JWT session cookies.

## Features

- Role-based access for Reporter, UnitManager, RMTeam, Executive, and Admin.
- Incident submission with NRLS risk-code search, SIMPLE category, severity A-I, patient HN masking, and automatic incident number generation.
- RM triage with classification, severity/status updates, sentinel flag, RM-support flag, comments, audit trail, and CSV export.
- RCA workflow: RM requests RCA by status, UnitManager saves/submits RCA, RM approves or requests revision.
- Action workflow: UnitManager creates action plans after RCA approval, owner updates evidence/status, RM verifies action, and RM can close only after all actions are verified.
- Monthly report API and RM dashboard button to generate a month summary.
- Notification bell, read-state API, workflow notifications, and audit logging for critical actions.
- Admin has RMTeam authority, but its menu hierarchy starts with Admin Console, then non-duplicated RM workflow links, then Admin CRUD for users, units, and risk codes.
- Google OAuth login with domain/email allowlist, existing-user account linking, optional invite-based role assignment, and auth audit trail.
- Phase 4 dashboards with Recharts, global filters, aggregation APIs, risk heatmap, and 9 Important Safety Goals.
- Cloud data management hardening for encrypted HN/AN/RCA/reporter fields, Supabase RLS/storage policies, and append-only audit preparation. See [CLOUD_DATA_MANAGEMENT.md](CLOUD_DATA_MANAGEMENT.md).
- Storage lifecycle, retention, restore, smart cache, backup, and partition planning. See [STORAGE_RETENTION_GOVERNANCE.md](STORAGE_RETENTION_GOVERNANCE.md).
- Admin-only governance dashboard, signed export security, observability, QA, and security readiness. See [PRODUCTION_QA_SECURITY.md](PRODUCTION_QA_SECURITY.md).
- Responsive shell with desktop sidebar and mobile navigation.

## Setup

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

## Tests and QA

Run the automated checks before release:

```bash
npm install
npx prisma generate
npm run test
npm run test:unit
npm run test:qa
npm run build
```

`npm run test` and `npm run test:unit` run the Vitest regression tests for RBAC helpers, risk-code filtering, incident validation, RCA permission helpers, high-severity classification, and dashboard filters.

`npm run test:e2e` is reserved for future Playwright workflow automation. Until browser E2E is added, use [TEST_RUBRIC.md](TEST_RUBRIC.md) as the formal manual QA checklist and record findings in [BUG_REPORT.md](BUG_REPORT.md).

## Environment

```env
DATABASE_URL="file:./dev.db"
AUTH_SECRET="change-me-super-secret"
ENCRYPTION_KEY=""
RETENTION_DRY_RUN="true"
MAX_RETENTION_DELETE_PER_RUN="100"
EXPORT_SIGNED_URL_TTL_SECONDS="1800"
NEXT_PUBLIC_APP_NAME="Hospital Risk Report & Management System"
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
NEXTAUTH_SECRET="change-me-super-secret"
NEXTAUTH_URL="http://localhost:3000"
APP_BASE_URL="http://localhost:3000"
```

`NEXTAUTH_*` variables are included for deployment compatibility with OAuth setups. The current implementation keeps the existing JWT session cookie and uses Google OAuth only for identity verification.

## Sample Users

All seeded users use password `password`.

| Email | Role |
|---|---|
| admin@hospital.local | Admin |
| rm@hospital.local | RMTeam |
| executive@hospital.local | Executive |
| unitmanager@hospital.local | UnitManager |
| reporter@hospital.local | Reporter |

Seed role expectations:

- Reporter: submits incidents and sees only own reports.
- UnitManager: sees incidents for own unit and completes RCA/action work for that unit.
- RMTeam: sees all incidents and manages triage, RCA review, dashboards, exports, and closure.
- Executive: sees aggregate dashboards only; no patient identifiers or incident detail APIs.
- Admin: sees Admin maintenance plus RM and Executive dashboards.

## Production / Cloud Deployment QA Checklist

- `npm install`, `npx prisma generate`, `npm run test`, `npm run test:qa`, and `npm run build` pass.
- Production `AUTH_SECRET`, `NEXTAUTH_SECRET`, and `ENCRYPTION_KEY` are strong non-default values.
- Database migrations are applied and seed/test users are removed or changed for production.
- Reporter, UnitManager, RMTeam, Executive, and Admin access are verified in both UI and direct API calls.
- Clinical risk selection shows only Clinical NRLS/risk codes; General selection shows only General NRLS/risk codes.
- Incident submission creates a valid `incidentNo`, persists the record, and writes an audit log.
- Clinical E-I and General Level 3-5 incidents follow high-severity escalation rules.
- Executive dashboards are aggregate-only and do not expose HN, AN, reporter, patient, or narrative identifiers.
- RCA submit/approval permissions, action verification, and incident closure are tested end to end.
- Export, sensitive-data access, auth/admin changes, RCA actions, and close/reject actions are visible in AuditLog.

## Main Routes

| Route | Purpose |
|---|---|
| `/login` | Login |
| `/report/new` | Submit incident |
| `/my-reports` | Incidents submitted by current user |
| `/unit/incidents` | Unit-scoped incidents |
| `/unit/dashboard` | Unit dashboard scoped to current UnitManager unit |
| `/rm/dashboard` | RM operational dashboard |
| `/rm/analytics` | RM analytics alias |
| `/rm/incidents` | Redirect to RM search/export incident |
| `/rm/heatmap` | Unit x severity incident heatmap |
| `/rm/analysis` | Risk trend and category analysis |
| `/rm/safety-goals` | 9 Important Safety Goals for RM |
| `/rm/search` | Search/export incident |
| `/executive` | Executive dashboard counts |
| `/executive/dashboard` | Executive analytics dashboard |
| `/executive/safety-goals` | 9 Important Safety Goals for executive view |
| `/admin` | Admin console; first Admin menu item and central entry for RM workflow plus Admin maintenance |
| `/admin/auth-settings` | Google login policy, allowed domains/emails, auto provision, and invites |
| `/admin/users`, `/admin/units`, `/admin/risk-codes` | Admin-only maintenance |

## API Highlights

- `POST /api/incidents` creates incidents for Reporter, UnitManager, RMTeam, and Admin.
- `PUT /api/incidents/:id` supports Reporter edits while status is `New`, and RM/Admin triage.
- `GET /api/incidents/export` exports filtered incident CSV and writes an audit log.
- `PUT /api/incidents/:id/rca` saves/submits RCA for the owning UnitManager/Admin.
- `POST /api/incidents/:id/rca/approve` approves RCA or requests revision for RM/Admin.
- `POST /api/incidents/:id/actions` creates action plans after RCA approval.
- `PUT /api/actions/:id` lets the owner update action progress/evidence.
- `POST /api/actions/:id/verify` lets RM/Admin verify or return action work.
- `POST /api/reports/monthly` generates a monthly summary for RM/Admin.
- `GET /api/auth/google` starts Google OAuth with scope `openid email profile`.
- `GET /api/auth/callback/google` verifies Google ID token, links/creates user according to policy, and signs the existing app session.
- `GET/PUT /api/admin/auth-settings` manages Google login settings.
- `GET/POST/DELETE /api/admin/invites` manages Google invite records.
- `GET /api/dashboard/executive` returns executive dashboard aggregates.
- `GET /api/dashboard/rm` returns RM dashboard aggregates.
- `GET /api/dashboard/unit` returns unit-scoped dashboard aggregates.
- `GET /api/analytics/heatmap` returns unit/category heatmap data.
- `GET /api/analytics/safety-goals` returns 9 Important Safety Goals metrics.
- `GET /api/analytics/trends`, `/api/analytics/top-risk-codes`, `/api/analytics/top-units` return chart-ready aggregates.

Dashboard and analytics APIs accept:

- `startDate`
- `endDate`
- `unitId`
- `clinicalOrGeneral`
- `simpleCategory`
- `includeClosed`

Dashboard filters support this month, Thai fiscal year (October 1 to September 30), last 12 months, and custom date range.

## Google OAuth Setup

1. Open [Google Cloud Console](https://console.cloud.google.com/).
2. Create or select a project.
3. Configure OAuth consent screen for the organization.
4. Create OAuth Client ID with type `Web application`.
5. Add Authorized JavaScript origins:
   - Development: `http://localhost:3000`
   - Production: `https://your-domain.com`
6. Add Authorized redirect URIs:
   - Development: `http://localhost:3000/api/auth/callback/google`
   - Production: `https://your-domain.com/api/auth/callback/google`
7. Put values in `.env`:

```env
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
APP_BASE_URL="http://localhost:3000"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="change-me-super-secret"
```

8. Login as Admin and open `/admin/auth-settings`.
9. Enable Google Login.
10. Add allowed domains such as `hospital.go.th` or `moph.go.th`, or allowed individual emails such as `specificdoctor@gmail.com`.
11. Turn on `Allow auto provision` when allowed Google users should be created automatically as Reporter.
12. Test with a Google account whose email is verified and allowed.

## Google Auth Policy

- Existing email/password login remains available.
- Google login is disabled by default until Admin enables it.
- Google login requires `email_verified = true`.
- Allowed access is controlled by Admin settings:
  - allowed Google domains
  - allowed individual Google emails
  - optional invite records
  - optional auto provision policy
- If a Google email matches an existing user, the system links `googleId` to that user and keeps the existing role/unit/isActive values.
- If there is no existing user and the Google email is allowed, the system creates an active Reporter account and requires the user to select a unit before entering the app.
- If an invite exists, role/unit come from the invite. The user cannot choose their own role.
- Existing users and invite users keep the role/unit configured by Admin.
- Inactive users cannot login.
- Admin can unlink Google from a user if needed.

## PDPA / Privacy Note

Google OAuth is used only to verify identity. The app requests only:

- `openid`
- `email`
- `profile`

The system does not request or access Gmail, Google Drive, Google Calendar, or other Google data. Role, unit, access rights, and account status are controlled inside this HRMS system by Admin. Users who leave the organization must be deactivated by Admin.

## Auth Audit Events

- `LOGIN_CREDENTIALS_SUCCESS`
- `LOGIN_GOOGLE_SUCCESS`
- `LOGIN_GOOGLE_DENIED_DOMAIN`
- `LOGIN_GOOGLE_DENIED_NO_USER`
- `GOOGLE_ACCOUNT_LINKED`
- `GOOGLE_ACCOUNT_UNLINKED`
- `USER_ROLE_CHANGED`
- `USER_DEACTIVATED`
- `AUTH_SETTINGS_UPDATED`
- `USER_INVITE_CREATED`
- `USER_INVITE_ACCEPTED`
- `USER_INVITE_REVOKED`

## End-To-End Workflow

1. Reporter submits an incident.
2. RM reviews and triages the incident.
3. RM sets status to `RCARequired` when RCA is needed.
4. UnitManager opens the incident, completes RCA, and submits it.
5. RM approves RCA or requests revision.
6. UnitManager creates action plan(s).
7. Action owner updates status/evidence and marks action `Done`.
8. RM verifies action plan(s).
9. RM sets incident status to `Closed` after all actions are verified.
10. RM generates the monthly report from the RM dashboard.

## Google Login Test Guide

1. Existing active user with matching Google email: login succeeds, original role/unit are preserved, `GOOGLE_ACCOUNT_LINKED` is logged the first time.
2. Existing inactive user: login is denied.
3. Email domain not in allowed domains and not in allowed emails: login is denied and `LOGIN_GOOGLE_DENIED_DOMAIN` is logged.
4. No user but Google email is allowed: user is created as active Reporter and must select a unit on first login.
5. Pending invite exists for Google email: login succeeds, user is created with invite role/unit, invite becomes `Accepted`.
6. Admin disables Google Login: login button is hidden and `/api/auth/google` redirects back with an error.
7. Credentials login still works.
8. Reporter still sees only own incidents.
9. UnitManager still sees only own unit incidents.
10. RMTeam/Admin permissions still allow triage/export/RCA/action verification.

## Verification

Recommended production-readiness checks:

```bash
npm run build
npx prisma migrate reset
npx prisma db seed
```

The build script runs `prisma generate` before `next build`.

Phase 7 smoke check against a running dev server:

```bash
npm run dev
npm run test:phase7
```

## Phase 7 Production Readiness

Additional production documents:

- `DEPLOYMENT.md`
- `PRODUCTION_CHECKLIST.md`
- `USER_GUIDE.md`
- `ROLE_GUIDE.md`
- `PDPA_READINESS_NOTES.md`
- `FINAL_READINESS_REPORT.md`
- `MIGRATION_GUIDE.md`

New readiness routes:

- `/unit/rca`
- `/unit/actions`
- `/rm/triage`
- `/rm/rca`
- `/rm/actions`
- `/rm/reports`
- `/rm/automation`
- `/executive/monthly-report`
- `/admin/dashboard`
- `/admin/audit-logs`
- `/admin/automation`

Production seed:

```bash
npm run seed:prod
```

The production seed creates master data and auth settings only. It does not create sample users or passwords.

## Notes

- SQLite stores role/status values as strings for compatibility.
- Attachments are modeled in Prisma but upload/storage UI is not implemented yet.
- For PostgreSQL later, change the Prisma datasource provider to `postgresql`, set `DATABASE_URL`, and create a new migration for the target database.
