import { PrismaClient } from "@prisma/client";
import { nrlsRiskCodes } from "../lib/nrls-risk-codes";

function normalizeSeedDatabaseUrl() {
  const value = process.env.DATABASE_URL;
  if (!value) return;
  try {
    const url = new URL(value);
    const isPooler = url.hostname.includes("pooler.supabase.com") || url.port === "6543";
    if (!isPooler) return;
    if (!url.searchParams.has("pgbouncer")) url.searchParams.set("pgbouncer", "true");
    if (!url.searchParams.has("connection_limit")) url.searchParams.set("connection_limit", "1");
    process.env.DATABASE_URL = url.toString();
  } catch {
    // Prisma will report invalid DATABASE_URL with its native validation.
  }
}

normalizeSeedDatabaseUrl();

const prisma = new PrismaClient();

const units = [
  { name: "ศูนย์พัฒนาคุณภาพ", type: "ทีม" },
  { name: "ER", type: "หน่วยงาน" },
  { name: "OPD", type: "หน่วยงาน" },
  { name: "ICU", type: "หน่วยงาน" },
  { name: "OR", type: "หน่วยงาน" },
  { name: "เภสัชกรรม", type: "หน่วยงาน" },
  { name: "ฝ่ายการพยาบาล", type: "ทีม" },
  { name: "IT", type: "ทีม" },
];

const safetyGoalRiskCodes: Array<(typeof nrlsRiskCodes)[number]> = [];
const defaultTeams = [
  { name: "RM Team", code: "RM", description: "Risk management" },
  { name: "Quality Development", code: "QD", description: "Quality improvement" },
  { name: "IC Team", code: "IC", description: "Infection control" },
  { name: "PTC / Medication Safety", code: "PTC", description: "Medication safety" },
  { name: "Blood Transfusion Team", code: "BLOOD", description: "Blood safety" },
  { name: "Laboratory Team", code: "LAB", description: "Laboratory" },
  { name: "OR / Surgical Safety Team", code: "OR", description: "Surgical safety" },
  { name: "ER Team", code: "ER", description: "Emergency room" },
  { name: "Nursing Team", code: "NS", description: "Nursing" },
  { name: "ENV / Environment Safety", code: "ENV", description: "Environment safety" },
  { name: "IT / Information Security", code: "IT", description: "Information security" },
  { name: "HR / Personnel Safety", code: "HR", description: "Personnel safety" },
];

async function seedTeams() {
  for (const [index, team] of defaultTeams.entries()) {
    await prisma.team.upsert({
      where: { name: team.name },
      update: {
        code: team.code,
        description: team.description,
        isActive: true,
        sortOrder: index + 1,
      },
      create: {
        ...team,
        isActive: true,
        sortOrder: index + 1,
      },
    });
  }
}

async function main() {
  for (const unit of units) {
    await prisma.unit.upsert({
      where: { name: unit.name },
      update: { type: unit.type, isActive: true },
      create: { ...unit, isActive: true },
    });
  }

  for (const riskCode of [...nrlsRiskCodes, ...safetyGoalRiskCodes]) {
    await prisma.riskCode.upsert({
      where: { code: riskCode.code },
      update: { ...riskCode, isActive: true },
      create: { ...riskCode, isActive: true },
    });
  }

  await prisma.authSettings.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default", googleEnabled: false, allowedDomains: "[]", allowedEmails: "[]", allowAutoProvision: false, defaultRole: "Reporter", defaultIsActive: false },
  });

  await seedTeams();

  console.log("Production seed completed without sample users");
}

main().finally(async () => prisma.$disconnect());
