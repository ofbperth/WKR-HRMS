"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/format";

type Run = { id: string; jobName: string; status: string; startedAt: string | Date; finishedAt: string | Date | null; message: string | null; error: string | null };

const jobs = [
  { id: "overdue-action-check", label: "Overdue action check" },
  { id: "due-soon-notification", label: "Due soon notification" },
  { id: "status-sync", label: "Status sync" },
  { id: "notification-cleanup", label: "Notification cleanup" },
];

export function AutomationPanel({ initialRuns }: { initialRuns: Run[] }) {
  const [runs, setRuns] = useState(initialRuns);
  const [running, setRunning] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function trigger(jobName: string) {
    setRunning(jobName);
    setMessage(null);
    const res = await fetch("/api/automation", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ jobName }) });
    setRunning(null);
    if (!res.ok) {
      setMessage("Automation ไม่สำเร็จ");
      return;
    }
    const run = await res.json();
    setRuns((current) => [run, ...current].slice(0, 10));
    setMessage(run.message ?? "Automation เสร็จแล้ว");
  }

  return <div className="space-y-4">
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {jobs.map((job) => <div key={job.id} className="rounded-lg border bg-white p-4">
        <div className="font-semibold">{job.label}</div>
        <p className="mt-1 min-h-10 text-sm text-slate-600">ปุ่มรันงานแบบป้องกัน พร้อม run log และ audit trail</p>
        <Button type="button" className="mt-3 w-full" onClick={() => trigger(job.id)} disabled={running !== null}>{running === job.id ? "กำลังรัน..." : "รันตอนนี้"}</Button>
      </div>)}
    </div>
    {message ? <div className="rounded-md border bg-slate-50 p-3 text-sm">{message}</div> : null}
    <div className="overflow-hidden rounded-xl border bg-white">
      <div className="overflow-auto">
        <table className="min-w-[900px] w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">งาน</th><th className="px-4 py-3">สถานะ</th><th className="px-4 py-3">เริ่ม</th><th className="px-4 py-3">เสร็จ</th><th className="px-4 py-3">ข้อความ</th><th className="px-4 py-3">ข้อผิดพลาด</th></tr></thead>
          <tbody className="divide-y">{runs.length === 0 ? <tr><td className="px-4 py-8 text-center text-slate-500" colSpan={6}>ยังไม่มีประวัติการรันงานอัตโนมัติ</td></tr> : runs.map((run) => <tr key={run.id}><td className="px-4 py-3 font-medium">{run.jobName}</td><td className="px-4 py-3">{run.status}</td><td className="px-4 py-3">{formatDateTime(run.startedAt)}</td><td className="px-4 py-3">{formatDateTime(run.finishedAt)}</td><td className="px-4 py-3">{run.message ?? "-"}</td><td className="px-4 py-3 text-red-700">{run.error ?? "-"}</td></tr>)}</tbody>
        </table>
      </div>
    </div>
  </div>;
}
