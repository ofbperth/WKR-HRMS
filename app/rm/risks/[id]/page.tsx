import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/sidebar";
import { RiskDetailPage } from "@/components/risks/risk-server";
import { getCurrentUser } from "@/lib/auth";

export default async function RmRiskDetailPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return (
    <AppShell user={user}>
      <RiskDetailPage user={user} id={params.id} />
    </AppShell>
  );
}
