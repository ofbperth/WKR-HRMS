export const ROLE_VALUES = ["Reporter", "UnitManager", "RMTeam", "Executive", "Admin"] as const;
export type Role = typeof ROLE_VALUES[number];

export const AUTH_PROVIDER_VALUES = ["CREDENTIALS", "GOOGLE", "BOTH"] as const;
export type AuthProvider = typeof AUTH_PROVIDER_VALUES[number];

export const INCIDENT_STATUS_VALUES = ["New", "UnderReview", "RCARequired", "RCASubmitted", "ActionOngoing", "WaitingVerification", "Closed", "Rejected"] as const;
export type IncidentStatus = typeof INCIDENT_STATUS_VALUES[number];

export const RCA_STATUS_VALUES = ["Draft", "Submitted", "Approved", "RevisionRequired"] as const;
export type RCAStatus = typeof RCA_STATUS_VALUES[number];

export const ACTION_PLAN_STATUS_VALUES = ["NotStarted", "Ongoing", "Done", "Delayed", "Verified"] as const;
export type ActionPlanStatus = typeof ACTION_PLAN_STATUS_VALUES[number];

export const CLINICAL_SEVERITY_VALUES = ["A", "B", "C", "D", "E", "F", "G", "H", "I"] as const;
export const GENERAL_SEVERITY_VALUES = ["1", "2", "3", "4", "5"] as const;
export const SEVERITY_VALUES = [...CLINICAL_SEVERITY_VALUES, ...GENERAL_SEVERITY_VALUES] as const;
export type Severity = typeof SEVERITY_VALUES[number];

export const AFFECTED_TYPE_VALUES = ["Patient", "Personnel", "People", "Organization"] as const;
export type AffectedType = typeof AFFECTED_TYPE_VALUES[number];

export const CLINICAL_OR_GENERAL_VALUES = ["Clinical", "General"] as const;
export type ClinicalOrGeneral = typeof CLINICAL_OR_GENERAL_VALUES[number];

export const EXPORT_KIND_VALUES = ["incident-csv", "action-csv", "rca-csv", "audit-log-csv"] as const;
export type ExportKind = typeof EXPORT_KIND_VALUES[number];

export const EXPORT_JOB_STATUS_VALUES = ["Queued", "Running", "Succeeded", "Failed", "Expired"] as const;
export type ExportJobStatus = typeof EXPORT_JOB_STATUS_VALUES[number];

export const RISK_SCOPE_VALUES = ["UNIT", "HOSPITAL"] as const;
export type RiskScope = typeof RISK_SCOPE_VALUES[number];

export const RISK_STATUS_VALUES = ["PROPOSED", "ACTIVE", "MONITORING", "ACCEPTED", "CLOSED", "REJECTED"] as const;
export type RiskStatus = typeof RISK_STATUS_VALUES[number];

export const RISK_TYPE_VALUES = ["CLINICAL", "OPERATIONAL", "STRATEGIC", "COMPLIANCE", "FINANCIAL", "IT"] as const;
export type RiskType = typeof RISK_TYPE_VALUES[number];

export const RISK_CONTROL_EFFECTIVENESS_VALUES = ["GOOD", "PARTIAL", "WEAK", "NOT_TESTED"] as const;
export type RiskControlEffectiveness = typeof RISK_CONTROL_EFFECTIVENESS_VALUES[number];

export const RISK_TREND_VALUES = ["WORSE", "STABLE", "BETTER", "UNKNOWN"] as const;
export type RiskTrend = typeof RISK_TREND_VALUES[number];

export const RISK_REVIEW_FREQUENCY_VALUES = ["MONTHLY", "QUARTERLY", "SEMIANNUAL", "ANNUAL"] as const;
export type RiskReviewFrequency = typeof RISK_REVIEW_FREQUENCY_VALUES[number];

export function isRole(value: string): value is Role {
  return (ROLE_VALUES as readonly string[]).includes(value);
}

export type DbUser = {
  id: string;
  name: string;
  email: string;
  role: Role | string;
  unitId: string | null;
  authProvider?: AuthProvider | string;
  googleId?: string | null;
  image?: string | null;
  lastLoginAt?: Date | null;
};

export type DbUnit = {
  id: string;
  name: string;
  type?: string;
  isActive?: boolean;
};

export type DbTeam = {
  id: string;
  name: string;
  code?: string | null;
  description?: string | null;
  isActive?: boolean;
  sortOrder?: number;
};

export type DbRiskCode = {
  id: string;
  code: string;
  nameTh: string;
  nameEn: string | null;
  clinicalOrGeneral: ClinicalOrGeneral | string;
  simpleCategory: string;
  isActive?: boolean;
};

export type DbIncident = {
  id: string;
  incidentNo: string;
  reportedAt: Date;
  occurredAt: Date;
  rcaDueAt?: Date | null;
  reportedById: string | null;
  reporterUnitId: string;
  incidentUnitId: string;
  location: string | null;
  patientHn: string | null;
  patientAn?: string | null;
  hnEncrypted?: string | null;
  anEncrypted?: string | null;
  reporterNameEncrypted?: string | null;
  medicationRight?: string | null;
  affectedType: string;
  clinicalOrGeneral: string;
  simpleCategory: string;
  riskCodeId: string;
  title: string;
  description: string;
  immediateAction: string | null;
  severity: string;
  isSentinel: boolean;
  needRmSupport: boolean;
  status: string;
  createdAt: Date;
  updatedAt: Date;
};

export type DbComment = {
  id: string;
  incidentId: string;
  userId: string | null;
  message: string;
  createdAt: Date;
};

export type DbAuditLog = {
  id: string;
  userId: string | null;
  userRole?: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  ipAddress?: string | null;
  oldValue: string | null;
  newValue: string | null;
  createdAt: Date;
};

export type DbRiskRegister = {
  id: string;
  riskNo: string;
  title: string;
  description: string;
  scope: RiskScope | string;
  status: RiskStatus | string;
  riskType: RiskType | string;
  riskDomain?: string | null;
  ownerUnitId?: string | null;
  ownerTeamId?: string | null;
  executiveSponsorId?: string | null;
  createdById: string;
  approvedById?: string | null;
  approvedAt?: Date | null;
  closedById?: string | null;
  closedAt?: Date | null;
  inherentLikelihood: number;
  inherentImpact: number;
  residualLikelihood: number;
  residualImpact: number;
  controlEffectiveness: RiskControlEffectiveness | string;
  trend: RiskTrend | string;
  reviewFrequency: RiskReviewFrequency | string;
  nextReviewAt?: Date | null;
  decisionRequired: boolean;
  decisionNote?: string | null;
  acceptedReason?: string | null;
  createdAt: Date;
  updatedAt: Date;
};
