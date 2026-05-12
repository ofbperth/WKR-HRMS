"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const roles = ["Reporter", "UnitManager", "RMTeam", "Executive", "Admin"];

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

  async function load() {
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
  }

  useEffect(() => { load(); }, []);

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
    setMessage(res.ok ? "Saved" : "Save failed");
  }

  if (loading) return <div className="rounded-lg border bg-white p-4 text-sm">Loading...</div>;

  return <form onSubmit={save} className="space-y-4 rounded-lg border bg-white p-4">
    <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" checked={settings.googleEnabled} onChange={e => setSettings({ ...settings, googleEnabled: e.target.checked })} /> Enable Google Login</label>
    <label className="grid gap-1 text-sm font-medium">Allowed domains<textarea className="min-h-24 rounded-md border px-3 py-2 text-sm" value={settings.allowedDomains} onChange={e => setSettings({ ...settings, allowedDomains: e.target.value })} placeholder={"hospital.go.th\nmoph.go.th"} /></label>
    <label className="grid gap-1 text-sm font-medium">Allowed individual emails<textarea className="min-h-24 rounded-md border px-3 py-2 text-sm" value={settings.allowedEmails} onChange={e => setSettings({ ...settings, allowedEmails: e.target.value })} placeholder={"specificdoctor@gmail.com\nrmteam@gmail.com"} /></label>
    <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" checked={settings.allowAutoProvision} onChange={e => setSettings({ ...settings, allowAutoProvision: e.target.checked })} /> Allow auto provision</label>
    <div className="grid gap-3 md:grid-cols-2">
      <label className="grid gap-1 text-sm font-medium">Default role<select className="h-10 rounded-md border px-3 text-sm" value={settings.defaultRole} onChange={e => setSettings({ ...settings, defaultRole: e.target.value })}>{roles.map(role => <option key={role}>{role}</option>)}</select></label>
      <label className="mt-6 flex items-center gap-2 text-sm font-medium"><input type="checkbox" checked={settings.defaultIsActive} onChange={e => setSettings({ ...settings, defaultIsActive: e.target.checked })} /> New Google user active by default</label>
    </div>
    <div className="rounded-md bg-slate-50 p-3 text-xs text-slate-600">Current policy: a new allowed Google user is created as active Reporter and must select a unit before entering the system. Existing users and invites keep their configured role/unit.</div>
    <div className="flex items-center gap-3"><Button type="submit">Save auth settings</Button>{message ? <span className="text-sm text-slate-600">{message}</span> : null}</div>
  </form>;
}

export function AdminInvites({ units }: { units: Array<{ id: string; name: string }> }) {
  const [items, setItems] = useState<any[]>([]);
  const [message, setMessage] = useState("");
  async function load() {
    setItems(await fetch("/api/admin/invites").then(r => r.json()));
  }
  useEffect(() => { load(); }, []);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    const res = await fetch("/api/admin/invites", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    setMessage(res.ok ? "Invite saved" : "Invite failed");
    if (res.ok) { event.currentTarget.reset(); await load(); }
  }
  async function revoke(id: string) {
    await fetch("/api/admin/invites", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    await load();
  }
  return <div className="space-y-4 rounded-lg border bg-white p-4">
    <form onSubmit={submit} className="grid gap-3 md:grid-cols-4">
      <label className="grid gap-1 text-sm font-medium">Email<Input name="email" type="email" required /></label>
      <label className="grid gap-1 text-sm font-medium">Role<select name="role" className="h-10 rounded-md border px-3 text-sm" defaultValue="Reporter">{roles.map(role => <option key={role}>{role}</option>)}</select></label>
      <label className="grid gap-1 text-sm font-medium">Unit<select name="unitId" className="h-10 rounded-md border px-3 text-sm"><option value="">-</option>{units.map(unit => <option key={unit.id} value={unit.id}>{unit.name}</option>)}</select></label>
      <label className="grid gap-1 text-sm font-medium">Expires at<Input name="expiresAt" type="date" required /></label>
      <div className="md:col-span-4 flex items-center gap-3"><Button type="submit">Save invite</Button>{message ? <span className="text-sm text-slate-600">{message}</span> : null}</div>
    </form>
    <div className="overflow-auto">
      <table className="w-full min-w-[720px] text-left text-sm"><thead className="bg-slate-50"><tr><th className="px-3 py-2">Email</th><th className="px-3 py-2">Role</th><th className="px-3 py-2">Unit</th><th className="px-3 py-2">Status</th><th className="px-3 py-2">Expires</th><th className="px-3 py-2">Action</th></tr></thead><tbody>{items.map(item => <tr key={item.id} className="border-t"><td className="px-3 py-2">{item.email}</td><td className="px-3 py-2">{item.role}</td><td className="px-3 py-2">{item.unit?.name || "-"}</td><td className="px-3 py-2">{item.status}</td><td className="px-3 py-2">{new Date(item.expiresAt).toLocaleDateString()}</td><td className="px-3 py-2"><button className="rounded-md border px-3 py-1 text-red-600" type="button" onClick={() => revoke(item.id)}>Revoke</button></td></tr>)}</tbody></table>
    </div>
  </div>;
}
