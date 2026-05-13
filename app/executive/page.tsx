import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AppShell } from "@/components/layout/sidebar";
import { RoleHome } from "@/components/role-home";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { countableIncidentFilter } from "@/lib/prisma-fields";

export default async function ExecutivePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const [total, high, sentinel, rmSupport] = await Promise.all([
    prisma.incident.count({ where: countableIncidentFilter() }),
    prisma.incident.count({ where: countableIncidentFilter({ severity: { in: ["E", "F", "G", "H", "I"] } }) }),
    prisma.incident.count({ where: countableIncidentFilter({ isSentinel: true }) }),
    prisma.incident.count({ where: countableIncidentFilter({ needRmSupport: true }) }),
  ]);
  return <AppShell user={user}><RoleHome title="Executive Dashboard" description="Phase 2 placeholder: แสดง count ภาพรวมแบบไม่ลง sensitive detail">
    <div className="grid gap-4 md:grid-cols-4">
      <Card><CardHeader><CardTitle>Incident ทั้งหมด</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{total}</CardContent></Card>
      <Card><CardHeader><CardTitle>Severity E-I</CardTitle></CardHeader><CardContent className="text-3xl font-bold text-amber-700">{high}</CardContent></Card>
      <Card><CardHeader><CardTitle>Sentinel</CardTitle></CardHeader><CardContent className="text-3xl font-bold text-red-700">{sentinel}</CardContent></Card>
      <Card><CardHeader><CardTitle>Need RM support</CardTitle></CardHeader><CardContent className="text-3xl font-bold text-purple-700">{rmSupport}</CardContent></Card>
    </div>
  </RoleHome></AppShell>;
}
