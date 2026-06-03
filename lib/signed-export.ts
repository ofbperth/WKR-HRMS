import "server-only";
import { randomUUID } from "crypto";
import { jwtVerify, SignJWT } from "jose";
import type { ExportKind } from "@/lib/export-builders";

const minTtlSeconds = 15 * 60;
const maxTtlSeconds = 60 * 60;
export type SignedExportFilters = Record<string, string | string[]>;

function getSigningSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET_REQUIRED");
  return new TextEncoder().encode(secret);
}

export function exportTtlSeconds() {
  const configured = Number(process.env.EXPORT_SIGNED_URL_TTL_SECONDS ?? "1800");
  if (!Number.isFinite(configured)) return 1800;
  return Math.min(maxTtlSeconds, Math.max(minTtlSeconds, configured));
}

export async function createSignedExportToken(input: {
  kind: ExportKind;
  userId: string;
  role: string;
  unitId: string | null;
  grantId: string;
  tokenJti?: string;
  filters?: SignedExportFilters;
}) {
  const tokenJti = input.tokenJti ?? randomUUID();
  return new SignJWT({
    kind: input.kind,
    userId: input.userId,
    role: input.role,
    unitId: input.unitId,
    grantId: input.grantId,
    jti: tokenJti,
    filters: input.filters ?? {},
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${exportTtlSeconds()}s`)
    .sign(getSigningSecret());
}

export async function verifySignedExportToken(token: string) {
  const { payload } = await jwtVerify(token, getSigningSecret());
  if (typeof payload.kind !== "string" || typeof payload.userId !== "string" || typeof payload.role !== "string") {
    throw new Error("INVALID_EXPORT_TOKEN");
  }
  return {
    kind: payload.kind as ExportKind,
    userId: payload.userId,
    role: payload.role,
    unitId: typeof payload.unitId === "string" ? payload.unitId : null,
    grantId: typeof payload.grantId === "string" ? payload.grantId : null,
    tokenJti: typeof payload.jti === "string" ? payload.jti : null,
    filters: typeof payload.filters === "object" && payload.filters ? payload.filters as SignedExportFilters : {},
  };
}

export function signedExportUrl(requestUrl: string, token: string) {
  const url = new URL("/api/exports/download", requestUrl);
  url.searchParams.set("token", token);
  return url;
}
