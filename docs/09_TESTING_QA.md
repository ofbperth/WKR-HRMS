# Testing and QA

## Automated Checks

Run before release:

```bash
npm install
npx prisma generate
npm run lint
npm run test
npm run test:unit
npm run test:qa
npm run build
```

`npm run test` and `npm run test:unit` run Vitest tests.

`npm run test:e2e` is currently a placeholder. Use the manual checklist until browser E2E is implemented.

## Manual QA Pass Criteria

Passing production QA means:

- No critical defects.
- Required scripts pass in a normal environment.
- Manual score is at least 90/100.
- No sensitive-data exposure is found in UI, API responses, or exports.

## Manual Test Checklist

| Area | Checks |
| --- | --- |
| Build/environment | Install, env variables, Prisma generate, build, tests. |
| Auth/session | Credential login, inactive-user denial, logout, Google policy, cookie settings. |
| RBAC/direct API | Reporter own only, UnitManager own unit only, RM/Admin all workflow, Executive aggregate only, 401/403 for unauthorized direct calls. |
| Incident workflow | Required fields, Clinical/General risk-code filtering, invalid combo rejection, incident number creation, high-severity escalation. |
| Search/detail/export | Role scope, keyword/date/unit/status/severity/risk-code filters, HN/AN/reporter masking, export audit logs. |
| RCA | Draft, submit, RM support, UnitManager ownership, RM/Admin approval/revision. |
| Dashboards | RM/Unit/Executive counts, heatmap, trends, safety goals, no executive sensitive data. |
| PDPA/security | Encryption/redaction, aggregate-only dashboards, signed exports, no default secrets. |
| Audit log | Create/update/status/RCA/action/export/sensitive/auth/admin events logged with redaction. |

## Workflow Test Cases

1. Reporter submits a Clinical incident.
2. Reporter submits a General Level 3-5 incident and verifies high-severity escalation.
3. RM triages and requests RCA.
4. UnitManager saves and submits RCA for own unit.
5. RM approves RCA.
6. UnitManager creates action plan.
7. Owner updates action evidence/status.
8. RM verifies action.
9. RM closes incident.
10. RM generates monthly report.

## RBAC Test Cases

- Reporter cannot access RM, Unit, Executive, or Admin pages.
- Reporter sees only own reports.
- UnitManager sees only own unit incidents, RCA, action, and dashboard data.
- RMTeam sees all operational incidents and workflow pages.
- Executive sees only aggregate dashboards and monthly summaries.
- Admin can access admin maintenance plus RM and executive dashboards.
- Direct API calls enforce the same scope as UI pages.

## Security Test Cases

- SQL injection attempts in text filters and export filters.
- IDOR attempts on incident detail, restore, sensitive reveal, and signed exports.
- Non-Admin attempts to access governance and audit export.
- UnitManager cross-unit access attempts.
- Expired/tampered signed export URL.
- Secret scan for service role keys, `ENCRYPTION_KEY`, `AUTH_SECRET`, database credentials, and OAuth secrets.
- Supabase anon/authenticated direct table write denial after RLS is applied.

## Regression Test Checklist

- Login form submits `POST /api/auth/login` and redirects by role.
- `bcryptjs` type declaration does not break build.
- Clinical shows only Clinical NRLS/risk codes.
- General shows only General NRLS/risk codes.
- Selecting a risk code fills type/category.
- General Level 3-5 and Clinical E-I follow high-severity behavior.
- Executive dashboard responses remain aggregate-only.
- Sensitive reveal stays RMTeam/Admin only.
- Audit log redaction remains in place.

## Known Test Gaps / Need Verification

- Playwright/browser E2E is not configured.
- Database-backed route tests for all direct API scopes are still recommended.
- Live Google OAuth callback needs production domain and credentials.
- Supabase RLS/storage behavior needs staging verification.
- Full backup/restore needs staging verification.

