const incidentDetailUpdateKeys = [
  "occurredDate",
  "occurredTime",
  "incidentUnitId",
  "location",
  "affectedType",
  "title",
  "description",
  "immediateAction",
  "clinicalOrGeneral",
  "medicationRight",
  "patientHn",
  "patientAn",
] as const;

export function isIncidentDetailUpdate(input: Record<string, unknown>) {
  return incidentDetailUpdateKeys.some((key) => key in input);
}

export { incidentDetailUpdateKeys };
