import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function StatCard({ title, value, caption }: { title: string; value: number | string; caption?: string }) {
  return <Card><CardHeader><CardTitle>{title}</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold">{value}</div>{caption ? <p className="mt-1 text-xs text-slate-500">{caption}</p> : null}</CardContent></Card>;
}

export function LinkedStatCard({ title, value, href, caption }: { title: string; value: number | string; href: string; caption?: string }) {
  return <Link href={href} className="block rounded-lg transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500">
    <StatCard title={title} value={value} caption={caption} />
  </Link>;
}
