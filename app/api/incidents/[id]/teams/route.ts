import { apiError, requireUser } from "@/lib/auth";
import { auditLog } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { teamAssignmentSchema } from "@/lib/validators";

function canManageIncidentTeams(user: { role: string; unitId: string | null }, incident: { incidentUnitId: string }) {
  if (user.role === "Admin" || user.role === "RMTeam") return true;
  return user.role === "UnitManager" && !!user.unitId && user.unitId === incident.incidentUnitId;
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser(["UnitManager", "RMTeam", "Admin"]);
    const input = teamAssignmentSchema.parse(await request.json());
    const incident = await prisma.incident.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        incidentUnitId: true,
        incidentTeams: { include: { team: true } },
      },
    });
    if (!incident) return Response.json({ error: "NOT_FOUND" }, { status: 404 });
    if (!canManageIncidentTeams(user, incident)) return Response.json({ error: "FORBIDDEN" }, { status: 403 });

    const requestedTeamIds = [...new Set(input.teamIds)];
    const teams = requestedTeamIds.length
      ? await prisma.team.findMany({ where: { id: { in: requestedTeamIds }, isActive: true } })
      : [];
    if (teams.length !== requestedTeamIds.length) {
      return Response.json({ error: "INVALID_TEAM_SELECTION" }, { status: 400 });
    }

    const currentTeamIds = new Set(incident.incidentTeams.map((item) => item.teamId));
    const nextTeamIds = new Set(requestedTeamIds);
    const addedIds = requestedTeamIds.filter((teamId) => !currentTeamIds.has(teamId));
    const removedIds = incident.incidentTeams.filter((item) => !nextTeamIds.has(item.teamId)).map((item) => item.teamId);

    await prisma.$transaction(async (tx) => {
      if (removedIds.length) {
        await tx.incidentTeam.deleteMany({
          where: {
            incidentId: incident.id,
            teamId: { in: removedIds },
          },
        });
      }
      if (addedIds.length) {
        await tx.incidentTeam.createMany({
          data: addedIds.map((teamId) => ({
            incidentId: incident.id,
            teamId,
            assignedById: user.id,
          })),
          skipDuplicates: true,
        });
      }
    });

    const refreshed = await prisma.incident.findUnique({
      where: { id: incident.id },
      select: {
        incidentTeams: {
          include: { team: true, assignedBy: { select: { id: true, name: true, email: true, role: true, unitId: true } } },
          orderBy: [{ team: { sortOrder: "asc" } }, { team: { name: "asc" } }],
        },
      },
    });

    const currentNames = incident.incidentTeams.map((item) => item.team.name);
    const nextNames = refreshed?.incidentTeams.map((item) => item.team.name) ?? [];
    await auditLog({
      userId: user.id,
      role: user.role,
      action: "INCIDENT_TEAMS_UPDATED",
      entityType: "Incident",
      entityId: incident.id,
      oldValue: { relatedTeams: currentNames },
      newValue: {
        relatedTeams: nextNames,
        addedTeams: teams.filter((team) => addedIds.includes(team.id)).map((team) => team.name),
        removedTeams: incident.incidentTeams.filter((item) => removedIds.includes(item.teamId)).map((item) => item.team.name),
      },
    });

    return Response.json({ incidentTeams: refreshed?.incidentTeams ?? [] });
  } catch (error) {
    return apiError(error);
  }
}
