export function formatDateTime(value: Date | string | null | undefined) {
  if (!value) return "-";
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export function formatDateOnly(value: Date | string | null | undefined) {
  if (!value) return "-";
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("th-TH", { dateStyle: "medium" }).format(date);
}

export function maskHn(value?: string | null) {
  if (!value) return "-";
  if (value.length <= 2) return "**";
  return `${value.slice(0, 2)}${"*".repeat(Math.max(2, value.length - 4))}${value.slice(-2)}`;
}

export function statusLabel(status: string) {
  const labels: Record<string, string> = {
    New: "ใหม่",
    UnderReview: "กำลังทบทวน",
    RCARequired: "ต้องทำ RCA",
    ActionOngoing: "ดำเนิน Action",
    WaitingVerification: "รอตรวจสอบ",
    Closed: "ปิดเคส",
    Rejected: "ไม่รับรายงาน",
  };
  return labels[status] ?? status;
}

export function statusTone(status: string) {
  const map: Record<string, string> = {
    New: "bg-blue-50 text-blue-700 border-blue-200",
    UnderReview: "bg-sky-50 text-sky-700 border-sky-200",
    RCARequired: "bg-red-50 text-red-700 border-red-200",
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
