# Database and Prisma

## Database Overview

Local development uses SQLite through Prisma:

```env
DATABASE_URL="file:./dev.db"
```

Production should use PostgreSQL. Supabase PostgreSQL is documented as the intended cloud-ready direction, but production cutover requires staging validation.

## Prisma Models Summary

| Model | Purpose |
| --- | --- |
| `User` | Users, roles, unit assignment, credential/Google identity, active status. |
| `Unit` | Hospital units/teams. |
| `RiskCode` | NRLS/HRMS risk code master data. |
| `Incident` | Main incident report, classification, status, lifecycle, and sensitive fields. |
| `RCA` | Root cause analysis content, KPI owner, approval status, encrypted RCA narrative. |
| `ActionPlan` | CAPA/action tracking, owner, due date, status, evidence, and RM verification. |
| `Comment` | Incident comments. |
| `Attachment` | Attachment metadata. Upload/storage UI needs verification. |
| `Notification` | User notifications and read state. |
| `AuditLog` | Workflow, auth, export, sensitive access, and governance audit trail. |
| `MonthlyReport` | Generated monthly summary metadata and JSON payload. |
| `AuthSettings` | Google login policy and defaults. |
| `UserInvite` | Google invite records for controlled onboarding. |
| `AutomationRun` | Automation job execution logs. |
| `RetentionRun` | Retention cleanup run logs and failsafe output. |
| `CacheEntry` | Smart cache payloads. |
| `StorageObject` | Object storage metadata and lifecycle state. |

## Migration Workflow

Local development:

```bash
npx prisma generate
npx prisma migrate dev
npx prisma db seed
```

Production/staging:

```bash
npx prisma generate
npx prisma migrate deploy
npm run seed:prod
```

Before a PostgreSQL cutover:

1. Create a PostgreSQL database and user.
2. Change Prisma datasource provider from `sqlite` to `postgresql`.
3. Set production `DATABASE_URL`.
4. Create/review a PostgreSQL migration in staging.
5. Run `npx prisma migrate deploy`.
6. Run `npm run seed:prod`.
7. Verify app workflows, dashboards, exports, auth, and audit logs.

## Seed Data

| Command | Behavior |
| --- | --- |
| `npm run seed` | Development seed. Creates master data and sample users with password `password`. |
| `npm run seed:prod` | Production seed. Creates master data/auth settings only; does not create sample users. |

NRLS seed notes:

- Seed includes 315 NRLS records from the documented NRLS/HRMS FY2565 list.
- Missing old risk codes are marked inactive instead of deleted to avoid breaking incident relations.
- Clinical/General selection filters risk code options.

## SQLite Compatibility Notes

- Prisma native enums are not used because SQLite does not support native enum fields.
- Role, severity, incident status, and similar enum-like values are stored as strings.
- TypeScript/Zod validation should remain the strict source of allowed values.

## PostgreSQL / Supabase Readiness

Relevant files:

- `prisma/supabase_rls_storage.sql`
- `prisma/postgres_partition_strategy.sql`

Production hardening notes:

- Apply Prisma migrations before Supabase RLS/storage policy SQL.
- Direct `anon` and `authenticated` database writes should be blocked.
- Backend service role access must never be exposed to the browser.
- Attachments should use a private bucket and signed URLs.
- Yearly partitions are a future option only after testing in a shadow database.

## Need Verification

- PostgreSQL migration has to be tested against the target version/provider.
- Supabase RLS/storage policy behavior must be verified in staging.
- Backup/restore process must be tested with real production-like data volume and hospital governance rules.

