import { beforeEach, describe, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({ job: vi.fn(), object: vi.fn(), objects: vi.fn(), objectUpdate: vi.fn(), jobUpdate: vi.fn(), remove: vi.fn(), sign: vi.fn(), rows: vi.fn(), grant: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/prisma", () => ({ prisma: {
  exportJob: { findUnique: m.job, updateMany: m.jobUpdate },
  storageObject: { findUnique: m.object, findMany: m.objects, update: m.objectUpdate },
  actionPlan: { count: async () => 1, findMany: m.rows },
  exportAccessGrant: { findUnique: m.grant },
} }));
vi.mock("@/lib/audit", () => ({ auditLog: vi.fn() }));
vi.mock("@/lib/storage", () => ({ deletePrivateObject: m.remove, createPrivateSignedDownloadUrl: m.sign, exportStorageBucket: () => "test" }));
import { cleanupExpiredGeneratedFiles, issueExportArtifactDownload, retryExportJob } from "@/lib/export-jobs";
import { validateExportDownload } from "@/lib/export-governance";
import { buildActionCsv } from "@/lib/export-builders";
const user = { id: "manager", role: "UnitManager", unitId: "A" };
beforeEach(() => {
  vi.clearAllMocks();
  m.job.mockResolvedValue({ id: "job", userId: user.id, role: user.role, unitId: "A", status: "Succeeded", storageObjectId: "object", expiresAt: new Date(Date.now() + 60000) });
  m.object.mockResolvedValue({ id: "object", targetType: "ExportJob", targetId: "job", objectKey: "synthetic", bucket: "test", deletedAt: null });
  m.sign.mockResolvedValue("https://example.test/synthetic"); m.remove.mockResolvedValue(undefined);
});
describe("export authorization", () => {
  it.each([{ unitId: "B" }, { unitId: null }, { role: "Reporter" }])("revokes downloads and retries after scope changes %j", async change => {
    const input = { user: { ...user, ...change }, jobId: "job" };
    await expect(issueExportArtifactDownload(input)).rejects.toThrow("FORBIDDEN");
    await expect(retryExportJob(input)).rejects.toThrow("FORBIDDEN");
    expect(m.sign).not.toHaveBeenCalled(); expect(m.remove).not.toHaveBeenCalled();
  });
  it("still signs a download in the current authorized unit", async () => { await expect(issueExportArtifactDownload({ user, jobId: "job" })).resolves.toEqual({ url: "https://example.test/synthetic" }); });
  it("revokes legacy signed grants when the user changes units", async () => {
    m.grant.mockResolvedValue({ id: "grant", userId: user.id, role: user.role, kind: "incident-csv", tokenJti: "token", unitId: "A", filtersJson: "{}", expiresAt: new Date(Date.now() + 60000) });
    await expect(validateExportDownload({ user: { ...user, unitId: "B" }, kind: "incident-csv", role: user.role, grantId: "grant", tokenJti: "token", filters: {} })).rejects.toThrow("EXPORT_SCOPE_FORBIDDEN");
  });
});
describe("storage deletion retry", () => {
  it("keeps failed objects eligible and retries successfully on the next run", async () => {
    const object = { id: "object", targetType: "ExportJob", targetId: "job", objectKey: "synthetic", bucket: "test" };
    m.objects.mockResolvedValue([object]); m.remove.mockRejectedValueOnce(new Error("synthetic outage"));
    expect(await cleanupExpiredGeneratedFiles()).toMatchObject({ deleted: 0, failed: 1 });
    expect(m.objectUpdate).not.toHaveBeenCalled(); expect(m.jobUpdate).not.toHaveBeenCalled();
    expect(await cleanupExpiredGeneratedFiles()).toMatchObject({ deleted: 1, failed: 0 });
    expect(m.remove).toHaveBeenCalledTimes(2); expect(m.objectUpdate).toHaveBeenCalledOnce();
  });
});
describe("CSV formula protection", () => {
  it.each(["=1+1", "+1+1", "-1+1", "@SUM(1,1)", "  =1+1", "\t=1+1", "\r=1+1"])("neutralizes %j in exported user content", async title => {
    m.rows.mockResolvedValue([{ title, incident: { incidentNo: "TEST", incidentUnit: { name: "A" } }, status: "Done", dueDate: new Date() }]);
    const csv = await buildActionCsv(user); const text = await new Response(csv.body).text();
    expect(text).toContain(String.fromCharCode(34, 39) + title + String.fromCharCode(34));
  });
});
