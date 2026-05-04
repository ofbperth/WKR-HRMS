import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AppShell } from "@/components/layout/sidebar";
import { getLookupData } from "@/lib/incident-query";
import { IncidentForm } from "@/components/incidents/incident-form";

export default async function NewReportPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const lookup = await getLookupData();
  return <AppShell user={user}>
    <div className="mb-6"><h1 className="text-2xl font-bold">รายงาน Incident ใหม่</h1><p className="mt-2 text-slate-600">Step form 3 ขั้นตอน พร้อม automation rule ตอน submit</p></div>
    <IncidentForm units={lookup.units} riskCodes={lookup.riskCodes} />
  </AppShell>;
}
