"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { actionPlanStatusValues, affectedTypes, clinicalOrGeneralValues, incidentStatusValues, medicationRightValues } from "@/lib/validators";
import { clinicalHighSeverity, severityOptionsFor } from "@/lib/severity";
import type { DbIncident, DbRiskCode, DbUnit, DbUser } from "@/lib/types";
import { actionPlanStatusDisplay, affectedTypeDisplay, roleDisplay } from "@/lib/i18n/th";
import { statusLabel } from "@/lib/format";

type UserOption = Pick<DbUser, "id" | "name" | "email" | "role" | "unitId">;

type EditableIncident = Pick<DbIncident, "id" | "occurredAt" | "incidentUnitId" | "location" | "affectedType" | "title" | "description" | "immediateAction" | "clinicalOrGeneral" | "simpleCategory" | "riskCodeId" | "severity" | "needRmSupport" | "medicationRight">;

export function IncidentDetailEditor({ incident, units, riskCodes }: { incident: EditableIncident; units: DbUnit[]; riskCodes: DbRiskCode[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const occurredDate = new Date(incident.occurredAt).toISOString().slice(0, 10);
  const occurredTime = new Date(incident.occurredAt).toTimeString().slice(0, 5);
  const [form, setForm] = useState({
    occurredDate,
    occurredTime,
    incidentUnitId: incident.incidentUnitId,
    location: incident.location ?? "",
    affectedType: incident.affectedType,
    title: incident.title,
    description: incident.description,
    immediateAction: incident.immediateAction ?? "",
    clinicalOrGeneral: incident.clinicalOrGeneral,
    simpleCategory: incident.simpleCategory,
    riskCodeId: incident.riskCodeId,
    severity: incident.severity,
    medicationRight: incident.medicationRight ?? "",
    needRmSupport: incident.needRmSupport,
  });
  const initialRisk = riskCodes.find(r => r.id === incident.riskCodeId);
  const [riskQuery, setRiskQuery] = useState(initialRisk ? `${initialRisk.code} ${initialRisk.nameTh}` : "");
  const severityOptions = severityOptionsFor(form.clinicalOrGeneral);
  const availableRiskCodes = useMemo(() => riskCodes.filter(r => r.clinicalOrGeneral === form.clinicalOrGeneral), [riskCodes, form.clinicalOrGeneral]);
  const filteredRiskCodes = useMemo(() => {
    const q = riskQuery.trim().toLowerCase();
    return availableRiskCodes
      .filter(r => !q || `${r.code} ${r.nameTh} ${r.nameEn ?? ""} ${r.simpleCategory}`.toLowerCase().includes(q))
      .slice(0, 80);
  }, [availableRiskCodes, riskQuery]);
  const selectedRisk = availableRiskCodes.find(r => r.id === form.riskCodeId);

  function updateClinicalOrGeneral(value: string) {
    const nextSeverity = (severityOptionsFor(value) as readonly string[]).includes(form.severity) ? form.severity : severityOptionsFor(value)[0];
    const nextRisk = riskCodes.find(r => r.clinicalOrGeneral === value);
    setForm({
      ...form,
      clinicalOrGeneral: value,
      severity: nextSeverity,
      riskCodeId: nextRisk?.id ?? "",
      simpleCategory: nextRisk?.simpleCategory ?? "",
      medicationRight: "",
    });
    setRiskQuery(nextRisk ? `${nextRisk.code} ${nextRisk.nameTh}` : "");
  }

  function selectRiskCode(risk: DbRiskCode) {
    setForm({
      ...form,
      clinicalOrGeneral: risk.clinicalOrGeneral,
      riskCodeId: risk.id,
      simpleCategory: risk.simpleCategory,
      medicationRight: risk.id === form.riskCodeId ? form.medicationRight : "",
    });
    setRiskQuery(`${risk.code} ${risk.nameTh}`);
  }

  async function save() {
    setSaving(true);
    const res = await fetch(`/api/incidents/${incident.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, medicationRight: form.medicationRight || null }) });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error || "บันทึกไม่สำเร็จ");
      return;
    }
    setEditing(false);
    router.refresh();
  }

  if (!editing) return <Button type="button" className="mt-1" onClick={() => setEditing(true)}>แก้ไข</Button>;

  return <div className="grid gap-3 rounded-lg border bg-white p-4 md:grid-cols-2">
    <label className="space-y-1 text-sm"><span className="font-medium">วันที่เกิดเหตุ</span><input type="date" className="h-10 w-full rounded-md border px-3" value={form.occurredDate} onChange={e => setForm({ ...form, occurredDate: e.target.value })} /></label>
    <label className="space-y-1 text-sm"><span className="font-medium">เวลาเกิดเหตุ</span><input type="time" className="h-10 w-full rounded-md border px-3" value={form.occurredTime} onChange={e => setForm({ ...form, occurredTime: e.target.value })} /></label>
    <label className="space-y-1 text-sm"><span className="font-medium">หน่วยงานที่เกิดเหตุ</span><select className="h-10 w-full rounded-md border bg-white px-3" value={form.incidentUnitId} onChange={e => setForm({ ...form, incidentUnitId: e.target.value })}>{units.map(unit => <option key={unit.id} value={unit.id}>{unit.name}</option>)}</select></label>
    <label className="space-y-1 text-sm"><span className="font-medium">สถานที่</span><input className="h-10 w-full rounded-md border px-3" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} /></label>
    <label className="space-y-1 text-sm"><span className="font-medium">ประเภทผู้ได้รับผลกระทบ</span><select className="h-10 w-full rounded-md border bg-white px-3" value={form.affectedType} onChange={e => setForm({ ...form, affectedType: e.target.value })}>{affectedTypes.map(type => <option key={type} value={type}>{affectedTypeDisplay(type)}</option>)}</select></label>
    <label className="space-y-1 text-sm"><span className="font-medium">กลุ่มเหตุการณ์</span><select className="h-10 w-full rounded-md border bg-white px-3" value={form.clinicalOrGeneral} onChange={e => updateClinicalOrGeneral(e.target.value)}>{clinicalOrGeneralValues.map(type => <option key={type} value={type}>{type === "Clinical" ? "เกี่ยวกับการดูแลรักษาผู้ป่วย" : "ทั่วไป / ระบบงาน / สิ่งแวดล้อม"}</option>)}</select></label>
    <label className="space-y-1 text-sm md:col-span-2"><span className="font-medium">ชื่อเหตุการณ์</span><input className="h-10 w-full rounded-md border px-3" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></label>
    <label className="space-y-1 text-sm md:col-span-2"><span className="font-medium">รายละเอียด</span><textarea className="min-h-28 w-full rounded-md border px-3 py-2" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></label>
    <label className="space-y-1 text-sm md:col-span-2"><span className="font-medium">การแก้ไขเบื้องต้น</span><textarea className="min-h-20 w-full rounded-md border px-3 py-2" value={form.immediateAction} onChange={e => setForm({ ...form, immediateAction: e.target.value })} /></label>
    <div className="space-y-2 text-sm md:col-span-2">
      <label className="space-y-1 font-medium"><span>NRLS code</span><input className="h-10 w-full rounded-md border px-3" value={riskQuery} onChange={e => setRiskQuery(e.target.value)} placeholder="ค้นหารหัส NRLS / ชื่อเหตุการณ์ / หมวด SIMPLE" /></label>
      <p className="text-xs leading-5 text-slate-500">หมวด SIMPLE ถูกกำหนดจาก NRLS code โดยอัตโนมัติ ไม่ให้แก้เองเพื่อป้องกันข้อมูลคลาดเคลื่อน</p>
      <div className="max-h-60 overflow-auto rounded-lg border bg-white">
        {filteredRiskCodes.length ? filteredRiskCodes.map(r => <button type="button" key={r.id} onClick={() => selectRiskCode(r)} className={`block w-full border-b px-3 py-2 text-left text-sm hover:bg-slate-50 ${form.riskCodeId === r.id ? "bg-blue-50" : ""}`}><span className="font-semibold">{r.code}</span> {r.nameTh}<span className="ml-2 text-xs text-slate-500">{r.clinicalOrGeneral === "Clinical" ? "ดูแลรักษาผู้ป่วย" : "ทั่วไป"} · SIMPLE {r.simpleCategory}</span>{form.riskCodeId === r.id ? <span className="ml-2 rounded-full bg-blue-600 px-2 py-0.5 text-[10px] text-white">เลือกแล้ว</span> : null}</button>) : <div className="px-3 py-4 text-sm text-slate-500">ไม่พบ NRLS code ในกลุ่มนี้</div>}
      </div>
    </div>
    <label className="space-y-1 text-sm"><span className="font-medium">หมวด SIMPLE จาก NRLS code</span><input className="h-10 w-full rounded-md border bg-slate-50 px-3 text-slate-700" value={selectedRisk?.simpleCategory ?? form.simpleCategory} readOnly /></label>
    <label className="space-y-1 text-sm"><span className="font-medium">ระดับความรุนแรง</span><select className="h-10 w-full rounded-md border bg-white px-3" value={form.severity} onChange={e => setForm({ ...form, severity: e.target.value })}>{severityOptions.map(severity => <option key={severity} value={severity}>{severity}</option>)}</select></label>
    {selectedRisk?.code === "CPM205" || /Administration/i.test(selectedRisk?.nameTh ?? "") ? <label className="space-y-1 text-sm"><span className="font-medium">ความถูกต้องในการบริหารยา 6 Rights</span><select className="h-10 w-full rounded-md border bg-white px-3" value={form.medicationRight} onChange={e => setForm({ ...form, medicationRight: e.target.value })}><option value="">-</option>{medicationRightValues.map(right => <option key={right} value={right}>{right}</option>)}</select></label> : null}
    <label className="!flex !w-fit items-center gap-2 text-sm md:col-span-2"><input type="checkbox" checked={form.needRmSupport} onChange={e => setForm({ ...form, needRmSupport: e.target.checked })} /> ต้องการ RM support</label>
    <div className="flex flex-wrap gap-2 md:col-span-2"><Button type="button" onClick={save} disabled={saving}>{saving ? "กำลังบันทึก..." : "บันทึกรายละเอียด"}</Button><Button type="button" className="bg-slate-700" onClick={() => setEditing(false)} disabled={saving}>ยกเลิก</Button></div>
  </div>;
}

export function IncidentClassificationEditor({ incident, riskCodes }: { incident: { id: string; severity: string; status: string; riskCodeId: string; simpleCategory: string; isSentinel: boolean; needRmSupport: boolean; clinicalOrGeneral: string }; riskCodes: DbRiskCode[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ severity: incident.severity, status: incident.status, riskCodeId: incident.riskCodeId, simpleCategory: incident.simpleCategory, isSentinel: incident.isSentinel, needRmSupport: incident.needRmSupport });
  const severityOptions = severityOptionsFor(incident.clinicalOrGeneral);
  const availableRiskCodes = riskCodes.filter(r => r.clinicalOrGeneral === incident.clinicalOrGeneral);
  const selected = availableRiskCodes.find(r => r.id === form.riskCodeId);
  async function save() {
    setSaving(true);
    const res = await fetch(`/api/incidents/${incident.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setSaving(false);
    if (!res.ok) alert("บันทึกไม่สำเร็จ"); else { setEditing(false); router.refresh(); }
  }
  if (!editing) return <div className="rounded-lg border bg-white p-4">
    <div className="grid gap-3 text-sm md:grid-cols-3">
      <div><div className="text-slate-500">ระดับความรุนแรง</div><div className="font-semibold">{incident.severity}</div></div>
      <div><div className="text-slate-500">สถานะ</div><div className="font-semibold">{statusLabel(incident.status)}</div></div>
      <div><div className="text-slate-500">Sentinel / RM support</div><div className="font-semibold">{incident.isSentinel ? "Sentinel" : "ไม่ใช่ Sentinel"} / {incident.needRmSupport ? "ต้องการ support" : "ไม่ต้องการ support"}</div></div>
    </div>
    <Button type="button" className="mt-3" onClick={() => setEditing(true)}>แก้ไขการจัดประเภทโดย RM</Button>
  </div>;
  return <div className="grid gap-3 rounded-lg border bg-white p-4 md:grid-cols-2">
    <label className="space-y-1 text-sm"><span className="font-medium">ระดับความรุนแรง</span><select className="h-10 w-full rounded-md border px-3" value={form.severity} onChange={e => setForm({ ...form, severity: e.target.value })}>{severityOptions.map(s => <option key={s} value={s}>{s}</option>)}</select></label>
    <label className="space-y-1 text-sm"><span className="font-medium">สถานะ</span><select className="h-10 w-full rounded-md border px-3" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>{incidentStatusValues.map(s => <option key={s} value={s}>{statusLabel(s)}</option>)}</select></label>
    <label className="space-y-1 text-sm md:col-span-2"><span className="font-medium">NRLS code</span><select className="h-10 w-full rounded-md border px-3" value={form.riskCodeId} onChange={e => { const risk = availableRiskCodes.find(r => r.id === e.target.value); setForm({ ...form, riskCodeId: e.target.value, simpleCategory: risk?.simpleCategory ?? form.simpleCategory }); }}>{availableRiskCodes.map(r => <option key={r.id} value={r.id}>{r.code} - {r.nameTh}</option>)}</select></label>
    <label className="space-y-1 text-sm"><span className="font-medium">หมวด SIMPLE จาก NRLS code</span><input className="h-10 w-full rounded-md border bg-slate-50 px-3 text-slate-700" value={selected?.simpleCategory ?? form.simpleCategory} readOnly /></label>
    <div className="flex flex-wrap items-center gap-4 text-sm"><label className="flex items-center gap-2"><input type="checkbox" checked={form.isSentinel} onChange={e => setForm({ ...form, isSentinel: e.target.checked })} /> Sentinel</label><label className="flex items-center gap-2"><input type="checkbox" checked={form.needRmSupport} onChange={e => setForm({ ...form, needRmSupport: e.target.checked })} /> ต้องการ RM support</label></div>
    <div className="md:col-span-2 flex flex-wrap items-center gap-2"><Button type="button" onClick={save} disabled={saving}>{saving ? "กำลังบันทึก..." : "บันทึกการจัดประเภท"}</Button><Button type="button" className="bg-slate-700" onClick={() => setEditing(false)} disabled={saving}>ยกเลิก</Button>{selected ? <span className="ml-3 text-xs text-slate-500">เลือกแล้ว: {selected.code}</span> : null}</div>
  </div>;
}

export function TriageClassificationForm({ incident, riskCodes, backHref }: { incident: { id: string; severity: string; riskCodeId: string; simpleCategory: string; isSentinel: boolean; needRmSupport: boolean; clinicalOrGeneral: string }; riskCodes: DbRiskCode[]; backHref: string }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const severityOptions = severityOptionsFor(incident.clinicalOrGeneral);
  const [form, setForm] = useState({ severity: incident.severity, riskCodeId: incident.riskCodeId, simpleCategory: incident.simpleCategory, isSentinel: incident.isSentinel, needRmSupport: incident.needRmSupport, requireRca: (clinicalHighSeverity as readonly string[]).includes(incident.severity) });
  const mustRca = (clinicalHighSeverity as readonly string[]).includes(form.severity);
  const availableRiskCodes = riskCodes.filter(r => r.clinicalOrGeneral === incident.clinicalOrGeneral);
  const selected = availableRiskCodes.find(r => r.id === form.riskCodeId);

  async function submit() {
    setSaving(true);
    const res = await fetch(`/api/incidents/${incident.id}/triage`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, requireRca: mustRca || form.requireRca }) });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error || "ส่ง Triage ไม่สำเร็จ");
      return;
    }
    router.push(backHref);
    router.refresh();
  }

  async function rejectIncident() {
    const ok = window.confirm("ยืนยันไม่รับรายงานนี้?\n\nข้อมูล incident และข้อมูลที่เกี่ยวข้องจะถูกลบจากระบบ ไม่สามารถกู้คืนจากหน้าจอได้");
    if (!ok) return;
    setSaving(true);
    const res = await fetch(`/api/incidents/${incident.id}`, { method: "DELETE" });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error || "ไม่รับรายงานไม่สำเร็จ");
      return;
    }
    router.push(backHref);
    router.refresh();
  }

  return <div className="grid gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 md:grid-cols-2">
    <div className="md:col-span-2"><div className="text-lg font-semibold">ตรวจคัดกรองและจัดประเภท</div><p className="text-sm text-slate-600">เมื่อส่งแล้วเคสจะออกจากคิว Triage และไปต่อหน้า Review RCA ถ้าต้องทำ RCA</p></div>
    <label className="space-y-1 text-sm"><span className="font-medium">ระดับความรุนแรง</span><select className="h-10 w-full rounded-md border bg-white px-3" value={form.severity} onChange={e => setForm({ ...form, severity: e.target.value, requireRca: (clinicalHighSeverity as readonly string[]).includes(e.target.value) || form.requireRca, isSentinel: ["G", "H", "I"].includes(e.target.value) || form.isSentinel })}>{severityOptions.map(s => <option key={s} value={s}>{s}</option>)}</select></label>
    <label className="space-y-1 text-sm"><span className="font-medium">ต้องทำ RCA หรือไม่</span><select className="h-10 w-full rounded-md border bg-white px-3" value={mustRca ? "yes" : form.requireRca ? "yes" : "no"} disabled={mustRca} onChange={e => setForm({ ...form, requireRca: e.target.value === "yes" })}><option value="yes">ต้องทำ RCA</option><option value="no">ไม่ต้องทำ RCA</option></select>{mustRca ? <p className="text-xs text-red-700">ระดับ E-I บังคับทำ RCA ทุก incident</p> : null}</label>
    <label className="space-y-1 text-sm md:col-span-2"><span className="font-medium">NRLS code</span><select className="h-10 w-full rounded-md border bg-white px-3" value={form.riskCodeId} onChange={e => { const risk = availableRiskCodes.find(r => r.id === e.target.value); setForm({ ...form, riskCodeId: e.target.value, simpleCategory: risk?.simpleCategory ?? form.simpleCategory }); }}>{availableRiskCodes.map(r => <option key={r.id} value={r.id}>{r.code} - {r.nameTh}</option>)}</select></label>
    <label className="space-y-1 text-sm"><span className="font-medium">หมวด SIMPLE จาก NRLS code</span><input className="h-10 w-full rounded-md border bg-slate-50 px-3 text-slate-700" value={selected?.simpleCategory ?? form.simpleCategory} readOnly /></label>
    <div className="flex flex-wrap items-center gap-4 text-sm"><label className="flex items-center gap-2"><input type="checkbox" checked={form.isSentinel} onChange={e => setForm({ ...form, isSentinel: e.target.checked })} /> Sentinel</label><label className="flex items-center gap-2"><input type="checkbox" checked={form.needRmSupport} onChange={e => setForm({ ...form, needRmSupport: e.target.checked })} /> ต้องการ RM support</label></div>
    <div className="md:col-span-2 flex flex-wrap items-center gap-2"><Button type="button" onClick={submit} disabled={saving}>{saving ? "กำลังส่ง..." : "ส่งผลการคัดกรอง"}</Button><Button type="button" className="bg-red-700" onClick={rejectIncident} disabled={saving}>ไม่รับรายงานนี้</Button>{selected ? <span className="text-xs text-slate-600">เลือกแล้ว: {selected.code}</span> : null}</div>
  </div>;
}

export function AddCommentForm({ incidentId }: { incidentId: string }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  async function submit() {
    if (!message.trim()) return;
    setSaving(true);
    const res = await fetch(`/api/incidents/${incidentId}/comments`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message }) });
    setSaving(false);
    if (!res.ok) alert("เพิ่ม comment ไม่สำเร็จ"); else { setMessage(""); router.refresh(); }
  }
  return <div className="space-y-2 rounded-lg border bg-white p-4"><textarea className="min-h-24 w-full rounded-md border px-3 py-2 text-sm" value={message} onChange={e => setMessage(e.target.value)} placeholder="เพิ่ม RM comment / note" /><Button type="button" onClick={submit} disabled={saving}>{saving ? "กำลังบันทึก..." : "เพิ่ม comment"}</Button></div>;
}

type RcaValue = {
  problemStatement: string | null;
  timeline: string | null;
  contributingHuman: string | null;
  contributingProcess: string | null;
  contributingEquipment: string | null;
  contributingEnvironment: string | null;
  contributingCommunication: string | null;
  contributingIT: string | null;
  rootCause: string | null;
  preventiveAction: string | null;
  kpi: string | null;
  kpiOwnerId: string | null;
  needRmSupport: boolean;
  status?: string;
} | null | undefined;

export function RcaForm({ incidentId, rca, users }: { incidentId: string; rca: RcaValue; users: UserOption[] }) {
  const router = useRouter();
  const locked = rca ? ["Submitted", "Approved"].includes(rca.status ?? "") : false;
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    problemStatement: rca?.problemStatement ?? "",
    timeline: rca?.timeline ?? "",
    contributingHuman: rca?.contributingHuman ?? "",
    contributingProcess: rca?.contributingProcess ?? "",
    contributingEquipment: rca?.contributingEquipment ?? "",
    contributingEnvironment: rca?.contributingEnvironment ?? "",
    contributingCommunication: rca?.contributingCommunication ?? "",
    contributingIT: rca?.contributingIT ?? "",
    rootCause: rca?.rootCause ?? "",
    preventiveAction: rca?.preventiveAction ?? "",
    kpi: rca?.kpi ?? "",
    kpiOwnerId: rca?.kpiOwnerId ?? "",
    needRmSupport: rca?.needRmSupport ?? false,
  });
  async function save(submit: boolean) {
    setSaving(true);
    const res = await fetch(`/api/incidents/${incidentId}/rca`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, submit }) });
    setSaving(false);
    if (!res.ok) alert("บันทึก RCA ไม่สำเร็จ"); else router.refresh();
  }
  if (locked) return <div className="rounded-lg border bg-slate-50 p-3 text-sm text-slate-600">ส่งหรืออนุมัติ RCA แล้ว ระบบล็อกไม่ให้แก้ไข หากต้องแก้ไขให้ทีม RM ขอปรับปรุงก่อน</div>;
  return <div className="grid gap-3 rounded-lg border bg-white p-3">
    <TextArea label="ปัญหาที่พบ" value={form.problemStatement} onChange={value => setForm({ ...form, problemStatement: value })} />
    <TextArea label="ลำดับเหตุการณ์" value={form.timeline} onChange={value => setForm({ ...form, timeline: value })} />
    <TextArea label="สาเหตุราก" value={form.rootCause} onChange={value => setForm({ ...form, rootCause: value })} />
    <TextArea label="แนวทางป้องกันซ้ำ" value={form.preventiveAction} onChange={value => setForm({ ...form, preventiveAction: value })} />
    <div className="grid gap-3 md:grid-cols-2">
      <TextArea label="บุคลากร" value={form.contributingHuman} onChange={value => setForm({ ...form, contributingHuman: value })} compact />
      <TextArea label="กระบวนการ" value={form.contributingProcess} onChange={value => setForm({ ...form, contributingProcess: value })} compact />
      <TextArea label="เครื่องมือ/อุปกรณ์" value={form.contributingEquipment} onChange={value => setForm({ ...form, contributingEquipment: value })} compact />
      <TextArea label="สภาพแวดล้อม" value={form.contributingEnvironment} onChange={value => setForm({ ...form, contributingEnvironment: value })} compact />
      <TextArea label="การสื่อสาร" value={form.contributingCommunication} onChange={value => setForm({ ...form, contributingCommunication: value })} compact />
      <TextArea label="IT" value={form.contributingIT} onChange={value => setForm({ ...form, contributingIT: value })} compact />
    </div>
    <label className="space-y-1 text-sm"><span className="font-medium">KPI</span><input className="h-10 w-full rounded-md border px-3" value={form.kpi} onChange={e => setForm({ ...form, kpi: e.target.value })} /></label>
    <label className="space-y-1 text-sm"><span className="font-medium">ผู้รับผิดชอบ KPI</span><select className="h-10 w-full rounded-md border px-3" value={form.kpiOwnerId} onChange={e => setForm({ ...form, kpiOwnerId: e.target.value })}><option value="">-</option>{users.map(u => <option key={u.id} value={u.id}>{u.name} ({roleDisplay(u.role)})</option>)}</select></label>
    <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.needRmSupport} onChange={e => setForm({ ...form, needRmSupport: e.target.checked })} /> ต้องการ RM support</label>
    <div className="flex flex-wrap gap-2"><Button type="button" className="bg-slate-700" onClick={() => save(false)} disabled={saving}>{saving ? "กำลังบันทึก..." : "บันทึกร่าง"}</Button><Button type="button" onClick={() => save(true)} disabled={saving}>{saving ? "กำลังส่ง..." : "ส่ง RCA"}</Button></div>
  </div>;
}

export function RcaApprovalForm({ incidentId }: { incidentId: string }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  async function decide(approved: boolean) {
    setSaving(true);
    const res = await fetch(`/api/incidents/${incidentId}/rca/approve`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ approved }) });
    setSaving(false);
    if (!res.ok) alert("อนุมัติ RCA ไม่สำเร็จ"); else router.refresh();
  }
  return <div className="flex flex-wrap gap-2 rounded-lg border bg-white p-3"><Button type="button" onClick={() => decide(true)} disabled={saving}>อนุมัติ RCA</Button><Button type="button" className="bg-slate-700" onClick={() => decide(false)} disabled={saving}>ขอปรับปรุง</Button></div>;
}

export function CloseIncidentButton({ incidentId }: { incidentId: string }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  async function closeIncident() {
    const ok = window.confirm("Close this incident?");
    if (!ok) return;
    setSaving(true);
    const res = await fetch(`/api/incidents/${incidentId}/close`, { method: "POST" });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error || "Close incident failed");
      return;
    }
    router.refresh();
  }
  return <Button type="button" className="bg-emerald-700 hover:bg-emerald-800" onClick={closeIncident} disabled={saving}>{saving ? "Closing..." : "Close incident"}</Button>;
}

export function ActionPlanForm({ incidentId, users }: { incidentId: string; users: UserOption[] }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", ownerId: "", coOwnerText: "", dueDate: new Date().toISOString().slice(0, 10), kpiName: "", kpiTarget: "" });
  async function submit() {
    setSaving(true);
    const res = await fetch(`/api/incidents/${incidentId}/actions`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setSaving(false);
    if (!res.ok) alert("สร้าง Action ไม่สำเร็จ"); else router.refresh();
  }
  return <div className="grid gap-3 rounded-lg border bg-white p-3">
    <label className="space-y-1 text-sm"><span className="font-medium">ชื่อแผนการแก้ไข</span><input className="h-10 w-full rounded-md border px-3" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></label>
    <TextArea label="รายละเอียด" value={form.description} onChange={value => setForm({ ...form, description: value })} />
    <div className="grid gap-3 md:grid-cols-2">
      <label className="space-y-1 text-sm"><span className="font-medium">ผู้รับผิดชอบ</span><select className="h-10 w-full rounded-md border px-3" value={form.ownerId} onChange={e => setForm({ ...form, ownerId: e.target.value })}><option value="">เลือกผู้รับผิดชอบ</option>{users.map(u => <option key={u.id} value={u.id}>{u.name} ({roleDisplay(u.role)})</option>)}</select></label>
      <label className="space-y-1 text-sm"><span className="font-medium">กำหนดส่ง</span><input type="date" className="h-10 w-full rounded-md border px-3" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} /></label>
    </div>
    <div className="grid gap-3 md:grid-cols-2"><label className="space-y-1 text-sm"><span className="font-medium">ชื่อ KPI</span><input className="h-10 w-full rounded-md border px-3" value={form.kpiName} onChange={e => setForm({ ...form, kpiName: e.target.value })} /></label><label className="space-y-1 text-sm"><span className="font-medium">เป้าหมาย KPI</span><input className="h-10 w-full rounded-md border px-3" value={form.kpiTarget} onChange={e => setForm({ ...form, kpiTarget: e.target.value })} /></label></div>
    <Button type="button" onClick={submit} disabled={saving}>{saving ? "กำลังสร้าง..." : "สร้างแผนการแก้ไข"}</Button>
  </div>;
}

export function ActionUpdateForm({ action, canVerify, users = [], canReassignOwner = false }: { action: { id: string; status: string; ownerId?: string | null; evidenceText: string | null; evidenceUrl: string | null; kpiResult: string | null; effectivenessReview: string | null }; canVerify: boolean; users?: UserOption[]; canReassignOwner?: boolean }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ ownerId: action.ownerId ?? "", status: action.status, evidenceText: action.evidenceText ?? "", evidenceUrl: action.evidenceUrl ?? "", kpiResult: action.kpiResult ?? "", effectivenessReview: action.effectivenessReview ?? "" });
  async function save() {
    setSaving(true);
    const res = await fetch(`/api/actions/${action.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setSaving(false);
    if (!res.ok) alert("อัปเดต Action ไม่สำเร็จ"); else router.refresh();
  }
  async function verify(verified: boolean) {
    setSaving(true);
    const res = await fetch(`/api/actions/${action.id}/verify`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ verified, effectivenessReview: form.effectivenessReview }) });
    setSaving(false);
    if (!res.ok) alert("Verification ไม่สำเร็จ"); else router.refresh();
  }
  return <div className="grid gap-2 rounded-md bg-slate-50 p-3">
    {canReassignOwner ? <label className="space-y-1 text-xs"><span className="font-medium">ผู้รับผิดชอบ</span><select className="h-9 w-full rounded-md border px-2" value={form.ownerId} onChange={e => setForm({ ...form, ownerId: e.target.value })}><option value="">รอหัวหน้าหน่วยงานมอบหมายใหม่</option>{users.map(u => <option key={u.id} value={u.id}>{u.name} ({roleDisplay(u.role)})</option>)}</select></label> : null}
    <label className="space-y-1 text-xs"><span className="font-medium">สถานะ</span><select className="h-9 w-full rounded-md border px-2" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>{actionPlanStatusValues.filter(s => s !== "Verified").map(s => <option key={s} value={s}>{actionPlanStatusDisplay(s)}</option>)}</select></label>
    <TextArea label="หลักฐาน" value={form.evidenceText} onChange={value => setForm({ ...form, evidenceText: value })} compact />
    <label className="space-y-1 text-xs"><span className="font-medium">ลิงก์หลักฐาน</span><input className="h-9 w-full rounded-md border px-2" value={form.evidenceUrl} onChange={e => setForm({ ...form, evidenceUrl: e.target.value })} /></label>
    <TextArea label="ผลลัพธ์ KPI" value={form.kpiResult} onChange={value => setForm({ ...form, kpiResult: value })} compact />
    <TextArea label="ทบทวนประสิทธิผล" value={form.effectivenessReview} onChange={value => setForm({ ...form, effectivenessReview: value })} compact />
    <div className="flex flex-wrap gap-2"><Button type="button" className="bg-slate-700" onClick={save} disabled={saving}>{saving ? "กำลังบันทึก..." : "อัปเดตแผนการแก้ไข"}</Button>{canVerify ? <><Button type="button" onClick={() => verify(true)} disabled={saving}>ตรวจสอบแล้ว</Button><Button type="button" className="bg-slate-700" onClick={() => verify(false)} disabled={saving}>ส่งกลับ</Button></> : null}</div>
  </div>;
}

function TextArea({ label, value, onChange, compact = false }: { label: string; value: string; onChange: (value: string) => void; compact?: boolean }) {
  return <label className={`space-y-1 ${compact ? "text-xs" : "text-sm"}`}><span className="font-medium">{label}</span><textarea className={`${compact ? "min-h-16" : "min-h-24"} w-full rounded-md border px-3 py-2 text-sm`} value={value} onChange={e => onChange(e.target.value)} /></label>;
}
