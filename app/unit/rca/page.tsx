import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { GovernedExportButton } from "@/components/exports/governed-export-button";
import { AppShell } from "@/components/layout/sidebar";
import { IncidentList } from "@/components/incidents/incident-list";
import { getIncidentList, getLookupData } from "@/lib/incident-query";

export default async function Page({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const params = { ...searchParams, rcaWorklist: "true" };
  const [lookup, incidentPage] = await Promise.all([getLookupData(), getIncidentList(user, params)]);
  return <AppShell user={user}>
    <div className="mb-6"><h1 className="text-2xl font-bold">RCA ของหน่วยงาน</h1><p className="mt-2 text-slate-600">คิว RCA ของอุบัติการณ์ในหน่วยงานของคุณ</p></div>
    <div className="mb-3 flex gap-2"><GovernedExportButton endpoint="/api/rca/export" label="Export RCA CSV" reasonPrompt="กรุณาระบุเหตุผลในการส่งออกข้อมูล RCA" /></div>
    <IncidentList incidents={incidentPage.data} meta={incidentPage.meta} lookup={lookup} basePath="/unit/rca" searchParams={params} showRcaDueCountdown />
  </AppShell>;
}
