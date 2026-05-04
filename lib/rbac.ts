import type { Role } from "@/lib/types";

export const roleHome: Record<Role, string> = {
  Reporter: "/reporter",
  UnitManager: "/unit",
  RMTeam: "/rm",
  Executive: "/executive",
  Admin: "/admin",
};

export const roleLabels: Record<Role, string> = {
  Reporter: "Reporter",
  UnitManager: "Unit Manager",
  RMTeam: "RM Team",
  Executive: "Executive",
  Admin: "Admin",
};

export function canAccessPath(role: string, pathname: string) {
  if (pathname === "/" || pathname === "/dashboard") return true;
  if (pathname.startsWith("/admin")) return role === "Admin";
  if (pathname.startsWith("/rm")) return role === "RMTeam" || role === "Admin";
  if (pathname.startsWith("/executive")) return role === "Executive" || role === "Admin";
  if (pathname.startsWith("/unit")) return role === "UnitManager" || role === "Admin";
  if (pathname.startsWith("/reporter")) return role === "Reporter" || role === "Admin";
  if (pathname.startsWith("/report/new")) return ["Reporter", "UnitManager", "RMTeam", "Admin"].includes(role);
  if (pathname.startsWith("/my-reports")) return ["Reporter", "UnitManager", "RMTeam", "Admin"].includes(role);
  return true;
}

export function canAccessApiPath(role: string, pathname: string) {
  if (pathname.startsWith("/api/admin")) return role === "Admin";
  if (pathname.startsWith("/api/incidents/export")) return ["RMTeam", "Admin", "UnitManager", "Reporter"].includes(role);
  if (pathname.startsWith("/api/incidents")) return ["Reporter", "UnitManager", "RMTeam", "Admin"].includes(role);
  if (pathname.startsWith("/api/notifications")) return true;
  if (pathname.startsWith("/api/lookups")) return true;
  return true;
}

export function canManageIncident(role: string) {
  return role === "RMTeam" || role === "Admin";
}

export function canSeeSensitive(role: string) {
  return role === "RMTeam" || role === "Admin";
}
