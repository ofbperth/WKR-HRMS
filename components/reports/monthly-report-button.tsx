"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function MonthlyReportButton() {
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  async function generate() {
    const now = new Date();
    setSaving(true);
    setMessage(null);
    const res = await fetch("/api/reports/monthly", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ year: now.getFullYear(), month: now.getMonth() + 1 }),
    });
    setSaving(false);
    if (!res.ok) {
      setMessage("สร้าง monthly report ไม่สำเร็จ");
      return;
    }
    const report = await res.json();
    setMessage(`สร้าง monthly report แล้ว: ${report.year}-${String(report.month).padStart(2, "0")}`);
  }
  return <div className="flex flex-wrap items-center gap-3">
    <Button type="button" onClick={generate} disabled={saving}>{saving ? "กำลังสร้าง..." : "สร้าง monthly report"}</Button>
    {message ? <span className="text-sm text-slate-600">{message}</span> : null}
  </div>;
}

