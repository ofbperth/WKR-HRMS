import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { roleHome } from "@/lib/rbac";
import { isRole } from "@/lib/types";
import { UnitSelector } from "@/components/onboarding/unit-selector";

function sanitizeNext(value: string | string[] | undefined) {
  const next = typeof value === "string" ? value : "/dashboard";
  if (!next.startsWith("/") || next.startsWith("//")) return "/dashboard";
  return next;
}

export default async function UnitOnboardingPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const rawRole: unknown = user.role;
  const role = typeof rawRole === "string" && isRole(rawRole) ? rawRole : null;
  if (!role) redirect("/login");
  if (user.unitId) redirect(roleHome[role]);
  const units = await prisma.unit.findMany({ where: { isActive: true }, select: { id: true, name: true }, orderBy: { name: "asc" } });
  return <main className="min-h-screen bg-slate-50"><UnitSelector units={units} next={sanitizeNext(searchParams.next)} /></main>;
}
