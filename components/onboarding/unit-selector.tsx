"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function UnitSelector({ units, next }: { units: Array<{ id: string; name: string }>; next: string }) {
  const router = useRouter();
  const [unitId, setUnitId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    if (!unitId) {
      setError("กรุณาเลือกหน่วยงาน");
      return;
    }
    setSaving(true);
    setError("");
    const res = await fetch("/api/onboarding/unit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ unitId }) });
    setSaving(false);
    if (!res.ok) {
      setError("บันทึกหน่วยงานไม่สำเร็จ กรุณาลองใหม่");
      return;
    }
    router.replace(next);
    router.refresh();
  }

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
    <div className="w-full max-w-lg rounded-lg bg-white p-5 shadow-xl">
      <div className="space-y-2"><h1 className="text-2xl font-bold">เลือกหน่วยงานก่อนเข้าใช้งาน</h1><p className="text-sm text-slate-600">สำหรับการเข้าสู่ระบบด้วย Google ครั้งแรก กรุณาเลือกหน่วยงานของคุณเพื่อใช้กำหนด workflow และสิทธิ์การรายงาน incident</p></div>
      <div className="mt-5 space-y-4">
        <label className="grid gap-1 text-sm font-medium">หน่วยงาน<select className="h-10 rounded-md border px-3 text-sm" value={unitId} onChange={e => setUnitId(e.target.value)}><option value="">เลือกหน่วยงาน</option>{units.map(unit => <option key={unit.id} value={unit.id}>{unit.name}</option>)}</select></label>
        {error ? <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}
        <Button type="button" onClick={submit} disabled={saving} className="w-full">{saving ? "กำลังบันทึก..." : "บันทึกและเข้าใช้งาน"}</Button>
      </div>
    </div>
  </div>;
}

