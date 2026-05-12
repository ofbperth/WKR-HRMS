"use client";

import { useState } from "react";
import { maskHn } from "@/lib/format";
import { Button } from "@/components/ui/button";

export function PatientIdentifierReveal({ incidentId, patientHn, patientAn, requesterName }: { incidentId: string; patientHn: string | null; patientAn?: string | null; requesterName: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [revealed, setRevealed] = useState<{ patientHn: string; patientAn: string } | null>(null);
  const [error, setError] = useState("");

  async function reveal() {
    setError("");
    if (reason.trim().length < 10) {
      setError("กรุณาระบุเหตุผลในการเข้าดูอย่างน้อย 10 ตัวอักษร");
      return;
    }
    if (!confirmed) {
      setError("กรุณายืนยันการรักษาข้อมูลส่วนบุคคลตามกฎหมาย PDPA");
      return;
    }
    setLoading(true);
    const res = await fetch(`/api/incidents/${incidentId}/sensitive`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason, pdpaConfirmed: confirmed }),
    });
    setLoading(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error === "REASON_REQUIRED" ? "กรุณาระบุเหตุผลในการเข้าดู" : "ไม่สามารถเปิดดูข้อมูลได้");
      return;
    }
    setRevealed({ patientHn: data.patientHn ?? "-", patientAn: data.patientAn ?? "-" });
    setOpen(false);
  }

  return <div className="rounded-lg border bg-slate-50 p-3">
    <div className="grid gap-2 sm:grid-cols-2">
      <Identifier label="Patient HN" value={revealed?.patientHn ?? maskHn(patientHn)} revealed={!!revealed} />
      <Identifier label="Patient AN" value={revealed?.patientAn ?? maskHn(patientAn ?? null)} revealed={!!revealed} />
    </div>
    {!revealed ? <Button type="button" className="mt-3" onClick={() => setOpen(true)}>ขอดู HN/AN</Button> : <p className="mt-3 text-xs text-red-700">ข้อมูลถูกเปิดดูแล้วใน session นี้ และมีการบันทึก audit log</p>}

    {open ? <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-5 shadow-xl">
        <div className="text-lg font-bold">ขอเปิดดูข้อมูล HN/AN</div>
        <p className="mt-2 text-sm text-slate-600">ผู้ขอเปิดดู: <span className="font-semibold text-slate-900">{requesterName}</span></p>
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          ข้อมูล HN/AN เป็นข้อมูลส่วนบุคคลของผู้ป่วยตามกฎหมายคุ้มครองข้อมูลส่วนบุคคล กรุณาเปิดดูเฉพาะเท่าที่จำเป็นต่อการปฏิบัติงานด้านความปลอดภัยและการบริหารความเสี่ยงของโรงพยาบาล ห้ามนำไปใช้ เปิดเผย ส่งต่อ หรือบันทึกซ้ำนอกวัตถุประสงค์ของระบบโดยไม่ได้รับอนุญาต
        </div>
        <label className="mt-4 block space-y-1 text-sm">
          <span className="font-medium">เหตุผลในการเข้าดู</span>
          <textarea className="min-h-24 w-full rounded-md border px-3 py-2 text-sm" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="เช่น ตรวจสอบข้อมูลเพื่อประสานการทบทวน RCA / ติดตาม action plan / ยืนยันเคสที่เกี่ยวข้อง" />
        </label>
        <label className="mt-3 flex items-start gap-2 text-sm">
          <input className="mt-1" type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />
          <span>ข้าพเจ้ายืนยันว่าจะรักษาข้อมูลส่วนบุคคลของผู้ป่วยตามกฎหมาย PDPA และนโยบายของโรงพยาบาล ใช้ข้อมูลเฉพาะตามเหตุผลที่ระบุ และยอมรับว่าการเข้าดูครั้งนี้จะถูกบันทึกใน audit log</span>
        </label>
        {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <Button type="button" className="bg-slate-700" onClick={() => setOpen(false)} disabled={loading}>ยกเลิก</Button>
          <Button type="button" onClick={reveal} disabled={loading}>{loading ? "กำลังบันทึก..." : "ยืนยันและเปิดดู"}</Button>
        </div>
      </div>
    </div> : null}
  </div>;
}

function Identifier({ label, value, revealed }: { label: string; value: string; revealed: boolean }) {
  return <div>
    <div className="text-xs font-medium text-slate-500">{label}</div>
    <div className={revealed ? "mt-1 font-semibold text-red-700" : "mt-1 font-semibold text-slate-900"}>{value}</div>
  </div>;
}
