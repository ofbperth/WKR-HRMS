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
  const [readAllLoading, setReadAllLoading] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch("/api/notifications", { cache: "no-store" });
      if (!res.ok) throw new Error("NOTIFICATIONS_LOAD_FAILED");
      const nextItems = await res.json();
      setItems(nextItems);
      setLoadedOnce(true);
      try {
        sessionStorage.setItem(notificationCacheKey, JSON.stringify(nextItems));
      } catch {
        // Ignore cache write issues and keep the live result in memory.
      }
    } catch {
      setError("โหลดการแจ้งเตือนไม่สำเร็จ กรุณาลองใหม่");
    } finally {
      setIsLoading(false);
    }
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

  async function readAll() {
    if (readAllLoading || unread === 0) return;
    setError("");
    setReadAllLoading(true);
    try {
      const res = await fetch("/api/notifications/read-all", { method: "POST" });
      if (!res.ok) throw new Error("READ_ALL_FAILED");
      setItems((current) => current.map((item) => ({ ...item, isRead: true })));
      await load();
    } catch {
      setError("อ่านทั้งหมดไม่สำเร็จ กรุณาลองใหม่");
    } finally {
      setReadAllLoading(false);
    }
  }

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
    {open ? <div className="fixed inset-x-3 top-16 z-50 max-h-[calc(100vh-5rem)] overflow-hidden rounded-xl border bg-white p-3 shadow-xl sm:absolute sm:inset-auto sm:right-0 sm:top-auto sm:mt-2 sm:w-96 sm:max-w-[calc(100vw-2rem)]">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="font-semibold">การแจ้งเตือน</div>
        <div className="flex items-center gap-2">
          <button className="rounded-md border px-2 py-1 text-xs text-slate-600 disabled:cursor-not-allowed disabled:opacity-50" type="button" onClick={readAll} disabled={readAllLoading || unread === 0}>{readAllLoading ? "กำลังอ่าน..." : "อ่านทั้งหมดแล้ว"}</button>
          <button className="text-xs text-slate-500 disabled:cursor-not-allowed disabled:opacity-50" type="button" onClick={load} disabled={isLoading}>{isLoading ? "กำลังโหลด..." : "รีเฟรช"}</button>
        </div>
      </div>
      {error ? <div className="mb-2 rounded-md border border-red-100 bg-red-50 p-2 text-xs text-red-700">{error}</div> : null}
      <div className="max-h-[calc(100vh-9rem)] space-y-2 overflow-auto sm:max-h-96">
        {isLoading && !items.length ? <div className="p-4 text-center text-sm text-slate-500">กำลังโหลดการแจ้งเตือน...</div> : null}
        {!isLoading && loadedOnce && items.length === 0 ? <div className="p-4 text-center text-sm text-slate-500">ยังไม่มีการแจ้งเตือน</div> : null}
        {items.map((item) => <button type="button" onClick={() => openNotification(item)} key={item.id} className={`block w-full rounded-lg border p-3 text-left text-sm ${item.isRead ? "bg-white" : "bg-blue-50"} hover:bg-slate-50`}>
          <div className="break-words font-semibold [overflow-wrap:anywhere]">{item.title}</div>
          <div className="break-words text-slate-600 [overflow-wrap:anywhere]">{item.message}</div>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500"><span>{formatDateTime(item.createdAt)}</span><span>{item.relatedIncidentId ? "เปิดเคส" : item.isRead ? "อ่านแล้ว" : "ทำเป็นอ่านแล้ว"}</span></div>
        </button>)}
      </div>
    </div> : null}
  </div>;
}
