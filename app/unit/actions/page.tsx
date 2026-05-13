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
    where: { incident: { incidentUnitId: user.unitId ?? "__NO_UNIT__" } },
    include: { incident: { include: { incidentUnit: true } }, owner: { select: { name: true, email: true } } },
    orderBy: [{ status: "asc" }, { dueDate: "asc" }],
    take: 300,
  });
  const page = getPage(searchParams.page, actions.length);
  const visibleActions = pageSlice(actions, page);
  const overdue = actions.filter((action) => action.status !== "Verified" && action.dueDate < new Date()).length;
  return <AppShell user={user}><div className="space-y-6">
    <div><h1 className="text-2xl font-bold">Unit Actions</h1><p className="mt-2 text-slate-600">Action plan ของ incident ในหน่วยงานของคุณ</p></div>
    <div className="grid gap-4 md:grid-cols-3"><Card><CardHeader><CardTitle>Action ที่เปิดอยู่</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{actions.filter((a) => a.status !== "Verified").length}</CardContent></Card><Card><CardHeader><CardTitle>Overdue</CardTitle></CardHeader><CardContent className="text-3xl font-bold text-red-700">{overdue}</CardContent></Card><Card><CardHeader><CardTitle>Done</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{actions.filter((a) => a.status === "Done").length}</CardContent></Card></div>
    <div className="flex gap-2"><a className="rounded-md border bg-white px-3 py-2 text-sm" href="/api/actions/export">Export Action CSV</a></div>
    <div className="overflow-hidden rounded-xl border bg-white"><div className="overflow-auto"><table className="min-w-[900px] w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">เปิด</th><th className="px-4 py-3">Incident</th><th className="px-4 py-3">Action</th><th className="px-4 py-3">Owner</th><th className="px-4 py-3">กำหนดส่ง</th><th className="px-4 py-3">Status</th></tr></thead><tbody className="divide-y">{actions.length === 0 ? <tr><td className="px-4 py-8 text-center text-slate-500" colSpan={6}>ยังไม่มี action plan</td></tr> : visibleActions.map((action) => <tr key={action.id}><td className="px-4 py-3"><Link className="rounded-md border px-3 py-2 text-xs" href={`/unit/incidents/${action.incidentId}`}>ดู</Link></td><td className="px-4 py-3 font-semibold">{action.incident.incidentNo}</td><td className="px-4 py-3">{action.title}</td><td className="px-4 py-3">{action.owner?.name ?? "รอมอบหมายใหม่"}</td><td className="px-4 py-3">{formatDateOnly(action.dueDate)}</td><td className="px-4 py-3">{action.status}</td></tr>)}</tbody></table></div></div>
    <Pagination basePath="/unit/actions" searchParams={searchParams} page={page} total={actions.length} />
  </div></AppShell>;
}
