"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { type MouseEvent, useState } from "react";
import { Button } from "@/components/ui/button";

export function DashboardFilter({ units = [], categories = [], showUnit = true }: { units?: Array<{ id: string; name: string }>; categories?: string[]; showUnit?: boolean }) {
  const router = useRouter();
  const search = useSearchParams();
  const [preset, setPreset] = useState(search.get("preset") || "last12");

  function apply(formData: FormData) {
    const query = new URLSearchParams();
    const selectedPreset = String(formData.get("preset") || "last12");
    query.set("preset", selectedPreset);
    for (const key of ["startDate", "endDate", "unitId", "clinicalOrGeneral", "simpleCategory"]) {
      const value = String(formData.get(key) || "");
      if (value) query.set(key, value);
    }
    const yMode = search.get("yMode");
    if (yMode) query.set("yMode", yMode);
    if (formData.get("includeClosed") === "on") query.set("includeClosed", "true");
    router.push(`?${query.toString()}`);
  }

  return <form action={apply} className="dashboard-filter-form grid grid-cols-1 gap-3 rounded-lg border bg-white p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
    <label className="grid min-w-0 gap-1 text-sm font-medium">ช่วงเวลา<select name="preset" className="h-10 w-full min-w-0 rounded-md border px-3 text-sm" value={preset} onChange={e => setPreset(e.target.value)}><option value="thisMonth">เดือนนี้</option><option value="fiscalYear">ปีงบประมาณ</option><option value="last12">12 เดือนล่าสุด</option><option value="custom">กำหนดวันที่เอง</option></select></label>
    <label className="grid min-w-0 gap-1 text-sm font-medium">เริ่มต้น<DateField name="startDate" defaultValue={search.get("startDate") || ""} disabled={preset !== "custom"} /></label>
    <label className="grid min-w-0 gap-1 text-sm font-medium">สิ้นสุด<DateField name="endDate" defaultValue={search.get("endDate") || ""} disabled={preset !== "custom"} /></label>
    {showUnit ? <label className="grid min-w-0 gap-1 text-sm font-medium">หน่วยงาน<select name="unitId" className="h-10 w-full min-w-0 rounded-md border px-3 text-sm" defaultValue={search.get("unitId") || ""}><option value="">ทั้งหมด</option>{units.map(unit => <option key={unit.id} value={unit.id}>{unit.name}</option>)}</select></label> : null}
    <label className="grid min-w-0 gap-1 text-sm font-medium">กลุ่มเหตุการณ์<select name="clinicalOrGeneral" className="h-10 w-full min-w-0 rounded-md border px-3 text-sm" defaultValue={search.get("clinicalOrGeneral") || ""}><option value="">ทั้งหมด</option><option value="Clinical">เกี่ยวกับการดูแลรักษาผู้ป่วย</option><option value="General">ทั่วไป / ระบบงาน / สิ่งแวดล้อม</option></select></label>
    <label className="grid min-w-0 gap-1 text-sm font-medium">SIMPLE<select name="simpleCategory" className="h-10 w-full min-w-0 rounded-md border px-3 text-sm" defaultValue={search.get("simpleCategory") || ""}><option value="">ทั้งหมด</option>{categories.map(category => <option key={category}>{category}</option>)}</select></label>
    <div className="dashboard-filter-actions flex flex-wrap items-center justify-end gap-4">
      <label className="dashboard-filter-checkbox-label inline-flex min-h-10 items-center gap-2 text-sm font-medium">
        <input className="h-4 w-4 shrink-0" name="includeClosed" type="checkbox" defaultChecked={search.get("includeClosed") === "true"} />
        <span className="whitespace-nowrap leading-5">รวม incident ที่ปิดแล้ว</span>
      </label>
      <Button className="h-10" type="submit">ใช้ตัวกรอง</Button>
    </div>
  </form>;
}

function DateField({ name, defaultValue, disabled }: { name: string; defaultValue: string; disabled: boolean }) {
  function openPicker(event: MouseEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    input.focus();
    try {
      input.showPicker?.();
    } catch {
      // Some browsers block showPicker in edge cases; focusing still keeps native date behavior available.
    }
  }

  return <input name={name} type="date" className="h-10 w-full min-w-0 cursor-pointer rounded-md border px-3 text-sm disabled:cursor-not-allowed disabled:opacity-50" defaultValue={defaultValue} disabled={disabled} onClick={openPicker} />;
}
