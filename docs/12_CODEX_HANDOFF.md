# Codex Handoff

## Project Context

WKR-HRMS is a Next.js App Router hospital RM system for incident reporting, triage, RCA, action tracking, dashboards, exports, audit logs, and governance.

The repo is expected at:

```text
C:\DEV\hrms-project\WKR-HRMS
```

## Current Status

- Documentation has been consolidated into canonical `/docs` files.
- Root `README.md` is now a short entry point.
- Legacy root Markdown notes were migrated into canonical docs.
- `skill.md` is intentionally untouched.

## What Not To Break

- Reporter sees only own reports.
- UnitManager sees only own unit incidents, dashboards, RCA, actions, and exports.
- RMTeam/Admin retain all RM workflow authority.
- Executive views remain aggregate-only and do not expose HN, AN, reporter identity, descriptions, or RCA narrative.
- Sensitive HN/AN reveal remains RMTeam/Admin only and requires reason + PDPA confirmation.
- NRLS Clinical/General filtering and risk-code auto-fill must stay intact.
- General Level 3-5 and Clinical E-I high-severity handling must stay aligned.
- Audit logs must remain redacted for secrets and sensitive identifiers.
- Production secrets and real patient data must never be committed.

## Important Files

| File | Why it matters |
| --- | --- |
| `lib/rbac.ts` | Role and permission boundaries. |
| `lib/workflow-permissions.ts` | RCA/action workflow permissions. |
| `lib/incident-query.ts` | Role-scoped incident list/detail query behavior. |
| `lib/triage-query.ts` | RM triage query behavior. |
| `lib/dashboard-analytics.ts` | Dashboard aggregation and role-scoped metrics. |
| `lib/severity.ts` | High-severity classification. |
| `lib/sensitive-fields.ts` | Sensitive reveal and masking helpers. |
| `lib/encryption.ts` | Sensitive-field encryption. |
| `lib/audit.ts` | Audit logging and redaction. |
| `prisma/schema.prisma` | Current SQLite schema and production-readiness fields. |
| `prisma/supabase_rls_storage.sql` | Supabase hardening script. |

## Suggested Next Tasks

1. Add database-backed API tests for RBAC and IDOR-sensitive routes.
2. Add browser E2E for login, report, triage, RCA, action, close, export, and dashboard flows.
3. Verify PostgreSQL migration in staging.
4. Verify Supabase RLS/storage script in staging.
5. Test production Google OAuth callback after secret rotation and domain setup.
6. Confirm hospital PDPA/retention policy and update docs if governance differs.
7. Verify attachment upload/download implementation before documenting attachments as complete.

## Validation Commands

Run after code changes:

```bash
npm run lint
npm run test
npm run test:qa
npm run build
```

Sandbox fallback when Prisma/Next cache permissions block normal commands:

```bash
npx tsc --noEmit --incremental false
npx eslint . --ext .ts,.tsx --cache=false
```

For documentation-only changes, still run `git status`. Run app validation where the environment allows it, and report environment blockers honestly.

