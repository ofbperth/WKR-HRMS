-- Supabase hardening script for production PostgreSQL.
-- Apply after Prisma migrations and run the application backend with a service-role database connection.
-- The browser must never receive this connection string or write directly to sensitive tables.

ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Unit" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RiskCode" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Incident" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RCA" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ActionPlan" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Comment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Attachment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Notification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MonthlyReport" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuthSettings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UserInvite" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AutomationRun" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RetentionRun" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CacheEntry" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "StorageObject" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "User" FORCE ROW LEVEL SECURITY;
ALTER TABLE "Unit" FORCE ROW LEVEL SECURITY;
ALTER TABLE "RiskCode" FORCE ROW LEVEL SECURITY;
ALTER TABLE "Incident" FORCE ROW LEVEL SECURITY;
ALTER TABLE "RCA" FORCE ROW LEVEL SECURITY;
ALTER TABLE "ActionPlan" FORCE ROW LEVEL SECURITY;
ALTER TABLE "Comment" FORCE ROW LEVEL SECURITY;
ALTER TABLE "Attachment" FORCE ROW LEVEL SECURITY;
ALTER TABLE "Notification" FORCE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog" FORCE ROW LEVEL SECURITY;
ALTER TABLE "MonthlyReport" FORCE ROW LEVEL SECURITY;
ALTER TABLE "AuthSettings" FORCE ROW LEVEL SECURITY;
ALTER TABLE "UserInvite" FORCE ROW LEVEL SECURITY;
ALTER TABLE "AutomationRun" FORCE ROW LEVEL SECURITY;
ALTER TABLE "RetentionRun" FORCE ROW LEVEL SECURITY;
ALTER TABLE "CacheEntry" FORCE ROW LEVEL SECURITY;
ALTER TABLE "StorageObject" FORCE ROW LEVEL SECURITY;

REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon, authenticated;

CREATE POLICY "backend_service_user_access" ON "User" FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "backend_service_unit_access" ON "Unit" FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "backend_service_risk_code_access" ON "RiskCode" FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "backend_service_incident_access" ON "Incident" FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "backend_service_rca_access" ON "RCA" FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "backend_service_action_plan_access" ON "ActionPlan" FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "backend_service_comment_access" ON "Comment" FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "backend_service_attachment_access" ON "Attachment" FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "backend_service_notification_access" ON "Notification" FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "backend_service_audit_log_insert" ON "AuditLog" FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "backend_service_audit_log_read" ON "AuditLog" FOR SELECT TO service_role USING (true);
CREATE POLICY "backend_service_monthly_report_access" ON "MonthlyReport" FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "backend_service_auth_settings_access" ON "AuthSettings" FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "backend_service_user_invite_access" ON "UserInvite" FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "backend_service_automation_run_access" ON "AutomationRun" FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "backend_service_retention_run_access" ON "RetentionRun" FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "backend_service_cache_entry_access" ON "CacheEntry" FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "backend_service_storage_object_access" ON "StorageObject" FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION prevent_audit_log_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'AuditLog is append-only';
END;
$$;

DROP TRIGGER IF EXISTS audit_log_no_update ON "AuditLog";
CREATE TRIGGER audit_log_no_update
BEFORE UPDATE ON "AuditLog"
FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_mutation();

DROP TRIGGER IF EXISTS audit_log_no_delete ON "AuditLog";
CREATE TRIGGER audit_log_no_delete
BEFORE DELETE ON "AuditLog"
FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_mutation();

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('risk-attachments-private', 'risk-attachments-private', false, 52428800)
ON CONFLICT (id) DO UPDATE SET public = false;

CREATE POLICY "backend_service_storage_read"
ON storage.objects FOR SELECT TO service_role
USING (bucket_id = 'risk-attachments-private');

CREATE POLICY "backend_service_storage_write"
ON storage.objects FOR INSERT TO service_role
WITH CHECK (bucket_id = 'risk-attachments-private');

CREATE POLICY "backend_service_storage_update"
ON storage.objects FOR UPDATE TO service_role
USING (bucket_id = 'risk-attachments-private')
WITH CHECK (bucket_id = 'risk-attachments-private');

CREATE POLICY "backend_service_storage_delete"
ON storage.objects FOR DELETE TO service_role
USING (bucket_id = 'risk-attachments-private');
