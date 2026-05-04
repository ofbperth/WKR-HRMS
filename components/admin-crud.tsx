"use client";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RoleBadge, Badge } from "@/components/ui/badge";

type Mode = "users" | "units" | "risk-codes";
const roleOptions = ["Reporter", "UnitManager", "RMTeam", "Executive", "Admin"];
const cgOptions = ["Clinical", "General"];

export function AdminCrud({ mode }: { mode: Mode }) {
  const [items, setItems] = useState<any[]>([]); const [units, setUnits] = useState<any[]>([]); const [editing, setEditing] = useState<any | null>(null); const [loading, setLoading] = useState(true); const endpoint = `/api/admin/${mode}`;
  const title = useMemo(() => mode === "users" ? "จัดการผู้ใช้งาน" : mode === "units" ? "จัดการหน่วยงาน" : "จัดการ Risk codes", [mode]);
  async function load() { setLoading(true); const [a,b] = await Promise.all([fetch(endpoint).then(r=>r.json()), fetch("/api/admin/units").then(r=>r.json()).catch(()=>[])]); setItems(a); setUnits(b); setLoading(false); }
  useEffect(()=>{ load(); }, []);
  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); const fd = new FormData(e.currentTarget); const data: any = Object.fromEntries(fd.entries()); data.isActive = fd.get("isActive") === "on";
    if (editing?.id) data.id = editing.id;
    const res = await fetch(endpoint, { method: editing?.id ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    if (!res.ok) { alert("บันทึกไม่สำเร็จ ตรวจสอบข้อมูลซ้ำ/ข้อมูลไม่ครบ"); return; }
    setEditing(null); await load(); e.currentTarget.reset();
  }
  async function deactivate(id: string) { if (!confirm("ปิดใช้งานรายการนี้?")) return; await fetch(endpoint, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) }); await load(); }
  return <div className="space-y-6">
    <div><h1 className="text-2xl font-bold">{title}</h1><p className="text-sm text-muted-foreground">Admin CRUD เบื้องต้น พร้อม Audit log ทุก create/update/deactivate</p></div>
    <form onSubmit={save} className="rounded-xl border bg-white p-4 shadow-sm"><div className="grid gap-3 md:grid-cols-3">
      {mode === "users" && <>
        <Field label="ชื่อ"><Input name="name" defaultValue={editing?.name || ""} required /></Field>
        <Field label="Email"><Input name="email" type="email" defaultValue={editing?.email || ""} required /></Field>
        <Field label="Password"><Input name="password" type="password" placeholder={editing ? "เว้นว่างถ้าไม่เปลี่ยน" : "อย่างน้อย 6 ตัว"} /></Field>
        <Field label="Role"><select name="role" defaultValue={editing?.role || "Reporter"} className="h-10 rounded-md border px-3 text-sm">{roleOptions.map(r => <option key={r}>{r}</option>)}</select></Field>
        <Field label="Unit"><select name="unitId" defaultValue={editing?.unitId || ""} className="h-10 rounded-md border px-3 text-sm"><option value="">-</option>{units.map(u => <option value={u.id} key={u.id}>{u.name}</option>)}</select></Field>
      </>}
      {mode === "units" && <><Field label="ชื่อหน่วยงาน"><Input name="name" defaultValue={editing?.name || ""} required /></Field><Field label="ประเภท"><Input name="type" defaultValue={editing?.type || "หน่วยงาน"} required /></Field></>}
      {mode === "risk-codes" && <>
        <Field label="Code"><Input name="code" defaultValue={editing?.code || ""} required /></Field><Field label="ชื่อไทย"><Input name="nameTh" defaultValue={editing?.nameTh || ""} required /></Field><Field label="ชื่ออังกฤษ"><Input name="nameEn" defaultValue={editing?.nameEn || ""} /></Field>
        <Field label="Clinical/General"><select name="clinicalOrGeneral" defaultValue={editing?.clinicalOrGeneral || "Clinical"} className="h-10 rounded-md border px-3 text-sm">{cgOptions.map(r => <option key={r}>{r}</option>)}</select></Field><Field label="SIMPLE Category"><Input name="simpleCategory" defaultValue={editing?.simpleCategory || ""} required /></Field>
      </>}
      <label className="mt-6 flex items-center gap-2 text-sm"><input name="isActive" type="checkbox" defaultChecked={editing?.isActive ?? true} /> เปิดใช้งาน</label>
    </div><div className="mt-4 flex gap-2"><Button type="submit">{editing ? "บันทึกการแก้ไข" : "เพิ่มรายการ"}</Button>{editing && <button type="button" className="rounded-md border px-4 text-sm" onClick={()=>setEditing(null)}>ยกเลิก</button>}</div></form>
    <div className="overflow-hidden rounded-xl border bg-white shadow-sm"><table className="w-full text-sm"><thead className="bg-slate-50 text-left"><tr>{headers(mode).map(h=><th key={h} className="px-4 py-3 font-semibold">{h}</th>)}<th className="px-4 py-3">Action</th></tr></thead><tbody>{loading ? <tr><td className="p-4" colSpan={6}>Loading...</td></tr> : items.map(item => <tr key={item.id} className="border-t">{rowCells(mode, item).map((c,i)=><td key={i} className="px-4 py-3">{c}</td>)}<td className="space-x-2 px-4 py-3"><button className="rounded-md border px-3 py-1" onClick={()=>setEditing(item)}>แก้ไข</button><button className="rounded-md border px-3 py-1 text-red-600" onClick={()=>deactivate(item.id)}>ปิดใช้</button></td></tr>)}</tbody></table></div>
  </div>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="grid gap-1 text-sm font-medium">{label}{children}</label>; }
function headers(mode: Mode) { return mode === "users" ? ["ชื่อ", "Email", "Role", "Unit", "Status"] : mode === "units" ? ["ชื่อ", "ประเภท", "Status"] : ["Code", "ชื่อไทย", "ชื่ออังกฤษ", "กลุ่ม", "SIMPLE", "Status"]; }
function status(active: boolean) { return <Badge className={active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}>{active ? "Active" : "Inactive"}</Badge>; }
function rowCells(mode: Mode, item: any) { if (mode === "users") return [item.name, item.email, <RoleBadge key="r" role={item.role}/>, item.unit?.name || "-", status(item.isActive)]; if (mode === "units") return [item.name, item.type, status(item.isActive)]; return [item.code, item.nameTh, item.nameEn || "-", item.clinicalOrGeneral, item.simpleCategory, status(item.isActive)]; }
