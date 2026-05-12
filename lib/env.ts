import "server-only";

export function validateServerEnv() {
  const required = ["AUTH_SECRET", "ENCRYPTION_KEY", "DATABASE_URL"];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required server environment variables: ${missing.join(", ")}`);
  }
}
