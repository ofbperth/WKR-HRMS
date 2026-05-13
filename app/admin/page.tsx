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
  const [total, rcaNotStarted, rcaSubmitted, sentinel] = await Promise.all([
    prisma.incident.count({ where: countableIncidentFilter() }),
    prisma.incident.count({ where: countableIncidentFilter({ status: "RCARequired", rca: null }) }),
    prisma.incident.count({ where: countableIncidentFilter({ OR: [{ status: "RCASubmitted" }, { rca: { status: "Submitted" } }] }) }),
    prisma.incident.count({ where: countableIncidentFilter({ isSentinel: true }) }),
  ]);
  return <AppShell user={user}><RoleHome title="Admin Console" description="ศูนย์กลางสำหรับงาน RM และการดูแลระบบ">
    <div className="grid gap-4 md:grid-cols-4">
      <Card><CardHeader><CardTitle>Incident ทั้งหมด</CardTitle></CardHeader><CardContent className="text-3xl font-bold text-slate-950">{total}</CardContent></Card>
      <Card><CardHeader><CardTitle>RCA ยังไม่ทำ</CardTitle></CardHeader><CardContent className="text-3xl font-bold text-amber-600">{rcaNotStarted}</CardContent></Card>
      <Card><CardHeader><CardTitle>RCA Submitted</CardTitle></CardHeader><CardContent className="text-3xl font-bold text-blue-700">{rcaSubmitted}</CardContent></Card>
      <Card><CardHeader><CardTitle>Sentinel</CardTitle></CardHeader><CardContent className="text-3xl font-bold text-red-600">{sentinel}</CardContent></Card>
    </div>

    <div className="grid gap-4 md:grid-cols-3">
      <Link href="/report/new" className={actionClass}><div className="font-semibold text-slate-900">รายงาน Incident</div><p className="mt-1 text-sm text-slate-600">สร้าง incident ด้วยสิทธิ์ระดับ RM</p></Link>
      <Link href="/my-reports" className={actionClass}><div className="font-semibold text-slate-900">รายงานของฉัน</div><p className="mt-1 text-sm text-slate-600">ดูรายงานที่ Admin คนนี้ส่งไว้</p></Link>
      <Link href="/rm/search" className={actionClass}><div className="font-semibold text-slate-900">ค้นหา/Export Incident</div><p className="mt-1 text-sm text-slate-600">ค้นหา กรอง เปิดรายละเอียด และ export incident</p></Link>
      <Link href="/rm/triage" className={actionClass}><div className="font-semibold text-slate-900">Triage</div><p className="mt-1 text-sm text-slate-600">Review และจัดประเภท incident ใหม่</p></Link>
      <Link href="/rm/rca" className={actionClass}><div className="font-semibold text-slate-900">Review RCA</div><p className="mt-1 text-sm text-slate-600">อนุมัติ RCA หรือ request revision</p></Link>
      <Link href="/rm/actions" className={actionClass}><div className="font-semibold text-slate-900">Action plan</div><p className="mt-1 text-sm text-slate-600">ติดตาม action plan และ verification</p></Link>
      <Link href="/rm/heatmap" className={actionClass}><div className="font-semibold text-slate-900">Heatmap</div><p className="mt-1 text-sm text-slate-600">ดูความเสี่ยงตามหน่วยงานและ severity</p></Link>
      <Link href="/rm/reports" className={actionClass}><div className="font-semibold text-slate-900">Report</div><p className="mt-1 text-sm text-slate-600">ดู RM report และผล analytics</p></Link>
    </div>

    <Card><CardHeader><CardTitle>Monthly report</CardTitle></CardHeader><CardContent><MonthlyReportButton /></CardContent></Card>

    <div className="grid gap-4 md:grid-cols-3">
      <Link href="/admin/users" className={actionClass}><div className="font-semibold text-slate-900">User</div><p className="mt-1 text-sm text-slate-600">จัดการ account, role และหน่วยงาน</p></Link>
      <Link href="/admin/auth-settings" className={actionClass}><div className="font-semibold text-slate-900">Auth Settings</div><p className="mt-1 text-sm text-slate-600">ตั้งค่า Google login, domain และ invite</p></Link>
      <Link href="/admin/units" className={actionClass}><div className="font-semibold text-slate-900">หน่วยงาน</div><p className="mt-1 text-sm text-slate-600">จัดการหน่วยงานในโรงพยาบาล</p></Link>
      <Link href="/admin/risk-codes" className={actionClass}><div className="font-semibold text-slate-900">Risk Codes</div><p className="mt-1 text-sm text-slate-600">ดูแล NRLS risk code master data ที่ใช้งานอยู่</p></Link>
      <Link href="/admin/audit-logs" className={actionClass}><div className="font-semibold text-slate-900">Audit Logs</div><p className="mt-1 text-sm text-slate-600">ตรวจสอบ security และ workflow trail</p></Link>
      <Link href="/admin/automation" className={actionClass}><div className="font-semibold text-slate-900">Automation</div><p className="mt-1 text-sm text-slate-600">รัน protected job และตรวจ failure</p></Link>
      <Link href="/admin/governance" className={actionClass}><div className="font-semibold text-slate-900">Governance</div><p className="mt-1 text-sm text-slate-600">ดู retention, storage, cache, export และ audit observability</p></Link>
    </div>
  </RoleHome></AppShell>;
}
