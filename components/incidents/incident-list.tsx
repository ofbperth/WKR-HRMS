"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type KeyboardEvent as ReactKeyboardEvent, type MouseEvent } from "react";
import { formatDateTime, formatRcaDueCountdown } from "@/lib/format";
import { RmSupportBadge, SentinelBadge, SeverityBadge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getPage, pageSlice, Pagination } from "@/components/ui/pagination";
import { incidentStatusValues, severityValues } from "@/lib/validators";
import type { DbRiskCode, DbUnit } from "@/lib/types";
import { clinicalOrGeneralDisplay } from "@/lib/i18n/th";
import { statusLabel } from "@/lib/format";

type IncidentRow = {
  id: string;
  incidentNo: string;
  occurredAt: Date;
  reportedAt: Date;
  rcaDueAt?: Date | null;
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

export function IncidentList({ incidents, meta, lookup, basePath, searchParams, detailBasePath, showRcaDueCountdown = false }: { incidents: IncidentRow[]; meta?: IncidentListMeta; lookup: Lookup; basePath: string; searchParams: SearchParams; canSeeSensitive?: boolean; detailBasePath?: string; showRcaDueCountdown?: boolean }) {
  const router = useRouter();
  const query = new URLSearchParams();
  Object.entries(searchParams).forEach(([key, value]) => {
    if (typeof value === "string" && value && key !== "page" && key !== "cursor") query.set(key, value);
    if (Array.isArray(value) && key !== "page" && key !== "cursor") value.filter(Boolean).forEach((item) => query.append(key, item));
  });
  const page = meta?.page ?? getPage(searchParams.page, incidents.length);
  const pageSize = meta?.pageSize;
  const total = meta?.total ?? incidents.length;
  const visibleIncidents = meta ? incidents : pageSlice(incidents, page);
  const getDetailHref = (incidentId: string) => `${detailBasePath ?? basePath}/${incidentId}`;
  const selectedSimpleCategories = asArray(searchParams.simpleCategory);

  function openIncidentDetail(incidentId: string) {
    router.push(getDetailHref(incidentId));
  }

  function handleRowKeyDown(event: ReactKeyboardEvent<HTMLDivElement>, incidentId: string) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openIncidentDetail(incidentId);
    }
  }

  return <div className="space-y-4">
    <form className="grid grid-cols-1 gap-3 overflow-hidden rounded-xl border bg-white p-4 sm:grid-cols-2 lg:grid-cols-4" action={basePath}>
      <DateFilterField name="from" defaultValue={asString(searchParams.from)} />
      <DateFilterField name="to" defaultValue={asString(searchParams.to)} />
      <select className="h-10 w-full min-w-0 rounded-md border px-3 py-2 text-sm" name="unitId" defaultValue={asString(searchParams.unitId)}><option value="">ทุกหน่วยงาน</option>{lookup.units.map((unit) => <option key={unit.id} value={unit.id}>{unit.name}</option>)}</select>
      <select className="h-10 w-full min-w-0 rounded-md border px-3 py-2 text-sm" name="severity" defaultValue={asString(searchParams.severity)}><option value="">ทุกระดับความรุนแรง</option>{severityValues.map((severity) => <option key={severity} value={severity}>{severity}</option>)}</select>
      <fieldset className="min-w-0 rounded-md border px-3 py-2 text-sm">
        <legend className="px-1 text-xs font-semibold text-slate-500">SIMPLE</legend>
        <div className="max-h-28 space-y-1 overflow-auto pr-1">
          {lookup.simpleCategories.map((category) => <label key={category} className="flex min-h-7 items-center gap-2">
            <input className="h-4 w-4 shrink-0" type="checkbox" name="simpleCategory" value={category} defaultChecked={selectedSimpleCategories.includes(category)} />
            <span className="truncate">{category}</span>
          </label>)}
        </div>
      </fieldset>
      <select className="h-10 w-full min-w-0 rounded-md border px-3 py-2 text-sm" name="riskCodeId" defaultValue={asString(searchParams.riskCodeId)}><option value="">ทุก NRLS code</option>{lookup.riskCodes.map((riskCode) => <option key={riskCode.id} value={riskCode.id}>{riskCode.code} - {riskCode.nameTh}</option>)}</select>
      <select className="h-10 w-full min-w-0 rounded-md border px-3 py-2 text-sm" name="status" defaultValue={asString(searchParams.status)}><option value="">ทุกสถานะ</option>{incidentStatusValues.map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}</select>
      <select className="h-10 w-full min-w-0 rounded-md border px-3 py-2 text-sm" name="sentinel" defaultValue={asString(searchParams.sentinel)}><option value="">ทั้งหมด</option><option value="true">Sentinel</option><option value="false">ไม่ใช่ Sentinel</option></select>
      <select className="h-10 w-full min-w-0 rounded-md border px-3 py-2 text-sm" name="needRmSupport" defaultValue={asString(searchParams.needRmSupport)}><option value="">RM support ทั้งหมด</option><option value="true">ต้องการ RM support</option><option value="false">ไม่ต้องการ</option></select>
      <input className="h-10 w-full min-w-0 rounded-md border px-3 py-2 text-sm sm:col-span-2" name="q" placeholder="ค้นหาเลขที่รายงาน / ชื่อเหตุการณ์ / NRLS code" defaultValue={asString(searchParams.q)} />
      <div className="flex min-w-0 flex-wrap gap-2 sm:col-span-2">
        <Button type="submit">ค้นหา</Button>
        <Link className="inline-flex h-10 items-center rounded-md border px-4 text-sm" href={basePath}>ล้างค่า</Link>
        <a className="inline-flex h-10 items-center rounded-md border px-4 text-sm" href={`/api/incidents/export?${query.toString()}`}>ส่งออก CSV</a>
      </div>
    </form>

    <div className="overflow-hidden rounded-xl border bg-white">
      <div className="divide-y md:hidden">
        {incidents.length === 0 ? <div className="px-4 py-8 text-center text-sm text-slate-500">ไม่พบข้อมูล</div> : visibleIncidents.map((incident) => <Link key={incident.id} className="block space-y-3 p-4 transition hover:bg-slate-50" href={getDetailHref(incident.id)}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-xs uppercase text-slate-500">เลขที่รายงาน</div>
              <div className="break-words text-sm font-semibold">{incident.incidentNo}</div>
            </div>
            <StatusBadge status={incident.status} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="min-w-0">
              <div className="text-xs uppercase text-slate-500">วันที่เกิดเหตุ</div>
              <div className="text-sm font-medium">{formatDateTime(incident.occurredAt)}</div>
            </div>
            <div className="min-w-0">
              <div className="text-xs uppercase text-slate-500">วันที่รายงาน</div>
              <div className="text-sm font-medium">{formatDateTime(incident.reportedAt)}</div>
            </div>
            <div className="min-w-0">
              <div className="text-xs uppercase text-slate-500">กำหนดส่ง RCA</div>
              <div className="text-sm font-medium">{formatDateTime(incident.rcaDueAt)}</div>
              {showRcaDueCountdown ? <div className="text-xs text-slate-500">{formatRcaDueCountdown(incident.rcaDueAt)}</div> : null}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="min-w-0">
              <div className="text-xs uppercase text-slate-500">หน่วยงานที่เกิดเหตุ</div>
              <div className="break-words text-sm">{incident.incidentUnit.name}</div>
            </div>
            <div className="min-w-0">
              <div className="text-xs uppercase text-slate-500">หน่วยงานผู้รายงาน</div>
              <div className="break-words text-sm">{incident.reporterUnit.name}</div>
            </div>
          </div>
          <div>
            <div className="text-xs uppercase text-slate-500">NRLS code</div>
            <div className="break-words text-sm"><span className="break-all font-semibold">{incident.riskCode.code}</span> - {incident.riskCode.nameTh}</div>
          </div>
          <div>
            <div className="text-xs uppercase text-slate-500">ประเภท</div>
            <div className="break-words text-sm">{clinicalOrGeneralDisplay(incident.clinicalOrGeneral)} / SIMPLE {incident.simpleCategory}</div>
          </div>
          <div>
            <div className="text-xs uppercase text-slate-500">ชื่อเหตุการณ์</div>
            <div className="break-words text-sm font-medium text-blue-700 underline-offset-2">{incident.title}</div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <SeverityBadge severity={incident.severity} />
            <SentinelBadge value={incident.isSentinel} />
            <RmSupportBadge value={incident.needRmSupport} />
          </div>
        </Link>)}
      </div>
      <div className="hidden divide-y md:block">
        {incidents.length === 0 ? <div className="px-4 py-8 text-center text-slate-500">ไม่พบข้อมูล</div> : visibleIncidents.map((incident) => <div key={incident.id} role="link" tabIndex={0} aria-label={`เปิดรายงาน ${incident.incidentNo}`} onClick={() => openIncidentDetail(incident.id)} onKeyDown={(event) => handleRowKeyDown(event, incident.id)} className="group grid cursor-pointer grid-cols-12 gap-x-4 gap-y-3 px-4 py-4 text-sm transition hover:bg-slate-50 focus-visible:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">
          <div className="col-span-3 min-w-0 xl:col-span-2">
            <div className="text-xs font-semibold uppercase text-slate-500">เลขที่รายงาน</div>
            <div className="break-words font-semibold">{incident.incidentNo}</div>
          </div>
          <div className="col-span-3 min-w-0 xl:col-span-2">
            <div className="text-xs font-semibold uppercase text-slate-500">วันที่เกิดเหตุ</div>
            <div>{formatDateTime(incident.occurredAt)}</div>
          </div>
          <div className="col-span-3 min-w-0 xl:col-span-2">
            <div className="text-xs font-semibold uppercase text-slate-500">กำหนดส่ง RCA</div>
            <div>{formatDateTime(incident.rcaDueAt)}</div>
            {showRcaDueCountdown ? <div className="text-xs text-slate-500">{formatRcaDueCountdown(incident.rcaDueAt)}</div> : null}
          </div>
          <div className="col-span-6 min-w-0 xl:col-span-3">
            <div className="text-xs font-semibold uppercase text-slate-500">หน่วยงานที่เกิดเหตุ</div>
            <div className="break-words">{incident.incidentUnit.name}</div>
          </div>
          <div className="col-span-12 flex min-w-0 flex-wrap items-start gap-2 xl:col-span-5 xl:justify-end">
            <SeverityBadge severity={incident.severity} />
            <SentinelBadge value={incident.isSentinel} />
            <RmSupportBadge value={incident.needRmSupport} />
            <StatusBadge status={incident.status} />
          </div>
          <div className="col-span-12 min-w-0 xl:col-span-7">
            <div className="text-xs font-semibold uppercase text-slate-500">ชื่อเหตุการณ์</div>
            <div className="break-words font-medium text-blue-700 underline-offset-2 group-hover:underline [overflow-wrap:anywhere]">{incident.title}</div>
          </div>
          <div className="col-span-12 min-w-0 xl:col-span-5">
            <div className="text-xs font-semibold uppercase text-slate-500">NRLS code</div>
            <div className="break-words [overflow-wrap:anywhere]"><span className="font-semibold">{incident.riskCode.code}</span> - <span className="text-slate-600">{incident.riskCode.nameTh}</span></div>
          </div>
        </div>)}
      </div>
    </div>

    <Pagination basePath={basePath} searchParams={searchParams} page={page} total={total} pageSize={pageSize} />
  </div>;
}

function asString(value: string | string[] | undefined) {
  return typeof value === "string" ? value : "";
}

function asArray(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value.filter(Boolean);
  return typeof value === "string" && value ? [value] : [];
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
