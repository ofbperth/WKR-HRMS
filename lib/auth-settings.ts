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

function normalizeDomain(domain: string) {
  return domain.trim().toLowerCase().replace(/^@+/, "");
}

function unique(values: string[]) {
  return Array.from(new Set(values));
}

export async function getAuthSettings(): Promise<AuthSettingsValue> {
  const settings = await prisma.authSettings.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default" },
  });
  return {
    googleEnabled: settings.googleEnabled,
    allowedDomains: unique(parseList(settings.allowedDomains).map(normalizeDomain).filter(Boolean)),
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
      allowedDomains: JSON.stringify(unique(input.allowedDomains.map(normalizeDomain).filter(Boolean))),
      allowedEmails: JSON.stringify(unique(input.allowedEmails.map(email => email.trim().toLowerCase()).filter(Boolean))),
      allowAutoProvision: input.allowAutoProvision,
      defaultRole: input.defaultRole,
      defaultIsActive: input.defaultIsActive,
    },
    create: {
      id: "default",
      googleEnabled: input.googleEnabled,
      allowedDomains: JSON.stringify(unique(input.allowedDomains.map(normalizeDomain).filter(Boolean))),
      allowedEmails: JSON.stringify(unique(input.allowedEmails.map(email => email.trim().toLowerCase()).filter(Boolean))),
      allowAutoProvision: input.allowAutoProvision,
      defaultRole: input.defaultRole,
      defaultIsActive: input.defaultIsActive,
    },
  });
}

export function isGoogleEmailAllowed(email: string, settings: Pick<AuthSettingsValue, "allowedDomains" | "allowedEmails">) {
  const normalized = email.trim().toLowerCase();
  const domain = normalized.split("@")[1] ?? "";
  const allowedDomains = settings.allowedDomains.map(normalizeDomain);
  return settings.allowedEmails.includes(normalized) || allowedDomains.includes(domain);
}

