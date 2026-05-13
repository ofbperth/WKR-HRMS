# Auth and RBAC

## Authentication Methods

WKR-HRMS supports:

- Email/password credential login.
- Optional Google OAuth for identity verification.
- JWT session cookies.

Google OAuth scopes are limited to:

- `openid`
- `email`
- `profile`

The system does not request Gmail, Drive, Calendar, or other Google data.

## Google Login Policy

Google login is disabled by default until Admin enables it in `/admin/auth-settings`.

Policy controls:

- Allowed Google domains.
- Allowed individual emails.
- Optional invite records.
- Optional auto provision as Reporter.
- Existing user account linking by email.
- Active user requirement.

If a Google email matches an existing user, the existing role, unit, and active status remain authoritative. Users do not choose their own role.

## Roles and Permissions

| Role | Access |
| --- | --- |
| Reporter | Submit incidents and view own reports only. Can update own incident only while status is `New`. |
| UnitManager | View unit dashboard, unit incidents, RCA, actions, and exports for own unit only. |
| RMTeam | View all RM workflow pages, triage, request/approve RCA, verify actions, close incidents, export workflow data, and run RM automation. |
| Executive | View aggregate dashboards, safety goals, and monthly report. No detailed RM workflow or incident APIs. |
| Admin | RMTeam-level workflow authority plus user/unit/risk-code/auth/audit/automation/governance administration. |

## Dashboard Visibility Rules

| View | Visibility |
| --- | --- |
| Reporter | Own submitted reports. |
| Unit dashboard | Current UnitManager unit only. |
| RM dashboard | All operational incidents. |
| Executive dashboard | Aggregate-only, no HN/AN/reporter/narrative identifiers. |
| Admin dashboard | Admin and governance views; Admin also has RM and Executive dashboard access. |

## Permission-Sensitive Areas

- Incident list/detail APIs.
- RCA submit/approve/revision paths.
- Action plan creation, owner updates, and RM verification.
- CSV exports and signed download routes.
- Sensitive HN/AN reveal endpoint.
- Admin user/role/unit/risk-code/auth settings.
- Audit log and governance dashboard.
- Retention, restore, and automation actions.

## Auth Audit Events

Known auth/admin events include:

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

## Limitations / TBD

- Live Google OAuth callback must be tested after production domain and secrets are configured.
- Browser E2E tests for direct API denial are not configured yet.
- Hospital account lifecycle policy must define who deactivates users and how quickly.

