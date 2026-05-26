import type { Role } from "@/lib/types";

export function canUnitManageIncident(user: { role: Role; unitId: string | null }, incident: { incidentUnitId: string }) {
  return user.role === "UnitManager" && !!user.unitId && user.unitId === incident.incidentUnitId;
}

export function canWorkAsOwner(user: { id: string; role: Role }, action: { ownerId: string | null }) {
  return user.role === "Admin" || user.id === action.ownerId;
}

