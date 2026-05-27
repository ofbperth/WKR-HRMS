import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AppShell } from "@/components/layout/sidebar";
import { IncidentList } from "@/components/incidents/incident-list";
import { getLookupData } from "@/lib/incident-query";
import { getTriageIncidentList } from "@/lib/triage-query";
import { canSeeSensitive } from "@/lib/rbac";

export default async function Page({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const params = searchParams;
  const [lookup, incidentPage] = await Promise.all([getLookupData(), getTriageIncidentList(user, params)]);
  return <AppShell user={user}>
    <div className="mb-6"><h1 className="text-2xl font-bold">คิว Triage ของ RM</h1><p className="mt-2 text-slate-600">ตรวจอุบัติการณ์ที่รายงานเข้ามา ปรับการจัดประเภท และส่งต่อไปขั้นตอนถัดไป</p></div>
    <IncidentList incidents={incidentPage.data} meta={incidentPage.meta} lookup={lookup} basePath="/rm/triage" searchParams={params} canSeeSensitive={canSeeSensitive(user.role)} />
  </AppShell>;
}
