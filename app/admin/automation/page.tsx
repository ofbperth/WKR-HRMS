import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AppShell } from "@/components/layout/sidebar";
import { AutomationPanel } from "@/components/automation-panel";
import { prisma } from "@/lib/prisma";

export default async function Page() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const runs = await (prisma as any).automationRun.findMany({ orderBy: { startedAt: "desc" }, take: 50 });
  return <AppShell user={user}><div className="space-y-6">
    <div><h1 className="text-2xl font-bold">Admin Automation</h1><p className="mt-2 text-slate-600">Manual production operations with run logs, failures, and audit trail.</p></div>
    <AutomationPanel initialRuns={runs} />
  </div></AppShell>;
}
