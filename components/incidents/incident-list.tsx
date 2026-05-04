import Link from "next/link";
import type { Incident, RiskCode, Unit, User } from "@prisma/client";
import { formatDateOnly, formatDateTime, maskHn } from "@/lib/format";
import { RmSupportBadge, SentinelBadge, SeverityBadge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { incidentStatusValues, severityValues } from "@/lib/validators";

type IncidentRow = Incident & { incidentUnit: Unit; reporterUnit: Unit; riskCode: RiskCode; reportedBy: Pick<User, "id" | "name" | "email" | "role" | "unitId"> };

type Lookup = { units: Unit[]; riskCodes: RiskCode[]; simpleCategories: string[] };

export function IncidentList({ incidents, lookup, basePath, searchParams, canSeeSensitive = false }: { incidents: IncidentRow[]; lookup: Lookup; basePath: string; searchParams: Record<string, string | string[] | undefined>; canSeeSensitive?: boolean }) {
  const query = new URLSearchParams();
  Object.entries(searchParams).forEach(([k, v]) => { if (typeof v === "string" && v) query.set(k, v); });
  return <div className="space-y-4">
    <form className="grid gap-3 rounded-xl border bg-white p-4 md:grid-cols-4" action={basePath}>
      <input className="rounded-md border px-3 py-2 text-sm" type="date" name="from" defaultValue={asString(searchParams.from)} />
      <input className="rounded-md border px-3 py-2 text-sm" type="date" name="to" defaultValue={asString(searchParams.to)} />
      <select className="rounded-md border px-3 py-2 text-sm" name="unitId" defaultValue={asString(searchParams.unitId)}><option value="">ทุกหน่วยงาน</option>{lookup.units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select>
      <select className="rounded-md border px-3 py-2 text-sm" name="severity" defaultValue={asString(searchParams.severity)}><option value="">ทุก Severity</option>{severityValues.map(s => <option key={s} value={s}>{s}</option>)}</select>
      <select className="rounded-md border px-3 py-2 text-sm" name="simpleCategory" defaultValue={asString(searchParams.simpleCategory)}><option value="">ทุก SIMPLE</option>{lookup.simpleCategories.map(s => <option key={s} value={s}>{s}</option>)}</select>
      <select className="rounded-md border px-3 py-2 text-sm" name="riskCodeId" defaultValue={asString(searchParams.riskCodeId)}><option value="">ทุก Risk code</option>{lookup.riskCodes.map(r => <option key={r.id} value={r.id}>{r.code} - {r.nameTh}</option>)}</select>
      <select className="rounded-md border px-3 py-2 text-sm" name="status" defaultValue={asString(searchParams.status)}><option value="">ทุก Status</option>{incidentStatusValues.map(s => <option key={s} value={s}>{s}</option>)}</select>
      <select className="rounded-md border px-3 py-2 text-sm" name="sentinel" defaultValue={asString(searchParams.sentinel)}><option value="">Sentinel ทั้งหมด</option><option value="true">Sentinel</option><option value="false">ไม่ใช่ Sentinel</option></select>
      <select className="rounded-md border px-3 py-2 text-sm" name="needRmSupport" defaultValue={asString(searchParams.needRmSupport)}><option value="">RM support ทั้งหมด</option><option value="true">Need RM support</option><option value="false">ไม่ต้องการ</option></select>
      <input className="rounded-md border px-3 py-2 text-sm md:col-span-2" name="q" placeholder="Keyword / incident no / risk code" defaultValue={asString(searchParams.q)} />
      <div className="flex gap-2"><Button type="submit">Filter</Button><Link className="inline-flex h-10 items-center rounded-md border px-4 text-sm" href={basePath}>Clear</Link><a className="inline-flex h-10 items-center rounded-md border px-4 text-sm" href={`/api/incidents/export?${query.toString()}`}>Export CSV</a></div>
    </form>
    <div className="overflow-hidden rounded-xl border bg-white">
      <div className="overflow-auto">
        <table className="min-w-[1200px] w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Incident No</th><th className="px-4 py-3">วันที่เกิดเหตุ</th><th className="px-4 py-3">หน่วยงาน</th><th className="px-4 py-3">ชื่อเหตุการณ์</th><th className="px-4 py-3">Risk code</th><th className="px-4 py-3">Severity</th><th className="px-4 py-3">Badge</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Reporter</th><th className="px-4 py-3">HN</th><th className="px-4 py-3">Last updated</th><th className="px-4 py-3">Action</th></tr></thead>
          <tbody className="divide-y">{incidents.length === 0 ? <tr><td className="px-4 py-8 text-center text-slate-500" colSpan={12}>ไม่พบข้อมูล</td></tr> : incidents.map(i => <tr key={i.id} className="hover:bg-slate-50"><td className="px-4 py-3 font-semibold">{i.incidentNo}</td><td className="px-4 py-3">{formatDateOnly(i.occurredAt)}</td><td className="px-4 py-3">{i.incidentUnit.name}</td><td className="px-4 py-3"><div className="font-medium">{i.title}</div><div className="text-xs text-slate-500 line-clamp-1">{i.description}</div></td><td className="px-4 py-3"><span className="font-semibold">{i.riskCode.code}</span><div className="text-xs text-slate-500">{i.riskCode.nameTh}</div></td><td className="px-4 py-3"><SeverityBadge severity={i.severity} /></td><td className="space-x-1 px-4 py-3"><SentinelBadge value={i.isSentinel} /> <RmSupportBadge value={i.needRmSupport} /></td><td className="px-4 py-3"><StatusBadge status={i.status} /></td><td className="px-4 py-3">{i.reportedBy.name}</td><td className="px-4 py-3">{canSeeSensitive ? (i.patientHn || "-") : maskHn(i.patientHn)}</td><td className="px-4 py-3">{formatDateTime(i.updatedAt)}</td><td className="px-4 py-3"><Link className="rounded-md border px-3 py-2 text-xs hover:bg-slate-100" href={`${basePath}/${i.id}`}>View</Link></td></tr>)}</tbody>
        </table>
      </div>
    </div>
  </div>;
}

function asString(v: string | string[] | undefined) { return typeof v === "string" ? v : ""; }
