# Security and workflow audit fixes (findings 1–9)

Baseline: 66f1dde on codex/hrms-audit-fixes. Incident numbering (finding 10) is intentionally unchanged.

## Changes

1. Onboarding only assigns a unit to an unassigned account. A conditional update prevents two simultaneous selections from overwriting each other. Subsequent unit changes remain in the Admin workflow.
2. getCurrentUser rejects sessions whose role or unit differs from the database. This protects server-rendered pages as well as APIs. Login remains reachable with a stale cookie, avoiding a redirect loop. Role/unit changes require reauthentication.
3. Stored export downloads and retries validate the current role and unit against the export snapshot. Workers revalidate active account permissions before building a queued export. Legacy signed grants also reject changed unit scope. Already-issued storage URLs retain their original short TTL.
4. RCA saves store narrative only in the encrypted payload, clearing legacy plaintext columns. Readers already support the encrypted five-tier factors. A dedicated dry-run-first backfill preserves encrypted narrative and migrates legacy-only factors, verifies encryption round-trip, and uses a compare-and-set before clearing legacy data. The older sensitive-data backfill uses the same safe conversion.
5. A shared lifecycle guard blocks action creation/update/verification, RCA saves/decisions, triage, classification/detail edits, and team reassignment for closed, rejected, archived, or soft-deleted incidents. Closure eligibility also rejects inactive lifecycle states.
6. RCA and incident submission status now commit in one Prisma transaction. Failure does not leave a submitted RCA with an unsubmitted incident; cache invalidation happens only after commit.
7. Triage UI and API reuse the same severity policy as incident creation: Clinical E–I and General 3–5 require RCA.
8. Storage cleanup records deletion only after the physical delete succeeds. Failures remain eligible for retry and are returned in the failed count. Export retry also stops if old-artifact cleanup fails.
9. CSV encoding neutralizes formula prefixes (including leading whitespace/control characters) before quoting user content.

## Existing RCA data rollout

Deploy the new writer before applying the backfill so an old instance cannot recreate plaintext copies. Use the target environment's database and matching encryption key; retain a recoverable backup under the existing operational policy.

- Dry run: npm run security:backfill-rca
- Apply after successful dry run: npm run security:backfill-rca -- --apply
- Repeat dry run; changed should be zero. Counts are printed without narrative values.

The script stops on malformed ciphertext or a concurrent edit. Resolve the cause and rerun; completed rows are idempotent. This code change does not itself rewrite production records or remove old backups. The sensitive-data backfill is broader; prefer the dedicated RCA command for this rollout.

## Validation boundary

Regression tests exercise real handlers with mocked persistence/storage, session revocation, first-unit selection races, terminal lifecycle states, General severity policy, transaction grouping/failure, encrypted storage conversion, export scope revocation, failed deletion retry, and CSV generation. Full unit suite, ESLint, TypeScript, and production build are run before pushing. No claim is made that mocked tests prove production database rollback, deployed RLS, or live account/browser flows.
