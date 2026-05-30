"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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

const notificationCacheKey = "wkr-hrms-notifications";

export function NotificationBell({ role }: { role: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadedOnce, setLoadedOnce] = useState(false);

  async function load() {
    setIsLoading(true);
    const res = await fetch("/api/notifications", { cache: "no-store" });
    if (res.ok) {
      const nextItems = await res.json();
      setItems(nextItems);
      setLoadedOnce(true);
      try {
        sessionStorage.setItem(notificationCacheKey, JSON.stringify(nextItems));
      } catch {
        // Ignore cache write issues and keep the live result in memory.
      }
    }
    setIsLoading(false);
  }

  useEffect(() => {
    try {
      const cached = sessionStorage.getItem(notificationCacheKey);
      if (!cached) return;
      const nextItems = JSON.parse(cached);
      if (Array.isArray(nextItems)) {
        setItems(nextItems);
        setLoadedOnce(true);
      }
    } catch {
      // Ignore cache read issues and fall back to loading on demand.
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    load();
    const interval = window.setInterval(load, 60_000);
    return () => window.clearInterval(interval);
  }, [open]);

  const unread = items.filter((item) => !item.isRead).length;

  async function openNotification(item: NotificationItem) {
    if (!item.isRead) {
      await fetch(`/api/notifications/${item.id}/read`, { method: "POST" });
    }
    await load();
    setOpen(false);
    if (!item.relatedIncidentId) return;
    const base = role === "UnitManager" ? "/unit/incidents" : role === "Reporter" ? "/my-reports" : "/rm/search";
    router.push(`${base}/${item.relatedIncidentId}`);
  }

  return <div className="relative">
    <button type="button" onClick={() => setOpen((value) => !value)} className="relative rounded-full border p-2 hover:bg-slate-50" aria-label="การแจ้งเตือน">
      <Bell size={18} />
      {unread > 0 ? <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">{unread}</span> : null}
    </button>
    {open ? <div className="absolute right-0 mt-2 w-96 max-w-[calc(100vw-2rem)] rounded-xl border bg-white p-3 shadow-xl">
      <div className="mb-2 flex items-center justify-between"><div className="font-semibold">การแจ้งเตือน</div><button className="text-xs text-slate-500" onClick={load} disabled={isLoading}>{isLoading ? "กำลังโหลด..." : "รีเฟรช"}</button></div>
      <div className="max-h-96 space-y-2 overflow-auto">
        {isLoading && !items.length ? <div className="p-4 text-center text-sm text-slate-500">กำลังโหลดการแจ้งเตือน...</div> : null}
        {!isLoading && loadedOnce && items.length === 0 ? <div className="p-4 text-center text-sm text-slate-500">ยังไม่มีการแจ้งเตือน</div> : null}
        {items.map((item) => <button type="button" onClick={() => openNotification(item)} key={item.id} className={`block w-full rounded-lg border p-3 text-left text-sm ${item.isRead ? "bg-white" : "bg-blue-50"} hover:bg-slate-50`}>
          <div className="font-semibold">{item.title}</div>
          <div className="text-slate-600">{item.message}</div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500"><span>{formatDateTime(item.createdAt)}</span><span>{item.relatedIncidentId ? "เปิดเคส" : item.isRead ? "อ่านแล้ว" : "ทำเป็นอ่านแล้ว"}</span></div>
        </button>)}
      </div>
    </div> : null}
  </div>;
}
