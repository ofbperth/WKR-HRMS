import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AppShell } from "@/components/layout/sidebar";
import { getIncidentCoreForUser } from "@/lib/incident-query";
import { IncidentDetail } from "@/components/incidents/incident-detail";

export default async function Page({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const incident = await getIncidentCoreForUser(params.id, user);
  if (!incident) notFound();
  return <AppShell user={user}><IncidentDetail incident={incident} currentUser={user} /></AppShell>;
}
