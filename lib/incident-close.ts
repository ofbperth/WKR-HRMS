type CloseCheckIncident = {
  status: string;
  rca?: { status: string } | null;
  actionPlans?: Array<{ status: string }>;
};

export function canCloseIncident(incident: CloseCheckIncident) {
  if (["Closed", "Rejected"].includes(incident.status)) return false;

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
