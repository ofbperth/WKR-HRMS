export function formatDateTime(value: Date | string | null | undefined) {
  if (!value) return "-";
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Bangkok" }).format(date);
}

export function formatDateOnly(value: Date | string | null | undefined) {
  if (!value) return "-";
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", timeZone: "Asia/Bangkok" }).format(date);
}

function bangkokDayNumber(value: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(value);
  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const day = Number(parts.find((part) => part.type === "day")?.value);
  return Math.floor(Date.UTC(year, month - 1, day) / 86_400_000);
}

export function formatRcaDueCountdown(value: Date | string | null | undefined, now = new Date()) {
  if (!value) return "ยังไม่กำหนด Due date";
  const due = typeof value === "string" ? new Date(value) : value;
  const diffDays = bangkokDayNumber(due) - bangkokDayNumber(now);
  if (diffDays === 0) return "ครบกำหนดวันนี้";
  if (diffDays > 0) return `เหลือ ${diffDays} วัน`;
  return `เลยกำหนด ${Math.abs(diffDays)} วัน`;
}

export function maskHn(value?: string | null) {
  if (!value) return "-";
  if (value.length <= 2) return "**";
  return `${value.slice(0, 2)}${"*".repeat(Math.max(2, value.length - 4))}${value.slice(-2)}`;
}

export function statusLabel(status: string) {
  const labels: Record<string, string> = {
    New: "ใหม่",
    UnderReview: "ผ่าน Triage / ไม่ต้อง RCA",
    RCARequired: "ยังไม่ทำ RCA",
    RCASubmitted: "ส่ง RCA แล้ว",
    ActionOngoing: "ดำเนินแผนการแก้ไข",
    WaitingVerification: "รอตรวจสอบ",
    Closed: "ปิดเคส",
    Rejected: "ไม่รับรายงาน",
    Draft: "ร่าง",
    Submitted: "ส่งแล้ว",
    Approved: "อนุมัติแล้ว",
    RevisionRequired: "ต้องปรับปรุง",
  };
  return labels[status] ?? status;
}

export function statusTone(status: string) {
  const map: Record<string, string> = {
    New: "bg-blue-50 text-blue-700 border-blue-200",
    UnderReview: "bg-sky-50 text-sky-700 border-sky-200",
    RCARequired: "bg-red-50 text-red-700 border-red-200",
    RCASubmitted: "bg-blue-50 text-blue-700 border-blue-200",
    ActionOngoing: "bg-amber-50 text-amber-700 border-amber-200",
    WaitingVerification: "bg-violet-50 text-violet-700 border-violet-200",
    Closed: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Rejected: "bg-slate-50 text-slate-600 border-slate-200",
  };
  return map[status] ?? "bg-slate-50 text-slate-600 border-slate-200";
}

export function severityOrder(severity: string) {
  return "ABCDEFGHI".indexOf(severity);
}
