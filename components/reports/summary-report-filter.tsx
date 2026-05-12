"use client";

import { type MouseEvent, useMemo, useState } from "react";

type Mode = "month" | "range" | "fiscalYear";

export function SummaryReportFilter({ defaults }: { defaults: { mode: string; month: string; startMonth: string; endMonth: string; fiscalYear: string } }) {
  const initialMode = defaults.mode === "range" || defaults.mode === "fiscalYear" ? defaults.mode : "month";
  const [mode, setMode] = useState<Mode>(initialMode);
  const helper = useMemo(() => {
    if (mode === "month") return "เลือกเดือนเดียว เช่น รายงานเดือนพฤษภาคม";
    if (mode === "range") return "เลือกเดือนเริ่มต้นและเดือนสิ้นสุด ระบบจะรวมข้อมูลทุกเดือนในช่วงนั้น";
    return "ปีงบประมาณไทยเริ่ม 1 ตุลาคม และสิ้นสุด 30 กันยายน";
  }, [mode]);

  return <form className="space-y-4 rounded-xl border bg-white p-4 print:hidden" action="/executive/monthly-report">
    <input type="hidden" name="mode" value={mode} />
    <div className="grid gap-2 sm:grid-cols-3">
      <ModeButton active={mode === "month"} onClick={() => setMode("month")} label="เดือนเดียว" />
      <ModeButton active={mode === "range"} onClick={() => setMode("range")} label="ช่วงเดือน" />
      <ModeButton active={mode === "fiscalYear"} onClick={() => setMode("fiscalYear")} label="ปีงบประมาณ" />
    </div>
    <p className="text-sm text-slate-600">{helper}</p>
    {mode === "month" ? <div className="grid gap-3 sm:max-w-sm"><label className="space-y-1 text-sm font-medium"><span>เดือนที่ต้องการ</span><MonthField name="month" defaultValue={defaults.month} /></label></div> : null}
    {mode === "range" ? <div className="grid gap-3 sm:grid-cols-2 lg:max-w-2xl">
      <label className="space-y-1 text-sm font-medium"><span>ตั้งแต่เดือน</span><MonthField name="startMonth" defaultValue={defaults.startMonth} /></label>
      <label className="space-y-1 text-sm font-medium"><span>ถึงเดือน</span><MonthField name="endMonth" defaultValue={defaults.endMonth} /></label>
    </div> : null}
    {mode === "fiscalYear" ? <div className="grid gap-3 sm:max-w-sm"><label className="space-y-1 text-sm font-medium"><span>ปีงบประมาณ พ.ศ.</span><input className="h-10 w-full rounded-md border px-3" name="fiscalYear" inputMode="numeric" defaultValue={defaults.fiscalYear} placeholder="เช่น 2569" /></label></div> : null}
    <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white">ดูรายงาน</button>
  </form>;
}

function ModeButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return <button type="button" onClick={onClick} className={`rounded-md border px-4 py-3 text-sm font-semibold ${active ? "border-primary bg-primary text-white" : "bg-white text-slate-700 hover:bg-slate-50"}`}>{label}</button>;
}

function MonthField({ name, defaultValue }: { name: string; defaultValue: string }) {
  function openPicker(event: MouseEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    input.focus();
    try {
      input.showPicker?.();
    } catch {
      // Browser support varies; focus keeps native month input behavior available.
    }
  }

  return <input className="h-10 w-full cursor-pointer rounded-md border px-3" type="month" name={name} defaultValue={defaultValue} onClick={openPicker} />;
}
