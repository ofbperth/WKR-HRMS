import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AppShell } from "@/components/layout/sidebar";
import { RoleHome } from "@/components/role-home";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MonthlyReportButton } from "@/components/reports/monthly-report-button";

const actionClass = "rounded-lg border border-emerald-100 bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:bg-emerald-50";

export default async function Page() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return <AppShell user={user}><RoleHome title="ศูนย์ควบคุมผู้ดูแลระบบ" description="ศูนย์กลางสำหรับงาน RM และการดูแลระบบ">
    <Link href="/rm/dashboard" className="block rounded-lg border border-emerald-100 bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:bg-emerald-50">
      <div className="font-semibold text-slate-900">Dashboard RM/Admin</div>
      <p className="mt-1 text-sm text-slate-600">ดูตัวชี้วัดกลางของ RM, RCA, Sentinel Event และแผนการแก้ไขจาก Dashboard เดียวกัน</p>
    </Link>

    <div className="grid gap-4 md:grid-cols-3">
      <Link href="/report/new" className={actionClass}><div className="font-semibold text-slate-900">รายงานอุบัติการณ์</div><p className="mt-1 text-sm text-slate-600">สร้างอุบัติการณ์ด้วยสิทธิ์ระดับ RM</p></Link>
      <Link href="/my-reports" className={actionClass}><div className="font-semibold text-slate-900">รายงานของฉัน</div><p className="mt-1 text-sm text-slate-600">ดูรายงานที่ผู้ดูแลระบบคนนี้ส่งไว้</p></Link>
      <Link href="/rm/search" className={actionClass}><div className="font-semibold text-slate-900">ค้นหา/Export อุบัติการณ์</div><p className="mt-1 text-sm text-slate-600">ค้นหา กรอง เปิดรายละเอียด และ export อุบัติการณ์</p></Link>
      <Link href="/rm/triage" className={actionClass}><div className="font-semibold text-slate-900">Triage</div><p className="mt-1 text-sm text-slate-600">ตรวจและจัดประเภทอุบัติการณ์ใหม่</p></Link>
      <Link href="/rm/rca" className={actionClass}><div className="font-semibold text-slate-900">ตรวจสอบ RCA</div><p className="mt-1 text-sm text-slate-600">อนุมัติ RCA หรือขอปรับปรุง</p></Link>
      <Link href="/rm/actions" className={actionClass}><div className="font-semibold text-slate-900">แผนการแก้ไข</div><p className="mt-1 text-sm text-slate-600">ติดตามแผนการแก้ไขและคิวตรวจสอบ</p></Link>
      <Link href="/rm/heatmap" className={actionClass}><div className="font-semibold text-slate-900">Heatmap</div><p className="mt-1 text-sm text-slate-600">ดูความเสี่ยงตามหน่วยงานและระดับความรุนแรง</p></Link>
      <Link href="/rm/reports" className={actionClass}><div className="font-semibold text-slate-900">รายงาน RM</div><p className="mt-1 text-sm text-slate-600">ดูรายงาน RM และผลวิเคราะห์</p></Link>
    </div>

    <Card><CardHeader><CardTitle>รายงานรายเดือน</CardTitle></CardHeader><CardContent><MonthlyReportButton /></CardContent></Card>

    <div className="grid gap-4 md:grid-cols-3">
      <Link href="/admin/users" className={actionClass}><div className="font-semibold text-slate-900">ผู้ใช้</div><p className="mt-1 text-sm text-slate-600">จัดการบัญชี บทบาท และหน่วยงาน</p></Link>
      <Link href="/admin/auth-settings" className={actionClass}><div className="font-semibold text-slate-900">ตั้งค่าการเข้าสู่ระบบ</div><p className="mt-1 text-sm text-slate-600">ตั้งค่า Google Login, domain และคำเชิญ</p></Link>
      <Link href="/admin/units" className={actionClass}><div className="font-semibold text-slate-900">หน่วยงาน</div><p className="mt-1 text-sm text-slate-600">จัดการหน่วยงานในโรงพยาบาล</p></Link>
      <Link href="/admin/risk-codes" className={actionClass}><div className="font-semibold text-slate-900">รหัสความเสี่ยง</div><p className="mt-1 text-sm text-slate-600">ดูแล master data รหัสความเสี่ยง NRLS ที่ใช้งานอยู่</p></Link>
      <Link href="/admin/audit-logs" className={actionClass}><div className="font-semibold text-slate-900">ประวัติการตรวจสอบ</div><p className="mt-1 text-sm text-slate-600">ตรวจสอบความปลอดภัยและประวัติ workflow</p></Link>
      <Link href="/admin/automation" className={actionClass}><div className="font-semibold text-slate-900">งานอัตโนมัติ</div><p className="mt-1 text-sm text-slate-600">รันงานที่ป้องกันไว้และตรวจงานที่ล้มเหลว</p></Link>
      <Link href="/admin/governance" className={actionClass}><div className="font-semibold text-slate-900">กำกับดูแล</div><p className="mt-1 text-sm text-slate-600">ดู retention, storage, cache, export และ audit observability</p></Link>
    </div>
  </RoleHome></AppShell>;
}
