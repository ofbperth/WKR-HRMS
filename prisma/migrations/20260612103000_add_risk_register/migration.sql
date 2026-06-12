-- CreateTable
CREATE TABLE "RiskRegister" (
    "id" TEXT NOT NULL,
    "riskNo" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "riskType" TEXT NOT NULL,
    "riskDomain" TEXT,
    "ownerUnitId" TEXT,
    "ownerTeamId" TEXT,
    "executiveSponsorId" TEXT,
    "createdById" TEXT NOT NULL,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "closedById" TEXT,
    "closedAt" TIMESTAMP(3),
    "inherentLikelihood" INTEGER NOT NULL,
    "inherentImpact" INTEGER NOT NULL,
    "residualLikelihood" INTEGER NOT NULL,
    "residualImpact" INTEGER NOT NULL,
    "controlEffectiveness" TEXT NOT NULL,
    "trend" TEXT NOT NULL,
    "reviewFrequency" TEXT NOT NULL,
    "nextReviewAt" TIMESTAMP(3),
    "decisionRequired" BOOLEAN NOT NULL DEFAULT false,
    "decisionNote" TEXT,
    "acceptedReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RiskRegister_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiskIncidentLink" (
    "id" TEXT NOT NULL,
    "riskId" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "linkedById" TEXT,
    "linkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,

    CONSTRAINT "RiskIncidentLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiskReview" (
    "id" TEXT NOT NULL,
    "riskId" TEXT NOT NULL,
    "reviewedById" TEXT,
    "reviewDate" TIMESTAMP(3) NOT NULL,
    "residualLikelihood" INTEGER NOT NULL,
    "residualImpact" INTEGER NOT NULL,
    "controlEffectiveness" TEXT NOT NULL,
    "trend" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "nextReviewAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RiskReview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RiskRegister_riskNo_key" ON "RiskRegister"("riskNo");
CREATE INDEX "RiskRegister_scope_status_idx" ON "RiskRegister"("scope", "status");
CREATE INDEX "RiskRegister_ownerUnitId_idx" ON "RiskRegister"("ownerUnitId");
CREATE INDEX "RiskRegister_ownerTeamId_idx" ON "RiskRegister"("ownerTeamId");
CREATE INDEX "RiskRegister_nextReviewAt_idx" ON "RiskRegister"("nextReviewAt");
CREATE INDEX "RiskRegister_decisionRequired_idx" ON "RiskRegister"("decisionRequired");
CREATE INDEX "RiskRegister_riskNo_idx" ON "RiskRegister"("riskNo");

-- CreateIndex
CREATE UNIQUE INDEX "RiskIncidentLink_riskId_incidentId_key" ON "RiskIncidentLink"("riskId", "incidentId");
CREATE INDEX "RiskIncidentLink_riskId_idx" ON "RiskIncidentLink"("riskId");
CREATE INDEX "RiskIncidentLink_incidentId_idx" ON "RiskIncidentLink"("incidentId");

-- CreateIndex
CREATE INDEX "RiskReview_riskId_reviewDate_idx" ON "RiskReview"("riskId", "reviewDate");

-- AddForeignKey
ALTER TABLE "RiskRegister" ADD CONSTRAINT "RiskRegister_ownerUnitId_fkey" FOREIGN KEY ("ownerUnitId") REFERENCES "Unit"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RiskRegister" ADD CONSTRAINT "RiskRegister_ownerTeamId_fkey" FOREIGN KEY ("ownerTeamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RiskRegister" ADD CONSTRAINT "RiskRegister_executiveSponsorId_fkey" FOREIGN KEY ("executiveSponsorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RiskRegister" ADD CONSTRAINT "RiskRegister_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RiskRegister" ADD CONSTRAINT "RiskRegister_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RiskRegister" ADD CONSTRAINT "RiskRegister_closedById_fkey" FOREIGN KEY ("closedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "RiskIncidentLink" ADD CONSTRAINT "RiskIncidentLink_riskId_fkey" FOREIGN KEY ("riskId") REFERENCES "RiskRegister"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RiskIncidentLink" ADD CONSTRAINT "RiskIncidentLink_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RiskIncidentLink" ADD CONSTRAINT "RiskIncidentLink_linkedById_fkey" FOREIGN KEY ("linkedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "RiskReview" ADD CONSTRAINT "RiskReview_riskId_fkey" FOREIGN KEY ("riskId") REFERENCES "RiskRegister"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RiskReview" ADD CONSTRAINT "RiskReview_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
