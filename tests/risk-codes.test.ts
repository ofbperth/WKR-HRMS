import { describe, expect, it } from "vitest";
import { nrlsRiskCodes } from "@/lib/nrls-risk-codes";

function filterRiskCodes(type: "Clinical" | "General", query = "") {
  const q = query.trim().toLowerCase();
  return nrlsRiskCodes
    .filter(riskCode => riskCode.clinicalOrGeneral === type)
    .filter(riskCode => !q || `${riskCode.code} ${riskCode.nameTh} ${riskCode.nameEn ?? ""} ${riskCode.simpleCategory}`.toLowerCase().includes(q));
}

describe("NRLS risk code filtering", () => {
  it("returns only clinical NRLS codes for Clinical selection", () => {
    const clinical = filterRiskCodes("Clinical");
    expect(clinical.length).toBeGreaterThan(0);
    expect(clinical.every(riskCode => riskCode.clinicalOrGeneral === "Clinical")).toBe(true);
  });

  it("returns only general NRLS codes for General selection", () => {
    const general = filterRiskCodes("General");
    expect(general.length).toBeGreaterThan(0);
    expect(general.every(riskCode => riskCode.clinicalOrGeneral === "General")).toBe(true);
  });

  it("does not cross clinical/general groups during search", () => {
    expect(filterRiskCodes("Clinical", "GO").every(riskCode => riskCode.clinicalOrGeneral === "Clinical")).toBe(true);
    expect(filterRiskCodes("General", "CP").every(riskCode => riskCode.clinicalOrGeneral === "General")).toBe(true);
  });
});
