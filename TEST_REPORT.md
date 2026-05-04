# Test Report - Phase 2

## Automated/sandbox status

- Source code generation: completed
- Static route/file presence check: completed
- Dependency install/build inside this sandbox: not completed because `npm install` timed out before creating `node_modules`

## Files added/updated

- `lib/session.ts` edge-safe JWT helper
- `lib/auth.ts` server auth helper
- `lib/rbac.ts` role/permission map
- `lib/validators.ts` Zod schemas
- `lib/incident-automation.ts` create incident automation
- `lib/incident-query.ts` scope/filter queries
- `lib/notifications.ts` notification service
- `lib/audit.ts` audit service
- `components/incidents/*` incident form, list, detail, client actions
- `components/layout/notification-bell.tsx`
- `app/report/new`
- `app/my-reports`
- `app/unit/incidents`
- `app/rm/incidents`
- `app/rm/search`
- `app/api/incidents/*`
- `app/api/notifications/*`
- Updated Admin API routes
- Updated README

## Manual smoke test command

```bash
npm install
cp .env.example .env
npx prisma migrate dev --name init
npx prisma db seed
npm run build
npm run dev
```

## Expected smoke test result

- Login works for all sample users
- Reporter can submit incident
- Incident No generated as `RM-YYYY-0001`
- Notification bell shows unread notifications for RM/Admin after report
- RMTeam/Admin can edit classification
- Comment creation works
- Audit trail shows create/update/comment/export actions
- CSV export downloads current filtered list
