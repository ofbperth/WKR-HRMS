import "server-only";
import { prisma } from "@/lib/prisma";
import { canSubmitRca } from "@/lib/rbac";
import { decryptRcaNarrative } from "@/lib/sensitive-fields";
import { canUnitManageIncident } from "@/lib/workflow-permissions";
import { mapLegacyRcaToFiveTier } from "@/lib/rca-contributory-factors";

type IncidentAccessUser = { id: string; role: string; unitId: string | null };

function sanitizeRca<T extends Record<string, any>>(rca: T) {
  const { rcaEncrypted, ...rest } = rca;
  const decrypted = decryptRcaNarrative(rcaEncrypted as string | null | undefined);
  const fiveTierFactors = mapLegacyRcaToFiveTier({
    patientFactors: decrypted?.patientFactors,
    individualStaffFactors: decrypted?.individualStaffFactors,
    taskProcessTechnologyFactors: decrypted?.taskProcessTechnologyFactors,
    teamCommunicationFactors: decrypted?.teamCommunicationFactors,
    workEnvironmentOrganizationalFactors: decrypted?.workEnvironmentOrganizationalFactors,
    contributingHuman: rest.contributingHuman,
    contributingProcess: rest.contributingProcess,
    contributingEquipment: rest.contributingEquipment,
    contributingEnvironment: rest.contributingEnvironment,
    contributingCommunication: rest.contributingCommunication,
    contributingIT: rest.contributingIT,
  });
  return {
    ...rest,
    problemStatement: decrypted?.problemStatement ?? rest.problemStatement ?? null,
    timeline: decrypted?.timeline ?? rest.timeline ?? null,
    rootCause: decrypted?.rootCause ?? rest.rootCause ?? null,
    preventiveAction: decrypted?.preventiveAction ?? rest.preventiveAction ?? null,
    ...fiveTierFactors,
  };
}

export const rcaRepository = {
  async getForUser(incidentId: string, user: IncidentAccessUser) {
    if (!canSubmitRca(user.role) && !["RMTeam", "Admin"].includes(user.role)) return null;
    const incident = await prisma.incident.findUnique({
      where: { id: incidentId },
      include: { rca: true },
    });
    if (!incident?.rca) return null;
    if (user.role !== "Admin" && user.role !== "RMTeam" && !canUnitManageIncident(user as any, incident)) return null;
    return sanitizeRca(incident.rca as any);
  },
};
