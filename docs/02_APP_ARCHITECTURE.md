# App Architecture

## Framework

WKR-HRMS uses Next.js App Router with TypeScript. Route handlers live under `app/api`, pages live under `app`, reusable UI lives under `components`, and shared server/business logic lives under `lib`.

## Important Folders

| Path | Purpose |
| --- | --- |
| `app/` | App Router pages, layouts, and route handlers. |
| `app/api/` | API route handlers for auth, incidents, RCA, dashboards, analytics, exports, admin, and automation. |
| `components/` | Reusable UI, incident views, dashboard charts, layout, reports, admin, and automation panels. |
| `lib/` | Auth, RBAC, Prisma client, workflow permissions, incident queries, dashboard analytics, encryption, audit, exports, notifications, and validation. |
| `prisma/` | Prisma schema, migrations, seed scripts, Supabase RLS/storage SQL, and PostgreSQL partition notes. |
| `scripts/` | Operational scripts such as sensitive-data backfill, retention, and API checks. |
| `tests/` | Vitest coverage for helpers and workflow logic. |
| `types/` | Local TypeScript declarations. |

## App Router Structure

| Area | Routes |
| --- | --- |
| Public/auth | `/login`, `/pdpa`, `/onboarding/unit` |
| Reporter | `/report/new`, `/my-reports`, `/my-reports/[id]` |
| Unit | `/unit`, `/unit/dashboard`, `/unit/incidents`, `/unit/rca`, `/unit/actions`, `/unit/triage` |
| RM | `/rm/dashboard`, `/rm/incidents`, `/rm/search`, `/rm/triage`, `/rm/rca`, `/rm/actions`, `/rm/reports`, `/rm/automation`, `/rm/heatmap`, `/rm/analysis`, `/rm/safety-goals` |
| Executive | `/executive`, `/executive/dashboard`, `/executive/safety-goals`, `/executive/monthly-report` |
| Admin | `/admin`, `/admin/dashboard`, `/admin/users`, `/admin/units`, `/admin/risk-codes`, `/admin/auth-settings`, `/admin/audit-logs`, `/admin/automation`, `/admin/governance` |

## Frontend Structure

- `components/incidents/*`: incident form, list, detail, detail actions, and patient identifier reveal UI.
- `components/dashboard/*`: dashboard filter, charts, heatmap grid, safety goal cards.
- `components/reports/*`: monthly report and print/save controls.
- `components/layout/*`: sidebar and notification bell.
- `components/ui/*`: local UI primitives.

## Backend/API Structure

The backend uses route handlers in `app/api` plus shared service/helper modules in `lib`.

Key modules:

- `lib/auth.ts`, `lib/session.ts`, `lib/google-auth.ts`, `lib/auth-settings.ts`
- `lib/rbac.ts`, `lib/workflow-permissions.ts`
- `lib/incident-query.ts`, `lib/triage-query.ts`, `lib/incident-automation.ts`
- `lib/dashboard-analytics.ts`, `lib/analytics.ts`, `lib/dashboard-filter.ts`
- `lib/audit.ts`, `lib/notifications.ts`
- `lib/encryption.ts`, `lib/sensitive-fields.ts`
- `lib/export-builders.ts`, `lib/export-route.ts`, `lib/signed-export.ts`
- `lib/retention.ts`, `lib/governance.ts`, `lib/smart-cache.ts`
- `lib/validators.ts`, `lib/types.ts`, `lib/severity.ts`

## Data Flow Overview

1. User authenticates through credentials or allowed Google OAuth.
2. Session helpers resolve current user and role.
3. Pages and API routes call RBAC/workflow helpers before data access.
4. Prisma queries load only data allowed for the role and unit scope.
5. Sensitive identifiers are masked, encrypted, or revealed only through authorized paths.
6. Critical actions write audit logs and notifications.
7. Dashboards use aggregated data for role-appropriate views.

## Design Constraints

- Preserve route scopes and RBAC when changing query or UI behavior.
- Keep executive dashboards aggregate-only.
- Keep incident list/search payloads compact.
- Avoid exposing HN, AN, reporter identity, RCA narratives, or free-text identifiers to unauthorized roles.
- Do not let application routes depend on physical PostgreSQL partition names.

