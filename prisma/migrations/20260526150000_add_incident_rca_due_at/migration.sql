ALTER TABLE "Incident" ADD COLUMN "rca_due_at" TIMESTAMP(3);

CREATE INDEX "Incident_rca_due_at_idx" ON "Incident"("rca_due_at");
