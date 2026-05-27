"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge, RoleBadge } from "@/components/ui/badge";
import { clinicalOrGeneralDisplay, roleDisplay } from "@/lib/i18n/th";

type Mode = "users" | "units" | "risk-codes";
const roleOptions = ["Reporter", "UnitManager", "RMTeam", "Executive", "Admin"];
const authProviderOptions = ["CREDENTIALS", "GOOGLE", "BOTH"];
const cgOptions = ["Clinical", "General"];
const unitTypeOptions = ["หน่วยงาน", "ทีม"];
const protectedAdminEmail = "ofbperth@gmail.com";
const userPageSize = 10;
type PageMeta = { page: number; pageSize: number; total: number; totalPages: number; hasNextPage?: boolean };

export function AdminCrud({ mode }: { mode: Mode }) {
  const [items, setItems] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [editing, setEditing] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [authFilter, setAuthFilter] = useState("");
  const [emailSearch, setEmailSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [meta, setMeta] = useState<PageMeta>({ page: 1, pageSize: userPageSize, total: 0, totalPages: 1 });
  const endpoint = `/api/admin/${mode}`;
  const title = useMemo(() => mode === "users" ? "จัดการผู้ใช้" : mode === "units" ? "จัดการหน่วยงาน" : "จัดการรหัสความเสี่ยง", [mode]);

  const load = useCallback(async () => {
    setLoading(true);
    const query = new URLSearchParams({ page: String(currentPage), pageSize: String(userPageSize) });
    if (mode === "users" && authFilter) query.set("authProvider", authFilter);
    if (mode === "users" && emailSearch.trim()) query.set("email", emailSearch.trim());
    const [data, unitData] = await Promise.all([
      fetch(`${endpoint}?${query.toString()}`).then(r => r.json()),
      fetch("/api/admin/units?all=1").then(r => r.json()).catch(() => []),
    ]);
    const nextItems = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
    const nextMeta = data?.meta && typeof data.meta.total === "number" ? data.meta : { page: currentPage, pageSize: userPageSize, total: nextItems.length, totalPages: 1 };
    setItems(nextItems);
    setMeta(nextMeta);
    setUnits(Array.isArray(unitData) ? unitData : []);
    setLoading(false);
  }, [endpoint, currentPage, authFilter, emailSearch, mode]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setCurrentPage(1); }, [authFilter, emailSearch, mode]);
  useEffect(() => {
    if (!loading && currentPage > meta.totalPages) setCurrentPage(meta.totalPages || 1);
  }, [currentPage, loading, meta.totalPages]);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
    const data: any = Object.fromEntries(fd.entries());
    data.isActive = fd.get("isActive") === "on";
    if (editing?.id) data.id = editing.id;
    const res = await fetch(endpoint, { method: editing?.id ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    if (!res.ok) {
      alert("บันทึกไม่สำเร็จ กรุณาตรวจข้อมูลซ้ำหรือข้อมูลที่ยังไม่ครบ");
      return;
    }
    setEditing(null);
    await load();
  }

  async function deactivate(id: string) {
    if (!confirm("ปิดใช้งานรายการนี้?")) return;
    const res = await fetch(endpoint, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    if (!res.ok) {
      const json = await res.json().catch(() => null);
      alert(deleteErrorMessage(json?.error));
      return;
    }
    setEditing(null);
    await load();
  }

  async function hardDeleteUser(id: string, email: string) {
    if (!confirm(`ลบผู้ใช้ ${email} แบบถาวร?\n\nการลบนี้ย้อนกลับไม่ได้ ถ้ามีรายงานเดิม ระบบจะเก็บชื่อไว้เป็นประวัติผู้รายงาน และแผนการแก้ไขที่เคยรับผิดชอบจะรอหัวหน้าหน่วยงานมอบหมายคนใหม่`)) return;
    const res = await fetch("/api/admin/users", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, hardDelete: true }) });
    if (!res.ok) {
      const json = await res.json().catch(() => null);
      alert(deleteErrorMessage(json?.error));
      return;
    }
    setEditing(null);
    await load();
  }

  async function unlinkGoogle(id: string) {
    if (!confirm("ยกเลิกการเชื่อมบัญชี Google?")) return;
    await fetch(endpoint, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, action: "UNLINK_GOOGLE" }) });
    await load();
  }

  const totalPages = meta.totalPages || 1;
  const safeCurrentPage = meta.page || currentPage;
  const pagedItems = items;
  const formEditing = mode === "users" ? null : editing;

  return <div className="space-y-6">
    <div><h1 className="text-2xl font-bold">{title}</h1><p className="text-sm text-muted-foreground">สร้าง แก้ไข ปิดใช้งาน และตรวจสอบประวัติข้อมูลผู้ดูแลระบบ</p></div>
    <form key={formEditing?.id ?? `new-${mode}`} onSubmit={save} className="rounded-lg border bg-white p-4 shadow-sm"><div className="grid gap-3 md:grid-cols-3">
      {mode === "users" && <>
        <Field label="ชื่อ"><Input name="name" required /></Field>
        <Field label="อีเมล"><Input name="email" type="email" required /></Field>
        <Field label="รหัสผ่าน"><Input name="password" type="password" placeholder="จำเป็น ยกเว้นบัญชี Google-only" /></Field>
        <Field label="บทบาท"><select name="role" defaultValue="Reporter" className="h-10 rounded-md border px-3 text-sm">{roleOptions.map(r => <option key={r} value={r}>{roleDisplay(r)}</option>)}</select></Field>
        <Field label="หน่วยงาน"><select name="unitId" defaultValue="" className="h-10 rounded-md border px-3 text-sm"><option value="">-</option>{units.map(u => <option value={u.id} key={u.id}>{u.name}</option>)}</select></Field>
        <Field label="วิธีเข้าสู่ระบบ"><select name="authProvider" defaultValue="CREDENTIALS" className="h-10 rounded-md border px-3 text-sm">{authProviderOptions.map(r => <option key={r} value={r}>{r}</option>)}</select></Field>
      </>}
      {mode === "units" && <><Field label="ชื่อหน่วยงาน"><Input name="name" defaultValue={editing?.name || ""} required /></Field><Field label="ประเภท"><select name="type" defaultValue={unitTypeOptions.includes(editing?.type) ? editing.type : "หน่วยงาน"} className="h-10 rounded-md border px-3 text-sm">{unitTypeOptions.map(type => <option key={type}>{type}</option>)}</select></Field></>}
      {mode === "risk-codes" && <>
        <Field label="รหัส"><Input name="code" defaultValue={editing?.code || ""} required /></Field>
        <Field label="ชื่อไทย"><Input name="nameTh" defaultValue={editing?.nameTh || ""} required /></Field>
        <Field label="ชื่ออังกฤษ"><Input name="nameEn" defaultValue={editing?.nameEn || ""} /></Field>
        <Field label="กลุ่มเหตุการณ์"><select name="clinicalOrGeneral" defaultValue={editing?.clinicalOrGeneral || "Clinical"} className="h-10 rounded-md border px-3 text-sm">{cgOptions.map(r => <option key={r} value={r}>{clinicalOrGeneralDisplay(r)}</option>)}</select></Field>
        <Field label="SIMPLE Category"><Input name="simpleCategory" defaultValue={editing?.simpleCategory || ""} required /></Field>
      </>}
      <label className="mt-6 flex items-center gap-2 text-sm"><input name="isActive" type="checkbox" defaultChecked={formEditing?.isActive ?? true} /> เปิดใช้งาน</label>
    </div>
      <div className="mt-4 flex flex-wrap gap-2"><Button type="submit">{formEditing ? "บันทึกการแก้ไข" : "เพิ่มรายการ"}</Button>{formEditing ? <button type="button" className="rounded-md border px-4 text-sm" onClick={() => setEditing(null)}>ยกเลิก</button> : null}</div></form>

    {mode === "users" ? <div className="rounded-lg border bg-white p-3 shadow-sm"><div className="grid gap-3 md:grid-cols-2"><label className="grid gap-1 text-sm font-medium">ค้นหาด้วยอีเมล<Input type="search" value={emailSearch} onChange={e => setEmailSearch(e.target.value)} placeholder="name@example.com" /></label><label className="grid gap-1 text-sm font-medium">ตัวกรองตามวิธีเข้าสู่ระบบ<select className="h-10 rounded-md border px-3 text-sm" value={authFilter} onChange={e => setAuthFilter(e.target.value)}><option value="">ทั้งหมด</option>{authProviderOptions.map(option => <option key={option} value={option}>{option}</option>)}</select></label></div></div> : null}

    <AdminMobileCards mode={mode} items={pagedItems} loading={loading} onEdit={setEditing} onUnlinkGoogle={unlinkGoogle} />
    <div className="hidden overflow-hidden rounded-lg border bg-white shadow-sm md:block"><div className="max-w-full overflow-hidden"><table className="w-full table-fixed text-sm"><thead className="bg-slate-50 text-left"><tr>{headers(mode).map(h => <th key={h} className="px-3 py-3 font-semibold">{h}</th>)}<th className="w-40 px-3 py-3">การทำงาน</th></tr></thead><tbody>{loading ? <tr><td className="p-4" colSpan={8}>กำลังโหลด...</td></tr> : pagedItems.map(item => <tr key={item.id} className="border-t">{rowCells(mode, item).map((cell, i) => <td key={i} className="px-3 py-3 align-top"><div className="min-w-0 break-words">{cell}</div></td>)}<td className="px-3 py-3 align-top"><div className="flex flex-wrap gap-2"><button type="button" className="rounded-md border px-3 py-1" onClick={() => setEditing(item)}>แก้ไข</button>{mode === "users" && item.googleId ? <button type="button" className="rounded-md border px-3 py-1" onClick={() => unlinkGoogle(item.id)}>ยกเลิก Google</button> : null}</div></td></tr>)}</tbody></table></div></div>
    {!loading && meta.total > meta.pageSize ? <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-white p-3 text-sm shadow-sm">
      <div className="text-slate-600">แสดง {(safeCurrentPage - 1) * meta.pageSize + 1}-{Math.min(safeCurrentPage * meta.pageSize, meta.total)} จาก {meta.total} รายการ</div>
      <div className="flex items-center gap-2">
        <button type="button" className="rounded-md border px-3 py-1 disabled:cursor-not-allowed disabled:opacity-50" disabled={safeCurrentPage <= 1} onClick={() => setCurrentPage(Math.max(1, safeCurrentPage - 1))}>ก่อนหน้า</button>
        <span className="text-slate-600">หน้า {safeCurrentPage} / {totalPages}</span>
        <button type="button" className="rounded-md border px-3 py-1 disabled:cursor-not-allowed disabled:opacity-50" disabled={safeCurrentPage >= totalPages} onClick={() => setCurrentPage(Math.min(totalPages, safeCurrentPage + 1))}>ถัดไป</button>
      </div>
    </div> : null}
    {mode === "users" && editing ? <UserEditDialog user={editing} units={units} onClose={() => setEditing(null)} onSaved={async () => { setEditing(null); await load(); }} onDeactivate={deactivate} onHardDelete={hardDeleteUser} /> : null}
  </div>;
}

function UserEditDialog({ user, units, onClose, onSaved, onDeactivate, onHardDelete }: { user: any; units: any[]; onClose: () => void; onSaved: () => Promise<void>; onDeactivate: (id: string) => Promise<void>; onHardDelete: (id: string, email: string) => Promise<void> }) {
  const isProtectedAdmin = String(user.email || "").toLowerCase() === protectedAdminEmail;
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
    const data: any = Object.fromEntries(fd.entries());
    data.id = user.id;
    data.isActive = fd.get("isActive") === "on";
    const res = await fetch("/api/admin/users", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    if (!res.ok) {
      alert("บันทึกไม่สำเร็จ กรุณาตรวจข้อมูลซ้ำหรือข้อมูลที่ยังไม่ครบ");
      return;
    }
    await onSaved();
  }
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
    <div className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-lg bg-white p-5 shadow-xl">
      <div className="mb-4 flex items-start justify-between gap-4"><div><h2 className="text-xl font-bold">แก้ไขผู้ใช้</h2><p className="text-sm text-slate-600">{user.email}</p></div><button className="rounded-md border px-3 py-1 text-sm" onClick={onClose}>ปิด</button></div>
      <form onSubmit={save} className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="ชื่อ"><Input name="name" defaultValue={user.name || ""} required /></Field>
          <Field label="อีเมล"><Input name="email" type="email" defaultValue={user.email || ""} required /></Field>
          <Field label="รหัสผ่าน"><Input name="password" type="password" placeholder="เว้นว่างถ้าไม่ต้องการเปลี่ยน" /></Field>
          <Field label="บทบาท"><select name="role" defaultValue={user.role || "Reporter"} className="h-10 rounded-md border px-3 text-sm">{roleOptions.map(r => <option key={r} value={r}>{roleDisplay(r)}</option>)}</select></Field>
          <Field label="หน่วยงาน"><select name="unitId" defaultValue={user.unitId || ""} className="h-10 rounded-md border px-3 text-sm"><option value="">-</option>{units.map(u => <option value={u.id} key={u.id}>{u.name}</option>)}</select></Field>
          <Field label="วิธีเข้าสู่ระบบ"><select name="authProvider" defaultValue={user.authProvider || "CREDENTIALS"} className="h-10 rounded-md border px-3 text-sm">{authProviderOptions.map(r => <option key={r} value={r}>{r}</option>)}</select></Field>
        </div>
        <label className="flex items-center gap-2 text-sm"><input name="isActive" type="checkbox" defaultChecked={user.isActive ?? true} /> เปิดใช้งาน</label>
        <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">การเปลี่ยนบทบาท หน่วยงาน สถานะ และวิธีเข้าสู่ระบบ จะถูกบันทึกใน audit log การลบถาวรจะลบผู้ใช้ออกจากระบบ แต่รายงานเดิมยังเก็บชื่อผู้รายงานไว้ และแผนการแก้ไขที่ไม่มีผู้รับผิดชอบจะให้หัวหน้าหน่วยงานมอบหมายคนใหม่ ส่วน {protectedAdminEmail} จะยังเป็นผู้ดูแลระบบเสมอ</div>
        <div className="flex flex-wrap justify-between gap-2"><div className="flex gap-2"><Button type="submit">บันทึกการแก้ไข</Button><button type="button" className="rounded-md border px-4 text-sm" onClick={onClose}>ยกเลิก</button></div><div className="flex flex-wrap gap-2">{user.isActive && !isProtectedAdmin ? <button type="button" className="rounded-md border border-red-200 px-4 text-sm text-red-700 hover:bg-red-50" onClick={() => onDeactivate(user.id)}>ปิดใช้งานผู้ใช้</button> : null}{!isProtectedAdmin ? <button type="button" className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700" onClick={() => onHardDelete(user.id, user.email)}>ลบถาวร</button> : null}</div></div>
      </form>
    </div>
  </div>;
}

function deleteErrorMessage(error?: string) {
  if (error === "DB_RELATION_BLOCKED") return "ยังลบไม่ได้เพราะมีข้อมูลอื่นผูกกับ user นี้อยู่ กรุณาตรวจ constraint ในฐานข้อมูล";
  if (error === "DB_SCHEMA_NOT_READY") return "ยังลบไม่ได้เพราะฐานข้อมูลจริงยังไม่ได้ apply migration สำหรับ hard delete user";
  if (error === "PROTECTED_ADMIN") return `${protectedAdminEmail} เป็น Admin หลักและไม่สามารถลบหรือปิดใช้งานได้`;
  if (error === "CANNOT_DELETE_SELF") return "ไม่สามารถลบ user ที่กำลังใช้งานอยู่ได้";
  if (error === "NOT_FOUND") return "ไม่พบ user นี้แล้ว";
  return "ดำเนินการไม่สำเร็จ กรุณาลองใหม่";
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="grid gap-1 text-sm font-medium">{label}{children}</label>;
}

function AdminMobileCards({ mode, items, loading, onEdit, onUnlinkGoogle }: { mode: Mode; items: any[]; loading: boolean; onEdit: (item: any) => void; onUnlinkGoogle: (id: string) => void }) {
  const labels = headers(mode);
  if (loading) return <div className="rounded-lg border bg-white p-4 text-sm shadow-sm md:hidden">กำลังโหลด...</div>;
  if (!items.length) return <div className="rounded-lg border bg-white p-4 text-sm text-slate-500 shadow-sm md:hidden">ไม่มีข้อมูล</div>;
  return <div className="space-y-3 md:hidden">
    {items.map(item => {
      const cells = rowCells(mode, item);
      return <div key={item.id} className="rounded-lg border bg-white p-4 text-sm shadow-sm">
        <div className="space-y-3">
          {cells.map((cell, index) => <div key={labels[index] ?? index} className="grid gap-1">
            <div className="text-xs font-semibold uppercase text-slate-500">{labels[index]}</div>
            <div className="min-w-0 break-words text-slate-900">{cell}</div>
          </div>)}
        </div>
        <div className="mt-4 flex flex-wrap gap-2 border-t pt-3">
          <button type="button" className="rounded-md border px-3 py-1" onClick={() => onEdit(item)}>แก้ไข</button>
          {mode === "users" && item.googleId ? <button type="button" className="rounded-md border px-3 py-1" onClick={() => onUnlinkGoogle(item.id)}>ยกเลิก Google</button> : null}
        </div>
      </div>;
    })}
  </div>;
}

function headers(mode: Mode) {
  if (mode === "users") return ["ชื่อ", "อีเมล", "บทบาท", "หน่วยงาน", "วิธีเข้าสู่ระบบ", "สถานะ"];
  if (mode === "units") return ["ชื่อ", "ประเภท", "สถานะ"];
  return ["รหัส", "ชื่อไทย", "ชื่ออังกฤษ", "กลุ่ม", "SIMPLE", "สถานะ"];
}

function status(active: boolean) {
  return <Badge className={active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}>{active ? "เปิดใช้งาน" : "ปิดใช้งาน"}</Badge>;
}

function rowCells(mode: Mode, item: any) {
  if (mode === "users") return [
    item.name,
    item.email,
    <RoleBadge key="role" role={item.role} />,
    item.unit?.name || "-",
    <span key="auth">{item.authProvider || "CREDENTIALS"}{item.googleId ? <span className="ml-1 text-xs text-emerald-700">(Google)</span> : null}</span>,
    status(item.isActive),
  ];
  if (mode === "units") return [item.name, item.type, status(item.isActive)];
  return [item.code, item.nameTh, item.nameEn || "-", clinicalOrGeneralDisplay(item.clinicalOrGeneral), item.simpleCategory, status(item.isActive)];
}
