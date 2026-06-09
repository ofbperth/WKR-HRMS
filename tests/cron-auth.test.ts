import { describe, expect, it } from "vitest";
import { isValidCronAuthorizationHeader, readDryRunFlag } from "@/lib/cron-auth";

describe("cron auth helpers", () => {
  it("validates bearer authorization header", () => {
    expect(isValidCronAuthorizationHeader("Bearer secret", "secret")).toBe(true);
    expect(isValidCronAuthorizationHeader("Bearer wrong", "secret")).toBe(false);
    expect(isValidCronAuthorizationHeader(null, "secret")).toBe(false);
  });

  it("reads dry run from query or body", () => {
    const queryRequest = new Request("https://example.com/api/cron/email-summary?dryRun=true");
    const bodyRequest = new Request("https://example.com/api/cron/email-summary", { method: "POST" });
    expect(readDryRunFlag(queryRequest)).toBe(true);
    expect(readDryRunFlag(bodyRequest, { dryRun: true })).toBe(true);
    expect(readDryRunFlag(bodyRequest, { dryRun: false })).toBe(false);
  });
});
