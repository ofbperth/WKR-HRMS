CREATE INDEX "RCA_status_idx" ON "RCA"("status");
CREATE INDEX "ActionPlan_dueDate_idx" ON "ActionPlan"("dueDate");
CREATE INDEX "ActionPlan_status_idx" ON "ActionPlan"("status");
CREATE INDEX "ActionPlan_ownerId_idx" ON "ActionPlan"("ownerId");
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");
CREATE INDEX "AuditLog_entityType_idx" ON "AuditLog"("entityType");

UPDATE "Unit"
SET "type" = CASE
  WHEN "type" IN ('Quality', 'Team', 'ทีม') THEN 'ทีม'
  ELSE 'หน่วยงาน'
END;

CREATE TABLE "AutomationRun" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "jobName" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "finishedAt" DATETIME,
  "message" TEXT,
  "resultJson" TEXT,
  "error" TEXT,
  "triggeredBy" TEXT
);

CREATE INDEX "AutomationRun_jobName_idx" ON "AutomationRun"("jobName");
CREATE INDEX "AutomationRun_startedAt_idx" ON "AutomationRun"("startedAt");
CREATE INDEX "AutomationRun_status_idx" ON "AutomationRun"("status");
