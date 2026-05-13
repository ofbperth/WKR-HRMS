"use client";

import Link from "next/link";
import { type MouseEvent } from "react";
import { formatDateOnly } from "@/lib/format";
import { RmSupportBadge, SentinelBadge, SeverityBadge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getPage, pageSlice, Pagination } from "@/components/ui/pagination";
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

const detailLinkClass = "block h-full px-3 py-3 sm:px-4";

export function IncidentList({ incidents, meta, lookup, basePath, searchParams, detailBasePath }: { incidents: IncidentRow[]; meta?: IncidentListMeta; lookup: Lookup; basePath: string; searchParams: SearchParams; canSeeSensitive?: boolean; detailBasePath?: string }) {
  const query = new URLSearchParams();
  Object.entries(searchParams).forEach(([key, value]) => {
    if (typeof value === "string" && value && key !== "page" && key !== "cursor") query.set(key, value);
  });
  const page = meta?.page ?? getPage(searchParams.page, incidents.length);
  const pageSize = meta?.pageSize;
  const total = meta?.total ?? incidents.length;
  const visibleIncidents = meta ? incidents : pageSlice(incidents, page);

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
      <div className="divide-y md:hidden">
        {incidents.length === 0 ? <div className="px-4 py-8 text-center text-sm text-slate-500">ไม่พบข้อมูล</div> : visibleIncidents.map((incident) => <Link key={incident.id} className="block space-y-3 p-4 transition hover:bg-slate-50" href={`${detailBasePath ?? basePath}/${incident.id}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-xs uppercase text-slate-500">Incident No</div>
              <div className="break-words text-sm font-semibold">{incident.incidentNo}</div>
            </div>
            <StatusBadge status={incident.status} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="min-w-0">
              <div className="text-xs uppercase text-slate-500">Occurred</div>
              <div className="text-sm font-medium">{formatDateOnly(incident.occurredAt)}</div>
            </div>
            <div className="min-w-0">
              <div className="text-xs uppercase text-slate-500">Reported</div>
              <div className="text-sm font-medium">{formatDateOnly(incident.reportedAt)}</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="min-w-0">
              <div className="text-xs uppercase text-slate-500">Incident unit</div>
              <div className="break-words text-sm">{incident.incidentUnit.name}</div>
            </div>
            <div className="min-w-0">
              <div className="text-xs uppercase text-slate-500">Reporter unit</div>
              <div className="break-words text-sm">{incident.reporterUnit.name}</div>
            </div>
          </div>
          <div>
            <div className="text-xs uppercase text-slate-500">Risk code</div>
            <div className="break-words text-sm"><span className="break-all font-semibold">{incident.riskCode.code}</span> - {incident.riskCode.nameTh}</div>
          </div>
          <div>
            <div className="text-xs uppercase text-slate-500">Type</div>
            <div className="break-words text-sm">{incident.clinicalOrGeneral} / {incident.simpleCategory}</div>
          </div>
          <div>
            <div className="text-xs uppercase text-slate-500">Title</div>
            <div className="break-words text-sm font-medium text-blue-700 underline-offset-2">{incident.title}</div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <SeverityBadge severity={incident.severity} />
            <SentinelBadge value={incident.isSentinel} />
            <RmSupportBadge value={incident.needRmSupport} />
          </div>
        </Link>)}
      </div>
      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-[1720px] table-auto text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="w-[8rem] px-3 py-3 sm:px-4">Incident No</th>
              <th className="w-[8rem] px-3 py-3 sm:px-4">Occurred</th>
              <th className="w-[8rem] px-3 py-3 sm:px-4">Reported</th>
              <th className="w-[12rem] px-3 py-3 sm:px-4">Incident unit</th>
              <th className="w-[11rem] px-3 py-3 sm:px-4">Reporter unit</th>
              <th className="w-[26rem] px-3 py-3 sm:px-4">Title</th>
              <th className="w-[20rem] px-3 py-3 sm:px-4">Risk code</th>
              <th className="w-[10rem] px-3 py-3 sm:px-4">Type</th>
              <th className="w-[7rem] px-3 py-3 sm:px-4">Severity</th>
              <th className="w-[9rem] px-3 py-3 sm:px-4">Badge</th>
              <th className="w-[9rem] px-3 py-3 sm:px-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {incidents.length === 0 ? <tr><td className="px-4 py-8 text-center text-slate-500" colSpan={11}>ไม่พบข้อมูล</td></tr> : visibleIncidents.map((incident) => <tr key={incident.id} className="group hover:bg-slate-50">
              <td className="w-[8rem] p-0 align-top"><Link className={`${detailLinkClass} break-words font-semibold`} href={`${detailBasePath ?? basePath}/${incident.id}`}>{incident.incidentNo}</Link></td>
              <td className="w-[8rem] p-0 align-top"><Link className={detailLinkClass} href={`${detailBasePath ?? basePath}/${incident.id}`}>{formatDateOnly(incident.occurredAt)}</Link></td>
              <td className="w-[8rem] p-0 align-top"><Link className={detailLinkClass} href={`${detailBasePath ?? basePath}/${incident.id}`}>{formatDateOnly(incident.reportedAt)}</Link></td>
              <td className="w-[12rem] p-0 align-top"><Link className={`${detailLinkClass} break-words`} href={`${detailBasePath ?? basePath}/${incident.id}`}>{incident.incidentUnit.name}</Link></td>
              <td className="w-[11rem] p-0 align-top"><Link className={`${detailLinkClass} break-words`} href={`${detailBasePath ?? basePath}/${incident.id}`}>{incident.reporterUnit.name}</Link></td>
              <td className="w-[26rem] p-0 align-top"><Link className={`${detailLinkClass} whitespace-normal break-words font-medium text-blue-700 underline-offset-2 group-hover:underline`} href={`${detailBasePath ?? basePath}/${incident.id}`}>{incident.title}</Link></td>
              <td className="w-[20rem] p-0 align-top"><Link className={`${detailLinkClass} whitespace-normal break-words`} href={`${detailBasePath ?? basePath}/${incident.id}`}><span className="break-all font-semibold">{incident.riskCode.code}</span><div className="mt-1 whitespace-normal break-words text-xs leading-5 text-slate-500">{incident.riskCode.nameTh}</div></Link></td>
              <td className="w-[10rem] p-0 align-top"><Link className={`${detailLinkClass} whitespace-normal break-words`} href={`${detailBasePath ?? basePath}/${incident.id}`}><div>{incident.clinicalOrGeneral}</div><div className="text-xs text-slate-500">{incident.simpleCategory}</div></Link></td>
              <td className="w-[7rem] p-0 align-top"><Link className={detailLinkClass} href={`${detailBasePath ?? basePath}/${incident.id}`}><SeverityBadge severity={incident.severity} /></Link></td>
              <td className="w-[9rem] p-0 align-top"><Link className={`${detailLinkClass} space-y-1`} href={`${detailBasePath ?? basePath}/${incident.id}`}><SentinelBadge value={incident.isSentinel} /> <RmSupportBadge value={incident.needRmSupport} /></Link></td>
              <td className="w-[9rem] p-0 align-top"><Link className={detailLinkClass} href={`${detailBasePath ?? basePath}/${incident.id}`}><StatusBadge status={incident.status} /></Link></td>
            </tr>)}
          </tbody>
        </table>
      </div>
    </div>

    <Pagination basePath={basePath} searchParams={searchParams} page={page} total={total} pageSize={pageSize} />
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
