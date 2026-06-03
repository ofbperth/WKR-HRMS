CREATE TABLE "ExportAccessGrant" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "unit_id" TEXT,
    "reason" TEXT NOT NULL,
    "filters_json" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "token_jti" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "downloaded_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExportAccessGrant_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ExportAccessGrant_token_jti_key" ON "ExportAccessGrant"("token_jti");
CREATE INDEX "ExportAccessGrant_user_id_created_at_idx" ON "ExportAccessGrant"("user_id", "created_at");
CREATE INDEX "ExportAccessGrant_kind_created_at_idx" ON "ExportAccessGrant"("kind", "created_at");
CREATE INDEX "ExportAccessGrant_expires_at_idx" ON "ExportAccessGrant"("expires_at");

ALTER TABLE "ExportAccessGrant"
ADD CONSTRAINT "ExportAccessGrant_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

UPDATE "Incident"
SET "patientHn" = NULL,
    "patientAn" = NULL
WHERE "patientHn" IS NOT NULL OR "patientAn" IS NOT NULL;

ALTER TABLE "Incident"
ADD CONSTRAINT "incident_plaintext_identifiers_must_be_null"
CHECK ("patientHn" IS NULL AND "patientAn" IS NULL);

ALTER TABLE "User"
ADD CONSTRAINT "user_role_valid"
CHECK ("role" IN ('Reporter', 'UnitManager', 'RMTeam', 'Executive', 'Admin'));

ALTER TABLE "Incident"
ADD CONSTRAINT "incident_status_valid"
CHECK ("status" IN ('New', 'UnderReview', 'RCARequired', 'RCASubmitted', 'ActionOngoing', 'WaitingVerification', 'Closed', 'Rejected'));

ALTER TABLE "Incident"
ADD CONSTRAINT "incident_severity_valid"
CHECK ("severity" IN ('A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', '1', '2', '3', '4', '5'));

ALTER TABLE "RCA"
ADD CONSTRAINT "rca_status_valid"
CHECK ("status" IN ('Draft', 'Submitted', 'Approved', 'RevisionRequired'));

ALTER TABLE "ActionPlan"
ADD CONSTRAINT "action_plan_status_valid"
CHECK ("status" IN ('NotStarted', 'Ongoing', 'Done', 'Delayed', 'Verified'));

CREATE OR REPLACE FUNCTION validate_action_owner_active()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW."ownerId" IS NULL THEN
    RETURN NEW;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM "User"
    WHERE "id" = NEW."ownerId" AND "isActive" = TRUE
  ) THEN
    RAISE EXCEPTION 'ACTION_OWNER_MUST_BE_ACTIVE';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS action_owner_active_guard ON "ActionPlan";
CREATE TRIGGER action_owner_active_guard
BEFORE INSERT OR UPDATE OF "ownerId" ON "ActionPlan"
FOR EACH ROW
EXECUTE FUNCTION validate_action_owner_active();
