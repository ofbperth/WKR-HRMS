import { describe, expect, it } from "vitest";
import { canCloseIncident, isIncidentClosed } from "@/lib/incident-close";

describe("incident close eligibility", () => {
  it("allows incidents that finished triage without RCA", () => {
    expect(canCloseIncident({ status: "UnderReview", rca: null, actionPlans: [] })).toBe(true);
  });

  it("allows incidents with approved RCA and all action plans verified", () => {
    expect(canCloseIncident({ status: "WaitingVerification", rca: { status: "Approved" }, actionPlans: [{ status: "Verified" }] })).toBe(true);
  });

  it("blocks incidents with open action plans", () => {
    expect(canCloseIncident({ status: "WaitingVerification", rca: { status: "Approved" }, actionPlans: [{ status: "Done" }] })).toBe(false);
  });

  it("blocks already closed and rejected incidents", () => {
    expect(canCloseIncident({ status: "Closed", rca: null, actionPlans: [] })).toBe(false);
    expect(canCloseIncident({ status: "Rejected", rca: null, actionPlans: [] })).toBe(false);
  });

  it("marks closed incidents as read-only for non-comment workflows", () => {
    expect(isIncidentClosed({ status: "Closed" })).toBe(true);
    expect(isIncidentClosed({ status: "WaitingVerification" })).toBe(false);
  });
});
