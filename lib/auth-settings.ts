import { prisma } from "@/lib/prisma";
import type { Role } from "@/lib/types";

export type AuthSettingsValue = {
  googleEnabled: boolean;
  allowedDomains: string[];
  allowedEmails: string[];
  allowAutoProvision: boolean;
  defaultRole: Role;
  defaultIsActive: boolean;
};

function parseList(value: string | null | undefined) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String).map(v => v.trim().toLowerCase()).filter(Boolean) : [];
  } catch {
    return value.split(/\r?\n|,/).map(v => v.trim().toLowerCase()).filter(Boolean);
  }
}

export async function getAuthSettings(): Promise<AuthSettingsValue> {
  const settings = await prisma.authSettings.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default" },
  });
  return {
    googleEnabled: settings.googleEnabled,
    allowedDomains: parseList(settings.allowedDomains),
    allowedEmails: parseList(settings.allowedEmails),
    allowAutoProvision: settings.allowAutoProvision,
    defaultRole: settings.defaultRole as Role,
    defaultIsActive: settings.defaultIsActive,
  };
}

export async function saveAuthSettings(input: AuthSettingsValue) {
  return prisma.authSettings.upsert({
    where: { id: "default" },
    update: {
      googleEnabled: input.googleEnabled,
      allowedDomains: JSON.stringify(input.allowedDomains),
      allowedEmails: JSON.stringify(input.allowedEmails),
      allowAutoProvision: input.allowAutoProvision,
      defaultRole: input.defaultRole,
      defaultIsActive: input.defaultIsActive,
    },
    create: {
      id: "default",
      googleEnabled: input.googleEnabled,
      allowedDomains: JSON.stringify(input.allowedDomains),
      allowedEmails: JSON.stringify(input.allowedEmails),
      allowAutoProvision: input.allowAutoProvision,
      defaultRole: input.defaultRole,
      defaultIsActive: input.defaultIsActive,
    },
  });
}

export function isGoogleEmailAllowed(email: string, settings: Pick<AuthSettingsValue, "allowedDomains" | "allowedEmails">) {
  const normalized = email.trim().toLowerCase();
  const domain = normalized.split("@")[1] ?? "";
  return settings.allowedEmails.includes(normalized) || settings.allowedDomains.includes(domain);
}

