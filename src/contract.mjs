export const API_VERSION = "1";
export const DEFAULT_ORIGIN = "https://mingshu.help";
export const LOCALES = ["zh-CN", "en", "zh-TW", "zh-HK", "ja-JP"];
export const MAX_INPUT_BYTES = 4096;

export class CliError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.code = code;
    this.details = details;
  }
}

export function validateInput(value) {
  const fail = (field, message) => { throw new CliError("INVALID_INPUT", message, { field }); };
  if (!value || typeof value !== "object" || Array.isArray(value)) fail("input", "Expected a JSON object.");
  const allowed = new Set(["birthDate", "birthTime", "birthCalendar", "birthLeapMonth", "gender", "placeId", "timeMode", "locale"]);
  for (const key of Object.keys(value)) if (!allowed.has(key)) fail(key, "Unknown field. Read the input schema with mingshu capabilities.");
  const input = { ...value };
  if (!LOCALES.includes(input.locale)) fail("locale", "Specify zh-CN, en, zh-TW, zh-HK or ja-JP.");
  if (!["solar", "lunar"].includes(input.birthCalendar)) fail("birthCalendar", "Specify solar or lunar; do not infer the calendar.");
  if (!["male", "female"].includes(input.gender)) fail("gender", "Specify male or female for the traditional Luck Cycle calculation.");
  if (typeof input.birthDate !== "string" || !/^(19|20)\d{2}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(input.birthDate)) fail("birthDate", "Use YYYY-MM-DD between 1900 and 2099.");
  if (typeof input.birthTime !== "string" || !/^([01]\d|2[0-3]):[0-5]\d$/.test(input.birthTime)) fail("birthTime", "Use a known local birth time HH:mm. V1 does not estimate unknown hours.");
  if (input.birthCalendar === "lunar" && typeof input.birthLeapMonth !== "boolean") fail("birthLeapMonth", "For lunar dates, explicitly specify true or false.");
  if (input.birthLeapMonth !== undefined && typeof input.birthLeapMonth !== "boolean") fail("birthLeapMonth", "Expected a boolean.");
  if (input.birthCalendar === "solar" && input.birthLeapMonth === true) fail("birthLeapMonth", "A solar date cannot use a lunar leap month.");
  input.birthLeapMonth ??= false;
  if (input.birthCalendar === "solar") {
    const date = new Date(`${input.birthDate}T00:00:00Z`);
    if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== input.birthDate) fail("birthDate", "Invalid Gregorian date.");
  }
  if (!["true_solar", "clock"].includes(input.timeMode)) fail("timeMode", "Explicitly select true_solar or clock.");
  if (input.timeMode === "true_solar" && (typeof input.placeId !== "string" || !/^geonames:[1-9]\d{0,11}$/.test(input.placeId))) fail("placeId", "Select a GeoNames place ID using mingshu locations.");
  if (input.timeMode === "clock" && input.placeId !== undefined) fail("placeId", "Clock mode does not use a location. Remove placeId or select true_solar.");
  return input;
}

export function websiteLinks(locale = "zh-CN", source = "cli") {
  const prefix = locale === "zh-CN" ? "" : `/${locale}`;
  const query = `utm_source=${source}&utm_medium=agent&utm_campaign=mingshu_cli`;
  return {
    home: `${DEFAULT_ORIGIN}${prefix}/?${query}`,
    workspace: `${DEFAULT_ORIGIN}${prefix}/workspace?start=form&${query}`,
    guide: `${DEFAULT_ORIGIN}${prefix}/tools/ai?${query}`,
  };
}

export function capabilities() {
  return {
    apiVersion: API_VERSION,
    commands: ["capabilities", "doctor", "example", "validate", "locations", "chart", "skills", "website"],
    endpoints: { chart: "/api/v1/chart", capabilities: "/api/v1/capabilities", locations: "/api/locations" },
    locales: LOCALES,
    input: {
      required: ["birthDate", "birthTime", "birthCalendar", "gender", "timeMode", "locale"],
      birthDate: "YYYY-MM-DD, 1900–2099; actual solar/lunar date is checked by the service",
      birthTime: "HH:mm, known local civil time",
      birthCalendar: ["solar", "lunar"],
      birthLeapMonth: "boolean; required for lunar",
      gender: ["male", "female"],
      timeMode: ["true_solar", "clock"],
      placeId: "GeoNames ID from locations; required only for true_solar",
      additionalProperties: false,
    },
    effects: { chart: "Sends birth input to the API; no account, report generation, payment or saved chart." },
    sections: {
      facts: "Four Pillars, Day Master and Full-Stem Ten Gods (fixed Chinese enum values).",
      derived: "Five-Element and Ten-God energy weights plus the Luck Cycle window covered by decadeWindow.",
      judgments: "This engine\u2019s own determinations in the request locale: pattern, Day Master strength with supporting evidence, Useful/Favorable/Unfavorable Elements, seasonal balance, circulation, wealth stars and vault, carrying capacity, benefactors, career palace, Shensha, branch relations and risk profile.",
      display: "Localized labels plus display.brief, a ready-to-print summary; it never carries birth data.",
    },
    limitations: [
      "Known birth time required",
      "Clock mode does not resolve a geographic instant",
      "Pattern, strength and Useful Element come from this engine\u2019s tables and may differ from another school",
      "No prose reading, stored profile or paid report is returned",
    ],
    links: websiteLinks(),
  };
}
