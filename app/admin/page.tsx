import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AppShell } from "@/components/layout/sidebar";
import { RoleHome } from "@/components/role-home";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";

export default async function Page() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const [total, rcaRequired, sentinel] = await Promise.all([
    prisma.incident.count(),
    prisma.incident.count({ where: { status: "RCARequired" } }),
    prisma.incident.count({ where: { isSentinel: true } }),
  ]);
  return <AppShell user={user}><RoleHome title="Admin Console" description="จัดการ users, units, risk codes และเข้าถึง incident log">
    <div className="grid gap-4 md:grid-cols-3">
      <Card><CardHeader><CardTitle>Incident ทั้งหมด</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{total}</CardContent></Card>
      <Card><CardHeader><CardTitle>RCA Required</CardTitle></CardHeader><CardContent className="text-3xl font-bold text-red-600">{rcaRequired}</CardContent></Card>
      <Card><CardHeader><CardTitle>Sentinel</CardTitle></CardHeader><CardContent className="text-3xl font-bold text-red-700">{sentinel}</CardContent></Card>
    </div>
    <div className="grid gap-4 md:grid-cols-3">
      <Link href="/report/new" className="rounded-xl border bg-white p-5 shadow-sm hover:bg-slate-50"><div className="font-semibold">รายงาน Incident</div><p className="mt-1 text-sm text-slate-600">เปิด incident report form</p></Link>
      <Link href="/my-reports" className="rounded-xl border bg-white p-5 shadow-sm hover:bg-slate-50"><div className="font-semibold">My Reports</div><p className="mt-1 text-sm text-slate-600">ดูรายงานของตนเอง</p></Link>
      <Link href="/rm/incidents" className="rounded-xl border bg-white p-5 shadow-sm hover:bg-slate-50"><div className="font-semibold">Incident Log</div><p className="mt-1 text-sm text-slate-600">สำหรับ RM/Admin</p></Link>
    </div>
  </RoleHome></AppShell>;
}
