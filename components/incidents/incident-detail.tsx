import { Suspense } from "react";
import { formatDateTime, statusLabel } from "@/lib/format";
import { canManageIncident, canSeeSensitive, canSubmitRca } from "@/lib/rbac";
import { severityDescriptions } from "@/lib/severity";
import type { DbIncident, DbRiskCode, DbUnit, DbUser } from "@/lib/types";
import { RmSupportBadge, SentinelBadge, SeverityBadge, StatusBadge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ActionPlanForm, ActionUpdateForm, CloseIncidentButton, IncidentClassificationEditor, IncidentDetailEditor, RcaApprovalForm, RcaForm, TriageClassificationForm } from "@/components/incidents/incident-detail-actions";
import { IncidentTeamAssignment } from "@/components/incidents/incident-team-assignment";
import { AiRcaAssistantCard } from "@/components/incidents/ai-rca-assistant";
import { PatientIdentifierReveal } from "@/components/incidents/patient-identifier-reveal";
import { IncidentCommentsPanel } from "@/components/incidents/incident-comments-panel";
import { IncidentAuditsPanel } from "@/components/incidents/incident-audits-panel";
import { actionPlanStatusDisplay, affectedTypeDisplay, clinicalOrGeneralDisplay } from "@/lib/i18n/th";
import { getActiveUsers, getLookupData } from "@/lib/incident-query";
import { canCloseIncident, isIncidentClosed } from "@/lib/incident-close";

type DetailIncident = DbIncident & {
  incidentUnit: DbUnit;
  reporterUnit: DbUnit;
  riskCode: DbRiskCode;
  reportedBy: Pick<DbUser, "id" | "name" | "email" | "role" | "unitId"> | null;
  reporterDisplayName?: string | null;
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
  incidentTeams: Array<{
    id: string;
    assignedAt: Date;
    team: { id: string; name: string; code: string | null; description: string | null; isActive: boolean; sortOrder: number };
  }>;
};

type CurrentUser = Pick<DbUser, "id" | "role" | "unitId" | "name" | "email">;

export function getReporterDisplayValue(incident: Pick<DetailIncident, "reportedBy" | "reporterDisplayName">, currentUserRole: CurrentUser["role"]) {
  if (currentUserRole === "Admin") return incident.reportedBy?.name ?? incident.reporterDisplayName ?? "ผู้ใช้ที่ถูกลบ";
  return incident.reportedBy ? "จำกัดสิทธิ์" : incident.reporterDisplayName ?? "ผู้ใช้ที่ถูกลบ";
}

export function IncidentDetail({ incident, currentUser }: { incident: DetailIncident; currentUser: CurrentUser }) {
  const manage = canManageIncident(currentUser.role);
  const canRevealSensitive = canSeeSensitive(currentUser.role);
  const unitCanWork = currentUser.role === "UnitManager" && currentUser.unitId === incident.incidentUnitId;
  const isIncidentOwner = currentUser.role === "Reporter" && currentUser.id === incident.reportedById;
  const incidentClosed = isIncidentClosed(incident);
  const rcaSubmitted = ["RCASubmitted", "ActionOngoing", "WaitingVerification", "Closed"].includes(incident.status) || ["Submitted", "Approved"].includes(incident.rca?.status ?? "");
  const canEditDetails = (isIncidentOwner || unitCanWork || manage) && !rcaSubmitted && incident.status !== "Rejected";
  const canTriage = (manage || unitCanWork) && !incident.reviewedAt && !["Closed", "Rejected"].includes(incident.status);
  const rcaAllowed = ["RCARequired", "RCASubmitted", "ActionOngoing", "WaitingVerification"].includes(incident.status);
  const canWorkRca = !incidentClosed && rcaAllowed && (manage || unitCanWork || canSubmitRca(currentUser.role) && currentUser.role !== "UnitManager");
  const canAddComment = manage;
  const canClose = manage && canCloseIncident(incident);

  const aiRcaAssistant = canWorkRca ? <AiRcaAssistantCard incident={incident} role={currentUser.role} /> : null;

  return <div className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-bold">{incident.incidentNo}</h1><p className="mt-1 text-slate-600">{incident.title}</p></div><div className="flex flex-wrap items-center gap-2"><SeverityBadge severity={incident.severity} /><StatusBadge status={incident.status} /><SentinelBadge value={incident.isSentinel} /><RmSupportBadge value={incident.needRmSupport} />{canClose ? <CloseIncidentButton incidentId={incident.id} /> : null}</div></div>
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2"><CardHeader><CardTitle>รายละเอียดเหตุการณ์</CardTitle></CardHeader><CardContent className="space-y-4 text-sm">
        <Info label="วันที่รายงาน" value={formatDateTime(incident.reportedAt)} />
        <Info label="วันเวลาที่เกิดเหตุ" value={formatDateTime(incident.occurredAt)} />
        <Info label="กำหนดส่ง RCA" value={formatDateTime(incident.rcaDueAt)} />
        <Info label="หน่วยงานที่เกิดเหตุ" value={incident.incidentUnit.name} />
        <Info label="สถานที่" value={incident.location || "-"} />
        <Info label="ผู้รายงาน" value={getReporterDisplayValue(incident, currentUser.role)} />
        <div>
          <div className="font-medium text-slate-500">ข้อมูลระบุตัวผู้ป่วย</div>
          {canRevealSensitive
            ? <PatientIdentifierReveal incidentId={incident.id} patientHn={null} patientAn={null} requesterName={`${currentUser.name} (${currentUser.email})`} />
            : <div className="rounded-lg border bg-slate-50 p-3 text-sm font-medium text-slate-700">จำกัดสิทธิ์</div>}
        </div>
        <div><div className="font-medium text-slate-500">รายละเอียด</div><p className="mt-1 whitespace-pre-wrap rounded-lg bg-slate-50 p-3">{incident.description}</p></div>
        <div><div className="font-medium text-slate-500">การแก้ไขเบื้องต้น</div><p className="mt-1 whitespace-pre-wrap rounded-lg bg-slate-50 p-3">{incident.immediateAction || "-"}</p></div>
        {canEditDetails ? <Suspense fallback={<InlineSectionSkeleton label="กำลังโหลดเครื่องมือแก้ไขรายละเอียด..." />}>
          <IncidentDetailEditorSection incident={incident} />
        </Suspense> : null}
      </CardContent></Card>
      <Card><CardHeader><CardTitle>การจัดประเภท</CardTitle></CardHeader><CardContent className="space-y-3 text-sm">
        <Info label="ประเภทผู้ได้รับผลกระทบ" value={affectedTypeDisplay(incident.affectedType)} />
        <Info label="กลุ่มเหตุการณ์" value={clinicalOrGeneralDisplay(incident.clinicalOrGeneral)} />
        <Info label="หมวด SIMPLE จาก NRLS code" value={incident.simpleCategory} />
        <Info label="NRLS code" value={`${incident.riskCode.code} ${incident.riskCode.nameTh}`} />
        <Info label="ความถูกต้องในการบริหารยา 6 Rights" value={incident.medicationRight || "-"} />
        <Info label="ความหมายระดับความรุนแรง" value={severityDescriptions[incident.severity]} />
      </CardContent></Card>
    </div>

    {(canTriage || (manage && !incidentClosed)) ? <Suspense fallback={<InlineSectionSkeleton label="กำลังโหลดเครื่องมือจัดประเภท..." />}>
      <IncidentClassificationSection incident={incident} currentUser={currentUser} canTriage={canTriage} manage={manage} unitCanWork={unitCanWork} incidentClosed={incidentClosed} />
    </Suspense> : null}
    {(manage || unitCanWork || incident.incidentTeams.length > 0) ? <Suspense fallback={<InlineSectionSkeleton label="กำลังโหลดทีมที่เกี่ยวข้อง..." />}>
      <IncidentTeamSection incident={incident} editable={manage || unitCanWork} />
    </Suspense> : null}

    <div className="grid gap-4 lg:grid-cols-2">
      <Card><CardHeader><CardTitle>RCA</CardTitle></CardHeader><CardContent className="space-y-4 text-sm">
        {aiRcaAssistant}
        {incident.rca ? <div className="rounded-lg border bg-slate-50 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2"><span className="font-semibold">สถานะ: {statusLabel(incident.rca.status)}</span>{incident.rca.submittedAt ? <span className="text-xs text-slate-500">ส่งเมื่อ {formatDateTime(incident.rca.submittedAt)}</span> : null}</div>
          <Info label="ปัญหา" value={incident.rca.problemStatement || "-"} />
          <Info label="สาเหตุราก" value={incident.rca.rootCause || "-"} />
          <Info label="แนวทางป้องกันซ้ำ" value={incident.rca.preventiveAction || "-"} />
        </div> : <p className="text-slate-500">ยังไม่มี RCA</p>}
        {(!incidentClosed && ((unitCanWork || currentUser.role === "Admin") && rcaAllowed)) || (manage && incident.rca?.status === "Submitted") ? <Suspense fallback={<InlineSectionSkeleton label="กำลังโหลดฟอร์ม RCA..." />}>
          <IncidentRcaSection incident={incident} currentUser={currentUser} unitCanWork={unitCanWork} rcaAllowed={rcaAllowed} manage={manage} incidentClosed={incidentClosed} />
        </Suspense> : null}
        {currentUser.role === "RMTeam" && !incidentClosed && rcaAllowed && incident.rca?.status !== "Submitted" ? <Suspense fallback={<InlineSectionSkeleton label="Loading RCA form..." />}>
          <IncidentRcaSection incident={incident} currentUser={currentUser} unitCanWork={unitCanWork} rcaAllowed={rcaAllowed} manage={manage} incidentClosed={incidentClosed} />
        </Suspense> : null}
      </CardContent></Card>

      <Card><CardHeader><CardTitle>แผนแก้ไข</CardTitle></CardHeader><CardContent className="space-y-4 text-sm">
        <Suspense fallback={<InlineSectionSkeleton label="กำลังโหลดเครื่องมือแผนแก้ไข..." />}>
          <IncidentActionSection incident={incident} currentUser={currentUser} unitCanWork={unitCanWork} manage={manage} incidentClosed={incidentClosed} />
        </Suspense>
      </CardContent></Card>
    </div>

    <div className="grid gap-4 lg:grid-cols-2">
      <Card><CardHeader><CardTitle>ความเห็น</CardTitle></CardHeader><CardContent><IncidentCommentsPanel incidentId={incident.id} canAddComment={canAddComment} /></CardContent></Card>
      <Card><CardHeader><CardTitle>ประวัติการตรวจสอบ</CardTitle></CardHeader><CardContent><IncidentAuditsPanel incidentId={incident.id} /></CardContent></Card>
    </div>
  </div>;
}

async function IncidentDetailEditorSection({ incident }: { incident: DetailIncident }) {
  const lookup = await getLookupData();
  return <IncidentDetailEditor incident={incident} units={lookup.units} riskCodes={lookup.riskCodes} />;
}

async function IncidentClassificationSection({
  incident,
  currentUser,
  canTriage,
  manage,
  unitCanWork,
  incidentClosed,
}: {
  incident: DetailIncident;
  currentUser: CurrentUser;
  canTriage: boolean;
  manage: boolean;
  unitCanWork: boolean;
  incidentClosed: boolean;
}) {
  const lookup = await getLookupData();
  if (canTriage) {
    return <div className="space-y-3"><TriageClassificationForm incident={incident} riskCodes={lookup.riskCodes} backHref={currentUser.role === "UnitManager" ? "/unit/triage" : "/rm/triage"} /></div>;
  }
  if (manage && !canTriage && !incidentClosed) {
    return <div className="space-y-3"><h2 className="text-lg font-semibold">แก้ไขการจัดประเภทโดย RM</h2><IncidentClassificationEditor incident={incident} riskCodes={lookup.riskCodes} /></div>;
  }
  return null;
}

async function IncidentTeamSection({ incident, editable }: { incident: DetailIncident; editable: boolean }) {
  const lookup = await getLookupData();
  return <IncidentTeamAssignment incidentId={incident.id} teams={lookup.teams} assignedTeams={incident.incidentTeams} editable={editable} />;
}

async function IncidentRcaSection({
  incident,
  currentUser,
  unitCanWork,
  rcaAllowed,
  manage,
  incidentClosed,
}: {
  incident: DetailIncident;
  currentUser: CurrentUser;
  unitCanWork: boolean;
  rcaAllowed: boolean;
  manage: boolean;
  incidentClosed: boolean;
}) {
  const showForm = !incidentClosed && rcaAllowed && (manage || unitCanWork || canSubmitRca(currentUser.role) && currentUser.role !== "UnitManager");
  const users = showForm ? await getActiveUsers() : [];
  return <>
    {showForm ? <RcaForm incidentId={incident.id} rca={incident.rca} users={users} /> : null}
    {manage && incident.rca?.status === "Submitted" ? <RcaApprovalForm incidentId={incident.id} /> : null}
  </>;
}

async function IncidentActionSection({
  incident,
  currentUser,
  unitCanWork,
  manage,
  incidentClosed,
}: {
  incident: DetailIncident;
  currentUser: CurrentUser;
  unitCanWork: boolean;
  manage: boolean;
  incidentClosed: boolean;
}) {
  const canAddActionPlan = !incidentClosed && (unitCanWork || currentUser.role === "Admin") && incident.rca?.status === "Approved";
  const canEditActions = !incidentClosed && incident.actionPlans.some((action) => (action.ownerId === currentUser.id || unitCanWork || manage || currentUser.role === "Admin") && action.status !== "Verified");
  const users = canAddActionPlan || canEditActions ? await getActiveUsers() : [];

  return <>
    {incident.actionPlans.length === 0 ? <p className="text-slate-500">ยังไม่มีแผนแก้ไข</p> : incident.actionPlans.map((action) => {
      const canEditAction = !incidentClosed && (action.ownerId === currentUser.id || unitCanWork || manage || currentUser.role === "Admin") && action.status !== "Verified";
      return <div key={action.id} className="space-y-3 rounded-lg border p-3">
        <div className="flex flex-wrap items-start justify-between gap-2"><div><div className="font-semibold">{action.title}</div><div className="text-xs text-slate-500">ผู้รับผิดชอบ: {action.owner?.name ?? "รอหัวหน้าหน่วยงานมอบหมายใหม่"} · กำหนดส่ง {formatDateTime(action.dueDate)}</div></div><span className="rounded-full border px-2 py-1 text-xs">{actionPlanStatusDisplay(action.status)}</span></div>
        <p className="whitespace-pre-wrap text-slate-600">{action.description || "-"}</p>
        {action.evidenceText || action.evidenceUrl ? <div className="rounded-md bg-slate-50 p-2 text-xs"><div className="font-semibold">หลักฐาน</div><div>{action.evidenceText || "-"}</div>{action.evidenceUrl ? <a className="text-blue-700 underline" href={action.evidenceUrl}>ลิงก์หลักฐาน</a> : null}</div> : null}
        {canEditAction ? <ActionUpdateForm action={action} canVerify={manage} users={users} canReassignOwner={unitCanWork || manage || currentUser.role === "Admin"} /> : null}
      </div>;
    })}
    {canAddActionPlan ? <ActionPlanForm incidentId={incident.id} users={users} /> : null}
  </>;
}

function InlineSectionSkeleton({ label }: { label: string }) {
  return <div className="rounded-lg border bg-slate-50 p-4 text-sm text-slate-500">{label}</div>;
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="grid gap-1"><div className="font-medium text-slate-500">{label}</div><div>{value}</div></div>;
}
