const textBoundary = String.raw`(^|[\s,.;:()[\]{}"'“”‘’\-/])`;
const thaiNameTitlePattern = new RegExp(`${textBoundary}(นาย|นาง|นางสาว|นส\\.|ด\\.ช\\.?|ด\\.ญ\\.?|ดช|ดญ)(?=$|[\\s,.;:()[\\]{}"'“”‘’\\-/])`, "i");
const englishNameTitlePattern = /\b(?:Mr\.?|Mrs\.?|Ms\.?|Miss)\s+[A-Z][A-Za-z'-]{1,}\b/;
const hnPattern = /\bHN\s*[:#-]?\s*[A-Za-z0-9-]{4,}\b/i;
const anPattern = /\bAN\s*[:#-]?\s*[A-Za-z0-9-]{4,}\b/i;
const cidLabelPattern = /(เลขบัตร|บัตรประชาชน|เลขประชาชน)\s*[:#-]?\s*\d[\d -]{11,}/i;
const thaiCidPattern = /(?:^|[^\d])\d[\d -]{11,16}\d(?:$|[^\d])/;
const phonePattern = /(?:^|[^\d])(?:\+?66|0)\d(?:[\d -]{7,12})\d(?:$|[^\d])/;
const patientNamePhrasePattern = /(ผู้ป่วยชื่อ|ชื่อผู้ป่วย)\s*[:#-]?\s*\S+/i;
const emailPattern = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;

const sensitivePatterns = [
  thaiNameTitlePattern,
  englishNameTitlePattern,
  hnPattern,
  anPattern,
  cidLabelPattern,
  thaiCidPattern,
  phonePattern,
  patientNamePhrasePattern,
];

const redactionRules = [
  { pattern: /\bHN\s*[:#-]?\s*[A-Za-z0-9-]{4,}\b/gi, replacement: "HN:[REDACTED]" },
  { pattern: /\bAN\s*[:#-]?\s*[A-Za-z0-9-]{4,}\b/gi, replacement: "AN:[REDACTED]" },
  { pattern: /(เลขบัตร|บัตรประชาชน|เลขประชาชน)\s*[:#-]?\s*\d[\d -]{11,}/gi, replacement: "$1:[REDACTED]" },
  { pattern: /(?:^|[^\d])((?:\+?66|0)\d(?:[\d -]{7,12})\d)(?:$|[^\d])/g, replacement: " [REDACTED_PHONE] " },
  { pattern: /(?:^|[^\d])(\d[\d -]{11,16}\d)(?:$|[^\d])/g, replacement: " [REDACTED_ID] " },
  { pattern: /(ผู้ป่วยชื่อ|ชื่อผู้ป่วย)\s*[:#-]?\s*\S+/gi, replacement: "$1:[REDACTED]" },
];

function normalizeDigits(value: string) {
  return value.replace(/[^\d]/g, "");
}

function stripEmails(text: string) {
  return text.replace(emailPattern, "[EMAIL]");
}

export function containsLikelyPatientIdentifier(text: string) {
  const sanitizedText = stripEmails(text);
  return sensitivePatterns.some((pattern) => {
    const matched = sanitizedText.match(pattern);
    if (!matched) return false;
    if (pattern === thaiCidPattern) {
      return matched.some((value) => normalizeDigits(value).length === 13);
    }
    if (pattern === phonePattern) {
      return matched.some((value) => {
        const digits = normalizeDigits(value);
        return digits.length >= 9 && digits.length <= 12;
      });
    }
    return true;
  });
}

export function redactSensitiveText(text: string) {
  return redactionRules.reduce((output, rule) => output.replace(rule.pattern, rule.replacement), text);
}
