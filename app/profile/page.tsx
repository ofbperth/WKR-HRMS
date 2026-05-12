import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AppShell } from "@/components/layout/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/lib/format";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return <AppShell user={user}><div className="space-y-6">
    <div><h1 className="text-2xl font-bold">Profile</h1><p className="text-sm text-slate-600">Authentication and account status.</p></div>
    <Card><CardHeader><CardTitle>{user.name}</CardTitle></CardHeader><CardContent className="grid gap-3 text-sm md:grid-cols-2">
      <Info label="Email" value={user.email} />
      <Info label="Role" value={user.role} />
      <Info label="Auth provider" value={user.authProvider ?? "CREDENTIALS"} />
      <Info label="Google linked" value={user.googleId ? "Linked" : "Not linked"} />
      <Info label="Last login" value={user.lastLoginAt ? formatDateTime(user.lastLoginAt) : "-"} />
      <Info label="Status" value={user.isActive ? "Active" : "Inactive"} />
    </CardContent></Card>
  </div></AppShell>;
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg border bg-white p-3"><div className="text-xs text-slate-500">{label}</div><div className="mt-1 font-medium">{value}</div></div>;
}

