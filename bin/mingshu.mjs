#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { parseArgs } from "node:util";
import { capabilities, CliError, LOCALES, MAX_INPUT_BYTES, validateInput, websiteLinks } from "../src/contract.mjs";
import { apiOrigin, requestApi } from "../src/client.mjs";

const HELP = `Mingshu CLI — Destiny Book / 个人命书

mingshu capabilities --json           Discover commands and input rules
mingshu example --json                Print fictional sample birth input
mingshu validate --input birth.json   Validate input locally (no network)
mingshu locations --query Shanghai --locale en --json
mingshu chart --input birth.json --json
mingshu chart --input - --json        Read JSON from stdin
mingshu doctor --json                 Check the remote API (no birth data)
mingshu skills                       Print the bundled SKILL.md
mingshu website --locale zh-CN        Print website links; no browser opened

Options: --origin https://mingshu.help (or MINGSHU_API_ORIGIN), --json, --help
Chart/locations/doctor use the network. Chart sends your birth input to the
selected origin. No local archive, login, payment or AI request is created.
API error messages and schema use English; chart display follows input.locale.
`;

async function readInput(path) {
  if (!path) throw new CliError("INPUT_REQUIRED", "Use --input birth.json or --input -.");
  let raw;
  if (path === "-") {
    if (process.stdin.isTTY) throw new CliError("INPUT_REQUIRED", "Pipe JSON to stdin or use an input file.");
    const chunks = []; let size = 0;
    for await (const chunk of process.stdin) {
      size += chunk.length;
      if (size > MAX_INPUT_BYTES) throw new CliError("INPUT_TOO_LARGE", "Input exceeds 4096 bytes.");
      chunks.push(chunk);
    }
    raw = Buffer.concat(chunks).toString("utf8");
  } else {
    try {
      const { open } = await import("node:fs/promises");
      const file = await open(path, "r");
      try {
        const buffer = Buffer.alloc(MAX_INPUT_BYTES + 1);
        const { bytesRead } = await file.read(buffer, 0, buffer.length, 0);
        if (bytesRead > MAX_INPUT_BYTES) throw new CliError("INPUT_TOO_LARGE", "Input exceeds 4096 bytes.");
        raw = buffer.subarray(0, bytesRead).toString("utf8");
      } finally { await file.close(); }
    } catch (error) {
      if (error instanceof CliError) throw error;
      throw new CliError("INPUT_UNREADABLE", "Could not read the input file.");
    }
  }
  try { return JSON.parse(raw.replace(/^\uFEFF/, "")); } catch { throw new CliError("INVALID_JSON", "Input must contain one valid JSON object."); }
}

async function main() {
  const { values, positionals } = parseArgs({ options: {
    json: { type: "boolean" }, help: { type: "boolean" }, input: { type: "string" },
    origin: { type: "string" }, query: { type: "string" }, locale: { type: "string" },
  }, allowPositionals: true, strict: true });
  if (values.help || !positionals.length) { process.stdout.write(HELP); return; }
  if (positionals.length !== 1) throw new CliError("INVALID_COMMAND", "Use one command. Run mingshu --help.");
  const command = positionals[0];
  const optionsByCommand = {
    capabilities: [], example: [], skills: [], website: ["locale"],
    validate: ["input"], chart: ["input", "origin"],
    locations: ["query", "locale", "origin"], doctor: ["origin"],
  };
  if (!optionsByCommand[command]) throw new CliError("INVALID_COMMAND", "Unknown command. Run mingshu --help.");
  for (const option of Object.keys(values)) if (!["json", "help", ...optionsByCommand[command]].includes(option)) throw new CliError("INVALID_OPTION", `--${option} is not supported by ${command}.`);
  const locale = values.locale || "zh-CN";
  if (!LOCALES.includes(locale)) throw new CliError("INVALID_LOCALE", "Unsupported locale. Run mingshu capabilities.");
  let result;
  if (command === "capabilities") result = { ok: true, ...capabilities() };
  if (command === "example") result = JSON.parse(await readFile(new URL("../examples/birth.json", import.meta.url), "utf8"));
  if (command === "website") result = { ok: true, links: websiteLinks(locale) };
  if (command === "skills") {
    const content = await readFile(new URL("../skills/mingshu-bazi/SKILL.md", import.meta.url), "utf8");
    if (!values.json) { process.stdout.write(content); return; }
    result = { ok: true, name: "mingshu-bazi", content };
  }
  if (command === "validate" || command === "chart") {
    const input = validateInput(await readInput(values.input));
    if (command === "validate") result = { ok: true, valid: true, validation: "local_schema_only", note: "Lunar dates and selected places are validated by the service." };
    else {
      result = await requestApi(apiOrigin(values.origin || process.env.MINGSHU_API_ORIGIN), "/api/v1/chart", { body: input, locale: input.locale });
      if (result?.apiVersion !== "1" || !result?.facts?.pillars || !result?.display?.pillars) throw new CliError("INVALID_RESPONSE", "The service returned an incompatible chart response.");
    }
  }
  if (command === "doctor") {
    const origin = apiOrigin(values.origin || process.env.MINGSHU_API_ORIGIN);
    const remote = await requestApi(origin, "/api/v1/capabilities");
    if (remote?.apiVersion !== "1" || remote?.ok !== true) throw new CliError("INCOMPATIBLE_API", "The origin does not provide API version 1.");
    result = { ok: true, origin, node: process.versions.node, apiVersion: remote.apiVersion, note: "Discovery is reachable; chart runtime and place availability are checked on each chart request." };
  }
  if (command === "locations") {
    if (!values.query?.trim() || values.query.length > 120) throw new CliError("QUERY_REQUIRED", "Use --query with a place name, up to 120 characters.");
    result = await requestApi(apiOrigin(values.origin || process.env.MINGSHU_API_ORIGIN), `/api/locations?q=${encodeURIComponent(values.query)}`, { locale });
    if (!Array.isArray(result?.results)) throw new CliError("INVALID_RESPONSE", "The service returned incompatible location results.");
  }
  if (command === "chart" && !values.json) {
    const brief = Array.isArray(result.display?.brief) && result.display.brief.length
      ? result.display.brief
      : [result.display.dayMaster, ...result.display.pillars.map(p => `${p.position}  ${p.ganZhi}  ${p.stemGod}`)];
    process.stdout.write(`${[...brief, result.links.workspace].join("\n")}\n`);
    return;
  }
  process.stdout.write(JSON.stringify(result, null, values.json ? undefined : 2) + "\n");
}

main().catch(error => {
  const failure = { ok: false, error: { code: error.code || "CLI_ERROR", message: error instanceof CliError ? error.message : "Invalid command options or an unexpected CLI failure. Run mingshu --help.", ...(error.details ? { details: error.details } : {}) } };
  process.stdout.write(JSON.stringify(failure) + "\n");
  process.exitCode = 1;
});
