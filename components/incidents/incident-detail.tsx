import type { AuditLog, Comment, Incident, RiskCode, Unit, User } from "@prisma/client";
import { formatDateTime, maskHn } from "@/lib/format";
import { canManageIncident, canSeeSensitive } from "@/lib/rbac";
import { severityDescriptions } from "@/lib/severity";
import { RmSupportBadge, SentinelBadge, SeverityBadge, StatusBadge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AddCommentForm, IncidentClassificationEditor } from "@/components/incidents/incident-detail-actions";

type DetailIncident = Incident & {
  incidentUnit: Unit;
  reporterUnit: Unit;
  riskCode: RiskCode;
  reportedBy: Pick<User, "id" | "name" | "email" | "role" | "unitId">;
  comments: Array<Comment & { user: Pick<User, "name" | "role"> }>;
  audits: Array<AuditLog & { user: Pick<User, "name" | "role"> | null }>;
};

export function IncidentDetail({ incident, currentUser, riskCodes }: { incident: DetailIncident; currentUser: Pick<User, "id" | "role" | "unitId" | "name" | "email">; riskCodes: RiskCode[] }) {
  const sensitive = canSeeSensitive(currentUser.role);
  const manage = canManageIncident(currentUser.role);
  return <div className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-bold">{incident.incidentNo}</h1><p className="mt-1 text-slate-600">{incident.title}</p></div><div className="flex flex-wrap gap-2"><SeverityBadge severity={incident.severity} /><StatusBadge status={incident.status} /><SentinelBadge value={incident.isSentinel} /><RmSupportBadge value={incident.needRmSupport} /></div></div>
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2"><CardHeader><CardTitle>รายละเอียดเหตุการณ์</CardTitle></CardHeader><CardContent className="space-y-4 text-sm">
        <Info label="วันที่รายงาน" value={formatDateTime(incident.reportedAt)} />
        <Info label="วันเวลาที่เกิดเหตุ" value={formatDateTime(incident.occurredAt)} />
        <Info label="หน่วยงานที่เกิดเหตุ" value={incident.incidentUnit.name} />
        <Info label="สถานที่" value={incident.location || "-"} />
        <Info label="Reporter" value={`${incident.reportedBy.name} (${incident.reportedBy.email})`} />
        <Info label="Patient HN" value={sensitive ? (incident.patientHn || "-") : maskHn(incident.patientHn)} />
        <div><div className="font-medium text-slate-500">รายละเอียด</div><p className="mt-1 whitespace-pre-wrap rounded-lg bg-slate-50 p-3">{incident.description}</p></div>
        <div><div className="font-medium text-slate-500">Immediate action</div><p className="mt-1 whitespace-pre-wrap rounded-lg bg-slate-50 p-3">{incident.immediateAction || "-"}</p></div>
      </CardContent></Card>
      <Card><CardHeader><CardTitle>Classification</CardTitle></CardHeader><CardContent className="space-y-3 text-sm">
        <Info label="Affected type" value={incident.affectedType} />
        <Info label="Clinical/General" value={incident.clinicalOrGeneral} />
        <Info label="SIMPLE" value={incident.simpleCategory} />
        <Info label="Risk code" value={`${incident.riskCode.code} ${incident.riskCode.nameTh}`} />
        <Info label="Severity meaning" value={severityDescriptions[incident.severity]} />
      </CardContent></Card>
    </div>

    {manage ? <div className="space-y-3"><h2 className="text-lg font-semibold">RM classification edit</h2><IncidentClassificationEditor incident={incident} riskCodes={riskCodes} /></div> : null}

    <div className="grid gap-4 lg:grid-cols-2">
      <Card><CardHeader><CardTitle>Comments</CardTitle></CardHeader><CardContent className="space-y-3">
        {manage ? <AddCommentForm incidentId={incident.id} /> : null}
        {incident.comments.length === 0 ? <p className="text-sm text-slate-500">ยังไม่มี comment</p> : incident.comments.map(c => <div key={c.id} className="rounded-lg border p-3 text-sm"><div className="flex justify-between"><span className="font-semibold">{c.user.name}</span><span className="text-xs text-slate-500">{formatDateTime(c.createdAt)}</span></div><p className="mt-1 whitespace-pre-wrap text-slate-700">{c.message}</p></div>)}
      </CardContent></Card>
      <Card><CardHeader><CardTitle>Audit trail</CardTitle></CardHeader><CardContent className="space-y-2">
        {incident.audits.length === 0 ? <p className="text-sm text-slate-500">ยังไม่มี audit</p> : incident.audits.map(a => <div key={a.id} className="rounded-lg border p-3 text-xs"><div className="flex justify-between gap-3"><span className="font-semibold">{a.action}</span><span className="text-slate-500">{formatDateTime(a.createdAt)}</span></div><div className="mt-1 text-slate-500">โดย {a.user?.name ?? "System"}</div></div>)}
      </CardContent></Card>
    </div>
  </div>;
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="grid gap-1"><div className="font-medium text-slate-500">{label}</div><div>{value}</div></div>;
}
