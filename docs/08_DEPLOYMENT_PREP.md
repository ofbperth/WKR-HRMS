# Deployment Prep

## Production Target

Use PostgreSQL for production. SQLite is acceptable only for local development or demo.

Node.js 20 LTS or later is recommended.

## Environment Variables Checklist

Required or commonly used production variables:

```env
DATABASE_URL="postgresql://..."
AUTH_SECRET="minimum-32-character-secret"
NEXTAUTH_SECRET="minimum-32-character-secret"
NEXTAUTH_URL="https://your-domain.com"
APP_BASE_URL="https://your-domain.com"
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
ENCRYPTION_KEY="<32-byte-base64-or-hex-key>"
SEED_DEV_USERS="false"
RETENTION_DRY_RUN="true"
MAX_RETENTION_DELETE_PER_RUN="100"
EXPORT_SIGNED_URL_TTL_SECONDS="1800"
```

No production secret should be committed.

## Deployment Checklist

1. Rotate Google OAuth client secret and all app secrets.
2. Set production `DATABASE_URL` to PostgreSQL.
3. Configure HTTPS.
4. Configure Google OAuth redirect URI:

   ```text
   https://your-domain.com/api/auth/callback/google
   ```

5. Run migrations.
6. Run production seed.
7. Create the first Admin account through a controlled process.
8. Configure `/admin/auth-settings`.
9. Deactivate test/sample users.
10. Verify role menus for Reporter, UnitManager, RMTeam, Executive, and Admin.
11. Verify incident, RCA, action, dashboard, export, audit, and automation flows.
12. Verify backup and restore procedure.

## Build and Migrate

```bash
npm ci
npx prisma generate
npx prisma migrate deploy
npm run seed:prod
npm run build
npm run start
```

## Supabase / PostgreSQL Readiness

Before production:

- Test Prisma migrations against the target PostgreSQL database.
- Apply `prisma/supabase_rls_storage.sql` in staging.
- Confirm service role credentials are server-only.
- Confirm `anon` and `authenticated` database roles cannot write app tables directly.
- Confirm private object bucket and signed URL downloads.
- Run `npm run security:backfill-sensitive` after `ENCRYPTION_KEY` is set.

## VPS Notes

- Put the app behind Nginx or another reverse proxy.
- Enforce HTTPS before enabling production Google OAuth.
- Restrict `.env` permissions to the deployment user.
- Back up PostgreSQL daily and before every migration.

Reverse proxy sketch:

```nginx
server {
  listen 443 ssl http2;
  server_name your-domain.com;

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto https;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  }
}
```

## Backup / Restore

Backup scope:

- incidents and lifecycle metadata
- RCA
- users/roles
- workflow/action plans
- audit trail
- attachment/export metadata

Exclude temporary cache, dashboard cache, generated chart cache, and temp exports.

Restore endpoint documented for archived/soft-deleted incidents:

```text
POST /api/incidents/{id}/restore
```

Need verification: full database and object-storage restore should be tested in staging.

## Rollback Plan

1. Keep `RETENTION_DRY_RUN=true` until retention behavior is validated.
2. Remove `retention-cleanup` from any external scheduler if issues appear.
3. If signed export issues occur, temporarily reduce export access to Admin while investigating.
4. Restore mistakenly archived or soft-deleted records with the restore endpoint.
5. Revert only the affected governance/export/retention change where possible.

## Production Build Checklist

Run:

```bash
npm run lint
npm run test
npm run test:qa
npm run build
```

Known environment caveat: Prisma generate and Next lint can fail in restricted sandboxes with `EPERM`; rerun in the normal deployment terminal before treating as an application failure.

