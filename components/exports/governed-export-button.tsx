"use client";

import { useId, useMemo, useState } from "react";

const minReasonLength = 10;

function errorMessage(error: string) {
  if (error === "EXPORT_REASON_REQUIRED") return "กรุณาระบุเหตุผลอย่างน้อย 10 ตัวอักษร";
  if (error === "EXPORT_RATE_LIMITED") return "คุณส่งออกข้อมูลบ่อยเกินไปในช่วงเวลานี้ กรุณาลองใหม่ภายหลัง";
  if (error === "EXPORT_SCOPE_FORBIDDEN") return "คุณไม่มีสิทธิ์ส่งออกข้อมูลในขอบเขตนี้";
  return error || "ไม่สามารถส่งออกข้อมูลได้";
}

export function GovernedExportButton({
  endpoint,
  label,
  filters,
  reasonPrompt,
  className = "rounded-md border bg-white px-3 py-2 text-sm",
}: {
  endpoint: string;
  label: string;
  filters?: Record<string, string | string[]>;
  reasonPrompt?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const fieldId = useId();
  const trimmedReason = useMemo(() => reason.trim(), [reason]);
  const tooShort = trimmedReason.length > 0 && trimmedReason.length < minReasonLength;

  async function startExport() {
    if (trimmedReason.length < minReasonLength) {
      setError("EXPORT_REASON_REQUIRED");
      return;
    }

    setLoading(true);
    setError("");
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: trimmedReason, filters: filters ?? {} }),
    });
    setLoading(false);
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.url) {
      setError(String(data.error || "EXPORT_FAILED"));
      return;
    }

    setOpen(false);
    setReason("");
    setError("");
    window.location.assign(data.url);
  }

  function closeDialog() {
    if (loading) return;
    setOpen(false);
    setReason("");
    setError("");
  }

  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)} disabled={loading}>
        {loading ? "กำลังเตรียมไฟล์..." : label}
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl">
            <div className="space-y-2">
              <h2 className="text-lg font-semibold">ยืนยันการส่งออกข้อมูล</h2>
              <p className="text-sm text-slate-600">
                {reasonPrompt ?? "กรุณาระบุเหตุผลในการส่งออกข้อมูลเพื่อบันทึกการตรวจสอบ"}
              </p>
            </div>

            <div className="mt-4 space-y-2">
              <label className="block text-sm font-medium" htmlFor={fieldId}>
                เหตุผลในการส่งออก
              </label>
              <textarea
                id={fieldId}
                className="min-h-28 w-full rounded-md border px-3 py-2 text-sm"
                value={reason}
                maxLength={500}
                onChange={(event) => {
                  setReason(event.target.value);
                  if (error) setError("");
                }}
                placeholder="เช่น ใช้สำหรับประชุมทบทวนประจำเดือน / เตรียมข้อมูล audit / ส่งต่อคณะกรรมการ"
              />
              <div className="flex items-center justify-between text-xs">
                <span className={tooShort ? "text-red-600" : "text-slate-500"}>
                  อย่างน้อย {minReasonLength} ตัวอักษร
                </span>
                <span className="text-slate-500">{trimmedReason.length}/500</span>
              </div>
              {error ? <p className="text-sm text-red-600">{errorMessage(error)}</p> : null}
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button type="button" className="rounded-md border px-4 py-2 text-sm" onClick={closeDialog} disabled={loading}>
                ยกเลิก
              </button>
              <button
                type="button"
                className="rounded-md bg-primary px-4 py-2 text-sm text-white disabled:opacity-60"
                onClick={startExport}
                disabled={loading || trimmedReason.length < minReasonLength}
              >
                {loading ? "กำลังเตรียมไฟล์..." : "ยืนยันและส่งออก"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
