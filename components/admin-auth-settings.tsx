"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDateTime } from "@/lib/format";
import { roleDisplay } from "@/lib/i18n/th";

const roles = ["Reporter", "UnitManager", "RMTeam", "Executive", "Admin"];
const invitePageSize = 10;

function listToText(value: string[]) {
  return value.join("\n");
}

function textToList(value: string) {
  return value.split(/\r?\n|,/).map(v => v.trim().toLowerCase()).filter(Boolean);
}

export function AdminAuthSettings() {
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({ googleEnabled: false, allowedDomains: "", allowedEmails: "", allowAutoProvision: false, defaultRole: "Reporter", defaultIsActive: false });
  const [message, setMessage] = useState("");

  const load = useCallback(async function load() {
    setLoading(true);
    const data = await fetch("/api/admin/auth-settings").then(r => r.json());
    setSettings({
      googleEnabled: Boolean(data.googleEnabled),
      allowedDomains: listToText(data.allowedDomains || []),
      allowedEmails: listToText(data.allowedEmails || []),
      allowAutoProvision: Boolean(data.allowAutoProvision),
      defaultRole: data.defaultRole || "Reporter",
      defaultIsActive: Boolean(data.defaultIsActive),
    });
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const res = await fetch("/api/admin/auth-settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        googleEnabled: settings.googleEnabled,
        allowedDomains: textToList(settings.allowedDomains),
        allowedEmails: textToList(settings.allowedEmails),
        allowAutoProvision: settings.allowAutoProvision,
        defaultRole: settings.defaultRole,
        defaultIsActive: settings.defaultIsActive,
      }),
    });
    setMessage(res.ok ? "บันทึกแล้ว" : "บันทึกไม่สำเร็จ");
  }

  if (loading) return <div className="rounded-lg border bg-white p-4 text-sm">กำลังโหลด...</div>;

  return <form onSubmit={save} className="space-y-4 rounded-lg border bg-white p-4">
    <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" checked={settings.googleEnabled} onChange={e => setSettings({ ...settings, googleEnabled: e.target.checked })} /> เปิดใช้ Google Login</label>
    <label className="grid gap-1 text-sm font-medium">Domain ที่อนุญาต<textarea className="min-h-24 rounded-md border px-3 py-2 text-sm" value={settings.allowedDomains} onChange={e => setSettings({ ...settings, allowedDomains: e.target.value })} placeholder={"hospital.go.th\nmoph.go.th"} /></label>
    <label className="grid gap-1 text-sm font-medium">Email รายบุคคลที่อนุญาต<textarea className="min-h-24 rounded-md border px-3 py-2 text-sm" value={settings.allowedEmails} onChange={e => setSettings({ ...settings, allowedEmails: e.target.value })} placeholder={"specificdoctor@gmail.com\nrmteam@gmail.com"} /></label>
    <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" checked={settings.allowAutoProvision} onChange={e => setSettings({ ...settings, allowAutoProvision: e.target.checked })} /> อนุญาต auto provision</label>
    <div className="grid gap-3 md:grid-cols-2">
      <label className="grid gap-1 text-sm font-medium">บทบาทเริ่มต้น<select className="h-10 rounded-md border px-3 text-sm" value={settings.defaultRole} onChange={e => setSettings({ ...settings, defaultRole: e.target.value })}>{roles.map(role => <option key={role} value={role}>{roleDisplay(role)}</option>)}</select></label>
      <label className="mt-6 flex items-center gap-2 text-sm font-medium"><input type="checkbox" checked={settings.defaultIsActive} onChange={e => setSettings({ ...settings, defaultIsActive: e.target.checked })} /> เปิดใช้งานผู้ใช้ Google ใหม่เป็นค่าเริ่มต้น</label>
    </div>
    <div className="rounded-md bg-slate-50 p-3 text-xs text-slate-600">นโยบายปัจจุบัน: ผู้ใช้ Google ใหม่ที่ผ่านเงื่อนไขจะถูกสร้างเป็นผู้รายงานที่เปิดใช้งานแล้ว และต้องเลือกหน่วยงานก่อนเข้าระบบ ส่วนผู้ใช้และ invite เดิมยังคงบทบาท/หน่วยงานที่ตั้งไว้</div>
    <div className="flex items-center gap-3"><Button type="submit">บันทึกการตั้งค่าเข้าสู่ระบบ</Button>{message ? <span className="text-sm text-slate-600">{message}</span> : null}</div>
  </form>;
}

export function AdminInvites({ units }: { units: Array<{ id: string; name: string }> }) {
  const [items, setItems] = useState<any[]>([]);
  const [message, setMessage] = useState("");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ page: 1, pageSize: invitePageSize, total: 0, totalPages: 1 });
  const load = useCallback(async function load() {
    const data = await fetch(`/api/admin/invites?page=${page}&pageSize=${invitePageSize}`).then(r => r.json());
    const nextItems = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
    setItems(nextItems);
    setMeta(data?.meta && typeof data.meta.total === "number" ? data.meta : { page, pageSize: invitePageSize, total: nextItems.length, totalPages: 1 });
  }, [page]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (page > meta.totalPages) setPage(meta.totalPages || 1);
  }, [page, meta.totalPages]);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    const res = await fetch("/api/admin/invites", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    setMessage(res.ok ? "บันทึกคำเชิญแล้ว" : "บันทึกคำเชิญไม่สำเร็จ");
    if (res.ok) { event.currentTarget.reset(); await load(); }
  }
  async function revoke(id: string) {
    await fetch("/api/admin/invites", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    await load();
  }
  return <div className="space-y-4 rounded-lg border bg-white p-4">
    <form onSubmit={submit} className="grid gap-3 md:grid-cols-4">
      <label className="grid gap-1 text-sm font-medium">อีเมล<Input name="email" type="email" required /></label>
      <label className="grid gap-1 text-sm font-medium">บทบาท<select name="role" className="h-10 rounded-md border px-3 text-sm" defaultValue="Reporter">{roles.map(role => <option key={role} value={role}>{roleDisplay(role)}</option>)}</select></label>
      <label className="grid gap-1 text-sm font-medium">หน่วยงาน<select name="unitId" className="h-10 rounded-md border px-3 text-sm"><option value="">-</option>{units.map(unit => <option key={unit.id} value={unit.id}>{unit.name}</option>)}</select></label>
      <label className="grid gap-1 text-sm font-medium">หมดอายุวันที่<Input name="expiresAt" type="date" required /></label>
      <div className="md:col-span-4 flex items-center gap-3"><Button type="submit">บันทึกคำเชิญ</Button>{message ? <span className="text-sm text-slate-600">{message}</span> : null}</div>
    </form>
    <div className="overflow-auto">
      <table className="w-full min-w-[720px] text-left text-sm"><thead className="bg-slate-50"><tr><th className="px-3 py-2">อีเมล</th><th className="px-3 py-2">บทบาท</th><th className="px-3 py-2">หน่วยงาน</th><th className="px-3 py-2">สถานะ</th><th className="px-3 py-2">หมดอายุ</th><th className="px-3 py-2">การทำงาน</th></tr></thead><tbody>{items.map(item => <tr key={item.id} className="border-t"><td className="px-3 py-2">{item.email}</td><td className="px-3 py-2">{roleDisplay(item.role)}</td><td className="px-3 py-2">{item.unit?.name || "-"}</td><td className="px-3 py-2">{item.status}</td><td className="px-3 py-2">{formatDateTime(item.expiresAt)}</td><td className="px-3 py-2"><button className="rounded-md border px-3 py-1 text-red-600" type="button" onClick={() => revoke(item.id)}>ยกเลิก</button></td></tr>)}</tbody></table>
    </div>
    {meta.total > meta.pageSize ? <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-3 text-sm">
      <div className="text-slate-600">แสดง {(meta.page - 1) * meta.pageSize + 1}-{Math.min(meta.page * meta.pageSize, meta.total)} จาก {meta.total} คำเชิญ</div>
      <div className="flex items-center gap-2">
        <button type="button" className="rounded-md border px-3 py-1 disabled:cursor-not-allowed disabled:opacity-50" disabled={meta.page <= 1} onClick={() => setPage(Math.max(1, meta.page - 1))}>ก่อนหน้า</button>
        <span className="text-slate-600">หน้า {meta.page} / {meta.totalPages}</span>
        <button type="button" className="rounded-md border px-3 py-1 disabled:cursor-not-allowed disabled:opacity-50" disabled={meta.page >= meta.totalPages} onClick={() => setPage(Math.min(meta.totalPages, meta.page + 1))}>ถัดไป</button>
      </div>
    </div> : null}
  </div>;
}
