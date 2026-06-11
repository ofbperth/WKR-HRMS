import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AppShell } from "@/components/layout/sidebar";
import { AdminUnitTeamManagement } from "@/components/admin-unit-team-management";

export default async function Page() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return <AppShell user={user}><AdminUnitTeamManagement /></AppShell>;
}
