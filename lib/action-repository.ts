import "server-only";
import { prisma } from "@/lib/prisma";

type ActionAccessUser = { id: string; role: string; unitId: string | null };

export const actionRepository = {
  async listForUser(user: ActionAccessUser) {
    const where =
      user.role === "Reporter"
        ? { ownerId: user.id }
        : user.role === "UnitManager"
          ? { incident: { incidentUnitId: user.unitId ?? "__NO_UNIT__" } }
          : {};
    return prisma.actionPlan.findMany({
      where,
      include: {
        incident: { select: { id: true, incidentNo: true, incidentUnitId: true, title: true, status: true } },
        owner: { select: { id: true, name: true, email: true, role: true, unitId: true, isActive: true } },
        verifiedBy: { select: { id: true, name: true, role: true } },
      },
      orderBy: { dueDate: "asc" },
      take: 1000,
    });
  },
};
