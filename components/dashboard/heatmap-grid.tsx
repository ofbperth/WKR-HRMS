"use client";

import Link from "next/link";
import { useState } from "react";

function color(value: number, max: number) {
  const ratio = max ? value / max : 0;
  if (ratio >= 0.75) return "bg-red-600 text-white";
  if (ratio >= 0.5) return "bg-orange-400 text-white";
  if (ratio >= 0.25) return "bg-yellow-300 text-slate-900";
  if (value > 0) return "bg-emerald-100 text-emerald-800";
  return "bg-slate-50 text-slate-400";
}

export function HeatmapGrid({ data }: { data: { units: Array<{ id: string; name: string }>; yMode: string; rows: Array<{ row: string; cells: any[] }> } }) {
  const [metric, setMetric] = useState<"count" | "score">("count");
  const max = Math.max(1, ...data.rows.flatMap(row => row.cells.map(cell => metric === "count" ? cell.count : cell.score)));
  return <div className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex gap-2"><button className={`rounded-md border px-3 py-2 text-sm ${metric === "count" ? "bg-primary text-white" : "bg-white"}`} onClick={() => setMetric("count")}>มุมมองจำนวน</button><button className={`rounded-md border px-3 py-2 text-sm ${metric === "score" ? "bg-primary text-white" : "bg-white"}`} onClick={() => setMetric("score")}>มุมมอง weighted score</button></div><Legend /></div>
    <div className="overflow-hidden rounded-lg border bg-white"><div className="overflow-auto"><table className="w-full min-w-[960px] text-sm"><thead className="bg-slate-50"><tr><th className="sticky left-0 bg-slate-50 px-4 py-3 text-left">{data.yMode === "simpleCategory" ? "SIMPLE category" : "Severity"}</th>{data.units.map(unit => <th key={unit.id} className="px-3 py-3 text-center">{unit.name}</th>)}</tr></thead><tbody>{data.rows.map(row => <tr key={row.row} className="border-t"><td className="sticky left-0 bg-white px-4 py-3 font-medium">{row.row}</td>{row.cells.map(cell => <td key={`${cell.unitId}-${row.row}`} className="p-1 text-center"><Link href={`/rm/search?unitId=${cell.unitId}&${data.yMode === "simpleCategory" ? `simpleCategory=${encodeURIComponent(row.row)}` : `severity=${row.row}`}`} title={`Unit: ${cell.unit}\n${data.yMode}: ${row.row}\nIncident count: ${cell.count}\nWeighted score: ${cell.score}\nHighest severity: ${cell.highestSeverity}\nOpen RCA: ${cell.openRca}\nOverdue actions: ${cell.overdueActions}`} className={`block rounded-md px-3 py-2 font-semibold ${color(metric === "count" ? cell.count : cell.score, max)}`}>{metric === "count" ? cell.count : cell.score}</Link></td>)}</tr>)}</tbody></table></div></div>
  </div>;
}

function Legend() {
  return <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600"><span>ต่ำ</span><span className="h-4 w-8 rounded bg-emerald-100" /><span>กลาง</span><span className="h-4 w-8 rounded bg-yellow-300" /><span>สูง</span><span className="h-4 w-8 rounded bg-orange-400" /><span>วิกฤต</span><span className="h-4 w-8 rounded bg-red-600" /></div>;
}

