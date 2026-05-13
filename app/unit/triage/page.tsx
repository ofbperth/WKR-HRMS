import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AppShell } from "@/components/layout/sidebar";
import { IncidentList } from "@/components/incidents/incident-list";
import { getLookupData } from "@/lib/incident-query";
import { getTriageIncidentList } from "@/lib/triage-query";

export default async function Page({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const [lookup, incidents] = await Promise.all([getLookupData(), getTriageIncidentList(user, searchParams)]);
  return <AppShell user={user}>
    <div className="mb-6"><h1 className="text-2xl font-bold">Unit Triage</h1><p className="mt-2 text-slate-600">ส่ง classification ของหน่วยงาน ตัดสิน RCA เมื่อมีสิทธิ์ และ reject รายงานที่ไม่ถูกต้อง</p></div>
    <IncidentList incidents={incidents} lookup={lookup} basePath="/unit/triage" detailBasePath="/unit/triage" searchParams={searchParams} />
  </AppShell>;
}
