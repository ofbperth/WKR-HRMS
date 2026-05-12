# Production Checklist

## Pre Go-Live

- Rotate Google OAuth client secret and all app secrets.
- Set production `DATABASE_URL` to PostgreSQL.
- Run `npx prisma migrate deploy`.
- Run `npm run seed:prod`.
- Create Admin account manually or through a controlled one-time script.
- Configure `/admin/auth-settings`.
- Confirm Google OAuth redirect URI: `https://your-domain.com/api/auth/callback/google`.
- Run `npm run build`.
- Run `npm run test:phase7` against a seeded test environment.
- Verify backup and restore procedure.

## Go-Live Day

- Enable HTTPS.
- Enable Google login only after domain/email allowlist is correct.
- Deactivate test/sample users.
- Confirm Reporter, UnitManager, RMTeam, Executive, and Admin role menus.
- Generate a monthly report and test print.
- Export incident, RCA, action, and audit CSV once.

## Post Go-Live

- Review audit logs daily for the first week.
- Review failed automation runs in `/admin/automation`.
- Confirm overdue notifications do not duplicate.
- Deactivate users who leave the organization immediately.
- Schedule quarterly PDPA access review.
