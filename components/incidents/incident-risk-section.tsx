import { IncidentRiskPanel } from "@/components/risks/risk-client";
import { getActiveTeams, getActiveUnits, getActiveUsers } from "@/lib/incident-query";
import { canCreateHospitalRisk, canCreateUnitRiskProposal } from "@/lib/rbac";
import { getRelatedRisksForIncident, getRiskListForUser } from "@/lib/risk-register";

export async function IncidentRiskSection({
  incident,
  currentUser,
}: {
  incident: { id: string; title: string; incidentUnitId: string };
  currentUser: { id: string; role: any; unitId: string | null };
}) {
  const [relatedRisks, riskList, units, teams, users] = await Promise.all([
    getRelatedRisksForIncident(incident.id, currentUser as any),
    getRiskListForUser(currentUser as any, {}),
    getActiveUnits(),
    getActiveTeams(),
    getActiveUsers(),
  ]);
  const riskOptions = riskList.data.filter((risk) => risk.detailHref !== null);
  return (
    <IncidentRiskPanel
      incidentId={incident.id}
      incidentTitle={incident.title}
      incidentUnitId={incident.incidentUnitId}
      relatedRisks={relatedRisks}
      riskOptions={riskOptions}
      units={units}
      teams={teams}
      users={users}
      canCreateHospital={canCreateHospitalRisk(currentUser.role)}
      canCreateProposal={canCreateUnitRiskProposal(currentUser.role)}
    />
  );
}
