import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AppShell } from "@/components/layout/sidebar";
import { MonthlyReportButton } from "@/components/reports/monthly-report-button";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getPage, Pagination } from "@/components/ui/pagination";

export default async function Page({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const pageSize = 10;
  const total = await prisma.monthlyReport.count();
  const page = getPage(searchParams.page, total, pageSize);
  const reports = await prisma.monthlyReport.findMany({ orderBy: [{ year: "desc" }, { month: "desc" }], skip: (page - 1) * pageSize, take: pageSize });
  return <AppShell user={user}><div className="space-y-6">
    <div><h1 className="text-2xl font-bold">RM Reports</h1><p className="mt-2 text-slate-600">สร้าง monthly record และเปิด Summary Report สำหรับ PDF output</p></div>
    <Card><CardHeader><CardTitle>สร้าง monthly report</CardTitle></CardHeader><CardContent><MonthlyReportButton /></CardContent></Card>
    <div><a className="rounded-md border bg-white px-3 py-2 text-sm" href="/executive/monthly-report">เปิด Summary Report</a></div>
    <div className="overflow-hidden rounded-xl border bg-white"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">เปิด</th><th className="px-4 py-3">ช่วงเวลา</th><th className="px-4 py-3">สร้างเมื่อ</th><th className="px-4 py-3">Source</th></tr></thead><tbody className="divide-y">{reports.length === 0 ? <tr><td className="px-4 py-8 text-center text-slate-500" colSpan={4}>ยังไม่มี monthly report</td></tr> : reports.map((report) => <tr key={report.id}><td className="px-4 py-3"><a className="rounded-md border px-3 py-2 text-xs" href={`/executive/monthly-report?mode=month&month=${report.year}-${String(report.month).padStart(2, "0")}`}>Summary</a></td><td className="px-4 py-3 font-semibold">{report.year}-{String(report.month).padStart(2, "0")}</td><td className="px-4 py-3">{report.generatedAt.toLocaleString("th-TH")}</td><td className="px-4 py-3">{report.generatedBySystem ? "System" : "Manual"}</td></tr>)}</tbody></table></div>
    <Pagination basePath="/rm/reports" searchParams={searchParams} page={page} total={total} pageSize={pageSize} />
  </div></AppShell>;
}
