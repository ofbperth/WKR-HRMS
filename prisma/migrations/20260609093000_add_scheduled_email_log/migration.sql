-- CreateTable
CREATE TABLE "ScheduledEmailLog" (
    "id" TEXT NOT NULL,
    "job_type" TEXT NOT NULL,
    "scheduled_for" TIMESTAMP(3) NOT NULL,
    "recipient_email" TEXT NOT NULL,
    "recipient_scope" TEXT NOT NULL,
    "unit_id" TEXT,
    "status" TEXT NOT NULL,
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScheduledEmailLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ScheduledEmailLog_job_type_scheduled_for_recipient_email_key" ON "ScheduledEmailLog"("job_type", "scheduled_for", "recipient_email");

-- CreateIndex
CREATE INDEX "ScheduledEmailLog_job_type_scheduled_for_idx" ON "ScheduledEmailLog"("job_type", "scheduled_for");

-- CreateIndex
CREATE INDEX "ScheduledEmailLog_recipient_scope_unit_id_idx" ON "ScheduledEmailLog"("recipient_scope", "unit_id");

-- CreateIndex
CREATE INDEX "ScheduledEmailLog_status_idx" ON "ScheduledEmailLog"("status");
