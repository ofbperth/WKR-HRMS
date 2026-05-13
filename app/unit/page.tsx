import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AppShell } from "@/components/layout/sidebar";
import { RoleHome } from "@/components/role-home";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";

const actionClass = "rounded-lg border border-emerald-100 bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:bg-emerald-50";

export default async function Page() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const unitScope = { incidentUnitId: user.unitId ?? "__NO_UNIT__" };
  const [total, rcaRequired, sentinel] = await Promise.all([
    prisma.incident.count({ where: unitScope }),
    prisma.incident.count({ where: { ...unitScope, status: "RCARequired" } }),
    prisma.incident.count({ where: { ...unitScope, isSentinel: true } }),
  ]);

  return <AppShell user={user}><RoleHome title="Unit Manager Workspace" description="ติดตาม incident ที่เกิดในหน่วยงานของตนเอง">
    <div className="grid gap-4 md:grid-cols-3">
      <Card><CardHeader><CardTitle>Incident ทั้งหมด</CardTitle></CardHeader><CardContent className="text-3xl font-bold text-slate-950">{total}</CardContent></Card>
      <Card><CardHeader><CardTitle>RCA Required</CardTitle></CardHeader><CardContent className="text-3xl font-bold text-amber-600">{rcaRequired}</CardContent></Card>
      <Card><CardHeader><CardTitle>Sentinel</CardTitle></CardHeader><CardContent className="text-3xl font-bold text-red-600">{sentinel}</CardContent></Card>
    </div>
    <div className="grid gap-4 md:grid-cols-3">
      <Link href="/report/new" className={actionClass}><div className="font-semibold text-slate-900">รายงาน Incident</div><p className="mt-1 text-sm text-slate-600">เปิด incident report form</p></Link>
      <Link href="/my-reports" className={actionClass}><div className="font-semibold text-slate-900">My Reports</div><p className="mt-1 text-sm text-slate-600">ดูรายงานของตนเอง</p></Link>
      <Link href="/unit/incidents" className={actionClass}><div className="font-semibold text-slate-900">Search / Export</div><p className="mt-1 text-sm text-slate-600">ค้นหา กรอง เปิดรายละเอียด และ export incident ของหน่วยงาน</p></Link>
    </div>
  </RoleHome></AppShell>;
}
