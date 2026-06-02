export const preferredRegion = "sin1";

export async function GET(request: Request) {
  return Response.json({
    vercelRegion: process.env.VERCEL_REGION ?? null,
    xVercelId: request.headers.get("x-vercel-id"),
  });
}
