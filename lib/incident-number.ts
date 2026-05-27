export type IncidentNoLookupTx = {
  incident: {
    findFirst: (args: {
      where: { incidentNo: { startsWith: string } };
      orderBy: { incidentNo: "desc" };
      select: { incidentNo: true };
    }) => Promise<{ incidentNo: string } | null>;
  };
};

export async function generateIncidentNo(tx: IncidentNoLookupTx, now = new Date()) {
  const year = now.getFullYear();
  const prefix = `RM-${year}-`;
  const latest = await tx.incident.findFirst({
    where: { incidentNo: { startsWith: prefix } },
    orderBy: { incidentNo: "desc" },
    select: { incidentNo: true },
  });
  const latestNumber = latest?.incidentNo.startsWith(prefix) ? Number.parseInt(latest.incidentNo.slice(prefix.length), 10) : 0;
  const nextNumber = Number.isFinite(latestNumber) ? latestNumber + 1 : 1;
  return `${prefix}${String(nextNumber).padStart(4, "0")}`;
}
