import "server-only";
import { auditLog } from "@/lib/audit";
import { prisma } from "@/lib/prisma";

function canRejectInsteadOfSoftDelete(incident: {
  reviewedAt: Date | null;
  status: string;
  rca: unknown;
  actionPlans: unknown[];
  comments: unknown[];
  attachments: unknown[];
  audits?: unknown[];
}) {
  return !incident.reviewedAt &&
    incident.status === "New" &&
    !incident.rca &&
    incident.actionPlans.length === 0 &&
    incident.comments.length === 0 &&
    incident.attachments.length === 0 &&
    (incident.audits?.length ?? 0) <= 1;
}

export async function deleteIncidentWithLifecycle(input: {
  incidentId: string;
  actor: { id: string; role: string };
}) {
  const incident = await prisma.incident.findUnique({
    where: { id: input.incidentId },
    include: {
      rca: true,
      actionPlans: true,
      comments: true,
      attachments: true,
    } as any,
  });
  if (!incident) throw new Error("NOT_FOUND");

  const auditCount = await prisma.auditLog.count({
    where: { entityType: "Incident", entityId: incident.id },
  });

  if (canRejectInsteadOfSoftDelete({
    reviewedAt: incident.reviewedAt,
    status: incident.status,
    rca: incident.rca,
    actionPlans: incident.actionPlans,
    comments: incident.comments,
    attachments: incident.attachments,
    audits: new Array(auditCount),
  })) {
    const updated = await prisma.incident.update({
      where: { id: incident.id },
      data: {
        status: "Rejected",
      },
    });
    await auditLog({
      userId: input.actor.id,
      role: input.actor.role,
      action: "REJECT_INCIDENT",
      entityType: "Incident",
      entityId: incident.id,
      oldValue: { status: incident.status },
      newValue: { status: "Rejected" },
    });
    return { mode: "rejected" as const, incident: updated };
  }

  const updated = await prisma.incident.update({
    where: { id: incident.id },
    data: {
      lifecycleStatus: "SOFT_DELETED",
      deletedAt: new Date(),
      retentionReviewRequired: true,
    } as any,
  });
  await auditLog({
    userId: input.actor.id,
    role: input.actor.role,
    action: "SOFT_DELETE_INCIDENT",
    entityType: "Incident",
    entityId: incident.id,
    oldValue: { lifecycleStatus: (incident as any).lifecycleStatus ?? "ACTIVE", status: incident.status },
    newValue: { lifecycleStatus: "SOFT_DELETED", deletedAt: updated.deletedAt, retentionReviewRequired: true },
  });
  return { mode: "soft-deleted" as const, incident: updated };
}
