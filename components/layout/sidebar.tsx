import type React from "react";
import Link from "next/link";
import { ClipboardList, FilePlus2, Hospital, LayoutDashboard, LogOut, Search, Settings, ShieldAlert, Users } from "lucide-react";
import type { Role } from "@/lib/types";
import { roleLabels } from "@/lib/rbac";
import { RoleBadge } from "@/components/ui/badge";
import { NotificationBell } from "@/components/layout/notification-bell";

const menus: Record<Role, Array<{ href: string; label: string; icon?: React.ReactNode }>> = {
  Reporter: [
    { href: "/reporter", label: "หน้าหลักผู้รายงาน", icon: <LayoutDashboard size={18} /> },
    { href: "/report/new", label: "รายงาน Incident", icon: <FilePlus2 size={18} /> },
    { href: "/my-reports", label: "My Reports", icon: <ClipboardList size={18} /> },
  ],
  UnitManager: [
    { href: "/unit", label: "หน้าหลักหัวหน้าหน่วย", icon: <LayoutDashboard size={18} /> },
    { href: "/report/new", label: "รายงาน Incident", icon: <FilePlus2 size={18} /> },
    { href: "/my-reports", label: "My Reports", icon: <ClipboardList size={18} /> },
    { href: "/unit/incidents", label: "Unit Incident List", icon: <ClipboardList size={18} /> },
  ],
  RMTeam: [
    { href: "/rm", label: "RM Workbench", icon: <ShieldAlert size={18} /> },
    { href: "/report/new", label: "รายงาน Incident", icon: <FilePlus2 size={18} /> },
    { href: "/my-reports", label: "My Reports", icon: <ClipboardList size={18} /> },
    { href: "/rm/incidents", label: "Incident Log", icon: <ClipboardList size={18} /> },
    { href: "/rm/search", label: "Search / Export", icon: <Search size={18} /> },
  ],
  Executive: [
    { href: "/executive", label: "Executive Dashboard", icon: <LayoutDashboard size={18} /> },
  ],
  Admin: [
    { href: "/admin", label: "Admin Home", icon: <Settings size={18} /> },
    { href: "/admin/users", label: "Users", icon: <Users size={18} /> },
    { href: "/admin/units", label: "Units", icon: <Hospital size={18} /> },
    { href: "/admin/risk-codes", label: "Risk Codes", icon: <ShieldAlert size={18} /> },
    { href: "/rm/incidents", label: "Incident Log", icon: <ClipboardList size={18} /> },
  ],
};

export function AppShell({ children, user }: { children: React.ReactNode; user: { name: string; email: string; role: Role } }) {
  return <div className="min-h-screen bg-slate-50">
    <aside className="fixed inset-y-0 left-0 hidden w-72 border-r bg-white p-5 lg:block">
      <div className="mb-8 flex items-center gap-3"><div className="rounded-xl bg-primary p-2 text-white"><Hospital size={24} /></div><div><div className="font-bold">Hospital Risk</div><div className="text-xs text-muted-foreground">Report & Management</div></div></div>
      <nav className="space-y-1">{menus[user.role].map(m => <Link key={m.href} className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100" href={m.href}>{m.icon}{m.label}</Link>)}</nav>
      <div className="absolute bottom-5 left-5 right-5 rounded-xl border bg-slate-50 p-4 text-sm"><div className="font-semibold">{user.name}</div><div className="mb-2 text-xs text-muted-foreground">{user.email}</div><RoleBadge role={user.role} /><div className="mt-1 text-xs text-slate-500">{roleLabels[user.role]}</div></div>
    </aside>
    <main className="lg:pl-72">
      <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-white/90 px-4 backdrop-blur lg:px-8">
        <div className="font-semibold">ระบบรายงานและบริหารความเสี่ยงโรงพยาบาล</div>
        <div className="flex items-center gap-3"><NotificationBell /><form action="/api/auth/logout" method="post"><button className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-slate-50"><LogOut size={16}/>ออกจากระบบ</button></form></div>
      </header>
      <div className="p-4 lg:p-8">{children}</div>
    </main>
  </div>;
}
