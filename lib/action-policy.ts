import "server-only";
import { prisma } from "@/lib/prisma";

export async function validateActionOwnerAssignment(input: {
  actor: { role: string; unitId: string | null };
  ownerId: string | null;
  incidentUnitId: string;
}) {
  if (!input.ownerId) return null;
  const owner = await prisma.user.findUnique({
    where: { id: input.ownerId },
    select: { id: true, isActive: true, unitId: true },
  });
  if (!owner || !owner.isActive) {
    throw new Error("ACTION_OWNER_MUST_BE_ACTIVE");
  }
  if (input.actor.role === "UnitManager" && owner.unitId !== input.incidentUnitId) {
    throw new Error("CROSS_UNIT_ACTION_ASSIGNMENT_FORBIDDEN");
  }
  return owner;
}
