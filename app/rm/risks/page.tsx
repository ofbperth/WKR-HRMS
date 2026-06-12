import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/sidebar";
import { RiskBoard } from "@/components/risks/risk-server";
import { getCurrentUser } from "@/lib/auth";

export default async function RmRisksPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return (
    <AppShell user={user}>
      <RiskBoard
        user={user}
        title="Risk Register"
        description="Hospital-wide and unit risk board for RM/Admin."
        basePath="/rm/risks"
        filters={Object.fromEntries(Object.entries(searchParams).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value]))}
      />
    </AppShell>
  );
}
