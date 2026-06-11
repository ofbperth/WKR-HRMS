import { PrismaClient } from "@prisma/client";
import { nrlsRiskCodes } from "../lib/nrls-risk-codes";

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

  const teamCount = await prisma.team.count();
  if (teamCount === 0) {
    await prisma.team.createMany({
      data: defaultTeams.map((team, index) => ({ ...team, isActive: true, sortOrder: index + 1 })),
    });
  }

  console.log("Production seed completed without sample users");
}

main().finally(async () => prisma.$disconnect());
