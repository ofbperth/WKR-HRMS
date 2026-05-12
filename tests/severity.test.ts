import { describe, expect, it } from "vitest";
import { isHighSeverityForType, isSentinelSeverity, severityOptionsFor } from "@/lib/severity";

describe("severity classification", () => {
  it("treats clinical E-I as high severity", () => {
    expect(["A", "B", "C", "D"].filter(severity => isHighSeverityForType(severity, "Clinical"))).toEqual([]);
    expect(["E", "F", "G", "H", "I"].every(severity => isHighSeverityForType(severity, "Clinical"))).toBe(true);
  });

  it("treats general Level 3-5 as high severity", () => {
    expect(["1", "2"].filter(severity => isHighSeverityForType(severity, "General"))).toEqual([]);
    expect(["3", "4", "5"].every(severity => isHighSeverityForType(severity, "General"))).toBe(true);
  });

  it("only marks clinical G-I as sentinel automation severity", () => {
    expect(isSentinelSeverity("G", "Clinical")).toBe(true);
    expect(isSentinelSeverity("5", "General")).toBe(false);
  });

  it("returns separate severity options for clinical and general incidents", () => {
    expect(severityOptionsFor("Clinical")).toEqual(["A", "B", "C", "D", "E", "F", "G", "H", "I"]);
    expect(severityOptionsFor("General")).toEqual(["1", "2", "3", "4", "5"]);
  });
});
