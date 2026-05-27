import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AppShell } from "@/components/layout/sidebar";
import { AutomationPanel } from "@/components/automation-panel";
import { prisma } from "@/lib/prisma";
import { getPage, Pagination } from "@/components/ui/pagination";

export default async function Page({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const pageSize = 10;
  const total = await (prisma as any).automationRun.count();
  const page = getPage(searchParams.page, total, pageSize);
  const runs = await (prisma as any).automationRun.findMany({ orderBy: { startedAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize });
  return <AppShell user={user}><div className="space-y-6">
    <div><h1 className="text-2xl font-bold">งานอัตโนมัติสำหรับผู้ดูแลระบบ</h1><p className="mt-2 text-slate-600">งาน production แบบกดรันเอง พร้อม run log, failure และ audit trail</p></div>
    <AutomationPanel initialRuns={runs} />
    <Pagination basePath="/admin/automation" searchParams={searchParams} page={page} total={total} pageSize={pageSize} />
  </div></AppShell>;
}
