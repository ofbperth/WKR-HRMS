CREATE INDEX "Incident_occurredAt_status_idx" ON "Incident"("occurredAt", "status");
CREATE INDEX "Incident_occurredAt_severity_idx" ON "Incident"("occurredAt", "severity");
CREATE INDEX "Incident_occurredAt_incidentUnitId_idx" ON "Incident"("occurredAt", "incidentUnitId");
CREATE INDEX "Incident_incidentUnitId_status_idx" ON "Incident"("incidentUnitId", "status");
CREATE INDEX "Incident_clinicalOrGeneral_occurredAt_idx" ON "Incident"("clinicalOrGeneral", "occurredAt");
CREATE INDEX "Incident_simpleCategory_occurredAt_idx" ON "Incident"("simpleCategory", "occurredAt");
CREATE INDEX "ActionPlan_incidentId_idx" ON "ActionPlan"("incidentId");
CREATE INDEX "Comment_incidentId_idx" ON "Comment"("incidentId");
CREATE INDEX "Attachment_incidentId_idx" ON "Attachment"("incidentId");
