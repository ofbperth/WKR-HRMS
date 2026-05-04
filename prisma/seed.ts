import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { nrlsRiskCodes } from "../lib/nrls-risk-codes";

const prisma = new PrismaClient();

const units = [
  "ICU", "ER", "OPD", "ศัลยกรรมหญิง", "ศัลยกรรมชาย", "สามัญหญิง", "สามัญชาย", "สามัญ 3",
  "ทันตกรรม", "OR", "Anes", "ศูนย์เด็กเล็ก", "หอผู้ป่วยพิเศษ", "เวชกรรมฟื้นฟู", "ชันสูตรโรคกลาง",
  "ธนาคารเลือด", "เภสัชกรรม", "ANC", "LR", "EMS", "เวชระเบียน", "ไตเทียม", "โภชนาการ",
  "งบประมาณ", "บริหาร", "ช่าง", "IT", "หน่วยจ่ายกลาง", "ฝ่ายการพยาบาล", "วิชาการ",
  "ศูนย์พัฒนาคุณภาพ", "จิตเวช", "แพทย์แผนไทย", "แพทย์แผนจีน", "IMC", "รังสีวิทยา"
];

const riskCodes = nrlsRiskCodes;

async function main() {
  for (const name of units) {
    await prisma.unit.upsert({ where: { name }, update: {}, create: { name, type: name === "ศูนย์พัฒนาคุณภาพ" ? "Quality" : "หน่วยงาน" } });
  }
  for (const riskCode of riskCodes) {
    await prisma.riskCode.upsert({
      where: { code: riskCode.code },
      update: {
        nameTh: riskCode.nameTh,
        nameEn: riskCode.nameEn,
        clinicalOrGeneral: riskCode.clinicalOrGeneral,
        simpleCategory: riskCode.simpleCategory,
        isActive: true,
      },
      create: {
        code: riskCode.code,
        nameTh: riskCode.nameTh,
        nameEn: riskCode.nameEn,
        clinicalOrGeneral: riskCode.clinicalOrGeneral,
        simpleCategory: riskCode.simpleCategory,
        isActive: true,
      },
    });
  }
  await prisma.riskCode.updateMany({
    where: { code: { notIn: Array.from(riskCodes, r => r.code) } },
    data: { isActive: false },
  });
  const qualityUnit = await prisma.unit.findUniqueOrThrow({ where: { name: "ศูนย์พัฒนาคุณภาพ" } });
  const erUnit = await prisma.unit.findUniqueOrThrow({ where: { name: "ER" } });
  const passwordHash = await bcrypt.hash("password", 12);
  const users: Array<{ email: string; name: string; role: string; unitId: string }> = [
    { email: "admin@hospital.local", name: "System Admin", role: "Admin", unitId: qualityUnit.id },
    { email: "rm@hospital.local", name: "RM Team", role: "RMTeam", unitId: qualityUnit.id },
    { email: "executive@hospital.local", name: "Executive User", role: "Executive", unitId: qualityUnit.id },
    { email: "unitmanager@hospital.local", name: "Unit Manager ER", role: "UnitManager", unitId: erUnit.id },
    { email: "reporter@hospital.local", name: "Reporter ER", role: "Reporter", unitId: erUnit.id },
  ];
  for (const u of users) {
    await prisma.user.upsert({ where: { email: u.email }, update: { ...u, passwordHash, isActive: true }, create: { ...u, passwordHash, isActive: true } });
  }
  console.log("Seed completed");
}
main().finally(async () => prisma.$disconnect());
