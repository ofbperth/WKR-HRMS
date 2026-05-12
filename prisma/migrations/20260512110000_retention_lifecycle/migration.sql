ALTER TABLE "Incident" ADD COLUMN "lifecycle_status" TEXT NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "Incident" ADD COLUMN "archived_at" DATETIME;
ALTER TABLE "Incident" ADD COLUMN "deleted_at" DATETIME;
ALTER TABLE "Incident" ADD COLUMN "retention_review_required" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Incident" ADD COLUMN "legal_hold" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Incident" ADD COLUMN "under_investigation" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "Incident_archived_at_idx" ON "Incident"("archived_at");
CREATE INDEX "Incident_deleted_at_idx" ON "Incident"("deleted_at");
CREATE INDEX "Incident_lifecycle_status_idx" ON "Incident"("lifecycle_status");

CREATE TABLE "RetentionRun" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mode" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "started_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" DATETIME,
    "reviewed" INTEGER NOT NULL DEFAULT 0,
    "archived" INTEGER NOT NULL DEFAULT 0,
    "soft_deleted" INTEGER NOT NULL DEFAULT 0,
    "files_deleted" INTEGER NOT NULL DEFAULT 0,
    "skipped_protected" INTEGER NOT NULL DEFAULT 0,
    "stopped_by_failsafe" BOOLEAN NOT NULL DEFAULT false,
    "message" TEXT,
    "result_json" TEXT,
    "created_by_id" TEXT
);

CREATE INDEX "RetentionRun_started_at_idx" ON "RetentionRun"("started_at");
CREATE INDEX "RetentionRun_status_idx" ON "RetentionRun"("status");

CREATE TABLE "CacheEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cache_key" TEXT NOT NULL,
    "cache_type" TEXT NOT NULL,
    "unit_id" TEXT,
    "report_type" TEXT,
    "filters_json" TEXT NOT NULL,
    "payload_json" TEXT NOT NULL,
    "expires_at" DATETIME NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

CREATE UNIQUE INDEX "CacheEntry_cache_key_key" ON "CacheEntry"("cache_key");
CREATE INDEX "CacheEntry_cache_type_idx" ON "CacheEntry"("cache_type");
CREATE INDEX "CacheEntry_unit_id_idx" ON "CacheEntry"("unit_id");
CREATE INDEX "CacheEntry_report_type_idx" ON "CacheEntry"("report_type");
CREATE INDEX "CacheEntry_expires_at_idx" ON "CacheEntry"("expires_at");

CREATE TABLE "StorageObject" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bucket" TEXT NOT NULL,
    "object_key" TEXT NOT NULL,
    "object_type" TEXT NOT NULL,
    "target_type" TEXT,
    "target_id" TEXT,
    "storage_tier" TEXT NOT NULL DEFAULT 'HOT',
    "compressed" BOOLEAN NOT NULL DEFAULT false,
    "read_only" BOOLEAN NOT NULL DEFAULT false,
    "expires_at" DATETIME,
    "archived_at" DATETIME,
    "deleted_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

CREATE UNIQUE INDEX "StorageObject_object_key_key" ON "StorageObject"("object_key");
CREATE INDEX "StorageObject_object_type_idx" ON "StorageObject"("object_type");
CREATE INDEX "StorageObject_target_type_target_id_idx" ON "StorageObject"("target_type", "target_id");
CREATE INDEX "StorageObject_storage_tier_idx" ON "StorageObject"("storage_tier");
CREATE INDEX "StorageObject_expires_at_idx" ON "StorageObject"("expires_at");
CREATE INDEX "StorageObject_archived_at_idx" ON "StorageObject"("archived_at");
CREATE INDEX "StorageObject_deleted_at_idx" ON "StorageObject"("deleted_at");
