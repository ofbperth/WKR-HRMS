import "server-only";
import { randomUUID } from "crypto";

type StorageUploadInput = {
  bucket?: string;
  objectKey?: string;
  contentType: string;
  body: Uint8Array;
};

function getSupabaseUrl() {
  const value = process.env.SUPABASE_URL?.trim();
  if (!value) throw new Error("SUPABASE_URL_REQUIRED");
  return value.replace(/\/+$/, "");
}

function getSupabaseServiceRoleKey() {
  const value = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!value) throw new Error("SUPABASE_SERVICE_ROLE_KEY_REQUIRED");
  return value;
}

export function exportStorageBucket() {
  return process.env.EXPORT_STORAGE_BUCKET?.trim() || "risk-exports-private";
}

function buildStorageUrl(pathname: string) {
  return `${getSupabaseUrl()}/storage/v1${pathname}`;
}

function buildHeaders(contentType?: string) {
  const headers = new Headers();
  headers.set("Authorization", `Bearer ${getSupabaseServiceRoleKey()}`);
  headers.set("apikey", getSupabaseServiceRoleKey());
  if (contentType) headers.set("Content-Type", contentType);
  return headers;
}

function ensureOk(response: Response, fallbackMessage: string) {
  if (response.ok) return response;
  throw new Error(`${fallbackMessage}:${response.status}`);
}

export async function uploadPrivateObject(input: StorageUploadInput) {
  const bucket = input.bucket ?? exportStorageBucket();
  const objectKey = input.objectKey ?? `exports/${new Date().toISOString().slice(0, 10)}/${randomUUID()}`;
  const encodedPath = objectKey.split("/").map(encodeURIComponent).join("/");
  const body = new Blob([Buffer.from(input.body)], { type: input.contentType });
  const response = await fetch(buildStorageUrl(`/object/${encodeURIComponent(bucket)}/${encodedPath}`), {
    method: "POST",
    headers: buildHeaders(input.contentType),
    body,
  });
  ensureOk(response, "EXPORT_STORAGE_UPLOAD_FAILED");
  return { bucket, objectKey };
}

export async function deletePrivateObject(input: { bucket?: string; objectKey: string }) {
  const bucket = input.bucket ?? exportStorageBucket();
  const encodedPath = input.objectKey.split("/").map(encodeURIComponent).join("/");
  const response = await fetch(buildStorageUrl(`/object/${encodeURIComponent(bucket)}/${encodedPath}`), {
    method: "DELETE",
    headers: buildHeaders(),
  });
  if (response.status === 404) return;
  ensureOk(response, "EXPORT_STORAGE_DELETE_FAILED");
}

export async function createPrivateSignedDownloadUrl(input: { bucket?: string; objectKey: string; expiresInSeconds: number }) {
  const bucket = input.bucket ?? exportStorageBucket();
  const encodedPath = input.objectKey.split("/").map(encodeURIComponent).join("/");
  const response = await fetch(buildStorageUrl(`/object/sign/${encodeURIComponent(bucket)}/${encodedPath}`), {
    method: "POST",
    headers: buildHeaders("application/json"),
    body: JSON.stringify({ expiresIn: input.expiresInSeconds }),
  });
  ensureOk(response, "EXPORT_STORAGE_SIGN_FAILED");
  const data = await response.json().catch(() => ({} as { signedURL?: string; signedUrl?: string }));
  const relativeUrl = data.signedURL ?? data.signedUrl;
  if (!relativeUrl) throw new Error("EXPORT_STORAGE_SIGN_RESPONSE_INVALID");
  return relativeUrl.startsWith("http") ? relativeUrl : `${getSupabaseUrl()}/storage/v1${relativeUrl}`;
}
