# Storage Retention Governance

## Storage Strategy

PostgreSQL stores incidents, RCA, workflow, KPI, audit trail, users/roles, and metadata only.

Object storage stores generated files:

- PDF exports
- Excel exports
- annual report snapshots
- dashboard snapshots
- attachments

Large binary files must not be stored in PostgreSQL.

## Retention Policy

| Data class | TTL / retention |
| --- | --- |
| Temporary export reports | 1 day |
| Dashboard cache | 1 day |
| Search/filter cache | 1 day |
| Monthly summary cache | 10 days |
| Annual report snapshot | 5 years |
| Incident records | Minimum 5 years |

## Incident Lifecycle

```text
ACTIVE -> ARCHIVED -> SOFT_DELETED -> PENDING_HARD_DELETE_APPROVAL -> HARD_DELETE
```

Hard delete must never run automatically. The retention engine only archives or soft-deletes eligible old incidents. Admin review is required before any future hard-delete workflow.

Protected incidents are skipped and marked for review when applicable:

- unresolved
- under RCA
- linked to CAPA/action plans
- sentinel event
- `legal_hold = true`
- `under_investigation = true`

## Dry Run and Failsafe

Set:

```env
RETENTION_DRY_RUN=true
MAX_RETENTION_DELETE_PER_RUN=100
```

Dry-run mode generates audit logs and retention-run records but does not delete data or files.

If cleanup candidates exceed `MAX_RETENTION_DELETE_PER_RUN`, cleanup stops immediately and writes a critical audit event.

## Scheduler

The automation job name is:

```text
retention-cleanup
```

It can be run from the existing automation API/UI by RM/Admin roles. Keep dry-run enabled until production validation is complete.

## Restore

Admin restore endpoint:

```text
POST /api/incidents/{id}/restore
```

Restore changes `ARCHIVED` or `SOFT_DELETED` incidents back to `ACTIVE`, preserving RCA linkage, action plans, comments, attachments metadata, and audit trail.

## Smart Cache

The cache key includes:

- cache type
- unit scope
- role
- date range
- report type
- filters

Dashboard cache TTL is 1 day, but incident/RCA writes invalidate dashboard/search/monthly summary cache to protect correctness.

## Backup Scope

Include:

- incidents and lifecycle metadata
- RCA
- users/roles
- workflow/action plans
- audit trail
- attachment/export metadata

Exclude:

- temporary cache
- dashboard cache
- generated chart cache
- temp exports

## Hot and Cold Storage

HOT:

- active incidents
- active dashboard data
- recent attachments and reports

COLD:

- archived incidents
- annual snapshots older than active reporting windows
- read-only compressed snapshots

Cold objects should be marked read-only and compressed when moved to cheaper compatible storage.

## Partition Strategy

See `prisma/postgres_partition_strategy.sql`.

Use yearly partitions only after testing in a shadow database. Prisma must continue querying the logical `Incident` model; application routes must not know partition names.
