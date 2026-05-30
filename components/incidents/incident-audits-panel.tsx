"use client";

import { useState } from "react";
import { formatDateTime } from "@/lib/format";

type AuditItem = {
  id: string;
  action: string;
  createdAt: string;
  user: { name: string; role: string } | null;
};

type AuditResponse = {
  data: AuditItem[];
  meta: {
    hasNextPage: boolean;
    nextCursor: string | null;
  };
};

export function IncidentAuditsPanel({ incidentId }: { incidentId: string }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AuditItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);

  async function load(cursor?: string) {
    setLoading(true);
    const query = new URLSearchParams({ take: "10" });
    if (cursor) query.set("cursor", cursor);
    const res = await fetch(`/api/incidents/${incidentId}/audits?${query.toString()}`, { cache: "no-store" });
    setLoading(false);
    if (!res.ok) return;
    const json = await res.json() as AuditResponse;
    setItems((current) => cursor ? [...current, ...json.data] : json.data);
    setNextCursor(json.meta.nextCursor);
    setHasNextPage(json.meta.hasNextPage);
    setLoaded(true);
  }

  async function toggleOpen() {
    const nextOpen = !open;
    setOpen(nextOpen);
    if (nextOpen && !loaded && !loading) {
      await load();
    }
  }

  return <div className="space-y-3">
    <button type="button" onClick={toggleOpen} className="rounded-md border px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">{open ? "ซ่อนประวัติการตรวจสอบ" : "โหลดประวัติการตรวจสอบ"}</button>
    {open ? <div className="space-y-2">
      {loading && !items.length ? <p className="text-sm text-slate-500">กำลังโหลดประวัติการตรวจสอบ...</p> : null}
      {!loading && loaded && items.length === 0 ? <p className="text-sm text-slate-500">ยังไม่มีประวัติการตรวจสอบ</p> : null}
      {items.map((item) => <div key={item.id} className="rounded-lg border p-3 text-xs"><div className="flex justify-between gap-3"><span className="font-semibold">{item.action}</span><span className="text-slate-500">{formatDateTime(item.createdAt)}</span></div><div className="mt-1 text-slate-500">โดย {item.user?.name ?? "ระบบ"}</div></div>)}
      {hasNextPage && nextCursor ? <button type="button" onClick={() => load(nextCursor)} className="rounded-md border px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50" disabled={loading}>{loading ? "กำลังโหลด..." : "โหลดประวัติเพิ่ม"}</button> : null}
    </div> : null}
  </div>;
}
