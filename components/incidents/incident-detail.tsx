import { formatDateTime } from "@/lib/format";
import { canManageIncident, canSeeSensitive } from "@/lib/rbac";
import { severityDescriptions } from "@/lib/severity";
import type { DbAuditLog, DbComment, DbIncident, DbRiskCode, DbUnit, DbUser } from "@/lib/types";
import { RmSupportBadge, SentinelBadge, SeverityBadge, StatusBadge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ActionPlanForm, ActionUpdateForm, AddCommentForm, IncidentClassificationEditor, IncidentDetailEditor, RcaApprovalForm, RcaForm, TriageClassificationForm } from "@/components/incidents/incident-detail-actions";
import { PatientIdentifierReveal } from "@/components/incidents/patient-identifier-reveal";

type DetailIncident = DbIncident & {
  incidentUnit: DbUnit;
  reporterUnit: DbUnit;
  riskCode: DbRiskCode;
  reportedBy: Pick<DbUser, "id" | "name" | "email" | "role" | "unitId"> | null;
  reporterDisplayName?: string | null;
  comments: Array<DbComment & { user: Pick<DbUser, "name" | "role"> | null }>;
  audits: Array<DbAuditLog & { user: Pick<DbUser, "name" | "role"> | null }>;
  rca?: {
    id: string;
    problemStatement: string | null;
    timeline: string | null;
    contributingHuman: string | null;
    contributingProcess: string | null;
    contributingEquipment: string | null;
    contributingEnvironment: string | null;
    contributingCommunication: string | null;
    contributingIT: string | null;
    rootCause: string | null;
    preventiveAction: string | null;
    kpi: string | null;
    kpiOwnerId: string | null;
    needRmSupport: boolean;
    status: string;
    submittedAt: Date | null;
    approvedAt: Date | null;
  } | null;
  reviewedAt: Date | null;
  actionPlans: Array<{
    id: string;
    title: string;
    description: string | null;
    ownerId: string | null;
    owner: Pick<DbUser, "id" | "name" | "email" | "role" | "unitId"> | null;
    dueDate: Date;
    status: string;
    evidenceText: string | null;
    evidenceUrl: string | null;
    kpiName: string | null;
    kpiTarget: string | null;
    kpiResult: string | null;
    effectivenessReview: string | null;
    verifiedAt: Date | null;
  }>;
};

export function IncidentDetail({ incident, currentUser, units, riskCodes, users = [] }: { incident: DetailIncident; currentUser: Pick<DbUser, "id" | "role" | "unitId" | "name" | "email">; units: DbUnit[]; riskCodes: DbRiskCode[]; users?: Array<Pick<DbUser, "id" | "name" | "email" | "role" | "unitId">> }) {
  const manage = canManageIncident(currentUser.role);
  const canRevealSensitive = canSeeSensitive(currentUser.role);
  const unitCanWork = currentUser.role === "UnitManager" && currentUser.unitId === incident.incidentUnitId;
  const isIncidentOwner = currentUser.role === "Reporter" && currentUser.id === incident.reportedById;
  const rcaSubmitted = ["RCASubmitted", "ActionOngoing", "WaitingVerification", "Closed"].includes(incident.status) || ["Submitted", "Approved"].includes(incident.rca?.status ?? "");
  const canEditDetails = (isIncidentOwner || unitCanWork || manage) && !rcaSubmitted && incident.status !== "Rejected";
  const canTriage = (manage || unitCanWork) && !incident.reviewedAt && !["Closed", "Rejected"].includes(incident.status);
  const rcaAllowed = ["RCARequired", "RCASubmitted", "ActionOngoing", "WaitingVerification"].includes(incident.status);
  return <div className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-bold">{incident.incidentNo}</h1><p className="mt-1 text-slate-600">{incident.title}</p></div><div className="flex flex-wrap gap-2"><SeverityBadge severity={incident.severity} /><StatusBadge status={incident.status} /><SentinelBadge value={incident.isSentinel} /><RmSupportBadge value={incident.needRmSupport} /></div></div>
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2"><CardHeader><CardTitle>รายละเอียดเหตุการณ์</CardTitle></CardHeader><CardContent className="space-y-4 text-sm">
        <Info label="วันที่รายงาน" value={formatDateTime(incident.reportedAt)} />
        <Info label="วันเวลาที่เกิดเหตุ" value={formatDateTime(incident.occurredAt)} />
        <Info label="กำหนดส่ง RCA" value={formatDateTime(incident.rcaDueAt)} />
        <Info label="หน่วยงานที่เกิดเหตุ" value={incident.incidentUnit.name} />
        <Info label="สถานที่" value={incident.location || "-"} />
        <Info label="ผู้รายงาน" value={incident.reportedBy ? "จำกัดสิทธิ์" : incident.reporterDisplayName ?? "Deleted user"} />
        <div>
          <div className="font-medium text-slate-500">ข้อมูลระบุตัวผู้ป่วย</div>
          {canRevealSensitive
            ? <PatientIdentifierReveal incidentId={incident.id} patientHn={null} patientAn={null} requesterName={`${currentUser.name} (${currentUser.email})`} />
            : <div className="rounded-lg border bg-slate-50 p-3 text-sm font-medium text-slate-700">จำกัดสิทธิ์</div>}
        </div>
        <div><div className="font-medium text-slate-500">รายละเอียด</div><p className="mt-1 whitespace-pre-wrap rounded-lg bg-slate-50 p-3">{incident.description}</p></div>
        <div><div className="font-medium text-slate-500">การแก้ไขเบื้องต้น</div><p className="mt-1 whitespace-pre-wrap rounded-lg bg-slate-50 p-3">{incident.immediateAction || "-"}</p></div>
        {canEditDetails ? <IncidentDetailEditor incident={incident} units={units} riskCodes={riskCodes} /> : null}
      </CardContent></Card>
      <Card><CardHeader><CardTitle>การจัดประเภท</CardTitle></CardHeader><CardContent className="space-y-3 text-sm">
        <Info label="ประเภทผู้ได้รับผลกระทบ" value={incident.affectedType} />
        <Info label="กลุ่มเหตุการณ์" value={incident.clinicalOrGeneral === "Clinical" ? "เกี่ยวกับการดูแลรักษาผู้ป่วย" : "ทั่วไป / ระบบงาน / สิ่งแวดล้อม"} />
        <Info label="หมวด SIMPLE จาก NRLS code" value={incident.simpleCategory} />
        <Info label="NRLS code" value={`${incident.riskCode.code} ${incident.riskCode.nameTh}`} />
        <Info label="ความถูกต้องในการบริหารยา 6 Rights" value={incident.medicationRight || "-"} />
        <Info label="ความหมายระดับความรุนแรง" value={severityDescriptions[incident.severity]} />
      </CardContent></Card>
    </div>

    {canTriage ? <div className="space-y-3"><TriageClassificationForm incident={incident} riskCodes={riskCodes} backHref={currentUser.role === "UnitManager" ? "/unit/triage" : "/rm/triage"} /></div> : null}

    {manage && !canTriage ? <div className="space-y-3"><h2 className="text-lg font-semibold">แก้ไขการจัดประเภทโดย RM</h2><IncidentClassificationEditor incident={incident} riskCodes={riskCodes} /></div> : null}

    <div className="grid gap-4 lg:grid-cols-2">
      <Card><CardHeader><CardTitle>RCA</CardTitle></CardHeader><CardContent className="space-y-4 text-sm">
        {incident.rca ? <div className="rounded-lg border bg-slate-50 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2"><span className="font-semibold">สถานะ: {incident.rca.status}</span>{incident.rca.submittedAt ? <span className="text-xs text-slate-500">ส่งเมื่อ {formatDateTime(incident.rca.submittedAt)}</span> : null}</div>
          <Info label="ปัญหา" value={incident.rca.problemStatement || "-"} />
          <Info label="สาเหตุราก" value={incident.rca.rootCause || "-"} />
          <Info label="แนวทางป้องกันซ้ำ" value={incident.rca.preventiveAction || "-"} />
        </div> : <p className="text-slate-500">ยังไม่มี RCA</p>}
        {(unitCanWork || currentUser.role === "Admin") && rcaAllowed ? <RcaForm incidentId={incident.id} rca={incident.rca} users={users} /> : null}
        {manage && incident.rca?.status === "Submitted" ? <RcaApprovalForm incidentId={incident.id} /> : null}
      </CardContent></Card>

      <Card><CardHeader><CardTitle>แผนแก้ไข</CardTitle></CardHeader><CardContent className="space-y-4 text-sm">
        {incident.actionPlans.length === 0 ? <p className="text-slate-500">ยังไม่มีแผนแก้ไข</p> : incident.actionPlans.map(action => <div key={action.id} className="space-y-3 rounded-lg border p-3">
          <div className="flex flex-wrap items-start justify-between gap-2"><div><div className="font-semibold">{action.title}</div><div className="text-xs text-slate-500">ผู้รับผิดชอบ: {action.owner?.name ?? "รอ Unit Manager มอบหมายใหม่"} · กำหนดส่ง {formatDateTime(action.dueDate)}</div></div><span className="rounded-full border px-2 py-1 text-xs">{action.status}</span></div>
          <p className="whitespace-pre-wrap text-slate-600">{action.description || "-"}</p>
          {action.evidenceText || action.evidenceUrl ? <div className="rounded-md bg-slate-50 p-2 text-xs"><div className="font-semibold">หลักฐาน</div><div>{action.evidenceText || "-"}</div>{action.evidenceUrl ? <a className="text-blue-700 underline" href={action.evidenceUrl}>ลิงก์หลักฐาน</a> : null}</div> : null}
          {(action.ownerId === currentUser.id || unitCanWork || manage || currentUser.role === "Admin") && action.status !== "Verified" ? <ActionUpdateForm action={action} canVerify={manage} users={users} canReassignOwner={unitCanWork || manage || currentUser.role === "Admin"} /> : null}
        </div>)}
        {(unitCanWork || currentUser.role === "Admin") && incident.rca?.status === "Approved" ? <ActionPlanForm incidentId={incident.id} users={users} /> : null}
      </CardContent></Card>
    </div>

    <div className="grid gap-4 lg:grid-cols-2">
      <Card><CardHeader><CardTitle>ความคิดเห็น</CardTitle></CardHeader><CardContent className="space-y-3">
        {manage ? <AddCommentForm incidentId={incident.id} /> : null}
        {incident.comments.length === 0 ? <p className="text-sm text-slate-500">ยังไม่มี comment</p> : incident.comments.map(c => <div key={c.id} className="rounded-lg border p-3 text-sm"><div className="flex justify-between"><span className="font-semibold">{c.user?.name ?? "Deleted user"}</span><span className="text-xs text-slate-500">{formatDateTime(c.createdAt)}</span></div><p className="mt-1 whitespace-pre-wrap text-slate-700">{c.message}</p></div>)}
      </CardContent></Card>
      <Card><CardHeader><CardTitle>ประวัติการตรวจสอบ</CardTitle></CardHeader><CardContent className="space-y-2">
        {incident.audits.length === 0 ? <p className="text-sm text-slate-500">ยังไม่มี audit</p> : incident.audits.map(a => <div key={a.id} className="rounded-lg border p-3 text-xs"><div className="flex justify-between gap-3"><span className="font-semibold">{a.action}</span><span className="text-slate-500">{formatDateTime(a.createdAt)}</span></div><div className="mt-1 text-slate-500">โดย {a.user?.name ?? "System"}</div></div>)}
      </CardContent></Card>
    </div>
  </div>;
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="grid gap-1"><div className="font-medium text-slate-500">{label}</div><div>{value}</div></div>;
}
