import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AppShell } from "@/components/layout/sidebar";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/format";
import { getPage, Pagination } from "@/components/ui/pagination";

export default async function Page({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const action = typeof searchParams.action === "string" ? searchParams.action : "";
  const entityType = typeof searchParams.entityType === "string" ? searchParams.entityType : "";
  const where = {
    ...(action ? { action: { contains: action } } : {}),
    ...(entityType ? { entityType } : {}),
  };
  const total = await prisma.auditLog.count({ where });
  const page = getPage(searchParams.page, total);
  const logs = await prisma.auditLog.findMany({
    where,
    include: { user: { select: { name: true, email: true, role: true } } },
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * 10,
    take: 10,
  });
  const query = new URLSearchParams();
  if (action) query.set("action", action);
  if (entityType) query.set("entityType", entityType);
  query.set("export", "csv");
  return <AppShell user={user}><div className="space-y-6">
    <div><h1 className="text-2xl font-bold">ประวัติการตรวจสอบ</h1><p className="mt-2 text-slate-600">ประวัติด้านความปลอดภัย การเข้าสู่ระบบ workflow export และกิจกรรมของผู้ดูแลระบบ</p></div>
    <form className="grid gap-3 rounded-xl border bg-white p-4 md:grid-cols-4" action="/admin/audit-logs"><input className="rounded-md border px-3 py-2 text-sm" name="action" placeholder="กิจกรรม" defaultValue={action} /><input className="rounded-md border px-3 py-2 text-sm" name="entityType" placeholder="ประเภทข้อมูล" defaultValue={entityType} /><button className="rounded-md bg-primary px-3 py-2 text-sm text-white">ตัวกรอง</button><a className="rounded-md border px-3 py-2 text-center text-sm" href={`/api/admin/audit-logs?${query.toString()}`}>Export CSV</a></form>
    <div className="overflow-hidden rounded-xl border bg-white"><div className="overflow-auto"><table className="min-w-[1100px] w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">สร้างเมื่อ</th><th className="px-4 py-3">ผู้ใช้</th><th className="px-4 py-3">กิจกรรม</th><th className="px-4 py-3">ข้อมูล</th><th className="px-4 py-3">รหัสข้อมูล</th><th className="px-4 py-3">ค่าใหม่</th></tr></thead><tbody className="divide-y">{logs.length === 0 ? <tr><td className="px-4 py-8 text-center text-slate-500" colSpan={6}>ยังไม่มีประวัติการตรวจสอบ</td></tr> : logs.map((log) => <tr key={log.id}><td className="px-4 py-3">{formatDateTime(log.createdAt)}</td><td className="px-4 py-3">{log.user?.email ?? "ระบบ"}</td><td className="px-4 py-3 font-medium">{log.action}</td><td className="px-4 py-3">{log.entityType}</td><td className="px-4 py-3">{log.entityId ?? "-"}</td><td className="max-w-md truncate px-4 py-3 text-xs text-slate-600">{log.newValue ?? "-"}</td></tr>)}</tbody></table></div></div>
    <Pagination basePath="/admin/audit-logs" searchParams={searchParams} page={page} total={total} />
  </div></AppShell>;
}
