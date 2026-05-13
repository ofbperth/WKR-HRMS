import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AppShell } from "@/components/layout/sidebar";
import { IncidentList } from "@/components/incidents/incident-list";
import { getIncidentList, getLookupData } from "@/lib/incident-query";
import { canSeeSensitive } from "@/lib/rbac";

export default async function Page({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const [lookup, incidents] = await Promise.all([getLookupData(), getIncidentList(user, searchParams)]);
  return <AppShell user={user}>
    <div className="mb-6"><h1 className="text-2xl font-bold">Search/Export Incident</h1><p className="mt-2 text-slate-600">ค้นหา incident ด้วย filter และ export CSV จากผล filter ปัจจุบัน</p></div>
    <IncidentList incidents={incidents} lookup={lookup} basePath="/rm/search" searchParams={searchParams} canSeeSensitive={canSeeSensitive(user.role)} />
  </AppShell>;
}
