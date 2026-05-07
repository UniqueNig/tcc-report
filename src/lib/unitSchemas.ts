// lib/unitSchemas.ts
// Centralized field schema for each unit type.
// Each field has: id, label, type, required, placeholder, options (for select/multiselect)
// Add new units or fields here — the submit form renders them automatically.

export type FieldType =
  | "text"
  | "number"
  | "textarea"
  | "select"
  | "multiselect"
  | "boolean"
  | "currency";

export interface UnitField {
  id: string;
  label: string;
  type: FieldType;
  required: boolean;
  placeholder?: string;
  options?: string[]; // for select / multiselect
  helpText?: string;
}

export interface UnitSchema {
  unitName: string;
  sections: {
    title: string;
    fields: UnitField[];
  }[];
}

// ── Shared fields (appear in every unit) ──────────────
const SHARED_FIELDS: UnitField[] = [
  {
    id: "serviceTitle",
    label: "Service / event title",
    type: "text",
    required: true,
    placeholder: "e.g. Sunday Service — May 4, 2026",
  },
  {
    id: "serviceType",
    label: "Service type",
    type: "select",
    required: true,
    options: ["Sunday Service", "Midweek Service", "Special Event", "Program", "Other"],
  },
  {
    id: "challenges",
    label: "Challenges",
    type: "textarea",
    required: false,
    placeholder: "Any challenges encountered during the service or event…",
  },
  {
    id: "prayerPoints",
    label: "Prayer points",
    type: "textarea",
    required: false,
    placeholder: "Key prayer points from your unit…",
  },
];

// ── Unit schemas ───────────────────────────────────────
export const UNIT_SCHEMAS: Record<string, UnitSchema> = {

  "Music Unit": {
    unitName: "Music Unit",
    sections: [
      {
        title: "Service info",
        fields: SHARED_FIELDS.slice(0, 2),
      },
      {
        title: "Music report",
        fields: [
          { id: "ministrationTitles", label: "Song / ministration titles", type: "textarea", required: true, placeholder: "List the songs ministered, one per line…" },
          { id: "choirPresent", label: "Choir members present", type: "number", required: true, placeholder: "e.g. 18" },
          { id: "choirTotal", label: "Total choir members", type: "number", required: true, placeholder: "e.g. 24" },
          { id: "rehearsalHeld", label: "Was a rehearsal held before service?", type: "boolean", required: true },
          { id: "newSongsIntroduced", label: "New songs introduced", type: "number", required: false, placeholder: "0" },
          { id: "highlights", label: "Highlights", type: "textarea", required: false, placeholder: "Anything noteworthy from the music session…" },
        ],
      },
      { title: "Follow-up", fields: SHARED_FIELDS.slice(2) },
    ],
  },

  "Ushering Unit": {
    unitName: "Ushering Unit",
    sections: [
      {
        title: "Service info",
        fields: SHARED_FIELDS.slice(0, 2),
      },
      {
        title: "Attendance",
        fields: [
          { id: "maleCount", label: "Male adults", type: "number", required: true, placeholder: "e.g. 145" },
          { id: "femaleCount", label: "Female adults", type: "number", required: true, placeholder: "e.g. 163" },
          { id: "childrenCount", label: "Children", type: "number", required: true, placeholder: "e.g. 42" },
          { id: "firstTimers", label: "First timers", type: "number", required: true, placeholder: "e.g. 12" },
          { id: "ushersOnDuty", label: "Ushers on duty", type: "number", required: true, placeholder: "e.g. 10" },
        ],
      },
      {
        title: "Collections",
        fields: [
          { id: "offeringAmount", label: "Offering envelope amount (NGN)", type: "currency", required: true, placeholder: "e.g. 128500" },
          { id: "titheAmount", label: "Tithe envelope amount (NGN)", type: "currency", required: true, placeholder: "e.g. 45000" },
          { id: "seedAmount", label: "Seed / donation envelope amount (NGN)", type: "currency", required: true, placeholder: "e.g. 20000" },
          { id: "offeringNotes", label: "Collection / envelope notes", type: "textarea", required: false, placeholder: "Breakdown or any notes on the envelopes..." },
        ],
      },
      {
        title: "Operations",
        fields: [
          { id: "highlights", label: "Highlights", type: "textarea", required: false, placeholder: "Any noteworthy usher moment…" },
          ...SHARED_FIELDS.slice(2),
        ],
      },
    ],
  },

  "Media Unit": {
    unitName: "Media Unit",
    sections: [
      {
        title: "Service info",
        fields: SHARED_FIELDS.slice(0, 2),
      },
      {
        title: "Live stream",
        fields: [
          { id: "streamPlatforms", label: "Platforms streamed on", type: "multiselect", required: true, options: ["YouTube", "Facebook", "Instagram", "TikTok", "Church App", "Other"] },
          { id: "onlineViewers", label: "Total online viewers", type: "number", required: true, placeholder: "e.g. 87" },
          { id: "peakViewers", label: "Peak concurrent viewers", type: "number", required: false, placeholder: "e.g. 45" },
          { id: "totalLikes", label: "Total likes / reactions", type: "number", required: false, placeholder: "e.g. 210" },
          { id: "streamQualityIssues", label: "Any stream quality issues?", type: "boolean", required: true },
          { id: "streamQualityDetails", label: "Quality issue details", type: "textarea", required: false, placeholder: "Describe any technical issues encountered…" },
        ],
      },
      {
        title: "Recording & content",
        fields: [
          { id: "recordingCompleted", label: "Full service recorded?", type: "boolean", required: true },
          { id: "contentPosted", label: "Content posted post-service?", type: "boolean", required: false },
          { id: "teamPresent", label: "Media team members present", type: "number", required: true, placeholder: "e.g. 4" },
          { id: "highlights", label: "Highlights", type: "textarea", required: false, placeholder: "Any noteworthy media moment…" },
        ],
      },
      { title: "Follow-up", fields: SHARED_FIELDS.slice(2) },
    ],
  },

  "Protocol Unit": {
    unitName: "Protocol Unit",
    sections: [
      {
        title: "Service info",
        fields: SHARED_FIELDS.slice(0, 2),
      },
      {
        title: "Protocol report",
        fields: [
          { id: "officersOnDuty", label: "Protocol officers on duty", type: "number", required: true, placeholder: "e.g. 6" },
          { id: "guestsHandled", label: "Guests / dignitaries handled?", type: "boolean", required: true },
          { id: "guestDetails", label: "Guest details", type: "textarea", required: false, placeholder: "Names, titles, nature of visit…" },
          { id: "incidentsOccurred", label: "Any incidents?", type: "boolean", required: true },
          { id: "incidentDetails", label: "Incident details", type: "textarea", required: false, placeholder: "Describe any incidents that occurred…" },
          { id: "highlights", label: "Highlights", type: "textarea", required: false, placeholder: "Any commendable protocol moments…" },
        ],
      },
      { title: "Follow-up", fields: SHARED_FIELDS.slice(2) },
    ],
  },

  "Technical/Sound Unit": {
    unitName: "Technical/Sound Unit",
    sections: [
      {
        title: "Service info",
        fields: SHARED_FIELDS.slice(0, 2),
      },
      {
        title: "Technical report",
        fields: [
          { id: "teamPresent", label: "Technical team members present", type: "number", required: true, placeholder: "e.g. 5" },
          { id: "soundQuality", label: "Overall sound quality", type: "select", required: true, options: ["Excellent", "Good", "Fair", "Poor"] },
          { id: "equipmentIssues", label: "Equipment issues encountered?", type: "boolean", required: true },
          { id: "equipmentDetails", label: "Equipment issue details", type: "textarea", required: false, placeholder: "Describe any equipment faults or failures…" },
          { id: "projectionWorked", label: "Projection / screens worked throughout?", type: "boolean", required: true },
          { id: "equipmentNeeded", label: "Equipment needing attention / replacement", type: "textarea", required: false, placeholder: "List any equipment that needs to be fixed or replaced…" },
          { id: "highlights", label: "Highlights", type: "textarea", required: false, placeholder: "Any technical wins this service…" },
        ],
      },
      { title: "Follow-up", fields: SHARED_FIELDS.slice(2) },
    ],
  },

  "Prayer Unit": {
    unitName: "Prayer Unit",
    sections: [
      {
        title: "Service info",
        fields: SHARED_FIELDS.slice(0, 2),
      },
      {
        title: "Prayer report",
        fields: [
          { id: "prayerLeaders", label: "Prayer leaders present", type: "number", required: true, placeholder: "e.g. 8" },
          { id: "prayerSessionHeld", label: "Pre-service prayer session held?", type: "boolean", required: true },
          { id: "prayerDuration", label: "Duration of prayer session (minutes)", type: "number", required: false, placeholder: "e.g. 30" },
          { id: "intercessorsPresent", label: "Intercessors present", type: "number", required: false, placeholder: "e.g. 12" },
          { id: "prayerThemes", label: "Key prayer themes", type: "textarea", required: true, placeholder: "What did the unit specifically pray about…" },
          { id: "testimonies", label: "Testimonies / answered prayers", type: "textarea", required: false, placeholder: "Any notable testimonies to report…" },
          { id: "highlights", label: "Highlights", type: "textarea", required: false, placeholder: "Any spiritually significant moments…" },
        ],
      },
      { title: "Follow-up", fields: SHARED_FIELDS.slice(2) },
    ],
  },

  "Children Unit": {
    unitName: "Children Unit",
    sections: [
      {
        title: "Service info",
        fields: SHARED_FIELDS.slice(0, 2),
      },
      {
        title: "Children's church report",
        fields: [
          { id: "teachersPresent", label: "Teachers / workers present", type: "number", required: true, placeholder: "e.g. 7" },
          { id: "childrenAttended", label: "Children attended", type: "number", required: true, placeholder: "e.g. 45" },
          { id: "ageGroups", label: "Age groups handled", type: "multiselect", required: false, options: ["Crèche (0–2)", "Toddlers (3–5)", "Primaries (6–9)", "Juniors (10–12)"] },
          { id: "lessonTitle", label: "Lesson / Bible story title", type: "text", required: true, placeholder: "e.g. David and Goliath" },
          { id: "lessonSummary", label: "Lesson summary", type: "textarea", required: true, placeholder: "Brief summary of what was taught…" },
          { id: "activitiesHeld", label: "Activities / crafts held?", type: "boolean", required: false },
          { id: "newChildren", label: "New children (first timers)", type: "number", required: false, placeholder: "e.g. 3" },
          { id: "highlights", label: "Highlights", type: "textarea", required: false, placeholder: "Any noteworthy children's moment…" },
        ],
      },
      { title: "Follow-up", fields: SHARED_FIELDS.slice(2) },
    ],
  },

  "Welfare Unit": {
    unitName: "Welfare Unit",
    sections: [
      {
        title: "Service info",
        fields: SHARED_FIELDS.slice(0, 2),
      },
      {
        title: "Welfare report",
        fields: [
          { id: "teamPresent", label: "Welfare team members present", type: "number", required: true, placeholder: "e.g. 5" },
          { id: "membersVisited", label: "Members visited / followed up", type: "number", required: false, placeholder: "e.g. 3" },
          { id: "needsIdentified", label: "Needs identified", type: "textarea", required: false, placeholder: "Any member needs reported this week…" },
          { id: "assistanceProvided", label: "Assistance provided", type: "textarea", required: false, placeholder: "What support was given, to whom…" },
          { id: "hospitalisedMembers", label: "Hospitalised / bereaved members", type: "number", required: false, placeholder: "e.g. 1" },
          { id: "hospitalisedDetails", label: "Details", type: "textarea", required: false, placeholder: "Names and situations (handle with care)…" },
          { id: "highlights", label: "Highlights", type: "textarea", required: false, placeholder: "Any welfare success story to share…" },
        ],
      },
      { title: "Follow-up", fields: SHARED_FIELDS.slice(2) },
    ],
  },

  "Finance Unit (Accounting)": {
    unitName: "Finance Unit (Accounting)",
    sections: [
      {
        title: "Service info",
        fields: SHARED_FIELDS.slice(0, 2),
      },
      {
        title: "Finance report",
        fields: [
          {
            id: "offeringReceived",
            label: "Offering received from ushers (NGN)",
            type: "currency",
            required: true,
            placeholder: "e.g. 128500",
            helpText: "Enter 0 if no usher offering was handed over for this service.",
          },
          {
            id: "offeringBanked",
            label: "Usher offering banked/deposited (NGN)",
            type: "currency",
            required: true,
            placeholder: "e.g. 128500",
            helpText: "This is only the amount from ushers, not tithes, seeds, or other finance-only income.",
          },
          {
            id: "titheReceived",
            label: "Tithe received from ushers (NGN)",
            type: "currency",
            required: true,
            placeholder: "e.g. 45000",
            helpText: "Enter 0 if no tithe envelope was handed over by ushers.",
          },
          {
            id: "specialSeedReceived",
            label: "Seed / donation received from ushers (NGN)",
            type: "currency",
            required: true,
            placeholder: "e.g. 20000",
            helpText: "Enter 0 if no seed/donation envelope was handed over by ushers.",
          },
          {
            id: "otherIncomeReceived",
            label: "Other direct income received (NGN)",
            type: "currency",
            required: false,
            placeholder: "e.g. 10000",
            helpText: "Use this only for money that did not pass through ushers.",
          },
          {
            id: "otherIncomeSource",
            label: "Other direct income source / description",
            type: "textarea",
            required: false,
            placeholder: "Describe where the direct non-usher income came from...",
          },
          {
            id: "totalIncomeBanked",
            label: "Total income banked/deposited (NGN)",
            type: "currency",
            required: true,
            placeholder: "e.g. 193500",
            helpText: "All usher handover envelopes + direct non-usher income that was banked or deposited.",
          },
          { id: "bankingDate", label: "Banking date", type: "text", required: false, placeholder: "e.g. May 5, 2026" },
          {
            id: "bankingReference",
            label: "Bank / deposit reference",
            type: "text",
            required: false,
            placeholder: "Receipt number, teller id, transfer reference...",
          },
          { id: "discrepancies", label: "Any finance discrepancy?", type: "boolean", required: true },
          { id: "discrepancyDetails", label: "Discrepancy details", type: "textarea", required: false, placeholder: "Explain any difference between collected and banked amounts…" },
          {
            id: "expenditure",
            label: "Expenditure this week (NGN)",
            type: "currency",
            required: false,
            placeholder: "e.g. 15000",
            helpText: "Enter the total approved spending for this service or reporting week. Leave empty or enter 0 if none.",
          },
          {
            id: "expenditureNotes",
            label: "Expenditure notes",
            type: "textarea",
            required: false,
            placeholder: "What was the expenditure for…",
            helpText: "Add the reason, vendor, or approval note for the expenditure where available.",
          },
          { id: "highlights", label: "Notes / highlights", type: "textarea", required: false, placeholder: "Any financial observations or notes…" },
        ],
      },
      { title: "Follow-up", fields: SHARED_FIELDS.slice(2) },
    ],
  },

  // ── Family Heads ──────────────────────────────────────
  "Family Head - Goshen": {
    unitName: "Family Head - Goshen",
    sections: [
      {
        title: "Service info",
        fields: SHARED_FIELDS.slice(0, 2),
      },
      {
        title: "Family group report",
        fields: [
          { id: "membersPresent", label: "Members present", type: "number", required: true, placeholder: "e.g. 22" },
          { id: "totalMembers", label: "Total registered members", type: "number", required: true, placeholder: "e.g. 30" },
          { id: "newMembers", label: "New members added", type: "number", required: false, placeholder: "0" },
          { id: "absentMembers", label: "Absent members", type: "number", required: false, placeholder: "0" },
          { id: "followUpDone", label: "Follow-up done on absentees?", type: "boolean", required: false },
          { id: "cellMeetingHeld", label: "Cell / family meeting held this week?", type: "boolean", required: false },
          { id: "cellMeetingNotes", label: "Cell meeting notes", type: "textarea", required: false, placeholder: "What was discussed or studied…" },
          { id: "highlights", label: "Highlights", type: "textarea", required: false, placeholder: "Any testimonies, prayer answers, milestones…" },
        ],
      },
      { title: "Follow-up", fields: SHARED_FIELDS.slice(2) },
    ],
  },
};

const FAMILY_GROUP_NAMES = ["Goshen", "David", "Joseph", "Issachar", "Judah"];

// Clone family head schema for other family groups
FAMILY_GROUP_NAMES.filter((name) => name !== "Goshen").forEach((name) => {
  UNIT_SCHEMAS[`Family Head - ${name}`] = {
    ...UNIT_SCHEMAS["Family Head - Goshen"],
    unitName: `Family Head - ${name}`,
  };
});

// ── Helper: get schema by unit name ───────────────────
function normalizeUnitName(unitName: string) {
  return unitName
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .filter((part) => part && part !== "unit")
    .join(" ");
}

const UNIT_SCHEMA_LOOKUP = Object.keys(UNIT_SCHEMAS).reduce<Record<string, string>>(
  (lookup, unitName) => {
    lookup[normalizeUnitName(unitName)] = unitName;
    return lookup;
  },
  {}
);

const UNIT_SCHEMA_ALIASES: Record<string, string> = {
  account: "Finance Unit (Accounting)",
  accounts: "Finance Unit (Accounting)",
  accounting: "Finance Unit (Accounting)",
  child: "Children Unit",
  children: "Children Unit",
  "children church": "Children Unit",
  childrens: "Children Unit",
  choir: "Music Unit",
  finance: "Finance Unit (Accounting)",
  "finance accounting": "Finance Unit (Accounting)",
  media: "Media Unit",
  music: "Music Unit",
  prayer: "Prayer Unit",
  protocol: "Protocol Unit",
  sound: "Technical/Sound Unit",
  tech: "Technical/Sound Unit",
  technical: "Technical/Sound Unit",
  "technical sound": "Technical/Sound Unit",
  usher: "Ushering Unit",
  ushering: "Ushering Unit",
  ushers: "Ushering Unit",
  welfare: "Welfare Unit",
  worship: "Music Unit",
};

const UNIT_SCHEMA_TOKEN_ALIASES: { schemaName: string; tokens: string[] }[] = [
  {
    schemaName: "Finance Unit (Accounting)",
    tokens: ["account", "accounts", "accounting", "finance"],
  },
  { schemaName: "Technical/Sound Unit", tokens: ["sound", "tech", "technical"] },
  { schemaName: "Children Unit", tokens: ["child", "children", "childrens", "creche"] },
  { schemaName: "Music Unit", tokens: ["choir", "music", "worship"] },
  { schemaName: "Ushering Unit", tokens: ["usher", "ushering", "ushers"] },
  { schemaName: "Media Unit", tokens: ["media"] },
  { schemaName: "Prayer Unit", tokens: ["intercession", "intercessory", "prayer"] },
  { schemaName: "Protocol Unit", tokens: ["protocol"] },
  { schemaName: "Welfare Unit", tokens: ["welfare"] },
];

function findKnownUnitSchemaName(normalizedName: string) {
  const exactName = UNIT_SCHEMA_LOOKUP[normalizedName] ?? UNIT_SCHEMA_ALIASES[normalizedName];
  if (exactName) return exactName;

  const tokens = new Set(normalizedName.split(" ").filter(Boolean));
  const familyGroup = FAMILY_GROUP_NAMES.find((name) => tokens.has(name.toLowerCase()));
  if (familyGroup) return `Family Head - ${familyGroup}`;

  return UNIT_SCHEMA_TOKEN_ALIASES.find((alias) =>
    alias.tokens.some((token) => tokens.has(token))
  )?.schemaName;
}

function createDefaultUnitSchema(unitName: string): UnitSchema {
  const displayName = unitName.trim();

  return createCustomUnitSchema(displayName, [
    {
      id: "summary",
      label: "Report summary",
      type: "textarea",
      required: true,
      placeholder: "Summarize what happened in your unit for this service or event...",
    },
    {
      id: "membersPresent",
      label: "Team members present",
      type: "number",
      required: false,
      placeholder: "e.g. 8",
    },
    {
      id: "activitiesCompleted",
      label: "Activities completed",
      type: "textarea",
      required: false,
      placeholder: "List the main activities, duties, or assignments completed...",
    },
    {
      id: "highlights",
      label: "Highlights",
      type: "textarea",
      required: false,
      placeholder: "Anything noteworthy from the unit...",
    },
    {
      id: "followUpActions",
      label: "Follow-up actions",
      type: "textarea",
      required: false,
      placeholder: "Anything that needs attention before the next service...",
    },
  ]);
}

export function createCustomUnitSchema(
  unitName: string,
  fields: UnitField[],
  sectionTitle = "Unit report"
): UnitSchema {
  return {
    unitName: unitName.trim(),
    sections: [
      {
        title: "Service info",
        fields: SHARED_FIELDS.slice(0, 2),
      },
      {
        title: sectionTitle,
        fields,
      },
      {
        title: "Follow-up",
        fields: SHARED_FIELDS.slice(2),
      },
    ],
  };
}

function hasConfiguredFields(schema?: UnitSchema | null) {
  return Boolean(schema?.sections?.some((section) => section.fields.length > 0));
}

export function getUnitSchema(unitName: string, configuredSchema?: UnitSchema | null): UnitSchema | null {
  const trimmedName = unitName.trim();
  if (!trimmedName) return null;

  const normalizedName = normalizeUnitName(trimmedName);
  const schemaName = findKnownUnitSchemaName(normalizedName);

  if (schemaName) {
    return UNIT_SCHEMAS[schemaName] ?? createDefaultUnitSchema(trimmedName);
  }

  if (configuredSchema && hasConfiguredFields(configuredSchema)) {
    return {
      ...configuredSchema,
      unitName: configuredSchema.unitName?.trim() || trimmedName,
    };
  }

  return createDefaultUnitSchema(trimmedName);
}

// ── Helper: get all unit names ─────────────────────────
export const ALL_UNIT_NAMES = Object.keys(UNIT_SCHEMAS);
