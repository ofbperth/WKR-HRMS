import { apiError, requireUser } from "@/lib/auth";
import { auditLog } from "@/lib/audit";
import { getIncidentForUser } from "@/lib/incident-query";
import { canSeeSensitive } from "@/lib/rbac";
import { decryptIncidentIdentifier } from "@/lib/sensitive-fields";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser(["Reporter", "UnitManager", "RMTeam", "Admin"]);
    if (!canSeeSensitive(user.role)) return Response.json({ error: "FORBIDDEN" }, { status: 403 });
    const body = await request.json().catch(() => ({}));
    const reason = typeof body.reason === "string" ? body.reason.trim() : "";
    const pdpaConfirmed = body.pdpaConfirmed === true;
    if (reason.length < 10) return Response.json({ error: "REASON_REQUIRED" }, { status: 400 });
    if (!pdpaConfirmed) return Response.json({ error: "PDPA_CONFIRMATION_REQUIRED" }, { status: 400 });

    const incident = await getIncidentForUser(params.id, user);
    if (!incident) return Response.json({ error: "NOT_FOUND" }, { status: 404 });

    await auditLog({
      userId: user.id,
      role: user.role,
      action: "VIEW_PATIENT_IDENTIFIER",
      entityType: "Incident",
      entityId: params.id,
      newValue: {
        incidentNo: incident.incidentNo,
        requesterName: user.name,
        requesterEmail: user.email,
        requesterRole: user.role,
        reason,
        pdpaConfirmed: true,
        viewedFields: ["patientHn", "patientAn"],
      },
    });

    return Response.json({
      patientHn: decryptIncidentIdentifier((incident as any).hnEncrypted) || "-",
      patientAn: decryptIncidentIdentifier((incident as any).anEncrypted) || "-",
    });
  } catch (error) {
    return apiError(error);
  }
}
