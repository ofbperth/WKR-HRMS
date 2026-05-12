import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { roleHome } from "@/lib/rbac";
import { isRole } from "@/lib/types";
export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const rawRole: unknown = user.role;
  const role = typeof rawRole === "string" && isRole(rawRole) ? rawRole : null;
  if (!role) redirect("/login");
  redirect(roleHome[role]);
}
