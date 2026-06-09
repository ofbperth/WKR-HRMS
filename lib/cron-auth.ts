export function isValidCronAuthorizationHeader(
  authorizationHeader: string | null | undefined,
  secret = process.env.CRON_SECRET,
) {
  if (!secret) return false;
  return authorizationHeader === `Bearer ${secret}`;
}

export function readDryRunFlag(request: Request, body?: unknown) {
  const url = new URL(request.url);
  if (url.searchParams.get("dryRun") === "true") return true;
  if (!body || typeof body !== "object") return false;
  return (body as Record<string, unknown>).dryRun === true;
}
