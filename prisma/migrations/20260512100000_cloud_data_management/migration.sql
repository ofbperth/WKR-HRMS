ALTER TABLE "Incident" ADD COLUMN "hn_encrypted" TEXT;
ALTER TABLE "Incident" ADD COLUMN "an_encrypted" TEXT;
ALTER TABLE "Incident" ADD COLUMN "reporter_name_encrypted" TEXT;
ALTER TABLE "RCA" ADD COLUMN "rca_encrypted" TEXT;
ALTER TABLE "AuditLog" ADD COLUMN "role" TEXT;
ALTER TABLE "AuditLog" ADD COLUMN "ip_address" TEXT;

CREATE INDEX "Incident_hn_encrypted_idx" ON "Incident"("hn_encrypted");
CREATE INDEX "Incident_an_encrypted_idx" ON "Incident"("an_encrypted");
CREATE INDEX "AuditLog_role_idx" ON "AuditLog"("role");
