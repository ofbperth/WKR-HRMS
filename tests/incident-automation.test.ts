import { afterEach, describe, expect, it, vi } from "vitest";
import { generateIncidentNo } from "@/lib/incident-number";

describe("incident number generation", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("uses the highest existing sequence instead of counting rows", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-27T10:00:00.000Z"));

    const tx = {
      incident: {
        findFirst: vi.fn().mockResolvedValue({ incidentNo: "RM-2026-0003" }),
      },
    };

    await expect(generateIncidentNo(tx as any)).resolves.toBe("RM-2026-0004");
    expect(tx.incident.findFirst).toHaveBeenCalledWith({
      where: { incidentNo: { startsWith: "RM-2026-" } },
      orderBy: { incidentNo: "desc" },
      select: { incidentNo: true },
    });
  });

  it("starts the yearly sequence when no incident exists for the year", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));

    const tx = {
      incident: {
        findFirst: vi.fn().mockResolvedValue(null),
      },
    };

    await expect(generateIncidentNo(tx as any)).resolves.toBe("RM-2026-0001");
  });
});
