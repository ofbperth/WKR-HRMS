import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/sidebar";
import { RiskBoard } from "@/components/risks/risk-server";
import { getCurrentUser } from "@/lib/auth";

export default async function RmRiskProposalsPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const filters = Object.fromEntries(Object.entries(searchParams).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value]));
  return (
    <AppShell user={user}>
      <RiskBoard
        user={user}
        title="Risk Proposal Review Queue"
        description="Approve, reject, merge, and investigate rule-based risk suggestions."
        basePath="/rm/risks/proposals"
        filters={{ ...filters, status: filters.status ?? "PROPOSED" }}
        showSuggestions
      />
    </AppShell>
  );
}
