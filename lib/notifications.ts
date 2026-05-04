import type { Prisma } from "@prisma/client";
import type { Role } from "@/lib/types";
import { prisma } from "@/lib/prisma";

export async function notifyRoles(roles: Role[], input: {
  type: string;
  title: string;
  message: string;
  relatedIncidentId?: string | null;
}) {
  const users = await prisma.user.findMany({ where: { role: { in: roles }, isActive: true }, select: { id: true } });
  if (users.length === 0) return { count: 0 };
  const data: Prisma.NotificationCreateManyInput[] = users.map(u => ({
    userId: u.id,
    type: input.type,
    title: input.title,
    message: input.message,
    relatedIncidentId: input.relatedIncidentId ?? null,
  }));
  return prisma.notification.createMany({ data });
}

export async function notifyRmTeam(input: { title: string; message: string; relatedIncidentId?: string | null; type?: string }) {
  return notifyRoles(["RMTeam", "Admin"], { type: input.type ?? "incident", title: input.title, message: input.message, relatedIncidentId: input.relatedIncidentId });
}
