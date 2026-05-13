import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getGovernanceDashboardData } from "@/lib/governance";
import { AppShell } from "@/components/layout/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/lib/format";

export default async function Page() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "Admin") redirect("/admin");
  const data = await getGovernanceDashboardData();

  return <AppShell user={user}><div className="space-y-6">
    <div><h1 className="text-2xl font-bold">Governance Dashboard</h1><p className="mt-2 text-slate-600">มุมมอง Admin สำหรับ retention, storage, cleanup, cache และ audit observability</p></div>

    <div className="grid gap-4 md:grid-cols-4">
      <Metric title="Storage object" value={data.storageOverview.activeStorageObjects} />
      <Metric title="Retention queue" value={data.retentionQueue} />
      <Metric title="Incident ที่ archive แล้ว" value={data.archiveMonitoring.archivedIncidents} />
      <Metric title="Expired cache" value={data.cacheMonitoring.expiredCache} />
    </div>

    <div className="grid gap-4 lg:grid-cols-2">
      <Card><CardHeader><CardTitle>ภาพรวม Storage</CardTitle></CardHeader><CardContent className="space-y-3 text-sm">
        <MiniRows rows={data.storageOverview.storageByTier.map((item: any) => ({ label: item.storageTier ?? "Unknown", value: item._count }))} empty="ไม่มี storage tier metadata" />
        <div className="rounded-md bg-slate-50 p-3">
          <div>Orphans: {data.storageOverview.consistency.orphanFiles}</div>
          <div>Missing metadata: {data.storageOverview.consistency.missingStorageObjects}</div>
          <div>Invalid signed URL candidates: {data.storageOverview.consistency.invalidSignedUrlCandidates}</div>
        </div>
      </CardContent></Card>

      <Card><CardHeader><CardTitle>Cleanup monitoring</CardTitle></CardHeader><CardContent className="space-y-3 text-sm">
        <Info label="Status ล่าสุด" value={data.cleanupMonitoring.lastRun?.status ?? "-"} />
        <Info label="Duration" value={data.cleanupMonitoring.cleanupDurationMs === null ? "-" : `${data.cleanupMonitoring.cleanupDurationMs} ms`} />
        <Info label="Message" value={data.cleanupMonitoring.lastRun?.message ?? "-"} />
        <Info label="Mode" value={data.cleanupMonitoring.lastRun?.mode ?? "-"} />
      </CardContent></Card>
    </div>

    <div className="grid gap-4 lg:grid-cols-2">
      <Card><CardHeader><CardTitle>Protected incident</CardTitle></CardHeader><CardContent className="space-y-2 text-sm">
        {data.protectedIncidents.length === 0 ? <p className="text-slate-500">ไม่มี protected incident ใน sample ที่ review</p> : data.protectedIncidents.map((incident: any) => <div key={incident.id} className="rounded-md border p-3">
          <div className="font-semibold">{incident.incidentNo} · {incident.severity} · {incident.status}</div>
          <div className="text-xs text-slate-500">{incident.incidentUnit?.name ?? "-"} · {formatDateTime(incident.occurredAt)}</div>
        </div>)}
      </CardContent></Card>

      <Card><CardHeader><CardTitle>Cleanup ที่ล้มเหลว</CardTitle></CardHeader><CardContent className="space-y-2 text-sm">
        {data.failedCleanup.length === 0 ? <p className="text-slate-500">ไม่มี cleanup run ที่ failed หรือ stopped</p> : data.failedCleanup.map((run: any) => <div key={run.id} className="rounded-md border p-3">
          <div className="font-semibold">{run.status} · {run.mode}</div>
          <div className="text-xs text-slate-500">{formatDateTime(run.startedAt)} · {run.message ?? "-"}</div>
        </div>)}
      </CardContent></Card>
    </div>

    <div className="grid gap-4 lg:grid-cols-3">
      <Card><CardHeader><CardTitle>Cache monitoring</CardTitle></CardHeader><CardContent><MiniRows rows={data.cacheMonitoring.cacheByType.map((item: any) => ({ label: item.cacheType, value: item._count }))} empty="ไม่มี cache entry" /></CardContent></Card>
      <Card><CardHeader><CardTitle>Audit summary</CardTitle></CardHeader><CardContent><MiniRows rows={data.auditSummary.map((item: any) => ({ label: item.action, value: item._count }))} empty="ยังไม่มี audit activity ล่าสุด" /></CardContent></Card>
      <Card><CardHeader><CardTitle>Archive monitoring</CardTitle></CardHeader><CardContent className="space-y-2 text-sm">
        <Info label="Incident ที่ archive แล้ว" value={String(data.archiveMonitoring.archivedIncidents)} />
        <Info label="Failed restores" value={String(data.archiveMonitoring.failedRestoreAttempts)} />
        <Info label="Failed signed exports" value={String(data.archiveMonitoring.failedExportAttempts)} />
      </CardContent></Card>
    </div>

    <Card><CardHeader><CardTitle>Reconciliation report</CardTitle></CardHeader><CardContent className="grid gap-3 text-sm md:grid-cols-3">
      <Info label="Orphan files" value={String(data.consistency.totals.orphanFiles)} />
      <Info label="Missing storage objects" value={String(data.consistency.totals.missingStorageObjects)} />
      <Info label="Invalid signed URL candidates" value={String(data.consistency.totals.invalidSignedUrlCandidates)} />
    </CardContent></Card>
  </div></AppShell>;
}

function Metric({ title, value }: { title: string; value: number }) {
  return <Card><CardHeader><CardTitle>{title}</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{value}</CardContent></Card>;
}

function Info({ label, value }: { label: string; value: string }) {
  return <div><div className="text-xs font-medium uppercase text-slate-500">{label}</div><div className="mt-1">{value}</div></div>;
}

function MiniRows({ rows, empty }: { rows: Array<{ label: string; value: number }>; empty: string }) {
  if (rows.length === 0) return <p className="text-sm text-slate-500">{empty}</p>;
  return <div className="space-y-2 text-sm">{rows.map((row) => <div key={row.label} className="flex justify-between gap-3 rounded-md border px-3 py-2"><span className="truncate">{row.label}</span><span className="font-semibold">{row.value}</span></div>)}</div>;
}
