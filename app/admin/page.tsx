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
  const [total, rcaNotStarted, rcaSubmitted, sentinel] = await Promise.all([
    prisma.incident.count(),
    prisma.incident.count({ where: { status: "RCARequired", rca: null } }),
    prisma.incident.count({ where: { OR: [{ status: "RCASubmitted" }, { rca: { status: "Submitted" } }] } }),
    prisma.incident.count({ where: { isSentinel: true } }),
  ]);
  return <AppShell user={user}><RoleHome title="Admin Console" description="Central entry for RM-level operations and system administration.">
    <div className="grid gap-4 md:grid-cols-4">
      <Card><CardHeader><CardTitle>Incident ทั้งหมด</CardTitle></CardHeader><CardContent className="text-3xl font-bold text-slate-950">{total}</CardContent></Card>
      <Card><CardHeader><CardTitle>RCA ยังไม่ทำ</CardTitle></CardHeader><CardContent className="text-3xl font-bold text-amber-600">{rcaNotStarted}</CardContent></Card>
      <Card><CardHeader><CardTitle>RCA Submitted</CardTitle></CardHeader><CardContent className="text-3xl font-bold text-blue-700">{rcaSubmitted}</CardContent></Card>
      <Card><CardHeader><CardTitle>Sentinel</CardTitle></CardHeader><CardContent className="text-3xl font-bold text-red-600">{sentinel}</CardContent></Card>
    </div>

    <div className="grid gap-4 md:grid-cols-3">
      <Link href="/report/new" className={actionClass}><div className="font-semibold text-slate-900">รายงาน Incident</div><p className="mt-1 text-sm text-slate-600">Create an incident using RM-level access</p></Link>
      <Link href="/my-reports" className={actionClass}><div className="font-semibold text-slate-900">My Reports</div><p className="mt-1 text-sm text-slate-600">View reports submitted by the current admin user</p></Link>
      <Link href="/rm/search" className={actionClass}><div className="font-semibold text-slate-900">Search/Export Incident</div><p className="mt-1 text-sm text-slate-600">Find, filter, open, and export incidents</p></Link>
      <Link href="/rm/triage" className={actionClass}><div className="font-semibold text-slate-900">Triage</div><p className="mt-1 text-sm text-slate-600">Review and classify new incidents</p></Link>
      <Link href="/rm/rca" className={actionClass}><div className="font-semibold text-slate-900">RCA Review</div><p className="mt-1 text-sm text-slate-600">Approve RCA or request revision</p></Link>
      <Link href="/rm/actions" className={actionClass}><div className="font-semibold text-slate-900">Actions</div><p className="mt-1 text-sm text-slate-600">Track action plans and verification</p></Link>
      <Link href="/rm/heatmap" className={actionClass}><div className="font-semibold text-slate-900">Heatmap</div><p className="mt-1 text-sm text-slate-600">Unit and severity heatmap from incident data</p></Link>
      <Link href="/rm/reports" className={actionClass}><div className="font-semibold text-slate-900">Reports</div><p className="mt-1 text-sm text-slate-600">Review RM reports and analytics outputs</p></Link>
    </div>

    <Card><CardHeader><CardTitle>Monthly report</CardTitle></CardHeader><CardContent><MonthlyReportButton /></CardContent></Card>

    <div className="grid gap-4 md:grid-cols-3">
      <Link href="/admin/users" className={actionClass}><div className="font-semibold text-slate-900">Users</div><p className="mt-1 text-sm text-slate-600">Manage accounts, roles, and unit assignment</p></Link>
      <Link href="/admin/auth-settings" className={actionClass}><div className="font-semibold text-slate-900">Auth Settings</div><p className="mt-1 text-sm text-slate-600">Configure Google login, domains, and invites</p></Link>
      <Link href="/admin/units" className={actionClass}><div className="font-semibold text-slate-900">Units</div><p className="mt-1 text-sm text-slate-600">Manage hospital units</p></Link>
      <Link href="/admin/risk-codes" className={actionClass}><div className="font-semibold text-slate-900">Risk Codes</div><p className="mt-1 text-sm text-slate-600">Maintain active NRLS risk code master data</p></Link>
      <Link href="/admin/audit-logs" className={actionClass}><div className="font-semibold text-slate-900">Audit Logs</div><p className="mt-1 text-sm text-slate-600">Review security and workflow trail</p></Link>
      <Link href="/admin/automation" className={actionClass}><div className="font-semibold text-slate-900">Automation</div><p className="mt-1 text-sm text-slate-600">Run protected jobs and inspect failures</p></Link>
      <Link href="/admin/governance" className={actionClass}><div className="font-semibold text-slate-900">Governance</div><p className="mt-1 text-sm text-slate-600">Retention, storage, cache, export, and audit observability</p></Link>
    </div>
  </RoleHome></AppShell>;
}
