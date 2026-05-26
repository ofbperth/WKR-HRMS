import { describe, expect, it } from "vitest";
import { calculateRcaDueAt, getRcaDueHours } from "@/lib/rca-due-date";

describe("RCA due date automation", () => {
  const submittedAt = new Date("2026-05-26T10:00:00.000Z");

  it("sets 30 day RCA due date for severity A-D and 1", () => {
    for (const severity of ["A", "B", "C", "D", "1"]) {
      expect(getRcaDueHours(severity)).toBe(30 * 24);
      expect(calculateRcaDueAt(severity, submittedAt)?.toISOString()).toBe("2026-06-25T10:00:00.000Z");
    }
  });

  it("sets 7 day RCA due date for severity E-F and 2-3", () => {
    for (const severity of ["E", "F", "2", "3"]) {
      expect(getRcaDueHours(severity)).toBe(7 * 24);
      expect(calculateRcaDueAt(severity, submittedAt)?.toISOString()).toBe("2026-06-02T10:00:00.000Z");
    }
  });

  it("sets 3 day RCA due date for severity G-H and 4", () => {
    for (const severity of ["G", "H", "4"]) {
      expect(getRcaDueHours(severity)).toBe(3 * 24);
      expect(calculateRcaDueAt(severity, submittedAt)?.toISOString()).toBe("2026-05-29T10:00:00.000Z");
    }
  });

  it("sets 24 hour RCA due date for severity I and 5", () => {
    for (const severity of ["I", "5"]) {
      expect(getRcaDueHours(severity)).toBe(24);
      expect(calculateRcaDueAt(severity, submittedAt)?.toISOString()).toBe("2026-05-27T10:00:00.000Z");
    }
  });
});
