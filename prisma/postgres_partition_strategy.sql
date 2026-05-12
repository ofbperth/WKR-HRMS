-- PostgreSQL yearly partition strategy for production planning.
-- Do not apply blindly to an existing Prisma-managed Incident table.
-- Use during a controlled maintenance window after testing a shadow database.

-- Goal:
-- - Keep Prisma querying the logical "Incident" table.
-- - Partition by occurredAt yearly.
-- - Preserve existing indexes and foreign-key behavior.
-- - Never rename/drop the active table until validation has passed.

-- Example Buddhist Era year labels:
-- incident_2568 = 2025-01-01 through 2025-12-31
-- incident_2569 = 2026-01-01 through 2026-12-31
-- incident_2570 = 2027-01-01 through 2027-12-31

-- Controlled rollout outline:
-- 1. Create a partitioned shadow table with the exact Incident columns.
-- 2. Backfill data in batches ordered by occurredAt.
-- 3. Validate row counts, RCA/action/comment/attachment joins, dashboards, exports, filters.
-- 4. Swap only after backup and app maintenance lock.
-- 5. Keep the original table read-only until rollback window closes.

-- Reference DDL shape:
-- CREATE TABLE "Incident_partitioned" (LIKE "Incident" INCLUDING ALL)
-- PARTITION BY RANGE ("occurredAt");
--
-- CREATE TABLE incident_2568 PARTITION OF "Incident_partitioned"
-- FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');
--
-- CREATE TABLE incident_2569 PARTITION OF "Incident_partitioned"
-- FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');
--
-- CREATE TABLE incident_2570 PARTITION OF "Incident_partitioned"
-- FOR VALUES FROM ('2027-01-01') TO ('2028-01-01');

-- Required indexes on each partition or the partitioned parent:
-- CREATE INDEX ON "Incident_partitioned" ("occurredAt");
-- CREATE INDEX ON "Incident_partitioned" ("createdAt");
-- CREATE INDEX ON "Incident_partitioned" ("incidentUnitId");
-- CREATE INDEX ON "Incident_partitioned" ("severity");
-- CREATE INDEX ON "Incident_partitioned" ("riskCodeId");
-- CREATE INDEX ON "Incident_partitioned" ("status");
-- CREATE INDEX ON "Incident_partitioned" ("archived_at");
-- CREATE INDEX ON "Incident_partitioned" ("deleted_at");

-- Prisma compatibility rule:
-- Application code should continue to query "Incident"; never require app code to know partition names.
