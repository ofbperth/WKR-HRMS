import { apiError, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { commentSchema } from "@/lib/validators";
import { auditLog } from "@/lib/audit";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser(["RMTeam", "Admin"]);
    const input = commentSchema.parse(await request.json());
    const incident = await prisma.incident.findUnique({ where: { id: params.id } });
    if (!incident) return Response.json({ error: "NOT_FOUND" }, { status: 404 });
    const comment = await prisma.comment.create({ data: { incidentId: params.id, userId: user.id, message: input.message.trim() } });
    await auditLog({ userId: user.id, action: "add comment", entityType: "Incident", entityId: params.id, newValue: { commentId: comment.id, message: comment.message } });
    return Response.json(comment, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
