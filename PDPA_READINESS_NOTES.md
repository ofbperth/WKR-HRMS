# PDPA Readiness Notes

## 1. Data Collected

- User account: name, email, role, unit, active status, auth provider, optional Google profile image.
- Incident: date/time, unit, location, affected type, risk code, severity, title, description, immediate action, optional patient HN.
- RCA and action plan details needed for risk management.
- Notifications and audit logs for workflow/security traceability.

## 2. Purpose

The system collects data to report, triage, analyze, correct, and monitor hospital risk events and patient safety goals.

## 3. Role Access

- Reporter: own reports only.
- UnitManager: own unit incidents, RCA, and actions.
- RMTeam: organization risk workflow.
- Executive: summary dashboards and reports with sensitive detail minimized.
- Admin: system administration and audit oversight.

## 4. Masking Policy

- Patient HN is optional.
- Executive and non-sensitive exports mask patient HN.
- RMTeam/Admin can view sensitive workflow data for risk-management purposes.

## 5. Audit Trail

Audit logs cover login, Google account linking, role changes, user deactivation, incident workflow changes, RCA/action events, exports, auth settings, and automation runs.

## 6. Google Auth Scope

Google OAuth is used only for identity verification with:

- `openid`
- `email`
- `profile`

The system does not request Gmail, Drive, Calendar, or other Google scopes.

## 7. Remaining Privacy Risks

- Free-text incident descriptions may contain patient-identifying data if users type it.
- Audit logs can include workflow metadata and should be accessible only to Admin.
- Google OAuth live behavior must be retested after rotating secrets and configuring the production domain.

## 8. Recommendations Before Go-Live

- Train users not to put patient names or unnecessary identifiers in free-text fields.
- Rotate secrets before production.
- Deactivate departed staff immediately.
- Review audit logs periodically.
- Confirm backup, retention, and data deletion policy with hospital governance.
