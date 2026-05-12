# Bug Report

## 1. Non-clinical high severity incidents did not auto-require RCA

- Severity: High
- Affected file/component/API: `lib/incident-automation.ts`, `lib/severity.ts`, `POST /api/incidents`
- Reproduction steps:
  1. Login as Reporter or UnitManager.
  2. Submit a General incident with severity Level 3, 4, or 5.
  3. Open the incident in RM/unit workflow.
- Expected behavior: General Level 3-5 is high severity and should follow the same high-severity escalation rule as Clinical E-I, including `RCARequired`.
- Actual behavior: Only Clinical E-I triggered automatic RCA. General Level 3-5 remained `New`.
- Recommended fix: Use a single shared high-severity classifier for both clinical and general events during incident creation and dashboard aggregation.
- Fixed in this PR: Yes.

## 2. Automated regression tests were missing

- Severity: High
- Affected file/component/API: `package.json`, project QA workflow
- Reproduction steps:
  1. Run `npm run test`.
  2. Observe that no real test command exists.
- Expected behavior: The project should have repeatable automated tests beyond `npm run build`.
- Actual behavior: Build existed, but no Vitest unit/integration test framework was configured.
- Recommended fix: Add Vitest, test scripts, and focused tests for RBAC, risk-code filtering, incident validation, RCA permissions, high severity, and dashboard filters.
- Fixed in this PR: Yes.

## 3. Direct incident APIs need continuing regression coverage

- Severity: Medium
- Affected file/component/API: `app/api/incidents/*`, `lib/incident-query.ts`, `lib/rbac.ts`
- Reproduction steps:
  1. Attempt list/detail API access as Reporter, UnitManager, RMTeam, Admin, and Executive.
  2. Compare returned data against role expectations.
- Expected behavior: Reporter sees only own reports; UnitManager sees own unit; RMTeam/Admin see all permitted operational incident data; Executive cannot use incident detail/list APIs.
- Actual behavior: Source review shows shared scoping is present for Reporter and UnitManager, and Executive is excluded from incident APIs. No failing behavior verified, but this is high-risk and now covered at helper level.
- Recommended fix: Keep shared scope helpers and expand API-level tests when a test database harness is added.
- Fixed in this PR: Partially. Helper-level automated coverage added; full database-backed route tests remain recommended.

## 4. Executive aggregate dashboard privacy requires ongoing QA

- Severity: Medium
- Affected file/component/API: `app/api/dashboard/executive/route.ts`, `lib/dashboard-analytics.ts`
- Reproduction steps:
  1. Login as Executive.
  2. Open `/executive/dashboard` and call `/api/dashboard/executive`.
  3. Inspect response fields.
- Expected behavior: Executive dashboard returns aggregate cards/charts only and no HN, AN, reporter name/email, incident descriptions, or patient identifiers.
- Actual behavior: Source review shows aggregate-only response structures. No leak was verified.
- Recommended fix: Maintain aggregate-only return shape and add E2E/API tests with seeded data before production.
- Fixed in this PR: Partially. Dashboard filter/shape helper tests and QA rubric added.

## 5. Audit logging coverage depends on workflow path

- Severity: Medium
- Affected file/component/API: `lib/audit.ts`, incident create/update/delete/RCA routes
- Reproduction steps:
  1. Create, update, triage, submit RCA, approve RCA, verify action, and close an incident.
  2. Check Admin audit log.
- Expected behavior: Important create/update/review/close/RCA actions are recorded with sensitive values redacted.
- Actual behavior: Source review found audit logging for incident create/update/delete/view, RCA save/submit/approve, auth/admin events, and redaction of sensitive keys. Full end-to-end audit completeness was not database-tested in this pass.
- Recommended fix: Add database-backed audit assertions once a dedicated test database and seed harness are available.
- Fixed in this PR: Partially. Rubric and bug report call out the remaining E2E audit verification.

## 6. Sensitive identifier reveal API allowed non-RM roles

- Severity: High
- Affected file/component/API: `app/api/incidents/[id]/sensitive/route.ts`, `components/incidents/incident-detail.tsx`, `lib/rbac.ts`
- Reproduction steps:
  1. Login as Reporter or UnitManager.
  2. Open a permitted incident detail page.
  3. Use the HN/AN reveal dialog or call `POST /api/incidents/{id}/sensitive` directly with a reason and PDPA confirmation.
- Expected behavior: HN/AN reveal is restricted to roles allowed by sensitive-data policy, currently RMTeam/Admin only, and direct API access enforces the same rule as the UI.
- Actual behavior: The UI rendered the reveal control for all scoped incident viewers and the route accepted Reporter/UnitManager requests if they could otherwise access the incident.
- Recommended fix: Gate the sensitive route and detail UI with `canSeeSensitive`, and add a regression test for direct API path authorization.
- Fixed in this PR: Yes.
