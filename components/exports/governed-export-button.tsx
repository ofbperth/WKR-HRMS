"use client";

import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { formatDateTime } from "@/lib/format";
import { Button } from "@/components/ui/button";
import type { ExportKind } from "@/lib/types";

const minReasonLength = 10;

type ExportJobRow = {
  id: string;
  kind: string;
  reason: string;
  status: "Queued" | "Running" | "Succeeded" | "Failed" | "Expired";
  attemptCount: number;
  requestedAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  expiresAt: string | null;
  filename: string | null;
  contentType: string | null;
  rowCount: number | null;
  lastError: string | null;
  canRetry: boolean;
  canDownload: boolean;
};

function errorMessage(error: string) {
  if (error === "EXPORT_REASON_REQUIRED") return "กรุณาระบุเหตุผลอย่างน้อย 10 ตัวอักษร";
  if (error === "EXPORT_RATE_LIMITED") return "คุณส่งออกข้อมูลบ่อยเกินไปในช่วงเวลานี้ กรุณาลองใหม่ภายหลัง";
  if (error === "EXPORT_SCOPE_FORBIDDEN") return "คุณไม่มีสิทธิ์ส่งออกข้อมูลในขอบเขตนี้";
  if (error === "EXPORT_JOB_NOT_DOWNLOADABLE") return "ไฟล์นี้ดาวน์โหลดไม่ได้แล้ว กรุณาสร้างใหม่";
  if (error === "EXPORT_JOB_RETRY_NOT_ALLOWED") return "job นี้ยัง retry ไม่ได้";
  return error || "ไม่สามารถส่งออกข้อมูลได้";
}

function statusLabel(status: ExportJobRow["status"]) {
  if (status === "Queued") return "รอประมวลผล";
  if (status === "Running") return "กำลังสร้างไฟล์";
  if (status === "Succeeded") return "พร้อมดาวน์โหลด";
  if (status === "Failed") return "ล้มเหลว";
  return "หมดอายุ";
}

function statusClass(status: ExportJobRow["status"]) {
  if (status === "Succeeded") return "bg-emerald-50 text-emerald-700";
  if (status === "Failed") return "bg-red-50 text-red-700";
  if (status === "Expired") return "bg-amber-50 text-amber-700";
  return "bg-slate-100 text-slate-700";
}

export function GovernedExportButton({
  endpoint,
  label,
  exportKind,
  filters,
  reasonPrompt,
  className = "rounded-md border bg-white px-3 py-2 text-sm",
}: {
  endpoint: string;
  label: string;
  exportKind: ExportKind;
  filters?: Record<string, string | string[]>;
  reasonPrompt?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [jobs, setJobs] = useState<ExportJobRow[]>([]);
  const fieldId = useId();
  const trimmedReason = useMemo(() => reason.trim(), [reason]);
  const tooShort = trimmedReason.length > 0 && trimmedReason.length < minReasonLength;
  const activeJobs = jobs.some((job) => job.status === "Queued" || job.status === "Running");

  const loadJobs = useCallback(async (silent = false) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    const response = await fetch(`/api/exports/jobs?kind=${encodeURIComponent(exportKind)}&pageSize=8`, { cache: "no-store" });
    const data = await response.json().catch(() => ({}));
    if (response.ok && Array.isArray(data.data)) {
      setJobs(data.data);
      if (!silent) setError("");
    } else if (!silent) {
      setError(String(data.error || "EXPORT_HISTORY_LOAD_FAILED"));
    }
    if (silent) {
      setRefreshing(false);
    } else {
      setLoading(false);
    }
  }, [exportKind]);

  useEffect(() => {
    if (!open) return;
    void loadJobs();
  }, [open, loadJobs]);

  useEffect(() => {
    if (!open || !activeJobs) return;
    const timer = window.setInterval(() => {
      void loadJobs(true);
    }, 3000);
    return () => window.clearInterval(timer);
  }, [open, activeJobs, loadJobs]);

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
    const data = await response.json().catch(() => ({}));
    setLoading(false);
    if (!response.ok || !data.jobId) {
      setError(String(data.error || "EXPORT_FAILED"));
      return;
    }

    setReason("");
    await loadJobs();
  }

  async function retryJob(jobId: string) {
    setRefreshing(true);
    setError("");
    const response = await fetch(`/api/exports/jobs/${jobId}/retry`, { method: "POST" });
    const data = await response.json().catch(() => ({}));
    setRefreshing(false);
    if (!response.ok) {
      setError(String(data.error || "EXPORT_RETRY_FAILED"));
      return;
    }
    await loadJobs(true);
  }

  async function downloadJob(jobId: string) {
    setRefreshing(true);
    setError("");
    const response = await fetch(`/api/exports/jobs/${jobId}/download`, { method: "POST" });
    const data = await response.json().catch(() => ({}));
    setRefreshing(false);
    if (!response.ok || !data.url) {
      setError(String(data.error || "EXPORT_DOWNLOAD_FAILED"));
      await loadJobs(true);
      return;
    }
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
        {loading ? "กำลังเตรียม..." : label}
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-4xl rounded-2xl bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <h2 className="text-lg font-semibold">ยืนยันการส่งออกข้อมูล</h2>
                <p className="text-sm text-slate-600">
                  {reasonPrompt ?? "กรุณาระบุเหตุผลในการส่งออกข้อมูลเพื่อบันทึกการตรวจสอบ"}
                </p>
              </div>
              <button type="button" className="rounded-md border px-3 py-2 text-sm" onClick={closeDialog} disabled={loading}>
                ปิด
              </button>
            </div>

            <div className="mt-4 grid gap-5 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
              <div className="space-y-2">
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
                <div className="flex gap-2 pt-2">
                  <Button onClick={startExport} disabled={loading || trimmedReason.length < minReasonLength}>
                    {loading ? "กำลังสร้าง job..." : "สร้าง Export Job"}
                  </Button>
                  <button type="button" className="rounded-md border px-4 py-2 text-sm" onClick={() => void loadJobs()} disabled={loading || refreshing}>
                    {refreshing ? "กำลังรีเฟรช..." : "รีเฟรช"}
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold">Export History</h3>
                    <p className="text-xs text-slate-500">แสดงเฉพาะประวัติของคุณสำหรับ export ประเภทนี้</p>
                  </div>
                  {activeJobs ? <span className="text-xs text-amber-700">กำลังติดตามสถานะอัตโนมัติ</span> : null}
                </div>

                <div className="max-h-[420px] overflow-auto rounded-xl border">
                  {jobs.length === 0 ? (
                    <div className="px-4 py-8 text-center text-sm text-slate-500">ยังไม่มีประวัติการส่งออก</div>
                  ) : (
                    <div className="divide-y">
                      {jobs.map((job) => (
                        <div key={job.id} className="space-y-3 p-4">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="min-w-0">
                              <div className="truncate text-sm font-semibold">{job.filename ?? "กำลังเตรียมไฟล์"}</div>
                              <div className="text-xs text-slate-500">
                                ขอเมื่อ {formatDateTime(job.requestedAt)} • ครั้งที่ {job.attemptCount}
                              </div>
                            </div>
                            <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClass(job.status)}`}>
                              {statusLabel(job.status)}
                            </span>
                          </div>

                          <div className="grid gap-2 text-xs text-slate-600 md:grid-cols-2">
                            <div>เหตุผล: {job.reason}</div>
                            <div>จำนวนแถว: {job.rowCount ?? "-"}</div>
                            <div>เสร็จเมื่อ: {job.finishedAt ? formatDateTime(job.finishedAt) : "-"}</div>
                            <div>หมดอายุ: {job.expiresAt ? formatDateTime(job.expiresAt) : "-"}</div>
                          </div>

                          {job.lastError ? <div className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">{job.lastError}</div> : null}

                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              className="rounded-md border px-3 py-2 text-xs"
                              onClick={() => void downloadJob(job.id)}
                              disabled={!job.canDownload || refreshing}
                            >
                              ดาวน์โหลด
                            </button>
                            <button
                              type="button"
                              className="rounded-md border px-3 py-2 text-xs"
                              onClick={() => void retryJob(job.id)}
                              disabled={!job.canRetry || refreshing}
                            >
                              Retry
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
