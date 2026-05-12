"use client";

import Link from "next/link";
import { type MouseEvent } from "react";
import { formatDateOnly, formatDateTime, maskHn } from "@/lib/format";
import { RmSupportBadge, SentinelBadge, SeverityBadge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getPage, pageSlice, Pagination } from "@/components/ui/pagination";
import { incidentStatusValues, severityValues } from "@/lib/validators";
import type { DbIncident, DbRiskCode, DbUnit, DbUser } from "@/lib/types";

type IncidentRow = DbIncident & { incidentUnit: DbUnit; reporterUnit: DbUnit; riskCode: DbRiskCode; reportedBy: Pick<DbUser, "id" | "name" | "email" | "role" | "unitId"> };
type Lookup = { units: DbUnit[]; riskCodes: DbRiskCode[]; simpleCategories: string[] };
type SearchParams = Record<string, string | string[] | undefined>;

export function IncidentList({ incidents, lookup, basePath, searchParams, detailBasePath }: { incidents: IncidentRow[]; lookup: Lookup; basePath: string; searchParams: SearchParams; canSeeSensitive?: boolean; detailBasePath?: string }) {
  const query = new URLSearchParams();
  Object.entries(searchParams).forEach(([key, value]) => {
    if (typeof value === "string" && value && key !== "page") query.set(key, value);
  });
  const page = getPage(searchParams.page, incidents.length);
  const visibleIncidents = pageSlice(incidents, page);

  return <div className="space-y-4">
    <form className="grid grid-cols-1 gap-3 overflow-hidden rounded-xl border bg-white p-4 sm:grid-cols-2 lg:grid-cols-4" action={basePath}>
      <DateFilterField name="from" defaultValue={asString(searchParams.from)} />
      <DateFilterField name="to" defaultValue={asString(searchParams.to)} />
      <select className="h-10 w-full min-w-0 rounded-md border px-3 py-2 text-sm" name="unitId" defaultValue={asString(searchParams.unitId)}><option value="">ทุกหน่วยงาน</option>{lookup.units.map((unit) => <option key={unit.id} value={unit.id}>{unit.name}</option>)}</select>
      <select className="h-10 w-full min-w-0 rounded-md border px-3 py-2 text-sm" name="severity" defaultValue={asString(searchParams.severity)}><option value="">ทุก Severity</option>{severityValues.map((severity) => <option key={severity} value={severity}>{severity}</option>)}</select>
      <select className="h-10 w-full min-w-0 rounded-md border px-3 py-2 text-sm" name="simpleCategory" defaultValue={asString(searchParams.simpleCategory)}><option value="">ทุก SIMPLE</option>{lookup.simpleCategories.map((category) => <option key={category}>{category}</option>)}</select>
      <select className="h-10 w-full min-w-0 rounded-md border px-3 py-2 text-sm" name="riskCodeId" defaultValue={asString(searchParams.riskCodeId)}><option value="">ทุก Risk code</option>{lookup.riskCodes.map((riskCode) => <option key={riskCode.id} value={riskCode.id}>{riskCode.code} - {riskCode.nameTh}</option>)}</select>
      <select className="h-10 w-full min-w-0 rounded-md border px-3 py-2 text-sm" name="status" defaultValue={asString(searchParams.status)}><option value="">ทุก Status</option>{incidentStatusValues.map((status) => <option key={status}>{status}</option>)}</select>
      <select className="h-10 w-full min-w-0 rounded-md border px-3 py-2 text-sm" name="sentinel" defaultValue={asString(searchParams.sentinel)}><option value="">ทั้งหมด</option><option value="true">Sentinel</option><option value="false">ไม่ใช่ Sentinel</option></select>
      <select className="h-10 w-full min-w-0 rounded-md border px-3 py-2 text-sm" name="needRmSupport" defaultValue={asString(searchParams.needRmSupport)}><option value="">RM support ทั้งหมด</option><option value="true">Need RM support</option><option value="false">ไม่ต้องการ</option></select>
      <input className="h-10 w-full min-w-0 rounded-md border px-3 py-2 text-sm sm:col-span-2" name="q" placeholder="Keyword / incident no / risk code" defaultValue={asString(searchParams.q)} />
      <div className="flex min-w-0 flex-wrap gap-2 sm:col-span-2">
        <Button type="submit">Filter</Button>
        <Link className="inline-flex h-10 items-center rounded-md border px-4 text-sm" href={basePath}>Clear</Link>
        <a className="inline-flex h-10 items-center rounded-md border px-4 text-sm" href={`/api/incidents/export?${query.toString()}`}>Export CSV</a>
      </div>
    </form>

    <div className="overflow-hidden rounded-xl border bg-white">
      <div className="overflow-auto">
        <table className="w-full min-w-[1200px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr><th className="px-4 py-3">Action</th><th className="px-4 py-3">Incident No</th><th className="px-4 py-3">Occurred</th><th className="px-4 py-3">Unit</th><th className="px-4 py-3">Title</th><th className="px-4 py-3">Risk code</th><th className="px-4 py-3">Severity</th><th className="px-4 py-3">Badge</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Reporter</th><th className="px-4 py-3">HN/AN</th><th className="px-4 py-3">Last updated</th></tr>
          </thead>
          <tbody className="divide-y">
            {incidents.length === 0 ? <tr><td className="px-4 py-8 text-center text-slate-500" colSpan={12}>ไม่พบข้อมูล</td></tr> : visibleIncidents.map((incident) => <tr key={incident.id} className="hover:bg-slate-50">
              <td className="px-4 py-3"><Link className="rounded-md border px-3 py-2 text-xs hover:bg-slate-100" href={`${detailBasePath ?? basePath}/${incident.id}`}>View</Link></td>
              <td className="px-4 py-3 font-semibold">{incident.incidentNo}</td>
              <td className="px-4 py-3">{formatDateOnly(incident.occurredAt)}</td>
              <td className="px-4 py-3">{incident.incidentUnit.name}</td>
              <td className="px-4 py-3"><div className="font-medium">{incident.title}</div><div className="line-clamp-1 text-xs text-slate-500">{incident.description}</div></td>
              <td className="px-4 py-3"><span className="font-semibold">{incident.riskCode.code}</span><div className="text-xs text-slate-500">{incident.riskCode.nameTh}</div></td>
              <td className="px-4 py-3"><SeverityBadge severity={incident.severity} /></td>
              <td className="space-x-1 px-4 py-3"><SentinelBadge value={incident.isSentinel} /> <RmSupportBadge value={incident.needRmSupport} /></td>
              <td className="px-4 py-3"><StatusBadge status={incident.status} /></td>
              <td className="px-4 py-3">Restricted</td>
              <td className="px-4 py-3">{`${maskHn(incident.patientHn)} / ${maskHn(incident.patientAn ?? null)}`}</td>
              <td className="px-4 py-3">{formatDateTime(incident.updatedAt)}</td>
            </tr>)}
          </tbody>
        </table>
      </div>
    </div>

    <Pagination basePath={basePath} searchParams={searchParams} page={page} total={incidents.length} />
  </div>;
}

function asString(value: string | string[] | undefined) {
  return typeof value === "string" ? value : "";
}

function DateFilterField({ name, defaultValue }: { name: string; defaultValue: string }) {
  function openPicker(event: MouseEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    input.focus();
    try {
      input.showPicker?.();
    } catch {
      // Some browsers still only focus the native date control.
    }
  }

  return <input className="h-10 w-full min-w-0 cursor-pointer rounded-md border px-3 py-2 text-sm" type="date" name={name} defaultValue={defaultValue} onClick={openPicker} />;
}
