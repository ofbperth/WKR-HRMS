import { getAuthSettings } from "@/lib/auth-settings";

export async function GET() {
  try {
    const settings = await getAuthSettings();
    return Response.json({ googleEnabled: settings.googleEnabled, configured: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) });
  } catch {
    return Response.json({ googleEnabled: false, configured: false, needsMigration: true });
  }
}
