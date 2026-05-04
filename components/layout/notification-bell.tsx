"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { formatDateTime } from "@/lib/format";

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  relatedIncidentId?: string | null;
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  async function load() {
    const res = await fetch("/api/notifications", { cache: "no-store" });
    if (res.ok) setItems(await res.json());
  }
  useEffect(() => { load(); }, []);
  const unread = items.filter(i => !i.isRead).length;
  async function markRead(id: string) {
    await fetch(`/api/notifications/${id}/read`, { method: "POST" });
    await load();
  }
  return <div className="relative">
    <button type="button" onClick={() => setOpen(v => !v)} className="relative rounded-full border p-2 hover:bg-slate-50" aria-label="notifications">
      <Bell size={18} />
      {unread > 0 ? <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">{unread}</span> : null}
    </button>
    {open ? <div className="absolute right-0 mt-2 w-96 max-w-[calc(100vw-2rem)] rounded-xl border bg-white p-3 shadow-xl">
      <div className="mb-2 flex items-center justify-between"><div className="font-semibold">Notifications</div><button className="text-xs text-slate-500" onClick={load}>refresh</button></div>
      <div className="max-h-96 space-y-2 overflow-auto">
        {items.length === 0 ? <div className="p-4 text-center text-sm text-slate-500">ยังไม่มี notification</div> : items.map(item => <div key={item.id} className={`rounded-lg border p-3 text-sm ${item.isRead ? "bg-white" : "bg-blue-50"}`}>
          <div className="font-semibold">{item.title}</div>
          <div className="text-slate-600">{item.message}</div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500"><span>{formatDateTime(item.createdAt)}</span>{!item.isRead ? <button className="rounded border px-2 py-1" onClick={() => markRead(item.id)}>อ่านแล้ว</button> : null}</div>
        </div>)}
      </div>
    </div> : null}
  </div>;
}
