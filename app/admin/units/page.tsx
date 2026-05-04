import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AppShell } from "@/components/layout/sidebar";
import { AdminCrud } from "@/components/admin-crud";

export default async function Page() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return <AppShell user={user}><AdminCrud mode="units" /></AppShell>;
}
