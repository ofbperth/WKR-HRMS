import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { GovernedExportButton } from "@/components/exports/governed-export-button";
import { AppShell } from "@/components/layout/sidebar";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getPage, Pagination } from "@/components/ui/pagination";
import { actionPlanStatusDisplay } from "@/lib/i18n/th";

export default async function Page({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const pageSize = 10;
  const total = await prisma.actionPlan.count();
  const page = getPage(searchParams.page, total, pageSize);
  const [actions, openCount, overdue, doneCount] = await prisma.$transaction([
    prisma.actionPlan.findMany({
      include: { incident: { include: { incidentUnit: true } }, owner: { select: { name: true, email: true } } },
      orderBy: [{ status: "asc" }, { dueDate: "asc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.actionPlan.count({ where: { status: { not: "Verified" } } }),
    prisma.actionPlan.count({ where: { status: { not: "Verified" }, dueDate: { lt: new Date() } } }),
    prisma.actionPlan.count({ where: { status: "Done" } }),
  ]);
  return <AppShell user={user}><div className="space-y-6">
    <div><h1 className="text-2xl font-bold">แผนการแก้ไขของ RM</h1><p className="mt-2 text-slate-600">ติดตามแผนการแก้ไข ผู้รับผิดชอบ งานเกินกำหนด และคิวตรวจสอบ</p></div>
    <div className="grid gap-4 md:grid-cols-3"><Card><CardHeader><CardTitle>แผนที่เปิดอยู่</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{openCount}</CardContent></Card><Card><CardHeader><CardTitle>เกินกำหนด</CardTitle></CardHeader><CardContent className="text-3xl font-bold text-red-700">{overdue}</CardContent></Card><Card><CardHeader><CardTitle>รอตรวจสอบ</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{doneCount}</CardContent></Card></div>
    <div className="flex gap-2"><GovernedExportButton endpoint="/api/actions/export" label="Export Action CSV" reasonPrompt="กรุณาระบุเหตุผลในการส่งออก Action Plan" /></div>
    <ActionTable actions={actions} detailBase="/rm/search" />
    <Pagination basePath="/rm/actions" searchParams={searchParams} page={page} total={total} pageSize={pageSize} />
  </div></AppShell>;
}

function ActionTable({ actions, detailBase }: { actions: any[]; detailBase: string }) {
  return <div className="overflow-hidden rounded-xl border bg-white"><div className="overflow-auto"><table className="w-full min-w-[900px] table-fixed text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="w-20 px-3 py-3">เปิด</th><th className="w-32 px-3 py-3">เลขที่รายงาน</th><th className="w-36 px-3 py-3">หน่วยงาน</th><th className="px-3 py-3">แผนการแก้ไข</th><th className="w-44 px-3 py-3">ผู้รับผิดชอบ</th><th className="w-28 px-3 py-3">กำหนดส่ง</th><th className="w-32 px-3 py-3">สถานะ</th></tr></thead><tbody className="divide-y">{actions.length === 0 ? <tr><td className="px-4 py-8 text-center text-slate-500" colSpan={7}>ยังไม่มีแผนการแก้ไข</td></tr> : actions.map((action) => <tr key={action.id}><td className="px-3 py-3"><Link className="rounded-md border px-3 py-2 text-xs" href={`${detailBase}/${action.incidentId}`}>ดู</Link></td><td className="break-words px-3 py-3 font-semibold">{action.incident.incidentNo}</td><td className="break-words px-3 py-3">{action.incident.incidentUnit.name}</td><td className="px-3 py-3"><div className="line-clamp-2 break-words font-medium">{action.title}</div><div className="line-clamp-1 break-words text-xs text-slate-500">{action.incident.title}</div></td><td className="break-words px-3 py-3">{action.owner?.name ?? "รอมอบหมายใหม่"}</td><td className="px-3 py-3">{formatDateTime(action.dueDate)}</td><td className="break-words px-3 py-3">{actionPlanStatusDisplay(action.status)}</td></tr>)}</tbody></table></div></div>;
}
