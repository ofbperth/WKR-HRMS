export const severityDescriptions: Record<string, string> = {
  A: "ยังไม่เกิดเหตุ แต่พบความเสี่ยง/ช่องโหว่",
  B: "เกิดความคลาดเคลื่อน แต่ยังไม่ถึงตัวผู้ป่วย/ผู้เกี่ยวข้อง",
  C: "ถึงตัวแล้ว แต่ไม่เกิดอันตราย",
  D: "ถึงตัวแล้ว ต้องเฝ้าระวัง/ตรวจเพิ่ม แต่ยังไม่เกิด harm ชัดเจน",
  E: "เกิด harm ชั่วคราว ต้องรักษา/แก้ไขเพิ่ม",
  F: "เกิด harm ชั่วคราว ต้องนอนโรงพยาบาลนานขึ้น/ส่งต่อ/เพิ่มระดับการดูแล",
  G: "เกิด harm ถาวร",
  H: "ต้องช่วยชีวิต / CPR / ICU / major intervention",
  I: "เสียชีวิต",
};

export function severityTone(severity: string) {
  if (["A", "B", "C"].includes(severity)) return "bg-slate-100 text-slate-800 border-slate-200";
  if (["D", "E", "F"].includes(severity)) return "bg-amber-100 text-amber-900 border-amber-200";
  return "bg-red-100 text-red-800 border-red-200";
}
