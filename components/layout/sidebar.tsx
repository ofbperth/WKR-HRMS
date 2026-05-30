import type React from "react";
import Link from "next/link";
import { BarChart3, ClipboardCheck, ClipboardList, FileCheck2, FilePlus2, FileText, Grid3X3, Home, Hospital, LayoutDashboard, LogOut, Search, Settings, ShieldAlert, UserCircle, Users } from "lucide-react";
import type { Role } from "@/lib/types";
import { roleLabels } from "@/lib/rbac";
import { RoleBadge } from "@/components/ui/badge";
import { NotificationBell } from "@/components/layout/notification-bell";

type MenuItem = { href: string; label: string; icon?: React.ReactNode };
type MenuSection = { title: string; items: MenuItem[] };

const rmTeamMenu: MenuSection[] = [
  {
    title: "งานหลัก",
    items: [
      { href: "/rm", label: "หน้าหลัก", icon: <Home size={18} /> },
      { href: "/report/new", label: "รายงานอุบัติการณ์", icon: <FilePlus2 size={18} /> },
      { href: "/rm/triage", label: "คิวตรวจสอบ", icon: <FileCheck2 size={18} /> },
      { href: "/rm/rca", label: "RCA", icon: <ClipboardCheck size={18} /> },
      { href: "/rm/actions", label: "แผนการแก้ไข", icon: <ClipboardList size={18} /> },
      { href: "/rm/search", label: "ค้นหา/Export อุบัติการณ์", icon: <Search size={18} /> },
    ],
  },
  {
    title: "ค้นหาและรายงาน",
    items: [
      { href: "/my-reports", label: "รายงานของฉัน", icon: <FileText size={18} /> },
      { href: "/rm/reports", label: "รายงาน", icon: <BarChart3 size={18} /> },
    ],
  },
  {
    title: "Analytics",
    items: [
      { href: "/rm/dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
      { href: "/rm/heatmap", label: "Heatmap", icon: <Grid3X3 size={18} /> },
      { href: "/rm/safety-goals", label: "9 มาตรฐานสำคัญ", icon: <ShieldAlert size={18} /> },
    ],
  },
  { title: "ตั้งค่า", items: [{ href: "/rm/automation", label: "งานอัตโนมัติ", icon: <Settings size={18} /> }, { href: "/profile", label: "ข้อมูลส่วนตัว", icon: <UserCircle size={18} /> }] },
];

const adminMenu: MenuSection[] = [
  {
    title: "ผู้ดูแลระบบ",
    items: [
      { href: "/admin", label: "ศูนย์ควบคุม", icon: <Home size={18} /> },
      { href: "/admin/users", label: "ผู้ใช้", icon: <Users size={18} /> },
      { href: "/admin/units", label: "หน่วยงาน", icon: <Hospital size={18} /> },
      { href: "/admin/risk-codes", label: "รหัสความเสี่ยง", icon: <ShieldAlert size={18} /> },
    ],
  },
  {
    title: "งาน RM",
    items: [
      { href: "/report/new", label: "รายงานอุบัติการณ์", icon: <FilePlus2 size={18} /> },
      { href: "/rm/triage", label: "คิวตรวจสอบ", icon: <FileCheck2 size={18} /> },
      { href: "/rm/rca", label: "RCA", icon: <ClipboardCheck size={18} /> },
      { href: "/rm/actions", label: "แผนการแก้ไข", icon: <ClipboardList size={18} /> },
      { href: "/rm/search", label: "ค้นหา/Export อุบัติการณ์", icon: <Search size={18} /> },
    ],
  },
  {
    title: "Dashboards",
    items: [
      { href: "/rm/dashboard", label: "RM/Admin Dashboard", icon: <LayoutDashboard size={18} /> },
      { href: "/rm/heatmap", label: "Heatmap", icon: <Grid3X3 size={18} /> },
      { href: "/rm/safety-goals", label: "9 มาตรฐานสำคัญ", icon: <ShieldAlert size={18} /> },
      { href: "/executive/dashboard", label: "ผู้บริหาร", icon: <BarChart3 size={18} /> },
      { href: "/executive/monthly-report", label: "รายงานสรุป", icon: <FileText size={18} /> },
    ],
  },
  {
    title: "ระบบ",
    items: [
      { href: "/my-reports", label: "รายงานของฉัน", icon: <FileText size={18} /> },
      { href: "/admin/auth-settings", label: "ตั้งค่าการเข้าสู่ระบบ", icon: <ShieldAlert size={18} /> },
      { href: "/admin/audit-logs", label: "ประวัติการตรวจสอบ", icon: <FileCheck2 size={18} /> },
      { href: "/admin/automation", label: "งานอัตโนมัติ", icon: <Settings size={18} /> },
      { href: "/admin/governance", label: "กำกับดูแล", icon: <ShieldAlert size={18} /> },
      { href: "/profile", label: "ข้อมูลส่วนตัว", icon: <UserCircle size={18} /> },
    ],
  },
];

const menus: Record<Role, MenuSection[]> = {
  Reporter: [
    { title: "รายงาน", items: [
      { href: "/reporter", label: "หน้าหลัก", icon: <Home size={18} /> },
      { href: "/report/new", label: "รายงานอุบัติการณ์", icon: <FilePlus2 size={18} /> },
      { href: "/my-reports", label: "รายงานของฉัน", icon: <FileText size={18} /> },
      { href: "/profile", label: "ข้อมูลส่วนตัว", icon: <UserCircle size={18} /> },
    ] },
  ],
  UnitManager: [
    { title: "งานหน่วยงาน", items: [
      { href: "/unit", label: "หน้าหลัก", icon: <Home size={18} /> },
      { href: "/report/new", label: "รายงานอุบัติการณ์", icon: <FilePlus2 size={18} /> },
      { href: "/unit/triage", label: "คิวตรวจสอบ", icon: <FileCheck2 size={18} /> },
      { href: "/unit/rca", label: "RCA", icon: <ClipboardCheck size={18} /> },
      { href: "/unit/actions", label: "แผนการแก้ไข", icon: <ClipboardList size={18} /> },
    ] },
    { title: "ติดตามงาน", items: [
      { href: "/unit/dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
      { href: "/unit/incidents", label: "ค้นหา / Export", icon: <Search size={18} /> },
      { href: "/executive/monthly-report", label: "รายงานสรุป", icon: <FileText size={18} /> },
      { href: "/my-reports", label: "รายงานของฉัน", icon: <FileText size={18} /> },
      { href: "/profile", label: "ข้อมูลส่วนตัว", icon: <UserCircle size={18} /> },
    ] },
  ],
  RMTeam: rmTeamMenu,
  Executive: [
    { title: "ผู้บริหาร", items: [
      { href: "/executive", label: "หน้าหลัก", icon: <Home size={18} /> },
      { href: "/executive/dashboard", label: "Dashboard", icon: <BarChart3 size={18} /> },
      { href: "/executive/safety-goals", label: "9 มาตรฐานสำคัญ", icon: <ShieldAlert size={18} /> },
      { href: "/executive/monthly-report", label: "รายงานสรุป", icon: <FileText size={18} /> },
      { href: "/profile", label: "ข้อมูลส่วนตัว", icon: <UserCircle size={18} /> },
    ] },
  ],
  Admin: adminMenu,
};

export function AppShell({ children, user }: { children: React.ReactNode; user: { name: string; email: string; role: Role } }) {
  const sections = menus[user.role];
  const mobileItems = sections.flatMap(section => section.items).slice(0, 9);
  return <div className="min-h-screen bg-transparent">
    <aside className="fixed inset-y-0 left-0 hidden w-72 flex-col border-r border-emerald-100 bg-white/95 shadow-xl shadow-emerald-950/5 backdrop-blur print:hidden lg:flex">
      <div className="shrink-0 p-5 pb-3">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-300 p-2.5 text-white shadow-lg shadow-emerald-500/20"><Hospital size={24} /></div>
          <div><div className="text-lg font-bold tracking-normal text-emerald-700">WKR-HRMS</div><div className="text-xs text-muted-foreground">ระบบบริหารความเสี่ยงโรงพยาบาล</div></div>
        </div>
      </div>
      <nav className="min-h-0 flex-1 space-y-5 overflow-y-auto px-3 py-3">
        {sections.map(section => <div key={section.title} className="space-y-1">
          <div className="px-3 text-[11px] font-bold uppercase text-emerald-700/80">{section.title}</div>
          {section.items.map(m => <Link key={m.href} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium leading-5 text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-800" href={m.href}><span className="shrink-0 text-emerald-600">{m.icon}</span><span className="min-w-0 break-words">{m.label}</span></Link>)}
        </div>)}
      </nav>
      <div className="shrink-0 border-t border-emerald-100 bg-white/90 p-3">
        <div className="rounded-lg border border-emerald-100 bg-emerald-50/70 p-4 text-sm"><div className="font-semibold">{user.name}</div><div className="mb-2 truncate text-xs text-muted-foreground">{user.email}</div><RoleBadge role={user.role} /><div className="mt-1 text-xs text-slate-500">{roleLabels[user.role]}</div></div>
      </div>
    </aside>
    <main className="print:pl-0 lg:pl-72">
      <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-3 border-b border-emerald-100 bg-white/86 px-4 backdrop-blur print:hidden lg:px-8">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-slate-900 sm:text-base">ระบบรายงานและบริหารความเสี่ยงโรงพยาบาล</div>
          <div className="hidden text-xs text-muted-foreground sm:block">กระบวนการชัดเจน แยกสิทธิ์ตามบทบาท และทำ Triage ได้เร็ว</div>
        </div>
        <div className="flex shrink-0 items-center gap-3"><NotificationBell role={user.role} /><form action="/api/auth/logout" method="post"><button className="flex items-center gap-2 rounded-lg border border-emerald-100 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-emerald-50"><LogOut size={16}/><span className="hidden sm:inline">ออกจากระบบ</span></button></form></div>
      </header>
      <nav className="flex gap-2 overflow-x-auto border-b border-emerald-100 bg-white/95 px-4 py-3 print:hidden lg:hidden">
        {mobileItems.map(m => <Link key={m.href} className="inline-flex min-h-10 max-w-[13rem] shrink-0 items-center gap-2 rounded-lg border border-emerald-100 bg-white px-3 py-2 text-xs font-semibold leading-4 text-slate-700 shadow-sm" href={m.href}><span className="shrink-0 text-emerald-600">{m.icon}</span><span className="min-w-0 whitespace-normal break-words">{m.label}</span></Link>)}
      </nav>
      <div className="p-4 print:p-0 lg:p-8">{children}</div>
    </main>
  </div>;
}
