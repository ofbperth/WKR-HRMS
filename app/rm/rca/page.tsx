import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AppShell } from "@/components/layout/sidebar";
import { IncidentList } from "@/components/incidents/incident-list";
import { getIncidentList, getLookupData } from "@/lib/incident-query";
import { canSeeSensitive } from "@/lib/rbac";

export default async function Page({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const params = searchParams;
  const [lookup, incidentPage] = await Promise.all([getLookupData(), getIncidentList(user, params)]);
  return <AppShell user={user}>
    <div className="mb-6"><h1 className="text-2xl font-bold">ตรวจสอบ RCA</h1><p className="mt-2 text-slate-600">ติดตาม RCA ที่ต้องทำ RCA ที่ส่งแล้ว และงานปรับปรุงที่ต้องติดตาม</p></div>
    <div className="mb-3 flex gap-2"><a className="rounded-md border bg-white px-3 py-2 text-sm" href="/api/rca/export">Export RCA CSV</a></div>
    <IncidentList incidents={incidentPage.data} meta={incidentPage.meta} lookup={lookup} basePath="/rm/rca" searchParams={params} canSeeSensitive={canSeeSensitive(user.role)} />
  </AppShell>;
}
