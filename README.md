# Hospital Risk Report & Management System

Phase 2 source code: Incident Report + Risk Log foundation for a Thai secondary-care hospital.

## Tech stack

- Next.js App Router + API routes
- React + TypeScript
- Tailwind CSS + lightweight shadcn-style components
- React Hook Form + Zod
- Prisma ORM
- SQLite for development (Prisma enum-like values are stored as String fields for SQLite compatibility)
- JWT session cookie + email/password login
- Role-based access control

## Phase 2 Features

### Incident Report

- `/report/new`
- 3-step incident report form
- Risk code searchable dropdown
- Severity A-I with Thai descriptions
- Patient HN optional; masked for non-RM/Admin views

### Risk Log / Incident List

- Reporter: `/my-reports`
- UnitManager: `/unit/incidents`
- RMTeam: `/rm/incidents`
- RM Search: `/rm/search`

Filters:

- Date range
- Unit
- Severity
- SIMPLE category
- Risk code
- Status
- Sentinel yes/no
- Need RM support yes/no
- Keyword search

CSV export:

- `/api/incidents/export` exports current filtered data
- Export action is logged in AuditLog

### Incident Detail

- Detail page per role route
- Shows incident information, classification, comments, and brief audit trail
- RMTeam/Admin can edit classification and status
- RMTeam/Admin can add comments

### Automation on submit

When an incident is submitted:

1. `incidentNo` generated as `RM-YYYY-0001`
2. `reportedAt` set to current timestamp
3. `reportedById` set to current user
4. `reporterUnitId` set to current user unit
5. Severity `G/H/I`
   - `isSentinel = true`
   - `status = RCARequired`
   - notification to RMTeam, Executive, Admin
   - audit log created
6. Severity `E/F`
   - `status = RCARequired`
   - notification to RMTeam/Admin
7. Severity `A-D`
   - `status = New`
   - notification to RMTeam/Admin
8. `needRmSupport = true`
   - extra RM notification
   - badge appears in lists

### Notifications

- Notification bell dropdown in app shell
- Unread count badge
- Mark-as-read API

### Audit Log

Logs:

- login/logout
- create incident
- update incident
- change severity
- change risk code
- change status
- mark sentinel
- add comment
- export CSV
- admin CRUD actions

## Roles

| Role | Access |
|---|---|
| Reporter | Create incident, view own reports, edit own New incidents via API foundation |
| UnitManager | View incidents where `incidentUnitId` equals own unit |
| RMTeam | View all incidents, edit classification/status, add comments, export CSV |
| Executive | Placeholder dashboard count only; no sensitive detail in Phase 2 |
| Admin | Admin CRUD + full incident access |

## Setup

```bash
npm install
cp .env.example .env
npx prisma migrate dev --name init
npx prisma db seed
npm run dev
```

Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Open:

```text
http://localhost:3000
```

## Sample users

All sample passwords are:

```text
password
```

| Email | Role |
|---|---|
| admin@hospital.local | Admin |
| rm@hospital.local | RMTeam |
| executive@hospital.local | Executive |
| unitmanager@hospital.local | UnitManager |
| reporter@hospital.local | Reporter |

## Test flow

### 1. Reporter create incident

1. Login as `reporter@hospital.local / password`
2. Open `/report/new`
3. Submit an incident with severity `A-D`
4. Expected:
   - Incident No format `RM-YYYY-0001`
   - Status = `New`
   - RMTeam/Admin receive notification
   - AuditLog contains `create incident`

### 2. Severity E/F automation

1. Submit another incident with severity `E` or `F`
2. Expected:
   - Status = `RCARequired`
   - `isSentinel = false`
   - RMTeam/Admin notification created

### 3. Severity G/H/I automation

1. Submit another incident with severity `G`, `H`, or `I`
2. Expected:
   - Status = `RCARequired`
   - `isSentinel = true`
   - RMTeam, Executive, Admin notification created
   - Sentinel badge appears

### 4. My Reports permission

1. Login as Reporter
2. Open `/my-reports`
3. Expected: only incidents reported by that user

### 5. UnitManager permission

1. Login as `unitmanager@hospital.local / password`
2. Open `/unit/incidents`
3. Expected: only incidents where incident unit equals the UnitManager unit

### 6. RMTeam workflow

1. Login as `rm@hospital.local / password`
2. Open `/rm/incidents`
3. Open an incident detail
4. Change severity/status/risk code/sentinel/RM support
5. Add comment
6. Expected:
   - Data updated
   - Audit trail shows update actions
   - Comment appears

### 7. Export CSV

1. Login as RMTeam/Admin
2. Open `/rm/search`
3. Apply filters
4. Click `Export CSV`
5. Expected:
   - CSV downloaded
   - Export action logged in AuditLog

## PostgreSQL later

Current Prisma datasource uses SQLite:

```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

For PostgreSQL in production later:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

Then set `DATABASE_URL` to your PostgreSQL connection string and re-run migration.

## Environment variables

See `.env.example`.

```env
DATABASE_URL="file:./dev.db"
AUTH_SECRET="change-me-super-secret"
NEXT_PUBLIC_APP_NAME="Hospital Risk Report & Management System"
```

## Known limits in Phase 2

- RCA and ActionPlan are still schema-ready but not fully implemented as workflow screens.
- Attachments model exists but upload UI/storage is not implemented yet.
- Executive dashboard is count placeholder only by design.
- AI features intentionally not included.

## Hotfix: NRLS Risk Code Master + Clinical/General Filtering

This build updates the risk code master to the official NRLS & HRMS on Cloud FY2565 list from `NRLS.pdf`.

- Seeds 315 active NRLS risk codes.
- Existing non-NRLS codes are marked `isActive=false` instead of deleted.
- Incident Report Step 2 now filters the Risk code dropdown by `Clinical / General`.
- Selecting a Risk code automatically sets `Clinical / General` and `SIMPLE category` from the selected NRLS record.

After replacing files, run:

```powershell
npx prisma generate
npx prisma db seed
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
npm run build
npm start
```
