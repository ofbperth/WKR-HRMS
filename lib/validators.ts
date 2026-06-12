import { z } from "zod";
import {
  ACTION_PLAN_STATUS_VALUES,
  AFFECTED_TYPE_VALUES,
  AUTH_PROVIDER_VALUES,
  CLINICAL_OR_GENERAL_VALUES,
  INCIDENT_STATUS_VALUES,
  RCA_STATUS_VALUES,
  ROLE_VALUES,
  SEVERITY_VALUES,
} from "@/lib/types";
import { INCIDENT_DETAIL_IDENTIFIER_ERROR_MESSAGE, validateIncidentDetailNoIdentifiers } from "@/lib/incident-detail-identifiers";

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

export const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });

function addIncidentDetailIdentifierIssue(ctx: z.RefinementCtx, field: string) {
  ctx.addIssue({
    code: z.ZodIssueCode.custom,
    path: [field],
    message: INCIDENT_DETAIL_IDENTIFIER_ERROR_MESSAGE,
  });
}

const createIncidentBaseSchema = z.object({
  occurredDate: z.string().min(1, "กรุณาระบุวันที่เกิดเหตุ"),
  occurredTime: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/, "Use 24-hour time as HH:mm"),
  incidentUnitId: z.string().min(1, "กรุณาเลือกหน่วยงานที่เกิดเหตุ"),
  location: z.string().optional().nullable(),
  affectedType: z.enum(affectedTypes),
  title: z.string().min(3, "กรุณาระบุชื่อเหตุการณ์อย่างน้อย 3 ตัวอักษร"),
  description: z.string().min(10, "กรุณาระบุรายละเอียดเหตุการณ์"),
  immediateAction: z.string().optional().nullable(),
  clinicalOrGeneral: z.enum(clinicalOrGeneralValues),
  simpleCategory: z.string().optional().nullable(),
  riskCodeId: z.string().min(1, "กรุณาเลือก risk code"),
  severity: z.enum(severityValues),
  needRmSupport: z.boolean().default(false),
  patientHn: z.string().optional().nullable(),
  patientAn: z.string().optional().nullable(),
  medicationRight: z.enum(medicationRightValues).optional().nullable(),
});

export const createIncidentSchema = createIncidentBaseSchema.superRefine((value, ctx) => {
  if (!validateIncidentDetailNoIdentifiers(value.description).valid) {
    addIncidentDetailIdentifierIssue(ctx, "description");
  }

  if (value.medicationRight && value.riskCodeId === "") {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["riskCodeId"],
      message: "กรุณาเลือก Medication Administration risk code ก่อนระบุ 6 Rights",
    });
  }
});

export const updateIncidentClassificationSchema = z.object({
  severity: z.enum(severityValues),
  riskCodeId: z.string().min(1),
  simpleCategory: z.string().optional().nullable(),
  status: z.enum(incidentStatusValues),
  isSentinel: z.boolean(),
  needRmSupport: z.boolean(),
});

export const triageClassificationSchema = z.object({
  severity: z.enum(severityValues),
  riskCodeId: z.string().min(1),
  simpleCategory: z.string().optional().nullable(),
  isSentinel: z.boolean(),
  needRmSupport: z.boolean(),
  requireRca: z.boolean(),
});

export const reporterUpdateIncidentSchema = createIncidentBaseSchema.partial().extend({ id: z.string().min(1) }).superRefine((value, ctx) => {
  if (typeof value.description === "string" && !validateIncidentDetailNoIdentifiers(value.description).valid) {
    addIncidentDetailIdentifierIssue(ctx, "description");
  }
});

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

export const exportRequestSchema = z.object({
  reason: z.string().trim().min(10, "EXPORT_REASON_REQUIRED"),
  filters: z.record(z.union([z.string(), z.array(z.string())])).default({}),
});

export const teamAssignmentSchema = z.object({
  teamIds: z.array(z.string().min(1)).max(100),
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

export const unitSchema = z.object({
  name: z.string().min(1),
  type: z.enum(unitTypeValues).default("หน่วยงาน"),
  isActive: z.boolean().default(true),
});

export const riskCodeSchema = z.object({
  code: z.string().min(1),
  nameTh: z.string().min(1),
  nameEn: z.string().optional().nullable(),
  clinicalOrGeneral: z.enum(clinicalOrGeneralValues),
  simpleCategory: z.string().min(1),
  isActive: z.boolean().default(true),
});

export const teamSchema = z.object({
  name: z.string().trim().min(1),
  code: z.string().trim().optional().nullable(),
  description: z.string().trim().optional().nullable(),
  isActive: z.boolean().default(true),
  sortOrder: z.coerce.number().int().min(0).default(0),
});
