import { prisma } from "@/lib/prisma";
import { apiError, requireUser } from "@/lib/auth";
import { riskCodeSchema } from "@/lib/validators";

function normalize(data: any) {
  return {
    ...data,
    code: data.code ? String(data.code).trim().toUpperCase() : data.code,
    nameEn: data.nameEn ? String(data.nameEn).trim() : null,
    simpleCategory: data.simpleCategory ? String(data.simpleCategory).trim() : data.simpleCategory,
  };
}

export async function GET() {
  try { await requireUser(["Admin"]); return Response.json(await prisma.riskCode.findMany({ orderBy: { code: "asc" } })); }
  catch (error) { return apiError(error); }
}
export async function POST(req: Request) {
  try {
    const user = await requireUser(["Admin"]);
    const parsed = riskCodeSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 });
    const item = await prisma.riskCode.create({ data: normalize(parsed.data) });
    await prisma.auditLog.create({ data: { userId: user.id, action: "CREATE", entityType: "RiskCode", entityId: item.id, newValue: JSON.stringify(item) } });
    return Response.json(item, { status: 201 });
  } catch (error) { return apiError(error); }
}
export async function PATCH(req: Request) {
  try {
    const user = await requireUser(["Admin"]);
    const body = await req.json();
    const parsed = riskCodeSchema.partial().safeParse(body);
    if (!body.id || !parsed.success) return Response.json({ error: "Invalid input" }, { status: 400 });
    const old = await prisma.riskCode.findUnique({ where: { id: body.id } });
    const item = await prisma.riskCode.update({ where: { id: body.id }, data: normalize(parsed.data) });
    await prisma.auditLog.create({ data: { userId: user.id, action: "UPDATE", entityType: "RiskCode", entityId: item.id, oldValue: JSON.stringify(old), newValue: JSON.stringify(item) } });
    return Response.json(item);
  } catch (error) { return apiError(error); }
}
export async function DELETE(req: Request) {
  try {
    const user = await requireUser(["Admin"]);
    const { id } = await req.json();
    if (!id) return Response.json({ error: "id required" }, { status: 400 });
    const item = await prisma.riskCode.update({ where: { id }, data: { isActive: false } });
    await prisma.auditLog.create({ data: { userId: user.id, action: "DEACTIVATE", entityType: "RiskCode", entityId: item.id } });
    return Response.json(item);
  } catch (error) { return apiError(error); }
}
