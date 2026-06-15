export type RCAContributoryFactors = {
  patientFactors?: string | null;
  individualStaffFactors?: string | null;
  taskProcessTechnologyFactors?: string | null;
  teamCommunicationFactors?: string | null;
  workEnvironmentOrganizationalFactors?: string | null;
};

export type LegacyRcaContributoryFactors = {
  contributingHuman?: string | null;
  contributingProcess?: string | null;
  contributingEquipment?: string | null;
  contributingEnvironment?: string | null;
  contributingCommunication?: string | null;
  contributingIT?: string | null;
};

type LabelValuePair = readonly [label: string, value: string | null | undefined];

const TASK_PROCESS_TECHNOLOGY_LABELS = [
  ["กระบวนการ", "contributingProcess"],
  ["เครื่องมือ/อุปกรณ์", "contributingEquipment"],
  ["IT", "contributingIT"],
] as const;

const SECTION_LABEL_PATTERN = /^(.+?):\s*$/m;

function normalizeText(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function joinLabeledSections(items: LabelValuePair[]) {
  const sections = items
    .map(([label, value]) => {
      const normalized = normalizeText(value);
      return normalized ? `${label}:\n${normalized}` : null;
    })
    .filter(Boolean);
  return sections.length ? sections.join("\n\n") : null;
}

function looksLikeMergedLegacySections(value: string | null | undefined) {
  const normalized = normalizeText(value);
  if (!normalized) return false;
  return normalized.split("\n\n").every((section) => SECTION_LABEL_PATTERN.test(section.trim()));
}

function stripSectionLabel(section: string) {
  return section.replace(SECTION_LABEL_PATTERN, "").trim();
}

function extractMergedSectionValue(
  value: string | null | undefined,
  labels: readonly string[],
) {
  const normalized = normalizeText(value);
  if (!normalized || !looksLikeMergedLegacySections(normalized)) return null;
  const sections = normalized.split("\n\n");
  const matches = sections
    .map((section) => section.trim())
    .filter((section) => labels.some((label) => section.startsWith(`${label}:`)))
    .map(stripSectionLabel)
    .filter(Boolean);
  return matches.length ? matches.join("\n\n") : null;
}

export function mapLegacyRcaToFiveTier(
  legacy: LegacyRcaContributoryFactors & Partial<RCAContributoryFactors>,
): Required<RCAContributoryFactors> {
  const patientFactors = normalizeText(legacy.patientFactors) ?? "";
  const individualStaffFactors = normalizeText(legacy.individualStaffFactors)
    ?? normalizeText(legacy.contributingHuman)
    ?? "";
  const taskProcessTechnologyFactors = normalizeText(legacy.taskProcessTechnologyFactors)
    ?? joinLabeledSections([
      ["กระบวนการ", legacy.contributingProcess],
      ["เครื่องมือ/อุปกรณ์", legacy.contributingEquipment],
      ["IT", legacy.contributingIT],
    ])
    ?? "";
  const teamCommunicationFactors = normalizeText(legacy.teamCommunicationFactors)
    ?? normalizeText(legacy.contributingCommunication)
    ?? "";
  const workEnvironmentOrganizationalFactors = normalizeText(legacy.workEnvironmentOrganizationalFactors)
    ?? normalizeText(legacy.contributingEnvironment)
    ?? "";

  return {
    patientFactors,
    individualStaffFactors,
    taskProcessTechnologyFactors,
    teamCommunicationFactors,
    workEnvironmentOrganizationalFactors,
  };
}

export function mapFiveTierToLegacyProjection(
  factors: RCAContributoryFactors,
): Required<LegacyRcaContributoryFactors> {
  const taskProcessTechnologyFactors = normalizeText(factors.taskProcessTechnologyFactors);

  return {
    contributingHuman: normalizeText(factors.individualStaffFactors),
    contributingProcess: extractMergedSectionValue(
      taskProcessTechnologyFactors,
      TASK_PROCESS_TECHNOLOGY_LABELS
        .filter(([_, key]) => key === "contributingProcess")
        .map(([label]) => label),
    ) ?? taskProcessTechnologyFactors,
    contributingEquipment: extractMergedSectionValue(
      taskProcessTechnologyFactors,
      TASK_PROCESS_TECHNOLOGY_LABELS
        .filter(([_, key]) => key === "contributingEquipment")
        .map(([label]) => label),
    ),
    contributingEnvironment: normalizeText(factors.workEnvironmentOrganizationalFactors),
    contributingCommunication: normalizeText(factors.teamCommunicationFactors),
    contributingIT: extractMergedSectionValue(
      taskProcessTechnologyFactors,
      TASK_PROCESS_TECHNOLOGY_LABELS
        .filter(([_, key]) => key === "contributingIT")
        .map(([label]) => label),
    ),
  };
}
