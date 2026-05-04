import { getLookupData } from "@/lib/incident-query";
import { apiError, requireUser } from "@/lib/auth";

export async function GET() {
  try {
    await requireUser();
    return Response.json(await getLookupData());
  } catch (error) {
    return apiError(error);
  }
}
