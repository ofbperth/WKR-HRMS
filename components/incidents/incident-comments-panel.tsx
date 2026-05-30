"use client";

import { useState } from "react";
import { formatDateTime } from "@/lib/format";
import { AddCommentForm } from "@/components/incidents/incident-detail-actions";

type CommentItem = {
  id: string;
  message: string;
  createdAt: string;
  user: { name: string; role: string } | null;
};

type CommentResponse = {
  data: CommentItem[];
  meta: {
    hasNextPage: boolean;
    nextCursor: string | null;
  };
};

export function IncidentCommentsPanel({ incidentId, canAddComment }: { incidentId: string; canAddComment: boolean }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<CommentItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);

  async function load(cursor?: string) {
    setLoading(true);
    const query = new URLSearchParams({ take: "10" });
    if (cursor) query.set("cursor", cursor);
    const res = await fetch(`/api/incidents/${incidentId}/comments?${query.toString()}`, { cache: "no-store" });
    setLoading(false);
    if (!res.ok) return;
    const json = await res.json() as CommentResponse;
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

  async function refreshAfterSave() {
    if (!open) {
      setOpen(true);
    }
    await load();
  }

  return <div className="space-y-3">
    {canAddComment ? <AddCommentForm incidentId={incidentId} onSaved={refreshAfterSave} /> : null}
    <button type="button" onClick={toggleOpen} className="rounded-md border px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">{open ? "ซ่อนความเห็น" : "โหลดความเห็นล่าสุด"}</button>
    {open ? <div className="space-y-3">
      {loading && !items.length ? <p className="text-sm text-slate-500">กำลังโหลดความเห็น...</p> : null}
      {!loading && loaded && items.length === 0 ? <p className="text-sm text-slate-500">ยังไม่มีความคิดเห็น</p> : null}
      {items.map((item) => <div key={item.id} className="rounded-lg border p-3 text-sm"><div className="flex justify-between gap-3"><span className="font-semibold">{item.user?.name ?? "ผู้ใช้ที่ถูกลบ"}</span><span className="text-xs text-slate-500">{formatDateTime(item.createdAt)}</span></div><p className="mt-1 whitespace-pre-wrap text-slate-700">{item.message}</p></div>)}
      {hasNextPage && nextCursor ? <button type="button" onClick={() => load(nextCursor)} className="rounded-md border px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50" disabled={loading}>{loading ? "กำลังโหลด..." : "โหลดความเห็นเพิ่ม"}</button> : null}
    </div> : null}
  </div>;
}
