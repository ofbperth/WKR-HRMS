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
    <div className="mx-auto mb-6 max-w-5xl"><h1 className="text-2xl font-bold">รายงานอุบัติการณ์ใหม่</h1><p className="mt-2 text-sm text-slate-600">กรอกข้อมูลตามลำดับ 3 ขั้นตอน ระบบจะตรวจข้อมูลจำเป็นก่อนส่งรายงาน</p></div>
    <IncidentForm units={lookup.units} riskCodes={lookup.riskCodes} />
  </AppShell>;
}
