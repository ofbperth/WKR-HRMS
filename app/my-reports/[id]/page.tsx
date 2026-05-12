import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AppShell } from "@/components/layout/sidebar";
import { getActiveUsers, getIncidentForUser, getLookupData } from "@/lib/incident-query";
import { IncidentDetail } from "@/components/incidents/incident-detail";

export default async function Page({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const myReportScope = { ...user, role: "Reporter" as const };
  const [incident, lookup, users] = await Promise.all([getIncidentForUser(params.id, myReportScope), getLookupData(), getActiveUsers()]);
  if (!incident) notFound();
  return <AppShell user={user}><IncidentDetail incident={incident} currentUser={user} units={lookup.units} riskCodes={lookup.riskCodes} users={users} /></AppShell>;
}
