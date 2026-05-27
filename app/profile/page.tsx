import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AppShell } from "@/components/layout/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/lib/format";
import { roleDisplay } from "@/lib/i18n/th";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return <AppShell user={user}><div className="space-y-6">
    <div><h1 className="text-2xl font-bold">ข้อมูลส่วนตัว</h1><p className="text-sm text-slate-600">สถานะการเข้าสู่ระบบและบัญชีผู้ใช้</p></div>
    <Card><CardHeader><CardTitle>{user.name}</CardTitle></CardHeader><CardContent className="grid gap-3 text-sm md:grid-cols-2">
      <Info label="อีเมล" value={user.email} />
      <Info label="บทบาท" value={roleDisplay(user.role)} />
      <Info label="วิธีเข้าสู่ระบบ" value={user.authProvider ?? "CREDENTIALS"} />
      <Info label="การเชื่อม Google" value={user.googleId ? "เชื่อมแล้ว" : "ยังไม่เชื่อม"} />
      <Info label="Login ล่าสุด" value={user.lastLoginAt ? formatDateTime(user.lastLoginAt) : "-"} />
      <Info label="สถานะ" value={user.isActive ? "เปิดใช้งาน" : "ปิดใช้งาน"} />
    </CardContent></Card>
  </div></AppShell>;
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg border bg-white p-3"><div className="text-xs text-slate-500">{label}</div><div className="mt-1 font-medium">{value}</div></div>;
}

