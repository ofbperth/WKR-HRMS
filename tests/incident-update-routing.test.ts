import { describe, expect, it } from "vitest";
import { isIncidentDetailUpdate } from "@/lib/incident-update-routing";

describe("incident detail update routing", () => {
  it("treats patientHn-only payloads as detail updates", () => {
    expect(isIncidentDetailUpdate({ patientHn: "123456" })).toBe(true);
  });

  it("treats patientAn-only payloads as detail updates", () => {
    expect(isIncidentDetailUpdate({ patientAn: "A-1001" })).toBe(true);
  });

  it("does not route classification-only payloads through detail update flow", () => {
    expect(isIncidentDetailUpdate({ severity: "E", status: "New" })).toBe(false);
  });
});
