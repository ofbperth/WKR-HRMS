import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/layout/sidebar";
import { AdminAuthSettings, AdminInvites } from "@/components/admin-auth-settings";

export default async function Page() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const units = await prisma.unit.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true } });
  return <AppShell user={user}><div className="space-y-6">
    <div><h1 className="text-2xl font-bold">ตั้งค่าการเข้าสู่ระบบ</h1><p className="text-sm text-slate-600">ตั้งค่านโยบาย Google Login, domain/email ที่อนุญาต และ workflow คำเชิญ Google</p></div>
    <AdminAuthSettings />
    <div><h2 className="text-lg font-semibold">คำเชิญ Google</h2><p className="text-sm text-slate-600">คำเชิญจะกำหนดบทบาท/หน่วยงานให้ผู้ใช้ ไม่สามารถเลือกบทบาทจาก Google Login เองได้</p></div>
    <AdminInvites units={units} />
  </div></AppShell>;
}

