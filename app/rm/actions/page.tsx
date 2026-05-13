import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AppShell } from "@/components/layout/sidebar";
import { prisma } from "@/lib/prisma";
import { formatDateOnly } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getPage, pageSlice, Pagination } from "@/components/ui/pagination";

export default async function Page({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const actions = await prisma.actionPlan.findMany({
    include: { incident: { include: { incidentUnit: true } }, owner: { select: { name: true, email: true } } },
    orderBy: [{ status: "asc" }, { dueDate: "asc" }],
    take: 300,
  });
  const page = getPage(searchParams.page, actions.length);
  const visibleActions = pageSlice(actions, page);
  const overdue = actions.filter((action) => action.status !== "Verified" && action.dueDate < new Date()).length;
  return <AppShell user={user}><div className="space-y-6">
    <div><h1 className="text-2xl font-bold">RM Actions</h1><p className="mt-2 text-slate-600">ติดตาม action plan, owner progress, งาน overdue และคิว verification</p></div>
    <div className="grid gap-4 md:grid-cols-3"><Card><CardHeader><CardTitle>Action ที่เปิดอยู่</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{actions.filter((a) => a.status !== "Verified").length}</CardContent></Card><Card><CardHeader><CardTitle>Overdue</CardTitle></CardHeader><CardContent className="text-3xl font-bold text-red-700">{overdue}</CardContent></Card><Card><CardHeader><CardTitle>รอ verification</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{actions.filter((a) => a.status === "Done").length}</CardContent></Card></div>
    <div className="flex gap-2"><a className="rounded-md border bg-white px-3 py-2 text-sm" href="/api/actions/export">Export Action CSV</a></div>
    <ActionTable actions={visibleActions} detailBase="/rm/search" />
    <Pagination basePath="/rm/actions" searchParams={searchParams} page={page} total={actions.length} />
  </div></AppShell>;
}

function ActionTable({ actions, detailBase }: { actions: any[]; detailBase: string }) {
  return <div className="overflow-hidden rounded-xl border bg-white"><div className="overflow-auto"><table className="w-full min-w-[900px] table-fixed text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="w-20 px-3 py-3">เปิด</th><th className="w-32 px-3 py-3">Incident</th><th className="w-36 px-3 py-3">หน่วยงาน</th><th className="px-3 py-3">Action</th><th className="w-44 px-3 py-3">Owner</th><th className="w-28 px-3 py-3">กำหนดส่ง</th><th className="w-32 px-3 py-3">Status</th></tr></thead><tbody className="divide-y">{actions.length === 0 ? <tr><td className="px-4 py-8 text-center text-slate-500" colSpan={7}>ยังไม่มี action plan</td></tr> : actions.map((action) => <tr key={action.id}><td className="px-3 py-3"><Link className="rounded-md border px-3 py-2 text-xs" href={`${detailBase}/${action.incidentId}`}>ดู</Link></td><td className="break-words px-3 py-3 font-semibold">{action.incident.incidentNo}</td><td className="break-words px-3 py-3">{action.incident.incidentUnit.name}</td><td className="px-3 py-3"><div className="line-clamp-2 break-words font-medium">{action.title}</div><div className="line-clamp-1 break-words text-xs text-slate-500">{action.incident.title}</div></td><td className="break-words px-3 py-3">{action.owner?.name ?? "รอมอบหมายใหม่"}</td><td className="px-3 py-3">{formatDateOnly(action.dueDate)}</td><td className="break-words px-3 py-3">{action.status}</td></tr>)}</tbody></table></div></div>;
}
