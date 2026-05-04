"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { RiskCode } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { incidentStatusValues, severityValues } from "@/lib/validators";

export function IncidentClassificationEditor({ incident, riskCodes }: { incident: { id: string; severity: string; status: string; riskCodeId: string; simpleCategory: string; isSentinel: boolean; needRmSupport: boolean }; riskCodes: RiskCode[] }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ severity: incident.severity, status: incident.status, riskCodeId: incident.riskCodeId, simpleCategory: incident.simpleCategory, isSentinel: incident.isSentinel, needRmSupport: incident.needRmSupport });
  const selected = riskCodes.find(r => r.id === form.riskCodeId);
  async function save() {
    setSaving(true);
    const res = await fetch(`/api/incidents/${incident.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setSaving(false);
    if (!res.ok) alert("Save ไม่สำเร็จ"); else router.refresh();
  }
  return <div className="grid gap-3 rounded-xl border bg-white p-4 md:grid-cols-2">
    <label className="space-y-1 text-sm"><span className="font-medium">Severity</span><select className="h-10 w-full rounded-md border px-3" value={form.severity} onChange={e => setForm({ ...form, severity: e.target.value })}>{severityValues.map(s => <option key={s} value={s}>{s}</option>)}</select></label>
    <label className="space-y-1 text-sm"><span className="font-medium">Status</span><select className="h-10 w-full rounded-md border px-3" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>{incidentStatusValues.map(s => <option key={s} value={s}>{s}</option>)}</select></label>
    <label className="space-y-1 text-sm md:col-span-2"><span className="font-medium">Risk code</span><select className="h-10 w-full rounded-md border px-3" value={form.riskCodeId} onChange={e => { const risk = riskCodes.find(r => r.id === e.target.value); setForm({ ...form, riskCodeId: e.target.value, simpleCategory: risk?.simpleCategory ?? form.simpleCategory }); }}>{riskCodes.map(r => <option key={r.id} value={r.id}>{r.code} - {r.nameTh}</option>)}</select></label>
    <label className="space-y-1 text-sm"><span className="font-medium">SIMPLE category</span><input className="h-10 w-full rounded-md border px-3" value={form.simpleCategory} onChange={e => setForm({ ...form, simpleCategory: e.target.value })} /></label>
    <div className="flex items-center gap-4 text-sm"><label className="flex items-center gap-2"><input type="checkbox" checked={form.isSentinel} onChange={e => setForm({ ...form, isSentinel: e.target.checked })} /> Sentinel</label><label className="flex items-center gap-2"><input type="checkbox" checked={form.needRmSupport} onChange={e => setForm({ ...form, needRmSupport: e.target.checked })} /> Need RM support</label></div>
    <div className="md:col-span-2"><Button type="button" onClick={save} disabled={saving}>{saving ? "กำลังบันทึก..." : "Save classification"}</Button>{selected ? <span className="ml-3 text-xs text-slate-500">Selected: {selected.code}</span> : null}</div>
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
  return <div className="space-y-2 rounded-xl border bg-white p-4"><textarea className="min-h-24 w-full rounded-md border px-3 py-2 text-sm" value={message} onChange={e => setMessage(e.target.value)} placeholder="เพิ่ม comment / note จาก RM" /><Button type="button" onClick={submit} disabled={saving}>{saving ? "กำลังบันทึก..." : "Add comment"}</Button></div>;
}
