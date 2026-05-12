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
  const menu = menus[user.role];

  return <div className="min-h-screen bg-transparent">
    <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-emerald-100 bg-white/95 p-5 shadow-[10px_0_30px_rgba(15,23,42,0.04)] backdrop-blur lg:block">
      <Link href="/dashboard" className="mb-8 flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-lg bg-emerald-500 text-white shadow-[0_12px_24px_rgba(34,197,94,0.28)]"><Hospital size={26} /></div>
        <div>
          <div className="text-xl font-bold tracking-normal text-emerald-600">WKR-HRMS</div>
          <div className="text-xs font-medium text-slate-500">Hospital Risk Management</div>
        </div>
      </Link>

      <nav className="space-y-1.5">
        {menu.map(m => <Link key={m.href} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-700" href={m.href}>{m.icon}{m.label}</Link>)}
      </nav>

      <div className="absolute bottom-5 left-5 right-5 rounded-lg border border-emerald-100 bg-emerald-50/70 p-4 text-sm shadow-sm">
        <div className="font-semibold text-slate-900">{user.name}</div>
        <div className="mb-3 truncate text-xs text-muted-foreground">{user.email}</div>
        <div className="flex items-center justify-between gap-2"><RoleBadge role={user.role} /><span className="text-xs text-slate-500">{roleLabels[user.role]}</span></div>
      </div>
    </aside>

    <main className="lg:pl-72">
      <header className="sticky top-0 z-10 border-b border-emerald-100 bg-white/86 backdrop-blur-xl">
        <div className="flex min-h-16 items-center justify-between gap-3 px-4 lg:px-8">
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-slate-900 lg:text-base">ระบบรายงานและบริหารความเสี่ยงโรงพยาบาล</div>
            <div className="hidden text-xs text-slate-500 sm:block">One screen, clear triage, role-based workflow</div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:block"><RoleBadge role={user.role} /></div>
            <NotificationBell />
            <form action="/api/auth/logout" method="post">
              <button className="inline-flex h-10 items-center gap-2 rounded-lg border border-emerald-100 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-emerald-50" aria-label="ออกจากระบบ"><LogOut size={16}/><span className="hidden sm:inline">ออกจากระบบ</span></button>
            </form>
          </div>
        </div>
        <nav className="flex gap-2 overflow-x-auto border-t border-emerald-50 px-4 py-2 lg:hidden">
          {menu.map(m => <Link key={m.href} href={m.href} className="inline-flex shrink-0 items-center gap-2 rounded-full border border-emerald-100 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm">{m.icon}{m.label}</Link>)}
        </nav>
      </header>
      <div className="p-4 lg:p-8">{children}</div>
    </main>
  </div>;
}
