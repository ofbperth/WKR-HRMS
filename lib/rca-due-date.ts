const rcaDueHoursBySeverity: Record<string, number> = {
  A: 30 * 24,
  B: 30 * 24,
  C: 30 * 24,
  D: 30 * 24,
  "1": 30 * 24,
  E: 7 * 24,
  F: 7 * 24,
  "2": 7 * 24,
  "3": 7 * 24,
  G: 3 * 24,
  H: 3 * 24,
  "4": 3 * 24,
  I: 24,
  "5": 24,
};

export function getRcaDueHours(severity: string) {
  return rcaDueHoursBySeverity[severity] ?? null;
}

export function calculateRcaDueAt(severity: string, submittedAt: Date | string | null | undefined) {
  const hours = getRcaDueHours(severity);
  if (hours === null || !submittedAt) return null;
  const base = typeof submittedAt === "string" ? new Date(submittedAt) : submittedAt;
  if (Number.isNaN(base.getTime())) return null;
  return new Date(base.getTime() + hours * 60 * 60 * 1000);
}
