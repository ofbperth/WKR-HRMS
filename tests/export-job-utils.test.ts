import { describe, expect, it } from "vitest";
import { resolveExportJobStatus } from "@/lib/export-job-utils";

describe("resolveExportJobStatus", () => {
  it("keeps queued and running jobs as active", () => {
    expect(resolveExportJobStatus({ status: "Queued" })).toBe("Queued");
    expect(resolveExportJobStatus({ status: "Running" })).toBe("Running");
  });

  it("marks succeeded jobs as expired when expiry is in the past", () => {
    expect(resolveExportJobStatus({ status: "Succeeded", expiresAt: new Date(Date.now() - 1000) })).toBe("Expired");
    expect(resolveExportJobStatus({ status: "Succeeded", expiresAt: new Date(Date.now() + 1000) })).toBe("Succeeded");
  });

  it("falls back unknown statuses to failed", () => {
    expect(resolveExportJobStatus({ status: "UnknownState" })).toBe("Failed");
  });
});
