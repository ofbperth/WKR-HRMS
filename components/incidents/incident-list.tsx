"use client";

import Link from "next/link";
import { type MouseEvent } from "react";
import { formatDateOnly } from "@/lib/format";
import { RmSupportBadge, SentinelBadge, SeverityBadge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { incidentStatusValues, severityValues } from "@/lib/validators";
import type { DbRiskCode, DbUnit } from "@/lib/types";

type IncidentRow = {
  id: string;
  incidentNo: string;
  occurredAt: Date;
  reportedAt: Date;
  title: string;
  severity: string;
  status: string;
  isSentinel: boolean;
  needRmSupport: boolean;
  clinicalOrGeneral: string;
  simpleCategory: string;
  incidentUnit: Pick<DbUnit, "id" | "name" | "type" | "isActive">;
  reporterUnit: Pick<DbUnit, "id" | "name" | "type" | "isActive">;
  riskCode: Pick<DbRiskCode, "id" | "code" | "nameTh" | "nameEn" | "clinicalOrGeneral" | "simpleCategory" | "isActive">;
};
type Lookup = { units: DbUnit[]; riskCodes: DbRiskCode[]; simpleCategories: string[] };
type SearchParams = Record<string, string | string[] | undefined>;
type IncidentListMeta = { page: number; pageSize: number; total: number; totalPages: number; hasNextPage: boolean; nextCursor: string | null };

export function IncidentList({ incidents, meta, lookup, basePath, searchParams, detailBasePath }: { incidents: IncidentRow[]; meta: IncidentListMeta; lookup: Lookup; basePath: string; searchParams: SearchParams; canSeeSensitive?: boolean; detailBasePath?: string }) {
  const query = new URLSearchParams();
  Object.entries(searchParams).forEach(([key, value]) => {
    if (typeof value === "string" && value && key !== "page" && key !== "cursor") query.set(key, value);
  });

  return <div className="space-y-4">
    <form className="grid grid-cols-1 gap-3 overflow-hidden rounded-xl border bg-white p-4 sm:grid-cols-2 lg:grid-cols-4" action={basePath}>
      <DateFilterField name="from" defaultValue={asString(searchParams.from)} />
      <DateFilterField name="to" defaultValue={asString(searchParams.to)} />
      <select className="h-10 w-full min-w-0 rounded-md border px-3 py-2 text-sm" name="unitId" defaultValue={asString(searchParams.unitId)}><option value="">All units</option>{lookup.units.map((unit) => <option key={unit.id} value={unit.id}>{unit.name}</option>)}</select>
      <select className="h-10 w-full min-w-0 rounded-md border px-3 py-2 text-sm" name="severity" defaultValue={asString(searchParams.severity)}><option value="">All severity</option>{severityValues.map((severity) => <option key={severity} value={severity}>{severity}</option>)}</select>
      <select className="h-10 w-full min-w-0 rounded-md border px-3 py-2 text-sm" name="simpleCategory" defaultValue={asString(searchParams.simpleCategory)}><option value="">All SIMPLE</option>{lookup.simpleCategories.map((category) => <option key={category}>{category}</option>)}</select>
      <select className="h-10 w-full min-w-0 rounded-md border px-3 py-2 text-sm" name="riskCodeId" defaultValue={asString(searchParams.riskCodeId)}><option value="">All risk codes</option>{lookup.riskCodes.map((riskCode) => <option key={riskCode.id} value={riskCode.id}>{riskCode.code} - {riskCode.nameTh}</option>)}</select>
      <select className="h-10 w-full min-w-0 rounded-md border px-3 py-2 text-sm" name="status" defaultValue={asString(searchParams.status)}><option value="">All status</option>{incidentStatusValues.map((status) => <option key={status}>{status}</option>)}</select>
      <select className="h-10 w-full min-w-0 rounded-md border px-3 py-2 text-sm" name="sentinel" defaultValue={asString(searchParams.sentinel)}><option value="">All sentinel</option><option value="true">Sentinel</option><option value="false">Non-sentinel</option></select>
      <select className="h-10 w-full min-w-0 rounded-md border px-3 py-2 text-sm" name="needRmSupport" defaultValue={asString(searchParams.needRmSupport)}><option value="">All RM support</option><option value="true">Need RM support</option><option value="false">No RM support</option></select>
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
            <tr><th className="px-4 py-3">Action</th><th className="px-4 py-3">Incident No</th><th className="px-4 py-3">Occurred</th><th className="px-4 py-3">Reported</th><th className="px-4 py-3">Incident unit</th><th className="px-4 py-3">Reporter unit</th><th className="px-4 py-3">Title</th><th className="px-4 py-3">Risk code</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Severity</th><th className="px-4 py-3">Badge</th><th className="px-4 py-3">Status</th></tr>
          </thead>
          <tbody className="divide-y">
            {incidents.length === 0 ? <tr><td className="px-4 py-8 text-center text-slate-500" colSpan={12}>No incident found</td></tr> : incidents.map((incident) => <tr key={incident.id} className="hover:bg-slate-50">
              <td className="px-4 py-3"><Link className="rounded-md border px-3 py-2 text-xs hover:bg-slate-100" href={`${detailBasePath ?? basePath}/${incident.id}`}>View</Link></td>
              <td className="px-4 py-3 font-semibold">{incident.incidentNo}</td>
              <td className="px-4 py-3">{formatDateOnly(incident.occurredAt)}</td>
              <td className="px-4 py-3">{formatDateOnly(incident.reportedAt)}</td>
              <td className="px-4 py-3">{incident.incidentUnit.name}</td>
              <td className="px-4 py-3">{incident.reporterUnit.name}</td>
              <td className="px-4 py-3"><div className="font-medium">{incident.title}</div></td>
              <td className="px-4 py-3"><span className="font-semibold">{incident.riskCode.code}</span><div className="text-xs text-slate-500">{incident.riskCode.nameTh}</div></td>
              <td className="px-4 py-3"><div>{incident.clinicalOrGeneral}</div><div className="text-xs text-slate-500">{incident.simpleCategory}</div></td>
              <td className="px-4 py-3"><SeverityBadge severity={incident.severity} /></td>
              <td className="space-x-1 px-4 py-3"><SentinelBadge value={incident.isSentinel} /> <RmSupportBadge value={incident.needRmSupport} /></td>
              <td className="px-4 py-3"><StatusBadge status={incident.status} /></td>
            </tr>)}
          </tbody>
        </table>
      </div>
    </div>

    <Pagination basePath={basePath} searchParams={searchParams} page={meta.page} total={meta.total} pageSize={meta.pageSize} />
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
