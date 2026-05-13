import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
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
  { name: "ICU", type: "หน่วยงาน" },
  { name: "ER", type: "หน่วยงาน" },
  { name: "OPD", type: "หน่วยงาน" },
  { name: "OR", type: "หน่วยงาน" },
  { name: "Anes", type: "ทีม" },
  { name: "ศัลยกรรมหญิง", type: "หน่วยงาน" },
  { name: "ศัลยกรรมชาย", type: "หน่วยงาน" },
  { name: "สามัญหญิง", type: "หน่วยงาน" },
  { name: "สามัญชาย", type: "หน่วยงาน" },
  { name: "สามัญ 3", type: "หน่วยงาน" },
  { name: "ทันตกรรม", type: "หน่วยงาน" },
  { name: "ศูนย์เด็กเล็ก", type: "หน่วยงาน" },
  { name: "หอผู้ป่วยพิเศษ", type: "หน่วยงาน" },
  { name: "เวชกรรมฟื้นฟู", type: "หน่วยงาน" },
  { name: "ชันสูตรโรคกลาง", type: "หน่วยงาน" },
  { name: "ธนาคารเลือด", type: "หน่วยงาน" },
  { name: "เภสัชกรรม", type: "หน่วยงาน" },
  { name: "ANC", type: "หน่วยงาน" },
  { name: "LR", type: "หน่วยงาน" },
  { name: "EMS", type: "ทีม" },
  { name: "เวชระเบียน", type: "หน่วยงาน" },
  { name: "ไตเทียม", type: "หน่วยงาน" },
  { name: "โภชนาการ", type: "หน่วยงาน" },
  { name: "งบประมาณ", type: "หน่วยงาน" },
  { name: "บริหาร", type: "หน่วยงาน" },
  { name: "ช่าง", type: "ทีม" },
  { name: "IT", type: "ทีม" },
  { name: "หน่วยจ่ายกลาง", type: "หน่วยงาน" },
  { name: "ฝ่ายการพยาบาล", type: "ทีม" },
  { name: "วิชาการ", type: "ทีม" },
  { name: "ศูนย์พัฒนาคุณภาพ", type: "ทีม" },
  { name: "จิตเวช", type: "หน่วยงาน" },
  { name: "แพทย์แผนไทย", type: "หน่วยงาน" },
  { name: "แพทย์แผนจีน", type: "หน่วยงาน" },
  { name: "IMC", type: "หน่วยงาน" },
  { name: "รังสีวิทยา", type: "หน่วยงาน" },
];

const safetyGoalRiskCodes = [
  { code: "CPP401", nameTh: "Common complication / Fall / Pressure injury", nameEn: "Common complication / Fall / Pressure injury", clinicalOrGeneral: "Clinical", simpleCategory: "Patient Care Process" },
  { code: "CPE402", nameTh: "Refer and transfer safety", nameEn: "Refer and transfer safety", clinicalOrGeneral: "Clinical", simpleCategory: "Emergency / Refer / Transfer" },
];

async function seedMasterData() {
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

  await prisma.riskCode.updateMany({
    where: { code: { notIn: [...nrlsRiskCodes.map((item) => item.code), ...safetyGoalRiskCodes.map((item) => item.code)] } },
    data: { isActive: false },
  });

  await prisma.authSettings.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default", googleEnabled: false, allowedDomains: "[]", allowedEmails: "[]", allowAutoProvision: false, defaultRole: "Reporter", defaultIsActive: false },
  });
}

async function seedDevUsers() {
  const qualityUnit = await prisma.unit.findUniqueOrThrow({ where: { name: "ศูนย์พัฒนาคุณภาพ" } });
  const erUnit = await prisma.unit.findUniqueOrThrow({ where: { name: "ER" } });
  const passwordHash = await bcrypt.hash("password", 12);
  const users = [
    { email: "admin@hospital.local", name: "System Admin", role: "Admin", unitId: qualityUnit.id },
    { email: "rm@hospital.local", name: "RM Team", role: "RMTeam", unitId: qualityUnit.id },
    { email: "executive@hospital.local", name: "Executive User", role: "Executive", unitId: qualityUnit.id },
    { email: "unitmanager@hospital.local", name: "Unit Manager ER", role: "UnitManager", unitId: erUnit.id },
    { email: "reporter@hospital.local", name: "Reporter ER", role: "Reporter", unitId: erUnit.id },
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: { ...user, passwordHash, isActive: true, authProvider: "CREDENTIALS" },
      create: { ...user, passwordHash, isActive: true, authProvider: "CREDENTIALS" },
    });
  }
}

async function main() {
  await seedMasterData();
  const shouldSeedDevUsers =
    process.env.SEED_DEV_USERS === "true" ||
    (process.env.NODE_ENV !== "production" && process.env.SEED_DEV_USERS !== "false");
  if (shouldSeedDevUsers) await seedDevUsers();
  console.log("Seed completed");
}

main().finally(async () => prisma.$disconnect());
