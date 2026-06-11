"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type UnitItem = {
  id: string;
  name: string;
  type: string;
  isActive: boolean;
};

type TeamItem = {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  isActive: boolean;
  sortOrder: number;
};

type TabKey = "units" | "teams";

export function AdminUnitTeamManagement() {
  const [tab, setTab] = useState<TabKey>("units");
  return <div className="space-y-4">
    <div>
      <h1 className="text-2xl font-bold">à¸ˆà¸±à¸”à¸à¸²à¸£à¸«à¸™à¹ˆà¸§à¸¢à¸‡à¸²à¸™/à¸—à¸µà¸¡</h1>
      <p className="text-sm text-slate-600">à¹à¸¢à¸ concept à¸£à¸°à¸«à¸§à¹ˆà¸²à¸‡à¸«à¸™à¹ˆà¸§à¸¢à¸‡à¸²à¸™à¸à¸±à¸šà¸—à¸µà¸¡à¸—à¸µà¹ˆà¹€à¸à¸µà¹ˆà¸¢à¸§à¸‚à¹‰à¸­à¸‡ à¹à¸•à¹ˆà¸¢à¸±à¸‡à¸”à¸¹à¹à¸¥à¸„à¸£à¸šà¹ƒà¸™à¹€à¸¡à¸™à¸¹à¹€à¸”à¸µà¸¢à¸§à¸„à¸§à¸²à¸¡à¸ªà¸°à¸”à¸§à¸</p>
    </div>
    <div className="flex flex-wrap gap-2">
      <button type="button" onClick={() => setTab("units")} className={`rounded-md border px-4 py-2 text-sm font-medium ${tab === "units" ? "border-emerald-500 bg-emerald-50 text-emerald-900" : "bg-white text-slate-600"}`}>
        à¸«à¸™à¹ˆà¸§à¸¢à¸‡à¸²à¸™
      </button>
      <button type="button" onClick={() => setTab("teams")} className={`rounded-md border px-4 py-2 text-sm font-medium ${tab === "teams" ? "border-emerald-500 bg-emerald-50 text-emerald-900" : "bg-white text-slate-600"}`}>
        à¸—à¸µà¸¡à¸—à¸µà¹ˆà¹€à¸à¸µà¹ˆà¸¢à¸§à¸‚à¹‰à¸­à¸‡
      </button>
    </div>
    {tab === "units" ? <UnitAdminPanel /> : <TeamAdminPanel />}
  </div>;
}

function UnitAdminPanel() {
  const [items, setItems] = useState<UnitItem[]>([]);
  const [editing, setEditing] = useState<UnitItem | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const data = await fetch("/api/admin/units?all=1").then((response) => response.json()).catch(() => []);
    setItems(Array.isArray(data) ? data.filter((item) => item.type !== "à¸—à¸µà¸¡") : []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
    const payload = {
      id: editing?.id,
      name: String(fd.get("name") || ""),
      type: "à¸«à¸™à¹ˆà¸§à¸¢à¸‡à¸²à¸™",
      isActive: fd.get("isActive") === "on",
    };
    const response = await fetch("/api/admin/units", {
      method: editing?.id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      alert("à¸šà¸±à¸™à¸—à¸¶à¸à¸«à¸™à¹ˆà¸§à¸¢à¸‡à¸²à¸™à¹„à¸¡à¹ˆà¸ªà¸³à¹€à¸£à¹‡à¸ˆ");
      return;
    }
    setEditing(null);
    event.currentTarget.reset();
    await load();
  }

  async function deactivate(id: string) {
    if (!window.confirm("à¸›à¸´à¸”à¹ƒà¸Šà¹‰à¸‡à¸²à¸™à¸«à¸™à¹ˆà¸§à¸¢à¸‡à¸²à¸™à¸™à¸µà¹‰?")) return;
    const response = await fetch("/api/admin/units", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (!response.ok) {
      alert("à¸›à¸´à¸”à¹ƒà¸Šà¹‰à¸‡à¸²à¸™à¸«à¸™à¹ˆà¸§à¸¢à¸‡à¸²à¸™à¹„à¸¡à¹ˆà¸ªà¸³à¹€à¸£à¹‡à¸ˆ");
      return;
    }
    if (editing?.id === id) setEditing(null);
    await load();
  }

  return <div className="space-y-6">
    <form key={editing?.id ?? "new-unit"} onSubmit={save} className="rounded-lg border bg-white p-4 shadow-sm">
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="à¸Šà¸·à¹ˆà¸­à¸«à¸™à¹ˆà¸§à¸¢à¸‡à¸²à¸™"><Input name="name" defaultValue={editing?.name || ""} required /></Field>
        <label className="mt-6 flex items-center gap-2 text-sm"><input name="isActive" type="checkbox" defaultChecked={editing?.isActive ?? true} /> à¹€à¸›à¸´à¸”à¹ƒà¸Šà¹‰à¸‡à¸²à¸™</label>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="submit">{editing ? "à¸šà¸±à¸™à¸—à¸¶à¸à¸à¸²à¸£à¹à¸à¹‰à¹„à¸‚" : "à¹€à¸žà¸´à¹ˆà¸¡à¸«à¸™à¹ˆà¸§à¸¢à¸‡à¸²à¸™"}</Button>
        {editing ? <button type="button" className="rounded-md border px-4 text-sm" onClick={() => setEditing(null)}>à¸¢à¸à¹€à¸¥à¸´à¸</button> : null}
      </div>
    </form>

    <div className="rounded-lg border bg-white shadow-sm">
      {loading ? <div className="p-4 text-sm">à¸à¸³à¸¥à¸±à¸‡à¹‚à¸«à¸¥à¸”...</div> : !items.length ? <div className="p-4 text-sm text-slate-500">à¸¢à¸±à¸‡à¹„à¸¡à¹ˆà¸¡à¸µà¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¸«à¸™à¹ˆà¸§à¸¢à¸‡à¸²à¸™</div> : <div className="divide-y">
        {items.map((item) => <div key={item.id} className="flex flex-col gap-3 p-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <div className="font-semibold">{item.name}</div>
              <span className={`rounded-full px-2 py-1 text-xs ${item.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{item.isActive ? "à¹€à¸›à¸´à¸”à¹ƒà¸Šà¹‰à¸‡à¸²à¸™" : "à¸›à¸´à¸”à¹ƒà¸Šà¹‰à¸‡à¸²à¸™"}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="rounded-md border px-3 py-1 text-sm" onClick={() => setEditing(item)}>à¹à¸à¹‰à¹„à¸‚</button>
            <button type="button" className="rounded-md border border-red-200 px-3 py-1 text-sm text-red-700" onClick={() => deactivate(item.id)}>à¸›à¸´à¸”à¹ƒà¸Šà¹‰à¸‡à¸²à¸™</button>
          </div>
        </div>)}
      </div>}
    </div>
  </div>;
}

function TeamAdminPanel() {
  const [items, setItems] = useState<TeamItem[]>([]);
  const [editing, setEditing] = useState<TeamItem | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const data = await fetch("/api/admin/teams?all=1").then((response) => response.json()).catch(() => []);
    setItems(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
    const payload = {
      id: editing?.id,
      name: String(fd.get("name") || ""),
      code: String(fd.get("code") || ""),
      description: String(fd.get("description") || ""),
      sortOrder: String(fd.get("sortOrder") || "0"),
      isActive: fd.get("isActive") === "on",
    };
    const response = await fetch("/api/admin/teams", {
      method: editing?.id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      alert("à¸šà¸±à¸™à¸—à¸¶à¸à¸—à¸µà¸¡à¹„à¸¡à¹ˆà¸ªà¸³à¹€à¸£à¹‡à¸ˆ");
      return;
    }
    setEditing(null);
    event.currentTarget.reset();
    await load();
  }

  async function deactivate(id: string) {
    if (!window.confirm("à¸›à¸´à¸”à¹ƒà¸Šà¹‰à¸‡à¸²à¸™à¸—à¸µà¸¡à¸™à¸µà¹‰?")) return;
    const response = await fetch("/api/admin/teams", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (!response.ok) {
      alert("à¸›à¸´à¸”à¹ƒà¸Šà¹‰à¸‡à¸²à¸™à¸—à¸µà¸¡à¹„à¸¡à¹ˆà¸ªà¸³à¹€à¸£à¹‡à¸ˆ");
      return;
    }
    if (editing?.id === id) setEditing(null);
    await load();
  }

  return <div className="space-y-6">
    <form key={editing?.id ?? "new-team"} onSubmit={save} className="rounded-lg border bg-white p-4 shadow-sm">
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="à¸Šà¸·à¹ˆà¸­à¸—à¸µà¸¡"><Input name="name" defaultValue={editing?.name || ""} required /></Field>
        <Field label="à¸£à¸«à¸±à¸ªà¸—à¸µà¸¡"><Input name="code" defaultValue={editing?.code || ""} /></Field>
        <Field label="à¸£à¸²à¸¢à¸¥à¸°à¹€à¸­à¸µà¸¢à¸”"><Input name="description" defaultValue={editing?.description || ""} /></Field>
        <Field label="Sort order"><Input name="sortOrder" type="number" min="0" defaultValue={editing?.sortOrder ?? 0} /></Field>
        <label className="mt-6 flex items-center gap-2 text-sm"><input name="isActive" type="checkbox" defaultChecked={editing?.isActive ?? true} /> à¹€à¸›à¸´à¸”à¹ƒà¸Šà¹‰à¸‡à¸²à¸™</label>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="submit">{editing ? "à¸šà¸±à¸™à¸—à¸¶à¸à¸à¸²à¸£à¹à¸à¹‰à¹„à¸‚" : "à¹€à¸žà¸´à¹ˆà¸¡à¸—à¸µà¸¡"}</Button>
        {editing ? <button type="button" className="rounded-md border px-4 text-sm" onClick={() => setEditing(null)}>à¸¢à¸à¹€à¸¥à¸´à¸</button> : null}
      </div>
    </form>

    <div className="rounded-lg border bg-white shadow-sm">
      {loading ? <div className="p-4 text-sm">à¸à¸³à¸¥à¸±à¸‡à¹‚à¸«à¸¥à¸”...</div> : !items.length ? <div className="p-4 text-sm text-slate-500">à¸¢à¸±à¸‡à¹„à¸¡à¹ˆà¸¡à¸µà¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¸—à¸µà¸¡</div> : <div className="divide-y">
        {items.map((item) => <div key={item.id} className="flex flex-col gap-3 p-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <div className="font-semibold">{item.name}</div>
              <span className={`rounded-full px-2 py-1 text-xs ${item.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{item.isActive ? "à¹€à¸›à¸´à¸”à¹ƒà¸Šà¹‰à¸‡à¸²à¸™" : "à¸›à¸´à¸”à¹ƒà¸Šà¹‰à¸‡à¸²à¸™"}</span>
            </div>
            <div className="text-sm text-slate-600">Code: {item.code || "-"} | Sort: {item.sortOrder}</div>
            <div className="text-sm text-slate-600">{item.description || "-"}</div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="rounded-md border px-3 py-1 text-sm" onClick={() => setEditing(item)}>à¹à¸à¹‰à¹„à¸‚</button>
            <button type="button" className="rounded-md border border-red-200 px-3 py-1 text-sm text-red-700" onClick={() => deactivate(item.id)}>à¸›à¸´à¸”à¹ƒà¸Šà¹‰à¸‡à¸²à¸™</button>
          </div>
        </div>)}
      </div>}
    </div>
  </div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="grid gap-1 text-sm font-medium">{label}{children}</label>;
}
