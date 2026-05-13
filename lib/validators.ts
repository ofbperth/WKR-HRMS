import { z } from "zod";
import { ACTION_PLAN_STATUS_VALUES, AFFECTED_TYPE_VALUES, AUTH_PROVIDER_VALUES, CLINICAL_OR_GENERAL_VALUES, INCIDENT_STATUS_VALUES, RCA_STATUS_VALUES, ROLE_VALUES, SEVERITY_VALUES } from "@/lib/types";

export const roles = ROLE_VALUES;
export const authProviderValues = AUTH_PROVIDER_VALUES;
export const severityValues = SEVERITY_VALUES;
export const affectedTypes = AFFECTED_TYPE_VALUES;
export const clinicalOrGeneralValues = CLINICAL_OR_GENERAL_VALUES;
export const incidentStatusValues = INCIDENT_STATUS_VALUES;
export const rcaStatusValues = RCA_STATUS_VALUES;
export const actionPlanStatusValues = ACTION_PLAN_STATUS_VALUES;
export const unitTypeValues = ["หน่วยงาน", "ทีม"] as const;
export const medicationRightValues = ["Right patient", "Right drug", "Right dose", "Right route", "Right time", "Right documentation"] as const;

const pdpaForbiddenTitlePattern = /(^|[\s,.;:()[\]{}"'“”‘’\-\/])(นาย|นาง|นางสาว|นส\.|ด\.ช\.?|ด\.ญ\.?|ดช|ดญ|miss|ms|mr|mrs)(?=$|[\s,.;:()[\]{}"'“”‘’\-\/])/i;

export const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });

const createIncidentBaseSchema = z.object({
  occurredDate: z.string().min(1, "กรุณาระบุวันที่เกิดเหตุ"),
  occurredTime: z.string().min(1, "กรุณาระบุเวลาเกิดเหตุ"),
  incidentUnitId: z.string().min(1, "กรุณาเลือกหน่วยงานที่เกิดเหตุ"),
  location: z.string().optional().nullable(),
  affectedType: z.enum(affectedTypes),
  title: z.string().min(3, "กรุณาระบุชื่อเหตุการณ์อย่างน้อย 3 ตัวอักษร"),
  description: z.string().min(10, "กรุณาระบุรายละเอียดเหตุการณ์"),
  immediateAction: z.string().optional().nullable(),
  clinicalOrGeneral: z.enum(clinicalOrGeneralValues),
  simpleCategory: z.string().min(1, "กรุณาระบุ SIMPLE category"),
  riskCodeId: z.string().min(1, "กรุณาเลือก risk code"),
  severity: z.enum(severityValues),
  needRmSupport: z.boolean().default(false),
  patientHn: z.string().optional().nullable(),
  patientAn: z.string().optional().nullable(),
  medicationRight: z.enum(medicationRightValues).optional().nullable(),
});

export const createIncidentSchema = createIncidentBaseSchema.superRefine((value, ctx) => {
  for (const field of ["title", "description", "immediateAction"] as const) {
    const text = value[field];
    if (text && pdpaForbiddenTitlePattern.test(text)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [field],
        message: "ไม่ให้ลงข้อมูลส่วนตัวผู้ป่วยลงในรายละเอียด",
      });
    }
  }
  if (value.medicationRight && value.riskCodeId === "") {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["riskCodeId"], message: "กรุณาเลือก Medication Administration risk code ก่อนระบุ 6 Rights" });
  }
});

export const updateIncidentClassificationSchema = z.object({
  severity: z.enum(severityValues),
  riskCodeId: z.string().min(1),
  simpleCategory: z.string().min(1),
  status: z.enum(incidentStatusValues),
  isSentinel: z.boolean(),
  needRmSupport: z.boolean(),
});

export const triageClassificationSchema = z.object({
  severity: z.enum(severityValues),
  riskCodeId: z.string().min(1),
  simpleCategory: z.string().min(1),
  isSentinel: z.boolean(),
  needRmSupport: z.boolean(),
  requireRca: z.boolean(),
});

export const reporterUpdateIncidentSchema = createIncidentBaseSchema.partial().extend({ id: z.string().min(1) });

export const commentSchema = z.object({ message: z.string().min(1, "กรุณาใส่ข้อความ") });

export const rcaSchema = z.object({
  problemStatement: z.string().min(3),
  timeline: z.string().optional().nullable(),
  contributingHuman: z.string().optional().nullable(),
  contributingProcess: z.string().optional().nullable(),
  contributingEquipment: z.string().optional().nullable(),
  contributingEnvironment: z.string().optional().nullable(),
  contributingCommunication: z.string().optional().nullable(),
  contributingIT: z.string().optional().nullable(),
  rootCause: z.string().min(3),
  preventiveAction: z.string().min(3),
  kpi: z.string().optional().nullable(),
  kpiOwnerId: z.string().optional().nullable(),
  needRmSupport: z.boolean().default(false),
  submit: z.boolean().default(false),
});

export const rcaApprovalSchema = z.object({
  approved: z.boolean(),
  comment: z.string().optional().nullable(),
});

export const actionPlanSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional().nullable(),
  ownerId: z.string().min(1),
  coOwnerText: z.string().optional().nullable(),
  dueDate: z.string().min(1),
  kpiName: z.string().optional().nullable(),
  kpiTarget: z.string().optional().nullable(),
});

export const actionUpdateSchema = z.object({
  status: z.enum(actionPlanStatusValues),
  ownerId: z.string().optional().nullable(),
  evidenceText: z.string().optional().nullable(),
  evidenceUrl: z.string().optional().nullable(),
  kpiResult: z.string().optional().nullable(),
  effectivenessReview: z.string().optional().nullable(),
});

export const actionVerifySchema = z.object({
  verified: z.boolean(),
  effectivenessReview: z.string().optional().nullable(),
});

export const adminUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().optional(),
  role: z.enum(roles),
  unitId: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
  authProvider: z.enum(authProviderValues).optional(),
  googleId: z.string().optional().nullable(),
  image: z.string().optional().nullable(),
});

export const authSettingsSchema = z.object({
  googleEnabled: z.boolean().default(false),
  allowedDomains: z.array(z.string().trim().toLowerCase().min(1)).default([]),
  allowedEmails: z.array(z.string().trim().toLowerCase().email()).default([]),
  allowAutoProvision: z.boolean().default(false),
  defaultRole: z.enum(roles).default("Reporter"),
  defaultIsActive: z.boolean().default(false),
});

export const userInviteSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  role: z.enum(roles),
  unitId: z.string().optional().nullable(),
  expiresAt: z.string().min(1),
});

export const unitSchema = z.object({ name: z.string().min(1), type: z.enum(unitTypeValues).default("หน่วยงาน"), isActive: z.boolean().default(true) });
export const riskCodeSchema = z.object({
  code: z.string().min(1),
  nameTh: z.string().min(1),
  nameEn: z.string().optional().nullable(),
  clinicalOrGeneral: z.enum(clinicalOrGeneralValues),
  simpleCategory: z.string().min(1),
  isActive: z.boolean().default(true),
});
