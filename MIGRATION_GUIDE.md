# Migration Guide

## Local Development

```bash
cp .env.example .env
npx prisma generate
npx prisma migrate dev
npm run seed
```

## Production PostgreSQL

1. Create a PostgreSQL database and user.
2. Set `DATABASE_URL` to the PostgreSQL URL.
3. Change Prisma datasource provider to `postgresql` when cutting over from SQLite.
4. Create and review a PostgreSQL migration in a staging environment.
5. Run:

```bash
npx prisma generate
npx prisma migrate deploy
npm run seed:prod
```

## Seed Policy

- `npm run seed` is for development and creates sample users with password `password`.
- `npm run seed:prod` creates master data only and does not create sample users.
- Set `SEED_DEV_USERS=false` if running the dev seed without sample users.

## Phase 7 Migration

Phase 7 adds indexes for RCA, action plans, audit logs, cleans unit type values to `หน่วยงาน` or `ทีม`, and adds `AutomationRun`.
