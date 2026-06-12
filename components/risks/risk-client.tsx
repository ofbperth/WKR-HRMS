"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  riskControlEffectivenessValues,
  riskReviewFrequencyValues,
  riskScopeValues,
  riskStatusValues,
  riskTrendValues,
  riskTypeValues,
} from "@/lib/validators";

type UnitOption = { id: string; name: string };
type TeamOption = { id: string; name: string; code?: string | null };
type UserOption = { id: string; name: string; role?: string };

type RiskCreateDefaults = {
  title?: string;
  description?: string;
  scope?: string;
  status?: string;
  riskType?: string;
  ownerUnitId?: string | null;
  ownerTeamId?: string | null;
  decisionRequired?: boolean;
};

export function RiskCreatePanel({
  apiPath = "/api/risks",
  label = "Create Risk",
  units,
  teams,
  users,
  defaults,
  lockedScope,
  lockedStatus,
}: {
  apiPath?: string;
  label?: string;
  units: UnitOption[];
  teams: TeamOption[];
  users: UserOption[];
  defaults?: RiskCreateDefaults;
  lockedScope?: string;
  lockedStatus?: string;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(Boolean(defaults?.title || defaults?.description));
  const [form, setForm] = useState({
    title: defaults?.title ?? "",
    description: defaults?.description ?? "",
    scope: lockedScope ?? defaults?.scope ?? "HOSPITAL",
    status: lockedStatus ?? defaults?.status ?? "ACTIVE",
    riskType: defaults?.riskType ?? "OPERATIONAL",
    riskDomain: "",
    ownerUnitId: defaults?.ownerUnitId ?? "",
    ownerTeamId: defaults?.ownerTeamId ?? "",
    executiveSponsorId: "",
    inherentLikelihood: 3,
    inherentImpact: 3,
    residualLikelihood: 2,
    residualImpact: 2,
    controlEffectiveness: "PARTIAL",
    trend: "UNKNOWN",
    reviewFrequency: "QUARTERLY",
    nextReviewAt: "",
    decisionRequired: defaults?.decisionRequired ?? false,
    decisionNote: "",
    acceptedReason: "",
  });

  async function submit() {
    setSaving(true);
    const res = await fetch(apiPath, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error || "Create risk failed");
      return;
    }
    setOpen(false);
    router.refresh();
  }

  return (
    <div className="rounded-lg border bg-white p-4">
      {!open ? (
        <Button type="button" onClick={() => setOpen(true)}>
          {label}
        </Button>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          <Input label="Title" value={form.title} onChange={(value) => setForm({ ...form, title: value })} />
          <Select label="Risk Type" value={form.riskType} onChange={(value) => setForm({ ...form, riskType: value })} options={riskTypeValues.map((value) => ({ value, label: value }))} />
          <TextArea label="Description" value={form.description} onChange={(value) => setForm({ ...form, description: value })} className="md:col-span-2" />
          <Select label="Scope" value={form.scope} disabled={Boolean(lockedScope)} onChange={(value) => setForm({ ...form, scope: value })} options={riskScopeValues.map((value) => ({ value, label: value }))} />
          <Select label="Status" value={form.status} disabled={Boolean(lockedStatus)} onChange={(value) => setForm({ ...form, status: value })} options={riskStatusValues.map((value) => ({ value, label: value }))} />
          <Input label="Risk Domain" value={form.riskDomain} onChange={(value) => setForm({ ...form, riskDomain: value })} />
          <Select label="Owner Unit" value={form.ownerUnitId} onChange={(value) => setForm({ ...form, ownerUnitId: value })} options={[{ value: "", label: "-" }, ...units.map((unit) => ({ value: unit.id, label: unit.name }))]} />
          <Select label="Owner Team" value={form.ownerTeamId} onChange={(value) => setForm({ ...form, ownerTeamId: value })} options={[{ value: "", label: "-" }, ...teams.map((team) => ({ value: team.id, label: team.code ? `${team.code} ${team.name}` : team.name }))]} />
          <Select label="Executive Sponsor" value={form.executiveSponsorId} onChange={(value) => setForm({ ...form, executiveSponsorId: value })} options={[{ value: "", label: "-" }, ...users.map((user) => ({ value: user.id, label: `${user.name}${user.role ? ` (${user.role})` : ""}` }))]} />
          <NumberInput label="Inherent Likelihood" value={form.inherentLikelihood} onChange={(value) => setForm({ ...form, inherentLikelihood: value })} />
          <NumberInput label="Inherent Impact" value={form.inherentImpact} onChange={(value) => setForm({ ...form, inherentImpact: value })} />
          <NumberInput label="Residual Likelihood" value={form.residualLikelihood} onChange={(value) => setForm({ ...form, residualLikelihood: value })} />
          <NumberInput label="Residual Impact" value={form.residualImpact} onChange={(value) => setForm({ ...form, residualImpact: value })} />
          <Select label="Control Effectiveness" value={form.controlEffectiveness} onChange={(value) => setForm({ ...form, controlEffectiveness: value })} options={riskControlEffectivenessValues.map((value) => ({ value, label: value }))} />
          <Select label="Trend" value={form.trend} onChange={(value) => setForm({ ...form, trend: value })} options={riskTrendValues.map((value) => ({ value, label: value }))} />
          <Select label="Review Frequency" value={form.reviewFrequency} onChange={(value) => setForm({ ...form, reviewFrequency: value })} options={riskReviewFrequencyValues.map((value) => ({ value, label: value }))} />
          <Input label="Next Review" type="date" value={form.nextReviewAt} onChange={(value) => setForm({ ...form, nextReviewAt: value })} />
          <label className="flex items-center gap-2 text-sm md:col-span-2">
            <input type="checkbox" checked={form.decisionRequired} onChange={(event) => setForm({ ...form, decisionRequired: event.target.checked })} />
            Decision required
          </label>
          <TextArea label="Decision Note" value={form.decisionNote} onChange={(value) => setForm({ ...form, decisionNote: value })} className="md:col-span-2" />
          <div className="flex flex-wrap gap-2 md:col-span-2">
            <Button type="button" onClick={submit} disabled={saving}>
              {saving ? "Saving..." : "Save Risk"}
            </Button>
            <Button type="button" className="bg-slate-700" onClick={() => setOpen(false)} disabled={saving}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export function RiskDetailActions({
  risk,
  units,
  teams,
  users,
  mergeTargets,
  linkableIncidents,
}: {
  risk: any;
  units: UnitOption[];
  teams: TeamOption[];
  users: UserOption[];
  mergeTargets: Array<{ id: string; riskNo: string; title: string }>;
  linkableIncidents: Array<{ id: string; incidentNo: string; title: string; unitName: string }>;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    reviewDate: "",
    residualLikelihood: risk.residualLikelihood,
    residualImpact: risk.residualImpact,
    controlEffectiveness: risk.controlEffectiveness,
    trend: risk.trend,
    summary: "",
    nextReviewAt: "",
  });
  const [editForm, setEditForm] = useState({
    title: risk.title,
    description: risk.description,
    scope: risk.scope,
    status: risk.status,
    riskType: risk.riskType,
    riskDomain: risk.riskDomain ?? "",
    ownerUnitId: risk.ownerUnitId ?? "",
    ownerTeamId: risk.ownerTeamId ?? "",
    executiveSponsorId: risk.executiveSponsorId ?? "",
    inherentLikelihood: risk.inherentLikelihood,
    inherentImpact: risk.inherentImpact,
    residualLikelihood: risk.residualLikelihood,
    residualImpact: risk.residualImpact,
    controlEffectiveness: risk.controlEffectiveness,
    trend: risk.trend,
    reviewFrequency: risk.reviewFrequency,
    nextReviewAt: risk.nextReviewAt ? String(risk.nextReviewAt).slice(0, 10) : "",
    decisionRequired: risk.decisionRequired,
    decisionNote: risk.decisionNote ?? "",
    acceptedReason: risk.acceptedReason ?? "",
  });
  const [selectedIncidentIds, setSelectedIncidentIds] = useState<string[]>([]);
  const [mergeTargetId, setMergeTargetId] = useState(mergeTargets[0]?.id ?? "");

  async function patchRisk() {
    setSaving(true);
    const res = await fetch(`/api/risks/${risk.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error || "Update risk failed");
      return;
    }
    router.refresh();
  }

  async function postAction(path: string, body: Record<string, unknown>) {
    setSaving(true);
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error || "Risk action failed");
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {risk.canEdit ? (
        <div className="grid gap-3 rounded-lg border bg-white p-4 md:grid-cols-2">
          <Input label="Title" value={editForm.title} onChange={(value) => setEditForm({ ...editForm, title: value })} />
          <Select label="Risk Type" value={editForm.riskType} onChange={(value) => setEditForm({ ...editForm, riskType: value })} options={riskTypeValues.map((value) => ({ value, label: value }))} />
          <TextArea label="Description" value={editForm.description} onChange={(value) => setEditForm({ ...editForm, description: value })} className="md:col-span-2" />
          <Select label="Scope" value={editForm.scope} onChange={(value) => setEditForm({ ...editForm, scope: value })} options={riskScopeValues.map((value) => ({ value, label: value }))} />
          <Select label="Status" value={editForm.status} onChange={(value) => setEditForm({ ...editForm, status: value })} options={riskStatusValues.map((value) => ({ value, label: value }))} />
          <Input label="Risk Domain" value={editForm.riskDomain} onChange={(value) => setEditForm({ ...editForm, riskDomain: value })} />
          <Select label="Owner Unit" value={editForm.ownerUnitId} onChange={(value) => setEditForm({ ...editForm, ownerUnitId: value })} options={[{ value: "", label: "-" }, ...units.map((unit) => ({ value: unit.id, label: unit.name }))]} />
          <Select label="Owner Team" value={editForm.ownerTeamId} onChange={(value) => setEditForm({ ...editForm, ownerTeamId: value })} options={[{ value: "", label: "-" }, ...teams.map((team) => ({ value: team.id, label: team.code ? `${team.code} ${team.name}` : team.name }))]} />
          <Select label="Executive Sponsor" value={editForm.executiveSponsorId} onChange={(value) => setEditForm({ ...editForm, executiveSponsorId: value })} options={[{ value: "", label: "-" }, ...users.map((user) => ({ value: user.id, label: `${user.name}${user.role ? ` (${user.role})` : ""}` }))]} />
          <NumberInput label="Inherent Likelihood" value={editForm.inherentLikelihood} onChange={(value) => setEditForm({ ...editForm, inherentLikelihood: value })} />
          <NumberInput label="Inherent Impact" value={editForm.inherentImpact} onChange={(value) => setEditForm({ ...editForm, inherentImpact: value })} />
          <NumberInput label="Residual Likelihood" value={editForm.residualLikelihood} onChange={(value) => setEditForm({ ...editForm, residualLikelihood: value })} />
          <NumberInput label="Residual Impact" value={editForm.residualImpact} onChange={(value) => setEditForm({ ...editForm, residualImpact: value })} />
          <Select label="Control Effectiveness" value={editForm.controlEffectiveness} onChange={(value) => setEditForm({ ...editForm, controlEffectiveness: value })} options={riskControlEffectivenessValues.map((value) => ({ value, label: value }))} />
          <Select label="Trend" value={editForm.trend} onChange={(value) => setEditForm({ ...editForm, trend: value })} options={riskTrendValues.map((value) => ({ value, label: value }))} />
          <Select label="Review Frequency" value={editForm.reviewFrequency} onChange={(value) => setEditForm({ ...editForm, reviewFrequency: value })} options={riskReviewFrequencyValues.map((value) => ({ value, label: value }))} />
          <Input label="Next Review" type="date" value={editForm.nextReviewAt} onChange={(value) => setEditForm({ ...editForm, nextReviewAt: value })} />
          <label className="flex items-center gap-2 text-sm md:col-span-2">
            <input type="checkbox" checked={editForm.decisionRequired} onChange={(event) => setEditForm({ ...editForm, decisionRequired: event.target.checked })} />
            Decision required
          </label>
          <TextArea label="Decision Note" value={editForm.decisionNote} onChange={(value) => setEditForm({ ...editForm, decisionNote: value })} className="md:col-span-2" />
          <div className="md:col-span-2">
            <Button type="button" onClick={patchRisk} disabled={saving}>
              {saving ? "Saving..." : "Update Risk"}
            </Button>
          </div>
        </div>
      ) : null}

      {risk.canLink ? (
        <div className="rounded-lg border bg-white p-4">
          <h3 className="mb-3 text-sm font-semibold">Link Incidents</h3>
          <div className="grid gap-2">
            {linkableIncidents.map((incident) => (
              <label key={incident.id} className="flex items-start gap-2 rounded border p-2 text-sm">
                <input
                  type="checkbox"
                  checked={selectedIncidentIds.includes(incident.id)}
                  onChange={(event) =>
                    setSelectedIncidentIds((current) =>
                      event.target.checked ? [...current, incident.id] : current.filter((value) => value !== incident.id),
                    )
                  }
                />
                <span>
                  <strong>{incident.incidentNo}</strong> {incident.title}
                  <span className="block text-xs text-slate-500">{incident.unitName}</span>
                </span>
              </label>
            ))}
          </div>
          <div className="mt-3">
            <Button type="button" onClick={() => postAction(`/api/risks/${risk.id}/links`, { incidentIds: selectedIncidentIds })} disabled={saving || selectedIncidentIds.length === 0}>
              Link Selected Incidents
            </Button>
          </div>
        </div>
      ) : null}

      {risk.canReview ? (
        <div className="grid gap-3 rounded-lg border bg-white p-4 md:grid-cols-2">
          <Input label="Review Date" type="date" value={reviewForm.reviewDate} onChange={(value) => setReviewForm({ ...reviewForm, reviewDate: value })} />
          <Input label="Next Review" type="date" value={reviewForm.nextReviewAt} onChange={(value) => setReviewForm({ ...reviewForm, nextReviewAt: value })} />
          <NumberInput label="Residual Likelihood" value={reviewForm.residualLikelihood} onChange={(value) => setReviewForm({ ...reviewForm, residualLikelihood: value })} />
          <NumberInput label="Residual Impact" value={reviewForm.residualImpact} onChange={(value) => setReviewForm({ ...reviewForm, residualImpact: value })} />
          <Select label="Control Effectiveness" value={reviewForm.controlEffectiveness} onChange={(value) => setReviewForm({ ...reviewForm, controlEffectiveness: value })} options={riskControlEffectivenessValues.map((value) => ({ value, label: value }))} />
          <Select label="Trend" value={reviewForm.trend} onChange={(value) => setReviewForm({ ...reviewForm, trend: value })} options={riskTrendValues.map((value) => ({ value, label: value }))} />
          <TextArea label="Review Summary" value={reviewForm.summary} onChange={(value) => setReviewForm({ ...reviewForm, summary: value })} className="md:col-span-2" />
          <div className="md:col-span-2">
            <Button type="button" onClick={() => postAction(`/api/risks/${risk.id}/reviews`, reviewForm)} disabled={saving}>
              Add Review
            </Button>
          </div>
        </div>
      ) : null}

      {risk.scope === "UNIT" && mergeTargets.length > 0 ? (
        <div className="rounded-lg border bg-white p-4">
          <h3 className="mb-3 text-sm font-semibold">Merge Proposal</h3>
          <Select label="Target Risk" value={mergeTargetId} onChange={setMergeTargetId} options={mergeTargets.map((target) => ({ value: target.id, label: `${target.riskNo} ${target.title}` }))} />
          <div className="mt-3">
            <Button type="button" className="bg-slate-700" onClick={() => postAction(`/api/risks/${risk.id}/merge`, { targetRiskId: mergeTargetId })} disabled={saving || !mergeTargetId}>
              Merge Into Target
            </Button>
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {risk.status === "PROPOSED" ? (
          <>
            <Button type="button" onClick={() => postAction(`/api/risks/${risk.id}/approve`, { note: editForm.decisionNote })} disabled={saving}>
              Approve
            </Button>
            <Button type="button" className="bg-slate-700" onClick={() => postAction(`/api/risks/${risk.id}/reject`, { note: editForm.decisionNote })} disabled={saving}>
              Reject
            </Button>
          </>
        ) : null}
        {!["CLOSED", "REJECTED"].includes(risk.status) ? (
          <>
            <Button type="button" className="bg-emerald-700 hover:bg-emerald-800" onClick={() => postAction(`/api/risks/${risk.id}/close`, { note: editForm.decisionNote })} disabled={saving}>
              Close Risk
            </Button>
            <Button type="button" className="bg-slate-700" onClick={() => postAction(`/api/risks/${risk.id}/accept`, { acceptedReason: editForm.acceptedReason || "Risk accepted by committee", note: editForm.decisionNote })} disabled={saving}>
              Accept Risk
            </Button>
          </>
        ) : null}
      </div>
    </div>
  );
}

export function UnlinkRiskIncidentButton({ riskId, incidentId }: { riskId: string; incidentId: string }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function unlinkIncident() {
    const ok = window.confirm("Unlink this incident from the risk?");
    if (!ok) return;
    setSaving(true);
    const res = await fetch(`/api/risks/${riskId}/links/${incidentId}`, { method: "DELETE" });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error || "Unlink risk failed");
      return;
    }
    router.refresh();
  }

  return (
    <Button type="button" className="bg-slate-700" onClick={unlinkIncident} disabled={saving}>
      {saving ? "Unlinking..." : "Unlink"}
    </Button>
  );
}

export function IncidentRiskPanel({
  incidentId,
  incidentTitle,
  incidentUnitId,
  relatedRisks,
  riskOptions,
  units,
  teams,
  users,
  canCreateHospital,
  canCreateProposal,
}: {
  incidentId: string;
  incidentTitle: string;
  incidentUnitId: string;
  relatedRisks: any[];
  riskOptions: any[];
  units: UnitOption[];
  teams: TeamOption[];
  users: UserOption[];
  canCreateHospital: boolean;
  canCreateProposal: boolean;
}) {
  const router = useRouter();
  const [selectedRiskIds, setSelectedRiskIds] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const filteredOptions = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return riskOptions
      .filter((risk) => {
        if (!normalized) return true;
        const haystack = `${risk.riskNo} ${risk.title} ${risk.scope} ${risk.status} ${risk.ownerUnit?.name ?? ""}`.toLowerCase();
        return haystack.includes(normalized);
      })
      .slice(0, 30);
  }, [query, riskOptions]);

  async function linkSelected() {
    for (const riskId of selectedRiskIds) {
      const res = await fetch(`/api/risks/${riskId}/links`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ incidentIds: [incidentId] }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Link risk failed");
        return;
      }
    }
    router.refresh();
  }

  async function createAndLink(scope: "UNIT" | "HOSPITAL") {
    setSaving(true);
    const createRes = await fetch("/api/risks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: `Risk from ${incidentTitle}`,
        description: `Created from incident ${incidentTitle}. Please refine the risk statement and controls.`,
        scope,
        status: scope === "UNIT" ? "PROPOSED" : "ACTIVE",
        riskType: "OPERATIONAL",
        ownerUnitId: incidentUnitId,
        ownerTeamId: "",
        executiveSponsorId: "",
        inherentLikelihood: 3,
        inherentImpact: 3,
        residualLikelihood: 2,
        residualImpact: 2,
        controlEffectiveness: "PARTIAL",
        trend: "UNKNOWN",
        reviewFrequency: "QUARTERLY",
        nextReviewAt: "",
        decisionRequired: false,
      }),
    });
    setSaving(false);
    if (!createRes.ok) {
      const data = await createRes.json().catch(() => ({}));
      alert(data.error || "Create risk failed");
      return;
    }
    const created = await createRes.json();
    const linkRes = await fetch(`/api/risks/${created.id}/links`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ incidentIds: [incidentId] }),
    });
    if (!linkRes.ok) {
      const data = await linkRes.json().catch(() => ({}));
      alert(data.error || "Link risk failed");
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-white p-4">
        <h2 className="mb-3 text-lg font-semibold">Related Risks</h2>
        {relatedRisks.length === 0 ? (
          <p className="text-sm text-slate-500">No linked risks yet.</p>
        ) : (
          <div className="space-y-2">
            {relatedRisks.map((risk) => (
              <div key={risk.id} className="rounded border p-3 text-sm">
                <div className="font-semibold">
                  {risk.riskNo} {risk.title}
                </div>
                <div className="text-slate-600">
                  {risk.scope} · {risk.status} · residual {risk.residualScore} ({risk.residualLevel})
                </div>
                {risk.detailHref ? (
                  <a className="mt-1 inline-block text-sm text-blue-700 underline" href={risk.detailHref}>
                    Open Risk
                  </a>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>

      {riskOptions.length > 0 ? (
        <div className="rounded-lg border bg-white p-4">
          <h3 className="mb-3 text-sm font-semibold">Link Existing Risk</h3>
          <Input label="Search Risk" value={query} onChange={setQuery} />
          <div className="mt-3 grid gap-2">
            {filteredOptions.map((risk) => (
              <label key={risk.id} className="flex items-start gap-2 rounded border p-2 text-sm">
                <input
                  type="checkbox"
                  checked={selectedRiskIds.includes(risk.id)}
                  onChange={(event) =>
                    setSelectedRiskIds((current) =>
                      event.target.checked ? [...current, risk.id] : current.filter((value) => value !== risk.id),
                    )
                  }
                />
                <span>
                  <strong>{risk.riskNo}</strong> {risk.title}
                  <span className="block text-xs text-slate-500">
                    {risk.scope} · {risk.status} · {risk.ownerUnit?.name ?? "-"}
                  </span>
                </span>
              </label>
            ))}
          </div>
          <div className="mt-3">
            <Button type="button" onClick={linkSelected} disabled={selectedRiskIds.length === 0}>
              Link Existing Risk
            </Button>
          </div>
        </div>
      ) : null}

      {(canCreateHospital || canCreateProposal) ? (
        <div className="flex flex-wrap gap-2">
          {canCreateProposal ? (
            <Button type="button" className="bg-slate-700" onClick={() => createAndLink("UNIT")} disabled={saving}>
              Create Risk Proposal
            </Button>
          ) : null}
          {canCreateHospital ? (
            <Button type="button" onClick={() => createAndLink("HOSPITAL")} disabled={saving}>
              Create Hospital Risk
            </Button>
          ) : null}
        </div>
      ) : null}

      {(canCreateHospital || canCreateProposal) ? (
        <RiskCreatePanel label="Manual Risk Draft" units={units} teams={teams} users={users} defaults={{ title: `Risk from ${incidentTitle}`, ownerUnitId: incidentUnitId }} />
      ) : null}
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="space-y-1 text-sm">
      <span className="font-medium">{label}</span>
      <input className="h-10 w-full rounded-md border px-3" type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function NumberInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="space-y-1 text-sm">
      <span className="font-medium">{label}</span>
      <input className="h-10 w-full rounded-md border px-3" type="number" min={1} max={5} value={value} onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  className = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <label className={`space-y-1 text-sm ${className}`}>
      <span className="font-medium">{label}</span>
      <textarea className="min-h-24 w-full rounded-md border px-3 py-2" value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  disabled?: boolean;
}) {
  return (
    <label className="space-y-1 text-sm">
      <span className="font-medium">{label}</span>
      <select className="h-10 w-full rounded-md border bg-white px-3" value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled}>
        {options.map((option) => (
          <option key={`${label}-${option.value || "blank"}`} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
