"use client";

import Link from "next/link";
import { type MouseEvent } from "react";
import { formatDateOnly } from "@/lib/format";
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
      <select className="h-10 w-full min-w-0 rounded-md border px-3 py-2 text-sm" name="needRmSupport" defaultValue={asString(searchParams.needRmSupport)}><option value="">RM support ทั้งหมด</option><option value="true">ต้องการ RM support</option><option value="false">ไม่ต้องการ</option></select>
      <input className="h-10 w-full min-w-0 rounded-md border px-3 py-2 text-sm sm:col-span-2" name="q" placeholder="Keyword / incident no / risk code" defaultValue={asString(searchParams.q)} />
      <div className="flex min-w-0 flex-wrap gap-2 sm:col-span-2">
        <Button type="submit">Filter</Button>
        <Link className="inline-flex h-10 items-center rounded-md border px-4 text-sm" href={basePath}>ล้างค่า</Link>
        <a className="inline-flex h-10 items-center rounded-md border px-4 text-sm" href={`/api/incidents/export?${query.toString()}`}>Export CSV</a>
      </div>
    </form>

    <div className="overflow-hidden rounded-xl border bg-white">
      <div className="hidden w-full gap-3 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase text-slate-500 md:grid md:grid-cols-[9rem_minmax(8rem,12rem)_minmax(0,1fr)_minmax(8rem,12rem)]">
        <div>วันที่เกิดเหตุ</div>
        <div>หน่วยงาน</div>
        <div>ชื่อเหตุการณ์</div>
        <div>Risk code / Badges / Status</div>
      </div>
      {incidents.length === 0 ? <div className="px-4 py-8 text-center text-sm text-slate-500">ไม่พบข้อมูล</div> : <div className="divide-y">
        {visibleIncidents.map((incident) => <Link key={incident.id} className="grid w-full gap-3 px-4 py-4 text-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 md:grid-cols-[9rem_minmax(8rem,12rem)_minmax(0,1fr)_minmax(8rem,12rem)] md:items-start" href={`${detailBasePath ?? basePath}/${incident.id}`}>
          <ListField label="วันที่เกิดเหตุ" className="md:row-span-2" value={formatDateOnly(incident.occurredAt)} />
          <ListField label="หน่วยงาน" className="md:row-span-2" value={incident.incidentUnit.name} />
          <div className="min-w-0 md:row-span-2">
            <div className="text-xs font-semibold uppercase text-slate-500 md:hidden">ชื่อเหตุการณ์</div>
            <div className="mt-1 break-words font-semibold leading-6 text-slate-950 md:mt-0">{incident.title}</div>
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold uppercase text-slate-500 md:hidden">Risk code</div>
            <div className="mt-1 break-words font-semibold text-slate-900 md:mt-0">{incident.riskCode.code}</div>
            <div className="mt-0.5 break-words text-xs leading-5 text-slate-500">{incident.riskCode.nameTh}</div>
          </div>
          <div className="flex min-w-0 flex-wrap gap-2 md:col-start-4">
            <SeverityBadge severity={incident.severity} />
            <SentinelBadge value={incident.isSentinel} />
            <RmSupportBadge value={incident.needRmSupport} />
            <StatusBadge status={incident.status} />
          </div>
        </Link>)}
      </div>}
    </div>

    <Pagination basePath={basePath} searchParams={searchParams} page={page} total={incidents.length} />
  </div>;
}

function ListField({ label, value, className }: { label: string; value: React.ReactNode; className?: string }) {
  return <div className={className}>
    <div className="text-xs font-semibold uppercase text-slate-500 md:hidden">{label}</div>
    <div className="mt-1 break-words font-medium leading-6 text-slate-900 md:mt-0">{value}</div>
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
