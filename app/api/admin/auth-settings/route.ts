import { apiError, requireUser } from "@/lib/auth";
import { auditLog } from "@/lib/audit";
import { getAuthSettings, saveAuthSettings } from "@/lib/auth-settings";
import { authSettingsSchema } from "@/lib/validators";

export async function GET() {
  try {
    await requireUser(["Admin"]);
    return Response.json(await getAuthSettings());
  } catch (error) {
    if (error instanceof Error && error.message.includes("authSettings")) {
      return Response.json({ error: "AUTH_SETTINGS_TABLE_MISSING_RUN_PRISMA_MIGRATE" }, { status: 503 });
    }
    return apiError(error);
  }
}

export async function PUT(request: Request) {
  try {
    const user = await requireUser(["Admin"]);
    const parsed = authSettingsSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return Response.json({ error: "INVALID_INPUT" }, { status: 400 });
    const updated = await saveAuthSettings(parsed.data);
    await auditLog({ userId: user.id, action: "AUTH_SETTINGS_UPDATED", entityType: "AuthSettings", entityId: "default", newValue: parsed.data });
    return Response.json(updated);
  } catch (error) {
    return apiError(error);
  }
}
