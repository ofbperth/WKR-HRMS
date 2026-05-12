"use client";

import Link from "next/link";
import { Line, LineChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const tone: Record<string, string> = {
  Good: "border-emerald-200 bg-emerald-50 text-emerald-700",
  Watch: "border-amber-200 bg-amber-50 text-amber-700",
  Critical: "border-red-200 bg-red-50 text-red-700",
};

export function SafetyGoalCard({ goal }: { goal: any }) {
  const query = goal.relatedRiskCodes.map((code: string) => `q=${encodeURIComponent(code)}`).join("&");
  return <Card className="overflow-hidden">
    <CardHeader><div className="flex flex-wrap items-start justify-between gap-3"><CardTitle>{goal.title}</CardTitle><span className={`rounded-full border px-2 py-1 text-xs font-semibold ${tone[goal.status]}`}>{goal.status}</span></div></CardHeader>
    <CardContent className="space-y-4 text-sm">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Info label="Incidents" value={goal.count} />
        <Info label="Highest severity" value={goal.highestSeverity} />
        <Info label="Open RCA" value={goal.openRca} />
        <Info label="Overdue action" value={goal.overdueActions} />
      </div>
      <div>
        <div className="mb-2 text-xs font-semibold uppercase text-slate-500">12-month trend</div>
        <div className="h-28 rounded-lg bg-slate-50 p-2">{goal.trend.length ? <ResponsiveContainer width="100%" height="100%"><LineChart data={goal.trend}><Tooltip /><Line type="monotone" dataKey="total" stroke="#2563eb" strokeWidth={2} dot /></LineChart></ResponsiveContainer> : <div className="flex h-full items-center justify-center text-xs text-slate-500">No trend</div>}</div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3"><div className="text-xs text-slate-500">Related risk codes: {goal.relatedRiskCodes.join(", ")}</div><Link className="inline-flex h-9 items-center rounded-md border px-3 text-sm hover:bg-slate-50" href={`/rm/search?${query}`}>View related incidents</Link></div>
    </CardContent>
  </Card>;
}

export function SafetyGoalSummaryCard({ goal, detailHref }: { goal: any; detailHref: string }) {
  return <Card className="h-full">
    <CardContent className="space-y-3 p-4 text-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0"><div className="line-clamp-2 font-semibold leading-snug">{goal.title}</div><div className="mt-1 text-xs text-slate-500">{goal.relatedRiskCodes.join(", ")}</div></div>
        <span className={`shrink-0 rounded-full border px-2 py-1 text-[11px] font-semibold ${tone[goal.status]}`}>{goal.status}</span>
      </div>
      <div className="grid grid-cols-4 gap-2 text-center">
        <Mini label="Inc" value={goal.count} />
        <Mini label="High" value={goal.highestSeverity} />
        <Mini label="RCA" value={goal.openRca} />
        <Mini label="OD" value={goal.overdueActions} />
      </div>
      <div className="h-12 rounded-md bg-slate-50 p-1">{goal.trend.length ? <ResponsiveContainer width="100%" height="100%"><LineChart data={goal.trend}><Line type="monotone" dataKey="total" stroke="#2563eb" strokeWidth={2} dot={false} /></LineChart></ResponsiveContainer> : <div className="flex h-full items-center justify-center text-[11px] text-slate-400">No trend</div>}</div>
      <div className="flex justify-end"><Link className="text-xs font-medium text-blue-700 hover:underline" href={detailHref}>View details</Link></div>
    </CardContent>
  </Card>;
}

function Info({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-md border bg-white p-2"><div className="text-xs text-slate-500">{label}</div><div className="font-semibold">{value}</div></div>;
}

function Mini({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-md border bg-white px-2 py-1"><div className="text-[10px] uppercase text-slate-400">{label}</div><div className="text-sm font-semibold">{value}</div></div>;
}
