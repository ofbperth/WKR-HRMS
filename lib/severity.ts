import { CLINICAL_SEVERITY_VALUES, GENERAL_SEVERITY_VALUES } from "@/lib/types";
import type { ClinicalOrGeneral, Severity } from "@/lib/types";

export const clinicalSeverityDescriptions: Record<string, string> = {
  A: "Near miss: มีโอกาสเกิดความคลาดเคลื่อน แต่ยังไม่เกิดเหตุ",
  B: "Near miss: เกิดความคลาดเคลื่อนแล้ว แต่ยังไม่ถึงผู้ป่วย/ผู้เกี่ยวข้อง",
  C: "เกิดถึงผู้ป่วย/ผู้เกี่ยวข้องแล้ว แต่ไม่เกิดอันตราย",
  D: "เกิดถึงผู้ป่วย/ผู้เกี่ยวข้องแล้ว ต้องเฝ้าระวังหรือดูแลเพิ่มเติม แต่ยังไม่เกิดอันตรายชัดเจน",
  E: "เกิดอันตรายชั่วคราว ต้องรักษาหรือแก้ไขเพิ่มเติม",
  F: "เกิดอันตรายชั่วคราว ต้องนอนโรงพยาบาลนานขึ้น ส่งต่อ หรือเพิ่มระดับการดูแล",
  G: "เกิดอันตรายถาวร",
  H: "ต้องช่วยชีวิต เช่น CPR, ICU หรือ major intervention",
  I: "เสียชีวิต",
};

export const generalSeverityDetails = {
  "1": {
    level: "1",
    label: "Low Risk / Near miss",
    summary: "เกิดความผิดพลาดแต่ยังไม่มีผลกระทบต่อผลสำเร็จหรือวัตถุประสงค์ของการดำเนินงาน",
    people: "ชีวิต/บุคคล/ผู้รับบริการ: ยังไม่เกิดความเดือดร้อนหรือความเสียหายต่อบุคคล",
    property: "ทรัพย์สิน: มูลค่าความเสียหาย 0-10,000 บาท",
    reputation: "ชื่อเสียง: ยังไม่เกิดข้อร้องเรียนหรือผลกระทบต่อชื่อเสียง",
  },
  "2": {
    level: "2",
    label: "Low Risk",
    summary: "เกิดความผิดพลาดและมีผลกระทบที่ควบคุมได้ต่อผลสำเร็จหรือวัตถุประสงค์ของการดำเนินงาน",
    people: "ชีวิต/บุคคล/ผู้รับบริการ: ผู้รับบริการอาจให้ข้อคิดเห็นหรือข้อเสนอแนะ และยังควบคุมแก้ไขได้",
    property: "ทรัพย์สิน: มูลค่าความเสียหาย 10,001-50,000 บาท",
    reputation: "ชื่อเสียง: เป็นข้อคิดเห็นหรือข้อเสนอแนะระดับต้น ยังควบคุมได้ภายในงาน",
  },
  "3": {
    level: "3",
    label: "Moderate Risk",
    summary: "เกิดความผิดพลาดและมีผลกระทบที่ต้องแก้ไขต่อผลสำเร็จหรือวัตถุประสงค์ของการดำเนินงาน",
    people: "ชีวิต/บุคคล/ผู้รับบริการ: ผู้รับบริการเดือดร้อนหรือมีข้อร้องเรียนที่หน่วยงานแก้ไขได้",
    property: "ทรัพย์สิน: มูลค่าความเสียหาย 50,001-250,000 บาท",
    reputation: "ชื่อเสียง: มีข้อร้องเรียนในระดับที่ต้องแก้ไข แต่ยังจัดการได้โดยหน่วยงาน/ระบบภายใน",
  },
  "4": {
    level: "4",
    label: "High Risk",
    summary: "เกิดความผิดพลาดและทำให้การดำเนินงานไม่บรรลุผลสำเร็จตามเป้าหมาย",
    people: "ชีวิต/บุคคล/ผู้รับบริการ: ผู้รับบริการเดือดร้อนมาก ต้องอาศัยทีม คณะกรรมการ หรือหลายหน่วยงานช่วยแก้ไข",
    property: "ทรัพย์สิน: มูลค่าความเสียหาย 250,001-10,000,000 บาท",
    reputation: "ชื่อเสียง: มีข้อร้องเรียนหรือผลกระทบที่หน่วยงานเดียวแก้ไขไม่ได้ ต้องยกระดับการจัดการ",
  },
  "5": {
    level: "5",
    label: "High Risk / Extreme impact",
    summary: "เกิดความผิดพลาดและทำให้ภารกิจขององค์กรเสียหายอย่างร้ายแรง",
    people: "ชีวิต/บุคคล/ผู้รับบริการ: กระทบต่อภารกิจหรือความเชื่อมั่นอย่างรุนแรง ต้องเร่งจัดการระดับองค์กร",
    property: "ทรัพย์สิน: มูลค่าความเสียหายมากกว่า 10,000,000 บาท",
    reputation: "ชื่อเสียง: มีผลกระทบต่อชื่อเสียง/ภาพลักษณ์อย่างรุนแรง เช่น ร้องเรียน ฟ้องร้อง หรือออกสื่อ",
  },
} as const;

export const generalSeverityDescriptions: Record<string, string> = Object.fromEntries(
  Object.entries(generalSeverityDetails).map(([level, item]) => [level, `${item.label}: ${item.summary}`]),
);

export const severityDescriptions: Record<string, string> = {
  ...clinicalSeverityDescriptions,
  ...generalSeverityDescriptions,
};

export const severityWeights: Record<string, number> = {
  A: 1,
  B: 2,
  C: 3,
  D: 4,
  E: 5,
  F: 6,
  G: 7,
  H: 8,
  I: 9,
  "1": 1,
  "2": 2,
  "3": 3,
  "4": 4,
  "5": 5,
};

export const clinicalHighSeverity = ["E", "F", "G", "H", "I"] as const;
export const generalHighSeverity = ["3", "4", "5"] as const;
export const clinicalSentinelSeverity = ["G", "H", "I"] as const;

export function severityOptionsFor(clinicalOrGeneral: string) {
  return clinicalOrGeneral === "General" ? [...GENERAL_SEVERITY_VALUES] : [...CLINICAL_SEVERITY_VALUES];
}

export function isHighSeverityForType(severity: string, clinicalOrGeneral: ClinicalOrGeneral | string) {
  return clinicalOrGeneral === "General"
    ? (generalHighSeverity as readonly string[]).includes(severity)
    : (clinicalHighSeverity as readonly string[]).includes(severity);
}

export function isSentinelSeverity(severity: Severity | string, clinicalOrGeneral: ClinicalOrGeneral | string) {
  return clinicalOrGeneral === "Clinical" && (clinicalSentinelSeverity as readonly string[]).includes(severity);
}

export function normalizeSeverityForType(severity: string | undefined, clinicalOrGeneral: string) {
  const options = severityOptionsFor(clinicalOrGeneral);
  return severity && options.includes(severity as never) ? severity : options[0];
}

export function severityTone(severity: string) {
  if (["A", "B", "C", "1"].includes(severity)) return "bg-slate-100 text-slate-800 border-slate-200";
  if (["D", "E", "F", "2", "3"].includes(severity)) return "bg-amber-100 text-amber-900 border-amber-200";
  return "bg-red-100 text-red-800 border-red-200";
}
