export const th = {
  "action.add": "เพิ่มรายการ",
  "action.applyFilter": "ใช้ตัวกรอง",
  "action.back": "ย้อนกลับ",
  "action.cancel": "ยกเลิก",
  "action.clear": "ล้างค่า",
  "action.close": "ปิด",
  "action.delete": "ลบ",
  "action.edit": "แก้ไข",
  "action.next": "ถัดไป",
  "action.refresh": "รีเฟรช",
  "action.save": "บันทึก",
  "action.search": "ค้นหา",
  "action.submit": "ส่งข้อมูล",
  "auth.email": "อีเมล",
  "auth.password": "รหัสผ่าน",
  "auth.login": "เข้าสู่ระบบ",
  "auth.logout": "ออกจากระบบ",
  "common.all": "ทั้งหมด",
  "common.loading": "กำลังโหลด...",
  "common.noData": "ไม่มีข้อมูล",
  "common.status": "สถานะ",
  "common.system": "ระบบ",
  "dashboard.title": "Dashboard",
  "incident.report": "รายงานอุบัติการณ์",
  "incident.title": "ชื่อเหตุการณ์",
  "incident.severity": "ระดับความรุนแรง",
  "incident.riskLevel": "ระดับความเสี่ยง",
  "notification.title": "การแจ้งเตือน",
  "patientSafety.title": "ความปลอดภัยของผู้ป่วย",
  "rca.actionPlan": "แผนการแก้ไข",
  "rca.rootCause": "สาเหตุราก",
} as const;

export type TranslationKey = keyof typeof th;

export function t(key: TranslationKey) {
  return th[key];
}

export const roleDisplayLabels: Record<string, string> = {
  Admin: "ผู้ดูแลระบบ",
  RMTeam: "ทีม RM",
  Executive: "ผู้บริหาร",
  UnitManager: "หัวหน้าหน่วยงาน",
  Reporter: "ผู้รายงาน",
};

export function roleDisplay(role: string) {
  return roleDisplayLabels[role] ?? role;
}

export const clinicalOrGeneralDisplayLabels: Record<string, string> = {
  Clinical: "เกี่ยวกับการดูแลรักษาผู้ป่วย",
  General: "ทั่วไป / ระบบงาน / สิ่งแวดล้อม",
};

export function clinicalOrGeneralDisplay(value: string) {
  return clinicalOrGeneralDisplayLabels[value] ?? value;
}

export const affectedTypeDisplayLabels: Record<string, string> = {
  Patient: "ผู้ป่วย",
  Personnel: "บุคลากร",
  People: "ประชาชน/ผู้มาติดต่อ",
  Organization: "องค์กร/ระบบงาน",
};

export function affectedTypeDisplay(value: string) {
  return affectedTypeDisplayLabels[value] ?? value;
}

export const actionPlanStatusDisplayLabels: Record<string, string> = {
  NotStarted: "ยังไม่เริ่ม",
  Ongoing: "กำลังดำเนินการ",
  Done: "ทำเสร็จแล้ว",
  Delayed: "ล่าช้า",
  Verified: "ตรวจสอบแล้ว",
};

export function actionPlanStatusDisplay(value: string) {
  return actionPlanStatusDisplayLabels[value] ?? value;
}
