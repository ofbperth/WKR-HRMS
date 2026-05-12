import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AppShell } from "@/components/layout/sidebar";
import { RoleHome } from "@/components/role-home";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MonthlyReportButton } from "@/components/reports/monthly-report-button";
import { prisma } from "@/lib/prisma";

const actionClass = "rounded-lg border border-emerald-100 bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:bg-emerald-50";

export default async function Page() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const [total, rcaRequired, sentinel] = await Promise.all([
    prisma.incident.count(),
    prisma.incident.count({ where: { status: "RCARequired" } }),
    prisma.incident.count({ where: { isSentinel: true } }),
  ]);
  return <AppShell user={user}><RoleHome title="RM Team Workbench" description="Triage incident, ค้นหา, ติดตาม RCA และบริหาร Risk Log">
    <div className="grid gap-4 md:grid-cols-3">
      <Card><CardHeader><CardTitle>Incident ทั้งหมด</CardTitle></CardHeader><CardContent className="text-3xl font-bold text-slate-950">{total}</CardContent></Card>
      <Link href="/rm/search?status=RCARequired" className="block"><Card className="h-full transition hover:-translate-y-0.5 hover:bg-emerald-50"><CardHeader><CardTitle>RCA Required</CardTitle></CardHeader><CardContent className="text-3xl font-bold text-amber-600">{rcaRequired}</CardContent></Card></Link>
      <Link href="/rm/search?sentinel=true" className="block"><Card className="h-full transition hover:-translate-y-0.5 hover:bg-emerald-50"><CardHeader><CardTitle>Sentinel</CardTitle></CardHeader><CardContent className="text-3xl font-bold text-red-600">{sentinel}</CardContent></Card></Link>
    </div>
    <div className="grid gap-4 md:grid-cols-3">
      <Link href="/report/new" className={actionClass}><div className="font-semibold text-slate-900">รายงาน Incident</div><p className="mt-1 text-sm text-slate-600">เปิด incident report form</p></Link>
      <Link href="/my-reports" className={actionClass}><div className="font-semibold text-slate-900">My Reports</div><p className="mt-1 text-sm text-slate-600">ดูรายงานของตนเอง</p></Link>
      <Link href="/rm/search" className={actionClass}><div className="font-semibold text-slate-900">Search / Export</div><p className="mt-1 text-sm text-slate-600">Find, filter, open, and export incidents</p></Link>
      <Link href="/rm/triage" className={actionClass}><div className="font-semibold text-slate-900">Triage</div><p className="mt-1 text-sm text-slate-600">Review and classify new incidents</p></Link>
      <Link href="/rm/rca" className={actionClass}><div className="font-semibold text-slate-900">RCA Review</div><p className="mt-1 text-sm text-slate-600">Approve RCA or request revision</p></Link>
      <Link href="/rm/actions" className={actionClass}><div className="font-semibold text-slate-900">Actions</div><p className="mt-1 text-sm text-slate-600">Track action plans and verification</p></Link>
      <Link href="/rm/heatmap" className={actionClass}><div className="font-semibold text-slate-900">Heatmap</div><p className="mt-1 text-sm text-slate-600">Unit and severity heatmap from incident data</p></Link>
      <Link href="/rm/reports" className={actionClass}><div className="font-semibold text-slate-900">Reports</div><p className="mt-1 text-sm text-slate-600">Review RM reports and analytics outputs</p></Link>
    </div>
    <Card><CardHeader><CardTitle>Monthly report</CardTitle></CardHeader><CardContent><MonthlyReportButton /></CardContent></Card>
  </RoleHome></AppShell>;
}
