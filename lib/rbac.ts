import type { Role } from "@/lib/types";

export const roleHome: Record<Role, string> = {
  Reporter: "/reporter",
  UnitManager: "/unit",
  RMTeam: "/rm",
  Executive: "/executive",
  Admin: "/admin",
};

export const roleLabels: Record<Role, string> = {
  Reporter: "ผู้รายงาน",
  UnitManager: "หัวหน้าหน่วยงาน",
  RMTeam: "ทีม RM",
  Executive: "ผู้บริหาร",
  Admin: "ผู้ดูแลระบบ",
};

function hasRmTeamAuthority(role: string) {
  return role === "RMTeam" || role === "Admin";
}

export function canAccessPath(role: string, pathname: string) {
  if (pathname === "/" || pathname === "/dashboard") return true;
  if (pathname.startsWith("/rm/triage")) return ["RMTeam", "Admin", "UnitManager"].includes(role);
  if (pathname.startsWith("/rm/search")) return ["Executive", "RMTeam", "Admin"].includes(role);
  if (pathname.startsWith("/rm")) return hasRmTeamAuthority(role);
  if (pathname.startsWith("/admin")) return role === "Admin";
  if (pathname.startsWith("/executive/monthly-report")) return ["Executive", "RMTeam", "Admin", "UnitManager"].includes(role);
  if (pathname.startsWith("/executive")) return role === "Executive" || role === "Admin";
  if (pathname.startsWith("/unit")) return role === "UnitManager" || role === "Admin";
  if (pathname.startsWith("/reporter")) return role === "Reporter" || role === "Admin";
  if (pathname.startsWith("/report/new")) return ["Reporter", "UnitManager", "RMTeam", "Admin"].includes(role);
  if (pathname.startsWith("/my-reports")) return ["Reporter", "UnitManager", "RMTeam", "Admin"].includes(role);
  return true;
}

export function canAccessApiPath(role: string, pathname: string) {
  if (pathname.startsWith("/api/auth/me")) return true;
  if (pathname.startsWith("/api/onboarding/unit")) return true;
  if (pathname.startsWith("/api/admin")) return role === "Admin";
  if (pathname.startsWith("/api/dashboard/executive")) return ["Executive", "RMTeam", "Admin"].includes(role);
  if (pathname.startsWith("/api/dashboard/rm")) return ["RMTeam", "Admin"].includes(role);
  if (pathname.startsWith("/api/dashboard/unit")) return ["UnitManager", "Admin"].includes(role);
  if (pathname.startsWith("/api/analytics")) return ["Executive", "RMTeam", "UnitManager", "Admin"].includes(role);
  if (pathname.startsWith("/api/automation")) return ["RMTeam", "Admin"].includes(role);
  if (pathname.startsWith("/api/exports")) return ["Reporter", "UnitManager", "RMTeam", "Admin"].includes(role);
  if (pathname.startsWith("/api/rca")) return ["UnitManager", "RMTeam", "Admin"].includes(role);
  if (pathname.startsWith("/api/actions")) return ["Reporter", "UnitManager", "RMTeam", "Admin"].includes(role);
  if (pathname.startsWith("/api/reports/monthly")) return hasRmTeamAuthority(role) || role === "Executive";
  if (pathname.startsWith("/api/incidents/export")) return ["RMTeam", "Admin", "UnitManager", "Reporter"].includes(role);
  if (/^\/api\/incidents\/[^/]+\/sensitive/.test(pathname)) return canSeeSensitive(role);
  if (pathname.startsWith("/api/incidents")) return ["Reporter", "UnitManager", "RMTeam", "Admin"].includes(role);
  if (pathname.startsWith("/api/notifications")) return true;
  if (pathname.startsWith("/api/lookups")) return true;
  return false;
}

export function canManageIncident(role: string) {
  return hasRmTeamAuthority(role);
}

export function canSubmitRca(role: string) {
  return role === "UnitManager" || role === "Admin";
}

export function canApproveRca(role: string) {
  return hasRmTeamAuthority(role);
}

export function canSeeSensitive(role: string) {
  return hasRmTeamAuthority(role);
}
