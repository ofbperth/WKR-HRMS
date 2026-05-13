"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function UnitSelector({ units, next }: { units: Array<{ id: string; name: string }>; next: string }) {
  const router = useRouter();
  const [unitId, setUnitId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isOpen, setIsOpen] = useState(true);

  const selectedUnit = units.find((unit) => unit.id === unitId);

  async function submit() {
    if (saving) return;
    if (!unitId) {
      setSuccess("");
      setError("กรุณาเลือกหน่วยงาน");
      return;
    }
    const started = performance.now();
    setSaving(true);
    setError("");
    setSuccess("กำลังบันทึก...");
    setIsOpen(false);
    try {
      const res = await fetch("/api/onboarding/unit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ unitId }) });
      if (!res.ok) {
        setError("ไม่สำเร็จ ลองอีกครั้ง");
        setSuccess("");
        setIsOpen(true);
        return;
      }
      if (process.env.NODE_ENV === "development") {
        console.info(`[perf] org-selection-save ${Math.round(performance.now() - started)}ms`);
      }
      setSuccess("บันทึกแล้ว");
      router.replace(next);
    } catch (err) {
      console.error("Unit selection failed", err);
      setError("ไม่สำเร็จ ลองอีกครั้ง");
      setSuccess("");
      setIsOpen(true);
    } finally {
      setSaving(false);
    }
  }

  if (!isOpen) {
    return <div className="fixed bottom-4 right-4 z-50 max-w-sm rounded-lg border border-emerald-100 bg-white px-4 py-3 text-sm text-slate-700 shadow-lg">
      <div className="font-semibold text-emerald-700">{success || "กำลังบันทึก..."}</div>
      <div className="mt-1 text-xs text-slate-500">{selectedUnit ? `หน่วยงาน: ${selectedUnit.name}` : "กำลังอัปเดตหน่วยงาน"}</div>
    </div>;
  }

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
    <div className="w-full max-w-lg rounded-lg bg-white p-5 shadow-xl">
      <div className="space-y-2"><h1 className="text-2xl font-bold">เลือกหน่วยงานก่อนเข้าใช้งาน</h1><p className="text-sm text-slate-600">สำหรับการเข้าสู่ระบบด้วย Google ครั้งแรก กรุณาเลือกหน่วยงานของคุณเพื่อใช้กำหนด workflow และสิทธิ์การรายงาน incident</p></div>
      <div className="mt-5 space-y-4">
        <label className="grid gap-1 text-sm font-medium">หน่วยงาน<select className="h-10 rounded-md border px-3 text-sm" value={unitId} onChange={e => { setUnitId(e.target.value); setError(""); setSuccess(""); }}><option value="">เลือกหน่วยงาน</option>{units.map(unit => <option key={unit.id} value={unit.id}>{unit.name}</option>)}</select></label>
        {error ? <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}
        {success ? <div className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">{success}</div> : null}
        <Button type="button" onClick={submit} disabled={saving} aria-busy={saving} className="w-full">{saving ? "กำลังบันทึก..." : "บันทึกและเข้าใช้งาน"}</Button>
      </div>
    </div>
  </div>;
}

