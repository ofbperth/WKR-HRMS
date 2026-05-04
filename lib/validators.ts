import { z } from "zod";
import { AFFECTED_TYPE_VALUES, CLINICAL_OR_GENERAL_VALUES, INCIDENT_STATUS_VALUES, ROLE_VALUES, SEVERITY_VALUES } from "@/lib/types";

export const roles = ROLE_VALUES;
export const severityValues = SEVERITY_VALUES;
export const affectedTypes = AFFECTED_TYPE_VALUES;
export const clinicalOrGeneralValues = CLINICAL_OR_GENERAL_VALUES;
export const incidentStatusValues = INCIDENT_STATUS_VALUES;

export const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });

export const createIncidentSchema = z.object({
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
});

export const updateIncidentClassificationSchema = z.object({
  severity: z.enum(severityValues),
  riskCodeId: z.string().min(1),
  simpleCategory: z.string().min(1),
  status: z.enum(incidentStatusValues),
  isSentinel: z.boolean(),
  needRmSupport: z.boolean(),
});

export const reporterUpdateIncidentSchema = createIncidentSchema.partial().extend({ id: z.string().min(1) });

export const commentSchema = z.object({ message: z.string().min(1, "กรุณาใส่ข้อความ") });

export const adminUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().optional(),
  role: z.enum(roles),
  unitId: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
});

export const unitSchema = z.object({ name: z.string().min(1), type: z.string().optional(), isActive: z.boolean().default(true) });
export const riskCodeSchema = z.object({
  code: z.string().min(1),
  nameTh: z.string().min(1),
  nameEn: z.string().optional().nullable(),
  clinicalOrGeneral: z.enum(clinicalOrGeneralValues),
  simpleCategory: z.string().min(1),
  isActive: z.boolean().default(true),
});
