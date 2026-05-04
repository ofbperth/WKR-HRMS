export const ROLE_VALUES = ["Reporter", "UnitManager", "RMTeam", "Executive", "Admin"] as const;
export type Role = typeof ROLE_VALUES[number];

export const INCIDENT_STATUS_VALUES = ["New", "UnderReview", "RCARequired", "ActionOngoing", "WaitingVerification", "Closed", "Rejected"] as const;
export type IncidentStatus = typeof INCIDENT_STATUS_VALUES[number];

export const RCA_STATUS_VALUES = ["Draft", "Submitted", "Approved", "RevisionRequired"] as const;
export type RCAStatus = typeof RCA_STATUS_VALUES[number];

export const ACTION_PLAN_STATUS_VALUES = ["NotStarted", "Ongoing", "Done", "Delayed", "Verified"] as const;
export type ActionPlanStatus = typeof ACTION_PLAN_STATUS_VALUES[number];

export const SEVERITY_VALUES = ["A", "B", "C", "D", "E", "F", "G", "H", "I"] as const;
export type Severity = typeof SEVERITY_VALUES[number];

export const AFFECTED_TYPE_VALUES = ["Patient", "Personnel", "People", "Organization"] as const;
export type AffectedType = typeof AFFECTED_TYPE_VALUES[number];

export const CLINICAL_OR_GENERAL_VALUES = ["Clinical", "General"] as const;
export type ClinicalOrGeneral = typeof CLINICAL_OR_GENERAL_VALUES[number];

export function isRole(value: string): value is Role {
  return (ROLE_VALUES as readonly string[]).includes(value);
}
