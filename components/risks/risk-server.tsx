import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/stat-cards";
import { RiskCreatePanel, RiskDetailActions } from "@/components/risks/risk-client";
import { getActiveTeams, getActiveUnits, getActiveUsers } from "@/lib/incident-query";
import {
  canCreateHospitalRisk,
  canCreateUnitRiskProposal,
  canManageAllRisks,
} from "@/lib/rbac";
import {
  getRiskDetailForUser,
  getRiskListForUser,
  getRiskSuggestionsForRm,
  riskControlEffectivenessLabels,
  riskReviewFrequencyLabels,
  riskScopeLabels,
  riskStatusLabels,
  riskTrendLabels,
  riskTypeLabels,
} from "@/lib/risk-register";

export async function RiskBoard({
  user,
  title,
  description,
  basePath,
  filters,
  showSuggestions = false,
  createDefaults,
}: {
  user: any;
  title: string;
  description: string;
  basePath: string;
  filters: Record<string, string | undefined>;
  showSuggestions?: boolean;
  createDefaults?: Record<string, unknown>;
}) {
  const [riskData, units, teams, users, suggestions] = await Promise.all([
    getRiskListForUser(user, filters),
    getActiveUnits(),
    getActiveTeams(),
    getActiveUsers(),
    showSuggestions ? getRiskSuggestionsForRm() : Promise.resolve([]),
  ]);
  const lockedScope = user.role === "UnitManager" ? "UNIT" : undefined;
  const lockedStatus = user.role === "UnitManager" ? "PROPOSED" : undefined;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-sm text-slate-600">{description}</p>
      </div>
      <form className="grid gap-3 rounded-lg border bg-white p-4 md:grid-cols-4">
        <FilterInput label="Search" name="q" defaultValue={filters.q} />
        <FilterInput label="Scope" name="scope" defaultValue={filters.scope} />
        <FilterInput label="Status" name="status" defaultValue={filters.status} />
        <FilterInput label="Risk Type" name="riskType" defaultValue={filters.riskType} />
        <FilterInput label="Owner Unit" name="ownerUnitId" defaultValue={filters.ownerUnitId} />
        <FilterInput label="Owner Team" name="ownerTeamId" defaultValue={filters.ownerTeamId} />
        <FilterInput label="Trend" name="trend" defaultValue={filters.trend} />
        <FilterInput label="Due Review" name="dueReview" defaultValue={filters.dueReview} />
        <div className="md:col-span-4">
          <button className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white" type="submit">
            Apply Filters
          </button>
        </div>
      </form>
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard title="Extreme" value={riskData.cards.extreme} />
        <StatCard title="High" value={riskData.cards.high} />
        <StatCard title="Overdue Review" value={riskData.cards.overdueReview} />
        <StatCard title="Need Decision" value={riskData.cards.needDecision} />
      </div>
      {(canCreateHospitalRisk(user.role) || canCreateUnitRiskProposal(user.role)) ? (
        <RiskCreatePanel
          units={units}
          teams={teams}
          users={users}
          defaults={createDefaults}
          lockedScope={lockedScope}
          lockedStatus={lockedStatus}
          label={user.role === "UnitManager" ? "Create Risk Proposal" : "Create Risk"}
        />
      ) : null}
      {showSuggestions && suggestions.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Suggested Risk Candidates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {suggestions.map((suggestion) => (
              <div key={suggestion.key} className="rounded border p-3">
                <div className="font-semibold">
                  {suggestion.riskCode?.code} {suggestion.riskCode?.nameTh}
                </div>
                <div className="text-slate-600">
                  {suggestion.unit?.name ?? "-"} · {suggestion.team?.name ?? "No team"} · {suggestion.incidentCount} incidents · {suggestion.reason}
                </div>
                <Link
                  href={`${basePath}?title=${encodeURIComponent(`${suggestion.riskCode?.code ?? "RISK"} cluster in ${suggestion.unit?.name ?? "unit"}`)}&description=${encodeURIComponent(`Suggested from ${suggestion.incidentCount} incidents in 90 days`)}`}
                  className="mt-2 inline-block text-blue-700 underline"
                >
                  Use as create draft
                </Link>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
      <div className="space-y-3">
        {riskData.data.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-sm text-slate-500">No risks found.</CardContent>
          </Card>
        ) : (
          riskData.data.map((risk) => (
            <Card key={risk.id}>
              <CardContent className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-slate-500">{risk.riskNo}</div>
                    <div className="text-lg font-semibold">{risk.title}</div>
                    <div className="text-sm text-slate-600">
                      {riskScopeLabels[risk.scope] ?? risk.scope} · {riskStatusLabels[risk.status] ?? risk.status} · {riskTypeLabels[risk.riskType] ?? risk.riskType}
                    </div>
                    <div className="mt-1 text-sm text-slate-600">
                      Owner: {risk.ownerUnit?.name ?? "-"} / {risk.ownerTeam?.name ?? "-"}
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    <div>
                      Residual score <strong>{risk.residualScore}</strong> ({risk.residualLevel})
                    </div>
                    <div>Trend: {riskTrendLabels[risk.trend] ?? risk.trend}</div>
                    <div>Linked incidents: {risk.aggregate.linkedIncidentCount}</div>
                    <div>Open RCA: {risk.aggregate.openRcaCount}</div>
                    <div>Open actions: {risk.aggregate.openActionCount}</div>
                    <div>Next review: {risk.nextReviewAt ? new Date(risk.nextReviewAt).toLocaleDateString("en-CA") : "-"}</div>
                  </div>
                </div>
                {risk.detailHref ? (
                  <div className="mt-3">
                    <Link className="text-blue-700 underline" href={risk.detailHref}>
                      Open detail
                    </Link>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

export async function RiskDetailPage({ user, id }: { user: any; id: string }) {
  const risk = await getRiskDetailForUser(id, user);
  if (!risk) notFound();
  const [units, teams, users, allRisks, incidents] = await Promise.all([
    getActiveUnits(),
    getActiveTeams(),
    getActiveUsers(),
    canManageAllRisks(user.role) ? getRiskListForUser(user, {}) : Promise.resolve({ data: [] as any[] }),
    risk.canLink
      ? import("@/lib/incident-query").then(({ getIncidentList }) =>
          getIncidentList(
            { id: user.id, role: user.role, unitId: user.unitId },
            risk.scope === "UNIT" && risk.ownerUnitId ? { unitId: risk.ownerUnitId } : {},
          ),
        )
      : Promise.resolve({ data: [] as any[] }),
  ]);
  const mergeTargets = (allRisks.data ?? []).filter((item) => item.id !== risk.id && item.scope === risk.scope);
  const linkedIncidentIds = new Set((risk.incidentLinks ?? []).map((link: any) => link.incident?.id));
  const linkableIncidents = (incidents.data ?? [])
    .filter((incident: any) => !linkedIncidentIds.has(incident.id))
    .map((incident: any) => ({
      id: incident.id,
      incidentNo: incident.incidentNo,
      title: incident.title,
      unitName: incident.incidentUnit?.name ?? "-",
    }))
    .slice(0, 20);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-500">{risk.riskNo}</div>
          <h1 className="text-2xl font-bold">{risk.title}</h1>
          <p className="text-sm text-slate-600">
            {riskScopeLabels[risk.scope] ?? risk.scope} · {riskStatusLabels[risk.status] ?? risk.status} · residual {risk.residualScore} ({risk.residualLevel})
          </p>
        </div>
        <div className="text-sm text-right text-slate-600">
          <div>Owner unit: {risk.ownerUnit?.name ?? "-"}</div>
          <div>Owner team: {risk.ownerTeam?.name ?? "-"}</div>
          <div>Trend: {riskTrendLabels[risk.trend] ?? risk.trend}</div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard title="Linked Incidents" value={risk.aggregate.linkedIncidentCount} />
        <StatCard title="High/Extreme Incidents" value={risk.aggregate.highSeverityCount} />
        <StatCard title="Open RCA" value={risk.aggregate.openRcaCount} />
        <StatCard title="Open Actions" value={risk.aggregate.openActionCount} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Info label="Description" value={risk.description} />
            <Info label="Risk Type" value={riskTypeLabels[risk.riskType] ?? risk.riskType} />
            <Info label="Risk Domain" value={risk.riskDomain ?? "-"} />
            <Info label="Control Effectiveness" value={riskControlEffectivenessLabels[risk.controlEffectiveness] ?? risk.controlEffectiveness} />
            <Info label="Review Frequency" value={riskReviewFrequencyLabels[risk.reviewFrequency] ?? risk.reviewFrequency} />
            <Info label="Next Review" value={risk.nextReviewAt ? new Date(risk.nextReviewAt).toLocaleDateString("en-CA") : "-"} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Committee / Decision</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Info label="Decision Required" value={risk.decisionRequired ? "Yes" : "No"} />
            <Info label="Decision Note" value={risk.decisionNote ?? "-"} />
            <Info label="Accepted Reason" value={risk.acceptedReason ?? "-"} />
            <Info label="Approved By" value={risk.approvedBy?.name ?? "-"} />
            <Info label="Closed By" value={risk.closedBy?.name ?? "-"} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Linked Incidents</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {risk.aggregateOnly ? (
              <p className="text-slate-500">Aggregate-only view for this role. Incident narratives are hidden.</p>
            ) : risk.incidentLinks?.length ? (
              risk.incidentLinks.map((link: any) => (
                <div key={link.id} className="rounded border p-3">
                  <div className="font-semibold">
                    {link.incident.incidentNo} {link.incident.title}
                  </div>
                  <div className="text-slate-600">
                    {link.incident.incidentUnit?.name ?? "-"} · severity {link.incident.severity} · {link.incident.status}
                  </div>
                  <div className="text-slate-600">NRLS: {link.incident.riskCode?.code ?? "-"}</div>
                  {!risk.aggregateOnly ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      <a
                        className="text-blue-700 underline"
                        href={user.role === "UnitManager" ? `/unit/incidents/${link.incident.id}` : `/rm/search/${link.incident.id}`}
                      >
                        Open incident
                      </a>
                      {risk.canLink ? (
                        <button
                          className="text-sm text-red-700 underline"
                          formAction={`/api/risks/${risk.id}/links/${link.incident.id}`}
                          formMethod="post"
                        >
                          Use delete endpoint below
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ))
            ) : (
              <p className="text-slate-500">No linked incidents.</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Related RCA via Incidents</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {risk.aggregateOnly ? (
              <p className="text-slate-500">Aggregate-only view for this role. RCA narrative is hidden.</p>
            ) : (
              (risk.incidentLinks ?? [])
                .filter((link: any) => link.incident?.rca)
                .map((link: any) => (
                  <div key={link.id} className="rounded border p-3">
                    <div className="font-semibold">{link.incident.incidentNo}</div>
                    <div className="text-slate-600">Status: {link.incident.rca.status}</div>
                    <div className="mt-1 text-slate-700">Root cause: {link.incident.rca.rootCause ?? "-"}</div>
                    <div className="text-slate-700">Preventive action: {link.incident.rca.preventiveAction ?? "-"}</div>
                  </div>
                ))
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Related Action Plans via Incidents</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {risk.aggregateOnly ? (
              <p className="text-slate-500">Aggregate-only view for this role. Action detail is hidden.</p>
            ) : (
              (risk.incidentLinks ?? []).flatMap((link: any) =>
                (link.incident.actionPlans ?? []).map((action: any) => (
                  <div key={action.id} className="rounded border p-3">
                    <div className="font-semibold">{action.title}</div>
                    <div className="text-slate-600">
                      {link.incident.incidentNo} · {action.status} · due {new Date(action.dueDate).toLocaleDateString("en-CA")}
                    </div>
                  </div>
                )),
              )
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Reviews</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {(risk.reviews ?? []).length === 0 ? (
              <p className="text-slate-500">No reviews yet.</p>
            ) : (
              (risk.reviews ?? []).map((review: any) => (
                <div key={review.id} className="rounded border p-3">
                  <div className="font-semibold">{new Date(review.reviewDate).toLocaleDateString("en-CA")}</div>
                  <div className="text-slate-600">
                    Residual {review.residualLikelihood}x{review.residualImpact} · {riskTrendLabels[review.trend] ?? review.trend}
                  </div>
                  {review.summary ? <div className="mt-1 text-slate-700">{review.summary}</div> : null}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {!risk.aggregateOnly ? (
        <RiskDetailActions
          risk={risk}
          units={units}
          teams={teams}
          users={users}
          mergeTargets={mergeTargets}
          linkableIncidents={linkableIncidents}
        />
      ) : null}
    </div>
  );
}

function FilterInput({ label, name, defaultValue }: { label: string; name: string; defaultValue?: string }) {
  return (
    <label className="space-y-1 text-sm">
      <span className="font-medium">{label}</span>
      <input className="h-10 w-full rounded-md border px-3" name={name} defaultValue={defaultValue ?? ""} />
    </label>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-medium text-slate-500">{label}</div>
      <div>{value}</div>
    </div>
  );
}
