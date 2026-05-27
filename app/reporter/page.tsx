import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AppShell } from "@/components/layout/sidebar";
import { RoleHome } from "@/components/role-home";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { countableIncidentFilter } from "@/lib/prisma-fields";

const actionClass = "rounded-lg border border-emerald-100 bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:bg-emerald-50";

export default async function Page() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const reporterScope = countableIncidentFilter({ reportedById: user.id });
  const [total, rcaRequired, sentinel] = await Promise.all([
    prisma.incident.count({ where: reporterScope }),
    prisma.incident.count({ where: countableIncidentFilter({ reportedById: user.id, status: "RCARequired" }) }),
    prisma.incident.count({ where: countableIncidentFilter({ reportedById: user.id, isSentinel: true }) }),
  ]);
  return <AppShell user={user}><RoleHome title="พื้นที่ทำงานผู้รายงาน" description="รายงานอุบัติการณ์ใหม่ และติดตามรายงานของตนเอง">
    <div className="grid gap-4 md:grid-cols-3">
      <Card><CardHeader><CardTitle>อุบัติการณ์ทั้งหมด</CardTitle></CardHeader><CardContent className="text-3xl font-bold text-slate-950">{total}</CardContent></Card>
      <Card><CardHeader><CardTitle>ต้องทำ RCA</CardTitle></CardHeader><CardContent className="text-3xl font-bold text-amber-600">{rcaRequired}</CardContent></Card>
      <Card><CardHeader><CardTitle>Sentinel Event</CardTitle></CardHeader><CardContent className="text-3xl font-bold text-red-600">{sentinel}</CardContent></Card>
    </div>
    <div className="grid gap-4 md:grid-cols-3">
      <Link href="/report/new" className={actionClass}><div className="font-semibold text-slate-900">รายงานอุบัติการณ์</div><p className="mt-1 text-sm text-slate-600">เปิดแบบฟอร์มรายงานอุบัติการณ์</p></Link>
      <Link href="/my-reports" className={actionClass}><div className="font-semibold text-slate-900">รายงานของฉัน</div><p className="mt-1 text-sm text-slate-600">ดูรายงานของตนเอง</p></Link>
      <Link href="/my-reports" className={actionClass}><div className="font-semibold text-slate-900">ติดตามสถานะ</div><p className="mt-1 text-sm text-slate-600">ติดตามสถานะของรายงานที่ส่งแล้ว</p></Link>
    </div>
  </RoleHome></AppShell>;
}
