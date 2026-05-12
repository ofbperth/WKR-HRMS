import type { Role } from "@/lib/types";
import { cn } from "@/lib/utils";
import { severityTone } from "@/lib/severity";
import { statusLabel, statusTone } from "@/lib/format";

export function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn("inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold leading-none shadow-sm", className)}>{children}</span>;
}

export function RoleBadge({ role }: { role: Role | string }) {
  const map: Record<string, string> = {
    Admin: "border-slate-800 bg-slate-900 text-white",
    RMTeam: "border-blue-200 bg-blue-50 text-blue-700",
    Executive: "border-violet-200 bg-violet-50 text-violet-700",
    UnitManager: "border-emerald-200 bg-emerald-50 text-emerald-700",
    Reporter: "border-amber-200 bg-amber-50 text-amber-700",
  };
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
  return <Badge className="border-violet-200 bg-violet-50 text-violet-700">Need RM support</Badge>;
}
