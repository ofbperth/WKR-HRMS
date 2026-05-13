# API Notes

Do not treat this as a full OpenAPI contract. It is a route map and behavior summary based on current repository files and historical docs. Confirm request/response details in route handlers before external integration.

## Auth

| Route | Notes |
| --- | --- |
| `POST /api/auth/login` | Credential login. |
| `POST /api/auth/logout` | Logout. |
| `GET /api/auth/me` | Current user/session info. |
| `GET /api/auth/google` | Start Google OAuth. |
| `GET /api/auth/callback/google` | Google OAuth callback. |
| `GET /api/auth/google/settings` | Google auth UI/settings helper. Need verification for exact scope. |

## Incidents

| Route | Notes |
| --- | --- |
| `GET /api/incidents` | Incident list. Must enforce role scope. |
| `POST /api/incidents` | Create incident. Reporter, UnitManager, RMTeam, and Admin documented. |
| `GET /api/incidents/:id` | Incident detail with role scope. |
| `PUT /api/incidents/:id` | Reporter edit while `New`; RM/Admin triage/update behavior documented historically. |
| `DELETE /api/incidents/:id` | Need verification from route before use. |
| `PUT /api/incidents/:id/triage` | Triage update. |
| `GET /api/incidents/export` | Filtered incident CSV/export. Should audit and enforce role scope. |
| `POST /api/incidents/:id/sensitive` | Sensitive HN/AN reveal. RMTeam/Admin only, reason + PDPA confirmation. |
| `POST /api/incidents/:id/restore` | Restore archived/soft-deleted incident. |
| `POST /api/incidents/:id/comments` | Add comment. |

## RCA and Actions

| Route | Notes |
| --- | --- |
| `PUT /api/incidents/:id/rca` | Save/submit RCA for owning UnitManager/Admin. |
| `POST /api/incidents/:id/rca/approve` | RM/Admin approve or request revision. |
| `POST /api/incidents/:id/actions` | Create action plans after RCA approval. |
| `PUT /api/actions/:id` | Action owner update. |
| `POST /api/actions/:id/verify` | RM/Admin verify or return action work. |
| `GET /api/actions/export` | Action export. |
| `GET /api/rca/export` | RCA export. |

## Dashboards and Analytics

| Route | Notes |
| --- | --- |
| `GET /api/dashboard/rm` | RM dashboard aggregates. |
| `GET /api/dashboard/unit` | Unit-scoped dashboard aggregates. |
| `GET /api/dashboard/executive` | Executive aggregate-only dashboard. |
| `GET /api/analytics/heatmap` | Unit/category heatmap data. |
| `GET /api/analytics/safety-goals` | 9 Important Safety Goals metrics. |
| `GET /api/analytics/trends` | Trend aggregates. |
| `GET /api/analytics/top-risk-codes` | Top risk-code aggregates. |
| `GET /api/analytics/top-units` | Top unit aggregates. |

Documented filters:

- `startDate`
- `endDate`
- `unitId`
- `clinicalOrGeneral`
- `simpleCategory`
- `includeClosed`

## Admin

| Route | Notes |
| --- | --- |
| `GET/POST/PUT/DELETE /api/admin/users` | User maintenance. Need verification for exact methods. |
| `GET/POST/PUT/DELETE /api/admin/units` | Unit maintenance. Need verification for exact methods. |
| `GET/POST/PUT/DELETE /api/admin/risk-codes` | Risk-code maintenance. Need verification for exact methods. |
| `GET/PUT /api/admin/auth-settings` | Google login settings. |
| `GET/POST/DELETE /api/admin/invites` | Google invite records. |
| `GET /api/admin/audit-logs` | Audit logs/export. |
| `GET /api/admin/governance` | Governance dashboard data. |

## Other

| Route | Notes |
| --- | --- |
| `GET /api/lookups` | Lookup/master data for forms. |
| `GET /api/notifications` | Notifications. |
| `POST /api/notifications/:id/read` | Mark notification read. |
| `POST /api/reports/monthly` | Generate monthly report for RM/Admin. |
| `GET /api/exports/download` | Signed export download. |
| `POST /api/automation` | Run protected automation jobs. |
| `POST /api/onboarding/unit` | Unit selection/onboarding. |

## Future API Ideas / TBD

- Formal OpenAPI specification.
- Database-backed API integration tests for RBAC and IDOR.
- Browser E2E coverage for full incident-to-closure flow.
- External notification API such as LINE only after stakeholder approval.

