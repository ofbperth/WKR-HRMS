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
  isActive: boolean;
};

type TabKey = "units" | "teams";
type UnitPageMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNextPage?: boolean;
};

const unitPageSize = 10;

async function readErrorCode(response: Response) {
  const body = await response.json().catch(() => null) as { error?: string } | null;
  return body?.error || null;
}

function unitAdminErrorMessage(errorCode: string | null) {
  if (errorCode === "CONFLICT") return "บันทึกหน่วยงานไม่สำเร็จ เพราะชื่อหน่วยงานซ้ำ";
  if (errorCode === "FORBIDDEN") return "คุณไม่มีสิทธิ์จัดการหน่วยงาน";
  if (errorCode === "VALIDATION_ERROR") return "บันทึกหน่วยงานไม่สำเร็จ เพราะข้อมูลไม่ครบหรือรูปแบบไม่ถูกต้อง";
  return "บันทึกหน่วยงานไม่สำเร็จ";
}

function teamAdminErrorMessage(errorCode: string | null) {
  if (errorCode === "CONFLICT") return "บันทึกทีมไม่สำเร็จ เพราะชื่อทีมหรือรหัสทีมซ้ำ";
  if (errorCode === "DB_SCHEMA_NOT_READY") return "บันทึกทีมไม่ได้ เพราะฐานข้อมูลของ environment นี้ยังไม่ได้ apply migration สำหรับ Team";
  if (errorCode === "VALIDATION_ERROR") return "บันทึกทีมไม่สำเร็จ เพราะข้อมูลไม่ครบหรือรูปแบบไม่ถูกต้อง";
  return "บันทึกทีมไม่สำเร็จ";
}

async function fetchUnitPage(targetPage: number) {
  const data = await fetch(`/api/admin/units?page=${targetPage}&pageSize=${unitPageSize}`)
    .then((response) => response.json())
    .catch(() => null);
  const items = Array.isArray(data?.data) ? data.data as UnitItem[] : [];
  const meta = data?.meta && typeof data.meta.total === "number"
    ? data.meta as UnitPageMeta
    : { page: targetPage, pageSize: unitPageSize, total: items.length, totalPages: 1 };
  return { items, meta };
}

async function findUnitPageForItem(itemId: string) {
  const data = await fetch("/api/admin/units?all=1")
    .then((response) => response.json())
    .catch(() => null);
  const items = Array.isArray(data) ? data as UnitItem[] : [];
  const index = items.findIndex((item) => item.id === itemId);
  if (index < 0) return 1;
  return Math.floor(index / unitPageSize) + 1;
}

export function AdminUnitTeamManagement() {
  const [tab, setTab] = useState<TabKey>("units");

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">จัดการหน่วยงาน/ทีม</h1>
        <p className="text-sm text-slate-600">
          แยกการจัดการหน่วยงานออกจากทีมที่เกี่ยวข้อง แต่ยังดูแลทั้งหมดได้ในเมนูเดียวเพื่อความสะดวก
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setTab("units")}
          className={`rounded-md border px-4 py-2 text-sm font-medium ${tab === "units" ? "border-emerald-500 bg-emerald-50 text-emerald-900" : "bg-white text-slate-600"}`}
        >
          หน่วยงาน
        </button>
        <button
          type="button"
          onClick={() => setTab("teams")}
          className={`rounded-md border px-4 py-2 text-sm font-medium ${tab === "teams" ? "border-emerald-500 bg-emerald-50 text-emerald-900" : "bg-white text-slate-600"}`}
        >
          ทีมที่เกี่ยวข้อง
        </button>
      </div>
      {tab === "units" ? <UnitAdminPanel /> : <TeamAdminPanel />}
    </div>
  );
}

function UnitAdminPanel() {
  const [items, setItems] = useState<UnitItem[]>([]);
  const [editing, setEditing] = useState<UnitItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<UnitPageMeta>({ page: 1, pageSize: unitPageSize, total: 0, totalPages: 1 });
  const [notice, setNotice] = useState<string | null>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  async function load(targetPage = page) {
    setLoading(true);
    const { items: nextItems, meta: nextMeta } = await fetchUnitPage(targetPage);
    setItems(nextItems);
    setMeta(nextMeta);
    setPage(nextMeta.page);
    setLoading(false);
  }

  useEffect(() => {
    let active = true;
    async function syncPage() {
      setLoading(true);
      const { items: nextItems, meta: nextMeta } = await fetchUnitPage(page);
      if (!active) return;
      setItems(nextItems);
      setMeta(nextMeta);
      setLoading(false);
    }
    void syncPage();
    return () => {
      active = false;
    };
  }, [page]);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const isEditing = !!editing?.id;
    const fd = new FormData(event.currentTarget);
    const payload = {
      id: editing?.id,
      name: String(fd.get("name") || ""),
      type: "หน่วยงาน",
      isActive: fd.get("isActive") === "on",
    };
    const response = await fetch("/api/admin/units", {
      method: editing?.id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      alert(unitAdminErrorMessage(await readErrorCode(response)));
      return;
    }
    const savedItem = await response.json() as UnitItem;
    const targetPage = await findUnitPageForItem(savedItem.id);
    setNotice(isEditing ? `บันทึกการแก้ไขหน่วยงาน ${savedItem.name} แล้ว` : `เพิ่มหน่วยงาน ${savedItem.name} แล้ว`);
    setHighlightedId(savedItem.id);
    setEditing(null);
    event.currentTarget.reset();
    await load(targetPage);
  }

  async function deactivate(id: string) {
    if (!window.confirm("ปิดใช้งานหน่วยงานนี้?")) return;
    const response = await fetch("/api/admin/units", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (!response.ok) {
      alert("ปิดใช้งานหน่วยงานไม่สำเร็จ");
      return;
    }
    if (editing?.id === id) setEditing(null);
    if (highlightedId === id) setHighlightedId(null);
    const isLastItemOnPage = items.length === 1 && page > 1;
    await load(isLastItemOnPage ? page - 1 : page);
  }

  return (
    <div className="space-y-6">
      <form key={editing?.id ?? "new-unit"} onSubmit={save} className="rounded-lg border bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="ชื่อหน่วยงาน">
            <Input name="name" defaultValue={editing?.name || ""} required />
          </Field>
          <label className="mt-6 flex items-center gap-2 text-sm">
            <input name="isActive" type="checkbox" defaultChecked={editing?.isActive ?? true} /> เปิดใช้งาน
          </label>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button type="submit">{editing ? "บันทึกการแก้ไข" : "เพิ่มหน่วยงาน"}</Button>
          {editing ? (
            <button type="button" className="rounded-md border px-4 text-sm" onClick={() => setEditing(null)}>
              ยกเลิก
            </button>
          ) : null}
        </div>
      </form>

      {notice ? <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">{notice}</div> : null}

      <div className="rounded-lg border bg-white shadow-sm">
        {loading ? (
          <div className="p-4 text-sm">กำลังโหลด...</div>
        ) : !items.length ? (
          <div className="p-4 text-sm text-slate-500">ยังไม่มีข้อมูลหน่วยงาน</div>
        ) : (
          <div className="divide-y">
            {items.map((item) => (
              <div
                key={item.id}
                className={`flex flex-col gap-3 p-4 md:flex-row md:items-start md:justify-between ${highlightedId === item.id ? "bg-emerald-50" : ""}`}
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="font-semibold">{item.name}</div>
                    <span
                      className={`rounded-full px-2 py-1 text-xs ${item.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}
                    >
                      {item.isActive ? "เปิดใช้งาน" : "ปิดใช้งาน"}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" className="rounded-md border px-3 py-1 text-sm" onClick={() => setEditing(item)}>
                    แก้ไข
                  </button>
                  <button
                    type="button"
                    className="rounded-md border border-red-200 px-3 py-1 text-sm text-red-700"
                    onClick={() => deactivate(item.id)}
                  >
                    ปิดใช้งาน
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {!loading && meta.total > meta.pageSize ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-white p-3 text-sm shadow-sm">
          <div className="text-slate-600">
            แสดง {(meta.page - 1) * meta.pageSize + 1}-{Math.min(meta.page * meta.pageSize, meta.total)} จาก {meta.total} หน่วยงาน
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded-md border px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={meta.page <= 1}
            >
              ก่อนหน้า
            </button>
            <span className="text-slate-600">หน้า {meta.page} / {meta.totalPages}</span>
            <button
              type="button"
              className="rounded-md border px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => setPage((current) => Math.min(meta.totalPages, current + 1))}
              disabled={meta.page >= meta.totalPages}
            >
              ถัดไป
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function TeamAdminPanel() {
  const [items, setItems] = useState<TeamItem[]>([]);
  const [editing, setEditing] = useState<TeamItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setLoadError(null);
    try {
      const response = await fetch("/api/admin/teams?all=1");
      if (!response.ok) {
        const errorCode = await readErrorCode(response);
        setItems([]);
        if (errorCode === "DB_SCHEMA_NOT_READY") {
          setLoadError("ยังใช้งานทีมไม่ได้ เพราะฐานข้อมูลของ environment นี้ยังไม่ได้ apply migration สำหรับ Team");
        } else {
          setLoadError("โหลดข้อมูลทีมไม่สำเร็จ");
        }
        return;
      }
      const data = await response.json();
      setItems(Array.isArray(data) ? data : []);
    } catch {
      setItems([]);
      setLoadError("โหลดข้อมูลทีมไม่สำเร็จ");
    }
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
    const payload = {
      id: editing?.id,
      name: String(fd.get("name") || ""),
      code: String(fd.get("code") || ""),
      isActive: fd.get("isActive") === "on",
    };
    const response = await fetch("/api/admin/teams", {
      method: editing?.id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      alert(teamAdminErrorMessage(await readErrorCode(response)));
      return;
    }
    setEditing(null);
    event.currentTarget.reset();
    await load();
  }

  async function deactivate(id: string) {
    if (!window.confirm("ปิดใช้งานทีมนี้?")) return;
    const response = await fetch("/api/admin/teams", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (!response.ok) {
      const errorCode = await readErrorCode(response);
      alert(errorCode === "DB_SCHEMA_NOT_READY" ? "ปิดใช้งานทีมไม่ได้ เพราะฐานข้อมูลของ environment นี้ยังไม่ได้ apply migration สำหรับ Team" : "ปิดใช้งานทีมไม่สำเร็จ");
      return;
    }
    if (editing?.id === id) setEditing(null);
    await load();
  }

  return (
    <div className="space-y-6">
      <form key={editing?.id ?? "new-team"} onSubmit={save} className="rounded-lg border bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="ชื่อทีม">
            <Input name="name" defaultValue={editing?.name || ""} required />
          </Field>
          <Field label="รหัสทีม">
            <Input name="code" defaultValue={editing?.code || ""} />
          </Field>
          <label className="mt-6 flex items-center gap-2 text-sm">
            <input name="isActive" type="checkbox" defaultChecked={editing?.isActive ?? true} /> เปิดใช้งาน
          </label>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button type="submit">{editing ? "บันทึกการแก้ไข" : "เพิ่มทีม"}</Button>
          {editing ? (
            <button type="button" className="rounded-md border px-4 text-sm" onClick={() => setEditing(null)}>
              ยกเลิก
            </button>
          ) : null}
        </div>
      </form>

      <div className="rounded-lg border bg-white shadow-sm">
        {loading ? (
          <div className="p-4 text-sm">กำลังโหลด...</div>
        ) : loadError ? (
          <div className="p-4 text-sm text-amber-700">{loadError}</div>
        ) : !items.length ? (
          <div className="p-4 text-sm text-slate-500">ยังไม่มีข้อมูลทีม</div>
        ) : (
          <div className="divide-y">
            {items.map((item) => (
              <div key={item.id} className="flex flex-col gap-3 p-4 md:flex-row md:items-start md:justify-between">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="font-semibold">{item.name}</div>
                    <span
                      className={`rounded-full px-2 py-1 text-xs ${item.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}
                    >
                      {item.isActive ? "เปิดใช้งาน" : "ปิดใช้งาน"}
                    </span>
                  </div>
                  <div className="text-sm text-slate-600">Code: {item.code || "-"}</div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" className="rounded-md border px-3 py-1 text-sm" onClick={() => setEditing(item)}>
                    แก้ไข
                  </button>
                  <button
                    type="button"
                    className="rounded-md border border-red-200 px-3 py-1 text-sm text-red-700"
                    onClick={() => deactivate(item.id)}
                  >
                    ปิดใช้งาน
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="grid gap-1 text-sm font-medium">{label}{children}</label>;
}
