# Final Readiness Report

## Status

Ready with minor environment-dependent issues.

## Passed Checks

- TypeScript check passed with `tsc --noEmit --incremental false`.
- Prisma schema validation passed.
- Route coverage was expanded for Phase 7 checklist pages.
- RBAC default for unknown API paths now denies access.
- Google OAuth scope remains limited to `openid email profile`.
- Admin audit log page and CSV export added.
- RCA/action CSV exports added.
- Automation manual trigger and run log added.
- Monthly report printable page added.
- Production seed is separated from dev sample users.

## Known Issues

- `npx prisma generate` failed inside the Codex sandbox with `spawn EPERM`. This is an environment permission issue. Run it in the normal project terminal before build.
- `npm run lint` is now configured, but the Codex sandbox could not create `.next/cache/eslint` due `EPERM`. Run lint in the normal project terminal.
- Direct `next build` was started after isolating Prisma generate, but the sandbox timed out before completion. No TypeScript errors were found before build.
- Live Google OAuth callback cannot be fully verified without production OAuth credentials and redirect domain. Manual test steps remain required after secret rotation.
- Free-text incident fields can still contain sensitive identifiers if users type them. User training and periodic audit review are required.

## Security Notes

- Unknown API routes are blocked by default in RBAC.
- Admin-only audit export is logged.
- Inactive users are blocked from login.
- Google login requires verified email and server-side role policy.
- Rotate the Google client secret that was shared during development before go-live.

## PDPA Notes

- Patient HN is optional and masked for executive/non-sensitive views.
- Google OAuth does not access Gmail, Drive, or Calendar.
- Role/unit authorization remains inside the system and is not user-selected from the client.

## Deployment Readiness

- Use PostgreSQL for production.
- Run `npx prisma migrate deploy`.
- Run `npm run seed:prod`.
- Run `npm run build`.
- Run `npm run test:phase7` against a seeded test environment with the dev server running.

## Next Steps

- Rotate secrets.
- Configure production Google OAuth redirect URI.
- Create the first Admin account through a controlled process.
- Confirm backup/restore.
- Complete a hospital user acceptance test with Reporter, UnitManager, RMTeam, Executive, and Admin.
