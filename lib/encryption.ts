import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

export type EncryptedValue = {
  ciphertext: string;
  iv: string;
  authTag: string;
};

function getEncryptionKey() {
  const raw = process.env.ENCRYPTION_KEY;
  if (!raw) {
    if (process.env.NODE_ENV === "production") throw new Error("ENCRYPTION_KEY_REQUIRED");
    return createHash("sha256")
      .update(process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "wkr-hrms-development-key")
      .digest();
  }

  const key = Buffer.from(raw, "base64");
  if (key.length === 32) return key;

  const hexKey = Buffer.from(raw, "hex");
  if (hexKey.length === 32) return hexKey;

  throw new Error("ENCRYPTION_KEY_MUST_BE_32_BYTES_BASE64_OR_HEX");
}

export function encrypt(value: string | null | undefined): EncryptedValue | null {
  if (!value) return null;
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, getEncryptionKey(), iv, { authTagLength: AUTH_TAG_LENGTH });
  const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    ciphertext: ciphertext.toString("base64"),
    iv: iv.toString("base64"),
    authTag: authTag.toString("base64"),
  };
}

export function decrypt(value: EncryptedValue | string | null | undefined): string | null {
  if (!value) return null;
  const payload = typeof value === "string" ? parseEncryptedValue(value) : value;
  if (!payload) return null;

  const decipher = createDecipheriv(
    ALGORITHM,
    getEncryptionKey(),
    Buffer.from(payload.iv, "base64"),
    { authTagLength: AUTH_TAG_LENGTH },
  );
  decipher.setAuthTag(Buffer.from(payload.authTag, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(payload.ciphertext, "base64")),
    decipher.final(),
  ]).toString("utf8");
}

export function serializeEncrypted(value: EncryptedValue | null) {
  return value ? JSON.stringify(value) : null;
}

export function parseEncryptedValue(value: string | null | undefined): EncryptedValue | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as Partial<EncryptedValue>;
    if (!parsed.ciphertext || !parsed.iv || !parsed.authTag) return null;
    return { ciphertext: parsed.ciphertext, iv: parsed.iv, authTag: parsed.authTag };
  } catch {
    return null;
  }
}

export function encryptToStorage(value: string | null | undefined) {
  return serializeEncrypted(encrypt(value?.trim() || null));
}
