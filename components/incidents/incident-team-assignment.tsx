"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { DbTeam } from "@/lib/types";
import { Button } from "@/components/ui/button";

type AssignedTeam = {
  id: string;
  assignedAt: Date;
  team: DbTeam;
};

export function IncidentTeamAssignment({
  incidentId,
  teams,
  assignedTeams,
  editable,
}: {
  incidentId: string;
  teams: DbTeam[];
  assignedTeams: AssignedTeam[];
  editable: boolean;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>(assignedTeams.map((item) => item.team.id));

  const filteredTeams = useMemo(() => {
    const q = query.trim().toLowerCase();
    return teams.filter((team) => !q || `${team.name} ${team.code ?? ""} ${team.description ?? ""}`.toLowerCase().includes(q));
  }, [query, teams]);

  function toggle(teamId: string) {
    setSelectedIds((current) => current.includes(teamId) ? current.filter((id) => id !== teamId) : [...current, teamId]);
  }

  async function save() {
    setSaving(true);
    const response = await fetch(`/api/incidents/${incidentId}/teams`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teamIds: selectedIds }),
    });
    setSaving(false);
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      alert(data.error || "บันทึกทีมไม่สำเร็จ");
      return;
    }
    router.refresh();
  }

  return <div className="space-y-3 rounded-lg border bg-white p-4">
    <div>
      <h3 className="text-lg font-semibold">ทีมที่เกี่ยวข้อง</h3>
      <p className="text-sm text-slate-500">เลือกทีมที่เกี่ยวข้องกับอุบัติการณ์นี้</p>
    </div>
    <div className="flex flex-wrap gap-2">
      {selectedIds.length ? teams.filter((team) => selectedIds.includes(team.id)).map((team) => (
        <span key={team.id} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
          {team.name}
        </span>
      )) : <div className="text-sm text-slate-500">ยังไม่ได้ระบุทีมที่เกี่ยวข้อง</div>}
    </div>
    {editable ? <>
      <input
        className="h-10 w-full rounded-md border px-3 text-sm"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="ค้นหาทีม"
      />
      <div className="max-h-72 overflow-auto rounded-lg border">
        {filteredTeams.map((team) => <label key={team.id} className="flex cursor-pointer items-start gap-3 border-b px-3 py-3 text-sm hover:bg-slate-50">
          <input type="checkbox" checked={selectedIds.includes(team.id)} onChange={() => toggle(team.id)} className="mt-0.5 h-4 w-4 shrink-0" />
          <span className="min-w-0">
            <span className="block font-medium">{team.name}</span>
            <span className="block text-xs text-slate-500">{team.code || "-"}</span>
          </span>
        </label>)}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={save} disabled={saving}>{saving ? "กำลังบันทึก..." : "บันทึกทีมที่เกี่ยวข้อง"}</Button>
      </div>
    </> : null}
  </div>;
}
