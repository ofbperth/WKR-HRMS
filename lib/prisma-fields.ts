import { Prisma } from "@prisma/client";

export function prismaModelHasField(modelName: string, fieldName: string) {
  return Prisma.dmmf.datamodel.models
    .find((model) => model.name === modelName)
    ?.fields.some((field) => field.name === fieldName) ?? false;
}

export function activeIncidentFilter() {
  return prismaModelHasField("Incident", "deletedAt") ? { deletedAt: null } : null;
}

export function countableIncidentFilter(extra?: object) {
  const filters: object[] = [{ status: { not: "Rejected" } }];
  const activeFilter = activeIncidentFilter();
  if (activeFilter) filters.unshift(activeFilter);
  if (extra) filters.push(extra);
  return { AND: filters };
}
