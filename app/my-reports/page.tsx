import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AppShell } from "@/components/layout/sidebar";
import { IncidentList } from "@/components/incidents/incident-list";
import { getIncidentList, getLookupData } from "@/lib/incident-query";
import { canSeeSensitive } from "@/lib/rbac";

export default async function Page({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const myReportScope = { ...user, role: "Reporter" as const };
  const [lookup, incidentPage] = await Promise.all([getLookupData(), getIncidentList(myReportScope, searchParams)]);
  return <AppShell user={user}>
    <div className="mb-6"><h1 className="text-2xl font-bold">รายงานของฉัน</h1><p className="mt-2 text-slate-600">แสดงเฉพาะอุบัติการณ์ที่คุณเป็นผู้รายงาน</p></div>
    <IncidentList incidents={incidentPage.data} meta={incidentPage.meta} lookup={lookup} basePath="/my-reports" searchParams={searchParams} canSeeSensitive={canSeeSensitive(user.role)} />
  </AppShell>;
}
