import type { Role } from "@/lib/types";

export const GEMINI_CANVAS_URL = "https://gemini.google.com/share/c3f695da4e72";
export const AI_RCA_PRIVACY_NOTICE = "ห้ามส่ง HN, AN, ชื่อผู้ป่วย, ชื่อเจ้าหน้าที่ หรือข้อมูลที่ระบุตัวตนได้ ให้ใช้ Case ID แทน";
export const MANUAL_DEIDENTIFY_NOTICE = "Please manually de-identify before pasting.";

type PromptRca = {
  status?: string | null;
  contributingHuman?: string | null;
  contributingProcess?: string | null;
  contributingEquipment?: string | null;
  contributingEnvironment?: string | null;
  contributingCommunication?: string | null;
  contributingIT?: string | null;
};

export type AiRcaPromptIncident = {
  id: string;
  occurredAt?: Date | null;
  incidentUnit: { name: string };
  riskCode: { code: string };
  clinicalOrGeneral: string;
  simpleCategory: string;
  severity: string;
  status: string;
  description?: string | null;
  immediateAction?: string | null;
  rca?: PromptRca | null;
};

export function shouldShowAiRcaAssistant(pathname: string | null, role: Role | string) {
  if (!["UnitManager", "RMTeam", "Admin"].includes(role)) return false;
  if (!pathname) return false;
  return pathname.startsWith("/rm/rca/") || pathname.startsWith("/unit/rca/");
}

export function buildGeminiRcaPrompt(incident: AiRcaPromptIncident) {
  const lines = [
    "ช่วยวิเคราะห์ RCA เคสนี้เป็นภาษาไทย โดยคง technical terms ที่จำเป็นเป็น English",
    "",
    "ข้อกำหนดด้าน Privacy",
    `- ${AI_RCA_PRIVACY_NOTICE}`,
    "- ห้ามเติมหรือเดาข้อมูลระบุตัวตนเพิ่มเอง",
    "",
    "ข้อมูลเคส (de-identified)",
    `- Case ID: ${incident.id}`,
    `- Incident category: ${incident.clinicalOrGeneral || "-"}`,
    `- NRLS code: ${incident.riskCode.code || "-"}`,
    `- SIMPLE category: ${incident.simpleCategory || "-"}`,
    `- Severity: ${incident.severity || "-"}`,
    `- Unit: ${incident.incidentUnit.name || "-"}`,
    `- Event date/time: ${formatPromptDateTime(incident.occurredAt)}`,
    `- Brief summary: ${buildDeidentifiedSummary(incident)}`,
    `- Immediate action: ${buildProtectedNarrativeField(incident.immediateAction)}`,
    `- Existing triage/RCA-required status: ${buildWorkflowStatus(incident)}`,
    `- Known contributing factors: ${buildKnownContributingFactors(incident.rca)}`,
    "",
    "กรุณาวิเคราะห์ให้ครบหัวข้อดังนี้",
    "1. Timeline analysis",
    "2. 5 Whys",
    "3. Fishbone",
    "4. Root cause",
    "5. Contributing factors",
    "6. Corrective action",
    "7. Preventive action",
    "8. Strong action recommendation",
    "9. KPI",
    "10. KPI owner",
    "11. Follow-up date",
    "12. Risk of recurrence",
    "",
    "ถ้าข้อมูล narrative ส่วนใดยังไม่ de-identify พอ ให้เตือนก่อนเริ่มวิเคราะห์และระบุว่าต้องให้ผู้ใช้แก้ไขเอง",
  ];

  return lines.join("\n");
}

function buildDeidentifiedSummary(incident: AiRcaPromptIncident) {
  if (incident.description?.trim()) return MANUAL_DEIDENTIFY_NOTICE;
  const parts = [
    `เหตุการณ์หมวด ${incident.clinicalOrGeneral || "-"}`,
    `SIMPLE ${incident.simpleCategory || "-"}`,
    `severity ${incident.severity || "-"}`,
    `ในหน่วย ${incident.incidentUnit.name || "-"}`,
  ];
  return parts.join(" ");
}

function buildWorkflowStatus(incident: AiRcaPromptIncident) {
  const status = incident.status || "-";
  const rcaStatus = incident.rca?.status || "ยังไม่มี RCA";
  return `${status} / RCA status: ${rcaStatus}`;
}

function buildKnownContributingFactors(rca?: PromptRca | null) {
  if (!rca) return "-";
  const labels = [
    ["Personnel", rca.contributingHuman],
    ["Process", rca.contributingProcess],
    ["Equipment", rca.contributingEquipment],
    ["Environment", rca.contributingEnvironment],
    ["Communication", rca.contributingCommunication],
    ["IT", rca.contributingIT],
  ] as const;
  const available = labels.filter(([, value]) => Boolean(value?.trim()));
  if (available.length === 0) return "-";
  return available.map(([label]) => `${label}: ${MANUAL_DEIDENTIFY_NOTICE}`).join("; ");
}

function buildProtectedNarrativeField(value?: string | null) {
  if (!value?.trim()) return "-";
  return MANUAL_DEIDENTIFY_NOTICE;
}

function formatPromptDateTime(value?: Date | null) {
  if (!value) return "-";
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  const hours = String(value.getHours()).padStart(2, "0");
  const minutes = String(value.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}
