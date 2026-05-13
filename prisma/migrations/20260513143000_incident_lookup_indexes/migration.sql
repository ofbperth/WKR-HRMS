CREATE INDEX "Incident_createdAt_idx" ON "Incident"("createdAt");
CREATE INDEX "Incident_reportedById_idx" ON "Incident"("reportedById");
CREATE INDEX "Incident_riskCodeId_occurredAt_idx" ON "Incident"("riskCodeId", "occurredAt");
