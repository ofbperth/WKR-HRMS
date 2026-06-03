CREATE TABLE "ExportJob" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "unit_id" TEXT,
    "reason" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "filters_json" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "attempt_count" INTEGER NOT NULL DEFAULT 0,
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "started_at" TIMESTAMP(3),
    "finished_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "filename" TEXT,
    "content_type" TEXT,
    "row_count" INTEGER,
    "storage_object_id" TEXT,
    "last_error" TEXT,

    CONSTRAINT "ExportJob_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ExportJob_storage_object_id_key" ON "ExportJob"("storage_object_id");
CREATE INDEX "ExportJob_user_id_requested_at_idx" ON "ExportJob"("user_id", "requested_at");
CREATE INDEX "ExportJob_status_requested_at_idx" ON "ExportJob"("status", "requested_at");
CREATE INDEX "ExportJob_kind_requested_at_idx" ON "ExportJob"("kind", "requested_at");
CREATE INDEX "ExportJob_expires_at_idx" ON "ExportJob"("expires_at");

ALTER TABLE "ExportJob" ADD CONSTRAINT "ExportJob_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
