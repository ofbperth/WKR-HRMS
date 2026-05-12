"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const colors = ["#2563eb", "#059669", "#d97706", "#dc2626", "#7c3aed", "#0891b2", "#65a30d", "#be123c", "#4b5563"];
type Drilldown = { basePath: string; param: string; field: string };

export function StatCard({ title, value, caption }: { title: string; value: number | string; caption?: string }) {
  return <Card><CardHeader><CardTitle>{title}</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold">{value}</div>{caption ? <p className="mt-1 text-xs text-slate-500">{caption}</p> : null}</CardContent></Card>;
}

export function LinkedStatCard({ title, value, href, caption }: { title: string; value: number | string; href: string; caption?: string }) {
  return <Link href={href} className="block rounded-lg transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500">
    <StatCard title={title} value={value} caption={caption} />
  </Link>;
}

export function TrendLineChart({ title, data, high = false }: { title: string; data: any[]; high?: boolean }) {
  return <ChartCard title={title}>{data.length === 0 ? <Empty /> : <ResponsiveContainer width="100%" height={240}><LineChart data={data}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="month" /><YAxis allowDecimals={false} /><Tooltip /><Line type="monotone" dataKey={high ? "high" : "total"} stroke="#2563eb" strokeWidth={2} /></LineChart></ResponsiveContainer>}</ChartCard>;
}

export function RateLineChart({ title, data, dataKey = "nearMissRate" }: { title: string; data: any[]; dataKey?: string }) {
  return <ChartCard title={title}>{data.length === 0 ? <Empty /> : <ResponsiveContainer width="100%" height={240}><LineChart data={data}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="month" /><YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} /><Tooltip formatter={(value) => [`${value}%`, "Rate"]} /><Line type="monotone" dataKey={dataKey} stroke="#dc2626" strokeWidth={2} /></LineChart></ResponsiveContainer>}</ChartCard>;
}

export function SeverityBarChart({ title, data, drilldown }: { title: string; data: any[]; drilldown?: Drilldown }) {
  const router = useRouter();
  const open = (item: any) => {
    const href = drilldownHref(item, drilldown);
    if (href) router.push(href);
  };
  return <ChartCard title={title}><ResponsiveContainer width="100%" height={240}><BarChart data={data}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="value" onClick={open}>{data.map((item, i) => <Cell key={i} fill={colors[i % colors.length]} className={drilldownHref(item, drilldown) ? "cursor-pointer" : ""} />)}</Bar></BarChart></ResponsiveContainer></ChartCard>;
}

export function CategoryPieChart({ title, data, drilldown }: { title: string; data: any[]; drilldown?: Drilldown }) {
  const router = useRouter();
  const open = (item: any) => {
    const href = drilldownHref(item, drilldown);
    if (href) router.push(href);
  };
  return <ChartCard title={title}>{data.every(item => item.value === 0) ? <Empty /> : <ResponsiveContainer width="100%" height={240}><PieChart><Pie data={data} dataKey="value" nameKey="name" outerRadius={90} label onClick={open}>{data.map((item, i) => <Cell key={i} fill={colors[i % colors.length]} className={drilldownHref(item, drilldown) ? "cursor-pointer" : ""} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer>}</ChartCard>;
}

export function TopRiskCodeBarChart({ title, data, dataKey = "value", labelKey = "riskCode", drilldown }: { title: string; data: any[]; dataKey?: string; labelKey?: string; drilldown?: Drilldown }) {
  const router = useRouter();
  const open = (item: any) => {
    const href = drilldownHref(item, drilldown);
    if (href) router.push(href);
  };
  const chartHeight = Math.max(320, data.length * 58);
  return <ChartCard title={title} className="lg:col-span-2" contentClassName="overflow-x-auto">
    {data.length === 0 ? <Empty /> : <div className="min-w-[760px]">
      <ResponsiveContainer width="100%" height={chartHeight}>
        <BarChart data={data} layout="vertical" margin={{ top: 8, right: 32, bottom: 8, left: 8 }} barCategoryGap={18}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" allowDecimals={false} />
          <YAxis
            type="category"
            dataKey={labelKey}
            width={300}
            tick={{ fontSize: 12, fill: "#475569" }}
            tickFormatter={compactChartLabel}
            interval={0}
          />
          <Tooltip formatter={(value) => [value, "Count"]} labelFormatter={(label) => String(label)} />
          <Bar dataKey={dataKey} fill="#10b981" radius={[0, 6, 6, 0]} onClick={open} className={drilldown ? "cursor-pointer" : ""} />
        </BarChart>
      </ResponsiveContainer>
    </div>}
  </ChartCard>;
}

export function UnitRankingChart({ title, data, score = false, drilldown }: { title: string; data: any[]; score?: boolean; drilldown?: Drilldown }) {
  return <TopRiskCodeBarChart title={title} data={data} dataKey={score ? "score" : "value"} labelKey="unit" drilldown={drilldown} />;
}

export function SentinelEventList({ title, data }: { title: string; data: Array<{ id: string; incidentNo: string; unit: string; severity: string; riskCode: string; title: string; status: string }> }) {
  return <ChartCard title={title} className="lg:col-span-2">
    {data.length === 0 ? <Empty /> : <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead className="border-b text-xs uppercase text-slate-500"><tr><th className="py-2 pr-3">Incident</th><th className="py-2 pr-3">Unit</th><th className="py-2 pr-3">Severity</th><th className="py-2 pr-3">Risk</th><th className="py-2 pr-3">Title</th><th className="py-2 pr-3">Status</th></tr></thead>
        <tbody className="divide-y">{data.map(item => <tr key={item.id}><td className="py-3 pr-3 font-semibold"><Link className="text-blue-700 underline" href={`/rm/search/${item.id}`}>{item.incidentNo}</Link></td><td className="py-3 pr-3">{item.unit}</td><td className="py-3 pr-3">{item.severity}</td><td className="py-3 pr-3">{item.riskCode}</td><td className="py-3 pr-3">{item.title}</td><td className="py-3 pr-3">{item.status}</td></tr>)}</tbody>
      </table>
    </div>}
  </ChartCard>;
}

function ChartCard({ title, children, className, contentClassName }: { title: string; children: React.ReactNode; className?: string; contentClassName?: string }) {
  return <Card className={className}><CardHeader><CardTitle>{title}</CardTitle></CardHeader><CardContent className={contentClassName}>{children}</CardContent></Card>;
}

function Empty() {
  return <div className="flex h-48 items-center justify-center rounded-lg border bg-slate-50 text-sm text-slate-500">No data</div>;
}

function compactChartLabel(value: unknown) {
  const text = String(value ?? "");
  if (text.length <= 42) return text;
  const code = text.match(/^[A-Z]{2,4}\d{3}/)?.[0];
  const withoutCode = code ? text.slice(code.length).trim() : text;
  const cleaned = withoutCode.replace(/\s*\([^)]{18,}\)\s*/g, " ").replace(/\s+/g, " ").trim();
  const label = cleaned.length > 46 ? `${cleaned.slice(0, 43)}...` : cleaned;
  return code ? `${code} ${label}` : label;
}

function drilldownHref(item: any, drilldown?: Drilldown) {
  if (!drilldown) return undefined;
  const source = item?.payload ?? item;
  const value = source?.[drilldown.field];
  if (value === undefined || value === null || value === "" || source?.value === 0) return undefined;
  const params = new URLSearchParams({ [drilldown.param]: String(value) });
  return `${drilldown.basePath}?${params.toString()}`;
}
