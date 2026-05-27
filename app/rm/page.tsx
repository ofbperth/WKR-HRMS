import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AppShell } from "@/components/layout/sidebar";
import { RoleHome } from "@/components/role-home";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MonthlyReportButton } from "@/components/reports/monthly-report-button";
import { prisma } from "@/lib/prisma";
import { countableIncidentFilter } from "@/lib/prisma-fields";

const actionClass = "rounded-lg border border-emerald-100 bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:bg-emerald-50";

export default async function Page() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const [total, rcaRequired, sentinel] = await Promise.all([
    prisma.incident.count({ where: countableIncidentFilter() }),
    prisma.incident.count({ where: countableIncidentFilter({ status: "RCARequired" }) }),
    prisma.incident.count({ where: countableIncidentFilter({ isSentinel: true }) }),
  ]);

  return <AppShell user={user}><RoleHome title="พื้นที่ทำงานทีม RM" description="จัดคิว Triage ค้นหาอุบัติการณ์ ติดตาม RCA และบริหาร workflow ความเสี่ยง">
    <div className="grid gap-4 md:grid-cols-3">
      <Card><CardHeader><CardTitle>อุบัติการณ์ทั้งหมด</CardTitle></CardHeader><CardContent className="text-3xl font-bold text-slate-950">{total}</CardContent></Card>
      <Link href="/rm/search?status=RCARequired" className="block"><Card className="h-full transition hover:-translate-y-0.5 hover:bg-emerald-50"><CardHeader><CardTitle>ต้องทำ RCA</CardTitle></CardHeader><CardContent className="text-3xl font-bold text-amber-600">{rcaRequired}</CardContent></Card></Link>
      <Link href="/rm/search?sentinel=true" className="block"><Card className="h-full transition hover:-translate-y-0.5 hover:bg-emerald-50"><CardHeader><CardTitle>Sentinel Event</CardTitle></CardHeader><CardContent className="text-3xl font-bold text-red-600">{sentinel}</CardContent></Card></Link>
    </div>
    <div className="grid gap-4 md:grid-cols-3">
      <Link href="/report/new" className={actionClass}><div className="font-semibold text-slate-900">รายงานอุบัติการณ์</div><p className="mt-1 text-sm text-slate-600">เปิดแบบฟอร์มรายงานอุบัติการณ์</p></Link>
      <Link href="/my-reports" className={actionClass}><div className="font-semibold text-slate-900">รายงานของฉัน</div><p className="mt-1 text-sm text-slate-600">ดูรายงานของตนเอง</p></Link>
      <Link href="/rm/search" className={actionClass}><div className="font-semibold text-slate-900">ค้นหา/Export อุบัติการณ์</div><p className="mt-1 text-sm text-slate-600">ค้นหา กรอง เปิดรายละเอียด และ export อุบัติการณ์</p></Link>
      <Link href="/rm/triage" className={actionClass}><div className="font-semibold text-slate-900">Triage</div><p className="mt-1 text-sm text-slate-600">ตรวจและจัดประเภทอุบัติการณ์ใหม่</p></Link>
      <Link href="/rm/rca" className={actionClass}><div className="font-semibold text-slate-900">ตรวจสอบ RCA</div><p className="mt-1 text-sm text-slate-600">อนุมัติ RCA หรือขอปรับปรุง</p></Link>
      <Link href="/rm/actions" className={actionClass}><div className="font-semibold text-slate-900">แผนการแก้ไข</div><p className="mt-1 text-sm text-slate-600">ติดตามแผนการแก้ไขและคิวตรวจสอบ</p></Link>
      <Link href="/rm/heatmap" className={actionClass}><div className="font-semibold text-slate-900">Heatmap</div><p className="mt-1 text-sm text-slate-600">ดูความเสี่ยงตามหน่วยงานและระดับความรุนแรง</p></Link>
      <Link href="/rm/reports" className={actionClass}><div className="font-semibold text-slate-900">รายงาน RM</div><p className="mt-1 text-sm text-slate-600">ดูรายงาน RM และผลวิเคราะห์</p></Link>
    </div>
    <Card><CardHeader><CardTitle>รายงานรายเดือน</CardTitle></CardHeader><CardContent><MonthlyReportButton /></CardContent></Card>
  </RoleHome></AppShell>;
}
