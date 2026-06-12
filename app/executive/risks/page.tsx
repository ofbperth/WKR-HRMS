import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/sidebar";
import { RiskBoard } from "@/components/risks/risk-server";
import { getCurrentUser } from "@/lib/auth";

export default async function ExecutiveRisksPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const filters = Object.fromEntries(Object.entries(searchParams).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value]));
  return (
    <AppShell user={user}>
      <RiskBoard
        user={user}
        title="Top Hospital Risks"
        description="Aggregate-only executive view. No incident narrative, reporter identity, or RCA text is exposed here."
        basePath="/executive/risks"
        filters={{ ...filters, scope: "HOSPITAL" }}
        showExecutiveTrend
      />
    </AppShell>
  );
}
