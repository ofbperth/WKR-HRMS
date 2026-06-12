import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/sidebar";
import { RiskBoard } from "@/components/risks/risk-server";
import { getCurrentUser } from "@/lib/auth";

export default async function UnitRisksPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return (
    <AppShell user={user}>
      <RiskBoard
        user={user}
        title="My Unit Risks"
        description="Unit proposals and hospital-level aggregate risk visibility."
        basePath="/unit/risks"
        filters={Object.fromEntries(Object.entries(searchParams).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value]))}
      />
    </AppShell>
  );
}
