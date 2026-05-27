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

  console.log("Production seed completed without sample users");
}

main().finally(async () => prisma.$disconnect());
