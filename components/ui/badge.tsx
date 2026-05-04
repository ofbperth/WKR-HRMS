import type { Role } from "@/lib/types";
import { cn } from "@/lib/utils";
import { severityTone } from "@/lib/severity";
import { statusLabel, statusTone } from "@/lib/format";

export function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold", className)}>{children}</span>;
}

export function RoleBadge({ role }: { role: Role | string }) {
  const map: Record<string, string> = { Admin: "bg-slate-900 text-white", RMTeam: "bg-sky-100 text-sky-800", Executive: "bg-violet-100 text-violet-800", UnitManager: "bg-emerald-100 text-emerald-800", Reporter: "bg-amber-100 text-amber-800" };
  return <Badge className={map[role] || ""}>{role}</Badge>;
}

export function SeverityBadge({ severity }: { severity: string }) {
  return <Badge className={severityTone(severity)}>Level {severity}</Badge>;
}

export function StatusBadge({ status }: { status: string }) {
  return <Badge className={statusTone(status)}>{statusLabel(status)}</Badge>;
}

export function SentinelBadge({ value }: { value: boolean }) {
  if (!value) return null;
  return <Badge className="border-red-200 bg-red-600 text-white">Sentinel</Badge>;
}

export function RmSupportBadge({ value }: { value: boolean }) {
  if (!value) return null;
  return <Badge className="border-purple-200 bg-purple-100 text-purple-800">Need RM support</Badge>;
}
