import { apiError, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(_: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const updated = await prisma.notification.updateMany({ where: { id: params.id, userId: user.id }, data: { isRead: true } });
    return Response.json(updated);
  } catch (error) {
    return apiError(error);
  }
}
