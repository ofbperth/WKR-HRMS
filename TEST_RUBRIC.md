# WKR-HRMS QA Test Rubric (100 Points)

Use this rubric before production or cloud deployment. Passing means no critical defects, all required scripts pass, and total score is at least 90/100.

## 1. Build and Environment (10 points)

- 3 pts: `npm install` completes without dependency errors.
- 2 pts: `.env` is present and required variables are set: `DATABASE_URL`, `AUTH_SECRET`, `ENCRYPTION_KEY` for production, `APP_BASE_URL`, OAuth variables if Google login is enabled.
- 2 pts: `npx prisma generate` completes.
- 2 pts: `npm run build` completes.
- 1 pt: `npm run test` completes.

## 2. Authentication and Session (10 points)

- 3 pts: Credential login works for active seeded users and rejects wrong passwords.
- 2 pts: Inactive users cannot login.
- 2 pts: Logout clears the session.
- 2 pts: Google login policy respects allowed domains, allowed emails, invite records, and active status.
- 1 pt: Session cookie is HTTP-only and uses production-safe settings when deployed.

## 3. RBAC and Direct API Access (15 points)

- 3 pts: Reporter can see only own reported incidents in UI and API.
- 3 pts: UnitManager can see only incidents from own unit in UI and API.
- 3 pts: RMTeam can see all incidents and manage review/RCA workflows.
- 2 pts: Admin can access admin, RM, and executive dashboards.
- 2 pts: Executive can access aggregate dashboards only and cannot call incident list/detail APIs.
- 2 pts: Unauthorized direct API calls return 401/403 and do not leak record data.

## 4. Incident Report Workflow (15 points)

- 3 pts: Required fields are validated before submit.
- 3 pts: Clinical selection shows only Clinical NRLS/risk codes.
- 3 pts: General selection shows only General NRLS/risk codes.
- 2 pts: Invalid risk-code/type combinations are rejected by API.
- 2 pts: Submit creates a valid `incidentNo` and persists the record.
- 2 pts: High severity rules are consistent: Clinical E-I and General Level 3-5 require escalation.

## 5. Incident Log, Search, and Detail (10 points)

- 2 pts: Role-specific incident lists match database scope.
- 2 pts: Search filters by incident number/title/location/risk code as expected.
- 2 pts: Incident detail follows the same role scope as list.
- 2 pts: HN/AN/reporter data is hidden from unauthorized roles; direct HN/AN reveal is limited to RMTeam/Admin and requires reason plus PDPA confirmation.
- 2 pts: CSV/export routes enforce the same role scope and create audit logs.

## 6. RCA Workflow (12 points)

- 2 pts: RCA page allows problem statement and timeline.
- 2 pts: RCA page allows root cause and preventive action.
- 2 pts: RCA page allows KPI and KPI owner.
- 2 pts: RCA page allows UnitManager to request RM support.
- 2 pts: RCA submit is limited to owning UnitManager/Admin.
- 2 pts: RCA approval/revision is restricted to RMTeam/Admin.

## 7. Dashboard, Analytics, Risk Matrix, and Safety Standards (12 points)

- 3 pts: Dashboard counts match equivalent database queries.
- 2 pts: Unit dashboard is scoped to the UnitManager unit.
- 2 pts: RM dashboard shows all operational incidents.
- 2 pts: Executive dashboard is aggregate-only and contains no patient identifiers.
- 2 pts: Risk heatmap and trend filters match selected date/unit/type/category.
- 1 pt: 9 Important Safety Standards pages show correct goal counts and drilldowns.

## 8. PDPA and Security (10 points)

- 2 pts: HN/AN/reporter identifiers are encrypted or redacted at rest/response where required.
- 2 pts: Aggregate dashboards never expose HN, AN, reporter name/email, narrative, or patient identifiers.
- 2 pts: Narrative fields reject obvious patient names or direct identifiers.
- 2 pts: Exports use signed/limited access where configured.
- 2 pts: Production secrets are not committed and default secrets are replaced.

## 9. Audit Log (6 points)

- 1 pt: Incident create is logged.
- 1 pt: Incident update/review/status changes are logged.
- 1 pt: Incident close/reject/restore actions are logged.
- 1 pt: RCA save/submit/approve/revision actions are logged.
- 1 pt: Export and sensitive-data access actions are logged.
- 1 pt: Audit values redact passwords, HN/AN, encrypted fields, Google IDs, and RCA encrypted narrative.
