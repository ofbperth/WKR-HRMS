export const INCIDENT_DETAIL_IDENTIFIER_ERROR_MESSAGE = "ไม่สามารถส่งรายงานได้ เนื่องจากพบข้อมูลที่อาจระบุตัวผู้ป่วยในช่องรายละเอียดเหตุการณ์ กรุณาลบข้อมูลดังกล่าวออก และใช้ช่อง HN/AN ที่ระบบเตรียมไว้แทน";

export const INCIDENT_DETAIL_IDENTIFIER_ERROR_CODE = "INCIDENT_DETAIL_IDENTIFIER_DETECTED";

export const patientIdentifierCategories = [
  "HN",
  "AN",
  "เลขบัตรประชาชน",
  "เบอร์โทรศัพท์",
  "อีเมล",
  "Passport",
  "ชื่อผู้ป่วย",
] as const;

export type PatientIdentifierCategory = typeof patientIdentifierCategories[number];

export type PatientIdentifierDetection = {
  category: PatientIdentifierCategory;
  start: number;
  end: number;
};

type PatientIdentifierRule = {
  category: PatientIdentifierCategory;
  pattern: RegExp;
  allowMatch?: (value: string) => boolean;
};

const thaiCitizenIdPattern = /(^|[^\d])(\d(?:[\s-]?\d){12})(?=$|[^\d])/g;
const thaiPhonePattern = /(^|[^\d])((?:\+66|0)(?:[\s-]?\d){8,9})(?=$|[^\d])/g;

const patientIdentifierRules: readonly PatientIdentifierRule[] = [
  {
    category: "HN",
    pattern: /\bHN\s*[:#-]?\s*[A-Za-z0-9-]{3,}\b/gi,
  },
  {
    category: "AN",
    pattern: /\bAN\s*[:#-]?\s*[A-Za-z0-9-]{3,}\b/gi,
  },
  {
    category: "เลขบัตรประชาชน",
    pattern: thaiCitizenIdPattern,
    allowMatch: (value) => normalizeDigits(value).length === 13,
  },
  {
    category: "เบอร์โทรศัพท์",
    pattern: thaiPhonePattern,
    allowMatch: (value) => {
      const digits = normalizeDigits(value);
      return digits.length >= 9 && digits.length <= 11;
    },
  },
  {
    category: "อีเมล",
    pattern: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
  },
  {
    category: "Passport",
    pattern: /(?:passport|เลข\s*passport)\s*[:#-]?\s*[A-Z0-9-]{5,}\b/gi,
  },
  {
    category: "ชื่อผู้ป่วย",
    pattern: /(ผู้ป่วยชื่อ|คนไข้ชื่อ|ชื่อผู้ป่วย|ชื่อ-สกุล)\s*[:#-]?\s*[A-Za-zก-๙][A-Za-zก-๙\s.'-]{1,}/gi,
  },
  {
    category: "ชื่อผู้ป่วย",
    pattern: /(นาย|นาง|นางสาว|น\.ส\.|ด\.ช\.|ด\.ญ\.)\s*[A-Za-zก-๙][A-Za-zก-๙.'-]{1,}(?:\s+[A-Za-zก-๙][A-Za-zก-๙.'-]{1,}){0,2}/gi,
  },
];

function normalizeDigits(value: string) {
  return value.replace(/[^\d]/g, "");
}

function pushDetections(text: string, detections: PatientIdentifierDetection[], rule: PatientIdentifierRule) {
  const pattern = new RegExp(rule.pattern.source, rule.pattern.flags);
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    const matchedValue = match[0];
    const capturedValue = match[2] ?? matchedValue;

    if (rule.allowMatch && !rule.allowMatch(capturedValue)) {
      continue;
    }

    const valueStartOffset = matchedValue.indexOf(capturedValue);
    const start = (match.index >= 0 ? match.index : 0) + Math.max(valueStartOffset, 0);
    const end = start + capturedValue.length;
    const duplicate = detections.some((item) => item.category === rule.category && item.start === start && item.end === end);

    if (!duplicate) {
      detections.push({ category: rule.category, start, end });
    }

    if (matchedValue.length === 0) {
      pattern.lastIndex += 1;
    }
  }
}

export function detectPatientIdentifiers(text: string): PatientIdentifierDetection[] {
  if (!text.trim()) return [];

  const detections: PatientIdentifierDetection[] = [];
  for (const rule of patientIdentifierRules) {
    pushDetections(text, detections, rule);
  }

  return detections.sort((left, right) => left.start - right.start || left.end - right.end);
}

export type IncidentDetailIdentifierValidationResult =
  | {
      valid: true;
      message: null;
      categories: [];
      detections: [];
    }
  | {
      valid: false;
      message: typeof INCIDENT_DETAIL_IDENTIFIER_ERROR_MESSAGE;
      categories: PatientIdentifierCategory[];
      detections: PatientIdentifierDetection[];
    };

export function validateIncidentDetailNoIdentifiers(text: string): IncidentDetailIdentifierValidationResult {
  const detections = detectPatientIdentifiers(text);
  if (!detections.length) {
    return { valid: true, message: null, categories: [], detections: [] };
  }

  const categories = patientIdentifierCategories.filter((category) =>
    detections.some((item) => item.category === category),
  );

  return {
    valid: false,
    message: INCIDENT_DETAIL_IDENTIFIER_ERROR_MESSAGE,
    categories,
    detections,
  };
}

export class IncidentDetailIdentifierError extends Error {
  readonly code = INCIDENT_DETAIL_IDENTIFIER_ERROR_CODE;
  readonly categories: PatientIdentifierCategory[];
  readonly detections: PatientIdentifierDetection[];

  constructor(result: Extract<IncidentDetailIdentifierValidationResult, { valid: false }>) {
    super(result.message);
    this.name = "IncidentDetailIdentifierError";
    this.categories = result.categories;
    this.detections = result.detections;
  }
}

export function assertIncidentDetailNoIdentifiers(text: string) {
  const result = validateIncidentDetailNoIdentifiers(text);
  if (!result.valid) {
    throw new IncidentDetailIdentifierError(result);
  }
}

export function isIncidentDetailIdentifierError(error: unknown): error is IncidentDetailIdentifierError {
  return error instanceof IncidentDetailIdentifierError;
}

export function toIncidentDetailIdentifierErrorPayload(error: IncidentDetailIdentifierError) {
  return {
    error: error.code,
    message: error.message,
    categories: error.categories,
  };
}
