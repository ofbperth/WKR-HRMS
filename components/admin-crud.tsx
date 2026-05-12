"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge, RoleBadge } from "@/components/ui/badge";

type Mode = "users" | "units" | "risk-codes";
const roleOptions = ["Reporter", "UnitManager", "RMTeam", "Executive", "Admin"];
const authProviderOptions = ["CREDENTIALS", "GOOGLE", "BOTH"];
const cgOptions = ["Clinical", "General"];
const unitTypeOptions = ["หน่วยงาน", "ทีม"];

export function AdminCrud({ mode }: { mode: Mode }) {
  const [items, setItems] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [editing, setEditing] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [authFilter, setAuthFilter] = useState("");
  const endpoint = `/api/admin/${mode}`;
  const title = useMemo(() => mode === "users" ? "User management" : mode === "units" ? "Unit management" : "Risk code management", [mode]);

  async function load() {
    setLoading(true);
    const [data, unitData] = await Promise.all([
      fetch(endpoint).then(r => r.json()),
      fetch("/api/admin/units").then(r => r.json()).catch(() => []),
    ]);
    setItems(Array.isArray(data) ? data : []);
    setUnits(Array.isArray(unitData) ? unitData : []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
    const data: any = Object.fromEntries(fd.entries());
    data.isActive = fd.get("isActive") === "on";
    if (editing?.id) data.id = editing.id;
    const res = await fetch(endpoint, { method: editing?.id ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    if (!res.ok) {
      alert("Save failed. Please check duplicate or missing data.");
      return;
    }
    setEditing(null);
    await load();
  }

  async function deactivate(id: string) {
    if (!confirm("Deactivate this item?")) return;
    await fetch(endpoint, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setEditing(null);
    await load();
  }

  async function unlinkGoogle(id: string) {
    if (!confirm("Unlink Google account?")) return;
    await fetch(endpoint, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, action: "UNLINK_GOOGLE" }) });
    await load();
  }

  const visibleItems = mode === "users" && authFilter ? items.filter(item => item.authProvider === authFilter) : items;
  const formEditing = mode === "users" ? null : editing;

  return <div className="space-y-6">
    <div><h1 className="text-2xl font-bold">{title}</h1><p className="text-sm text-muted-foreground">Create, update, deactivate, and audit administrative records.</p></div>
    <form key={formEditing?.id ?? `new-${mode}`} onSubmit={save} className="rounded-lg border bg-white p-4 shadow-sm"><div className="grid gap-3 md:grid-cols-3">
      {mode === "users" && <>
        <Field label="Name"><Input name="name" required /></Field>
        <Field label="Email"><Input name="email" type="email" required /></Field>
        <Field label="Password"><Input name="password" type="password" placeholder="Required unless Google-only" /></Field>
        <Field label="Role"><select name="role" defaultValue="Reporter" className="h-10 rounded-md border px-3 text-sm">{roleOptions.map(r => <option key={r}>{r}</option>)}</select></Field>
        <Field label="Unit"><select name="unitId" defaultValue="" className="h-10 rounded-md border px-3 text-sm"><option value="">-</option>{units.map(u => <option value={u.id} key={u.id}>{u.name}</option>)}</select></Field>
        <Field label="Auth provider"><select name="authProvider" defaultValue="CREDENTIALS" className="h-10 rounded-md border px-3 text-sm">{authProviderOptions.map(r => <option key={r}>{r}</option>)}</select></Field>
      </>}
      {mode === "units" && <><Field label="Unit name"><Input name="name" defaultValue={editing?.name || ""} required /></Field><Field label="Type"><select name="type" defaultValue={unitTypeOptions.includes(editing?.type) ? editing.type : "หน่วยงาน"} className="h-10 rounded-md border px-3 text-sm">{unitTypeOptions.map(type => <option key={type}>{type}</option>)}</select></Field></>}
      {mode === "risk-codes" && <>
        <Field label="Code"><Input name="code" defaultValue={editing?.code || ""} required /></Field>
        <Field label="Thai name"><Input name="nameTh" defaultValue={editing?.nameTh || ""} required /></Field>
        <Field label="English name"><Input name="nameEn" defaultValue={editing?.nameEn || ""} /></Field>
        <Field label="Clinical/General"><select name="clinicalOrGeneral" defaultValue={editing?.clinicalOrGeneral || "Clinical"} className="h-10 rounded-md border px-3 text-sm">{cgOptions.map(r => <option key={r}>{r}</option>)}</select></Field>
        <Field label="SIMPLE Category"><Input name="simpleCategory" defaultValue={editing?.simpleCategory || ""} required /></Field>
      </>}
      <label className="mt-6 flex items-center gap-2 text-sm"><input name="isActive" type="checkbox" defaultChecked={formEditing?.isActive ?? true} /> Active</label>
    </div>
      <div className="mt-4 flex flex-wrap gap-2"><Button type="submit">{formEditing ? "Save changes" : "Add item"}</Button>{formEditing ? <button type="button" className="rounded-md border px-4 text-sm" onClick={() => setEditing(null)}>Cancel</button> : null}</div></form>

    {mode === "users" ? <div className="rounded-lg border bg-white p-3 shadow-sm"><label className="grid max-w-xs gap-1 text-sm font-medium">Filter by auth provider<select className="h-10 rounded-md border px-3 text-sm" value={authFilter} onChange={e => setAuthFilter(e.target.value)}><option value="">All</option>{authProviderOptions.map(option => <option key={option}>{option}</option>)}</select></label></div> : null}

    <div className="overflow-hidden rounded-lg border bg-white shadow-sm"><div className="max-w-full overflow-x-auto"><table className="w-full table-fixed text-sm"><thead className="bg-slate-50 text-left"><tr>{headers(mode).map(h => <th key={h} className="px-3 py-3 font-semibold">{h}</th>)}<th className="w-40 px-3 py-3">Action</th></tr></thead><tbody>{loading ? <tr><td className="p-4" colSpan={8}>Loading...</td></tr> : visibleItems.map(item => <tr key={item.id} className="border-t">{rowCells(mode, item).map((cell, i) => <td key={i} className="truncate px-3 py-3">{cell}</td>)}<td className="px-3 py-3"><div className="flex flex-wrap gap-2"><button type="button" className="rounded-md border px-3 py-1" onClick={() => setEditing(item)}>Edit</button>{mode === "users" && item.googleId ? <button type="button" className="rounded-md border px-3 py-1" onClick={() => unlinkGoogle(item.id)}>Unlink Google</button> : null}</div></td></tr>)}</tbody></table></div></div>
    {mode === "users" && editing ? <UserEditDialog user={editing} units={units} onClose={() => setEditing(null)} onSaved={async () => { setEditing(null); await load(); }} onDeactivate={deactivate} /> : null}
  </div>;
}

function UserEditDialog({ user, units, onClose, onSaved, onDeactivate }: { user: any; units: any[]; onClose: () => void; onSaved: () => Promise<void>; onDeactivate: (id: string) => Promise<void> }) {
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
    const data: any = Object.fromEntries(fd.entries());
    data.id = user.id;
    data.isActive = fd.get("isActive") === "on";
    const res = await fetch("/api/admin/users", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    if (!res.ok) {
      alert("Save failed. Please check duplicate or missing data.");
      return;
    }
    await onSaved();
  }
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
    <div className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-lg bg-white p-5 shadow-xl">
      <div className="mb-4 flex items-start justify-between gap-4"><div><h2 className="text-xl font-bold">Edit user</h2><p className="text-sm text-slate-600">{user.email}</p></div><button className="rounded-md border px-3 py-1 text-sm" onClick={onClose}>Close</button></div>
      <form onSubmit={save} className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Name"><Input name="name" defaultValue={user.name || ""} required /></Field>
          <Field label="Email"><Input name="email" type="email" defaultValue={user.email || ""} required /></Field>
          <Field label="Password"><Input name="password" type="password" placeholder="Leave blank if unchanged" /></Field>
          <Field label="Role"><select name="role" defaultValue={user.role || "Reporter"} className="h-10 rounded-md border px-3 text-sm">{roleOptions.map(r => <option key={r}>{r}</option>)}</select></Field>
          <Field label="Unit"><select name="unitId" defaultValue={user.unitId || ""} className="h-10 rounded-md border px-3 text-sm"><option value="">-</option>{units.map(u => <option value={u.id} key={u.id}>{u.name}</option>)}</select></Field>
          <Field label="Auth provider"><select name="authProvider" defaultValue={user.authProvider || "CREDENTIALS"} className="h-10 rounded-md border px-3 text-sm">{authProviderOptions.map(r => <option key={r}>{r}</option>)}</select></Field>
        </div>
        <label className="flex items-center gap-2 text-sm"><input name="isActive" type="checkbox" defaultChecked={user.isActive ?? true} /> Active</label>
        <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">Role, unit, status, and auth provider changes are audited. Deactivate is available here only.</div>
        <div className="flex flex-wrap justify-between gap-2"><div className="flex gap-2"><Button type="submit">Save changes</Button><button type="button" className="rounded-md border px-4 text-sm" onClick={onClose}>Cancel</button></div>{user.isActive ? <button type="button" className="rounded-md border border-red-200 px-4 text-sm text-red-700 hover:bg-red-50" onClick={() => onDeactivate(user.id)}>Deactivate user</button> : null}</div>
      </form>
    </div>
  </div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="grid gap-1 text-sm font-medium">{label}{children}</label>;
}

function headers(mode: Mode) {
  if (mode === "users") return ["Name", "Email", "Role", "Unit", "Auth", "Status"];
  if (mode === "units") return ["Name", "Type", "Status"];
  return ["Code", "Thai name", "English name", "Group", "SIMPLE", "Status"];
}

function status(active: boolean) {
  return <Badge className={active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}>{active ? "Active" : "Inactive"}</Badge>;
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
  return [item.code, item.nameTh, item.nameEn || "-", item.clinicalOrGeneral, item.simpleCategory, status(item.isActive)];
}
