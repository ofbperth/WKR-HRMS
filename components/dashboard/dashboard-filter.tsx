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
    if (formData.get("includeClosed") === "on") query.set("includeClosed", "true");
    router.push(`?${query.toString()}`);
  }

  return <form action={apply} className="grid grid-cols-1 gap-3 rounded-lg border bg-white p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
    <label className="grid min-w-0 gap-1 text-sm font-medium">Period<select name="preset" className="h-10 w-full min-w-0 rounded-md border px-3 text-sm" value={preset} onChange={e => setPreset(e.target.value)}><option value="thisMonth">This month</option><option value="fiscalYear">Fiscal year</option><option value="last12">Last 12 months</option><option value="custom">Custom date</option></select></label>
    <label className="grid min-w-0 gap-1 text-sm font-medium">Start<DateField name="startDate" defaultValue={search.get("startDate") || ""} disabled={preset !== "custom"} /></label>
    <label className="grid min-w-0 gap-1 text-sm font-medium">End<DateField name="endDate" defaultValue={search.get("endDate") || ""} disabled={preset !== "custom"} /></label>
    {showUnit ? <label className="grid min-w-0 gap-1 text-sm font-medium">Unit<select name="unitId" className="h-10 w-full min-w-0 rounded-md border px-3 text-sm" defaultValue={search.get("unitId") || ""}><option value="">All</option>{units.map(unit => <option key={unit.id} value={unit.id}>{unit.name}</option>)}</select></label> : null}
    <label className="grid min-w-0 gap-1 text-sm font-medium">Clinical/General<select name="clinicalOrGeneral" className="h-10 w-full min-w-0 rounded-md border px-3 text-sm" defaultValue={search.get("clinicalOrGeneral") || ""}><option value="">All</option><option>Clinical</option><option>General</option></select></label>
    <label className="grid min-w-0 gap-1 text-sm font-medium">SIMPLE<select name="simpleCategory" className="h-10 w-full min-w-0 rounded-md border px-3 text-sm" defaultValue={search.get("simpleCategory") || ""}><option value="">All</option>{categories.map(category => <option key={category}>{category}</option>)}</select></label>
    <label className="flex items-center gap-2 text-sm font-medium md:col-span-2"><input name="includeClosed" type="checkbox" defaultChecked={search.get("includeClosed") === "true"} /> Include closed incidents</label>
    <div className="flex items-end"><Button type="submit">Apply filter</Button></div>
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
