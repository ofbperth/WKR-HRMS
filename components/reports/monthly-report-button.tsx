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
      setMessage("Monthly report failed");
      return;
    }
    const report = await res.json();
    setMessage(`Monthly report generated: ${report.year}-${String(report.month).padStart(2, "0")}`);
  }
  return <div className="flex flex-wrap items-center gap-3">
    <Button type="button" onClick={generate} disabled={saving}>{saving ? "Generating..." : "Generate monthly report"}</Button>
    {message ? <span className="text-sm text-slate-600">{message}</span> : null}
  </div>;
}

