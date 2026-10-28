import { INCIDENT_STATUS_VALUES } from "@/lib/types";

type CloseCheckIncident = {
  status: string;
  deletedAt?: Date | null;
  lifecycleStatus?: string;
  rca?: { status: string } | null;
  actionPlans?: Array<{ status: string }>;
};

// RCA/action transitions belong to their dedicated workflow endpoints. Allowing
// arbitrary classification status changes would bypass the close prerequisites.
export function classificationStatusOptions(currentStatus: string) {
  return INCIDENT_STATUS_VALUES.filter(status => [currentStatus, "Closed", "Rejected"].includes(status));
}

export function isIncidentClosed(incident: { status: string }) {
  return incident.status === "Closed";
}

export function isIncidentReadOnly(incident: { status: string; deletedAt?: Date | null; lifecycleStatus?: string }) {
  return ["Closed", "Rejected"].includes(incident.status) || !!incident.deletedAt || ["SOFT_DELETED", "ARCHIVED"].includes(incident.lifecycleStatus ?? "");
}

export function canCloseIncident(incident: CloseCheckIncident) {
  if (isIncidentReadOnly(incident)) return false;

  const actionPlans = incident.actionPlans ?? [];
  const hasOpenActions = actionPlans.some((action) => action.status !== "Verified");
  const noRcaRequired = incident.status === "UnderReview" && !incident.rca && actionPlans.length === 0;
  const completedRcaAndActions =
    incident.rca?.status === "Approved" &&
    actionPlans.length > 0 &&
    !hasOpenActions &&
    ["ActionOngoing", "WaitingVerification"].includes(incident.status);

  return noRcaRequired || completedRcaAndActions;
}
