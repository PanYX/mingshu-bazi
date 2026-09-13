import test from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import { validateInput } from "../src/contract.mjs";
import { apiOrigin } from "../src/client.mjs";

const exec = promisify(execFile);
const bin = fileURLToPath(new URL("../bin/mingshu.mjs", import.meta.url));
const example = fileURLToPath(new URL("../examples/birth.json", import.meta.url));
const run = (...args) => exec(process.execPath, [bin, ...args]);

test("offline discovery and example are executable without installed dependencies", async () => {
  const { stdout } = await run("capabilities", "--json");
  assert.equal(stdout.trim().split("\n").length, 1);
  assert.equal(JSON.parse(stdout).apiVersion, "1");
  const sample = JSON.parse((await run("example", "--json")).stdout);
  assert.equal(validateInput(sample).placeId, "geonames:1796236");
  const validated = JSON.parse((await run("validate", "--input", example, "--json")).stdout);
  assert.equal(validated.valid, true);
  assert.equal(validated.validation, "local_schema_only");
  assert.equal(JSON.parse((await run("skills", "--json")).stdout).name, "mingshu-bazi");
});

test("input errors cannot silently select a calendar, noon, or time mode", async () => {
  const sample = JSON.parse((await run("example", "--json")).stdout);
  for (const patch of [{ birthTime: "" }, { birthDate: "2025-02-30" }, { birthCalendar: undefined }, { gender: "unknown" }, { timeMode: "clock" }, { birthLeapMonth: "false" }, { locale: "fr" }, { birthLocation: {} }]) {
    assert.throws(() => validateInput({ ...sample, ...patch }), { code: "INVALID_INPUT" });
  }
  const { placeId, ...clock } = sample;
  assert.equal(validateInput({ ...clock, timeMode: "clock", birthTime: "00:00" }).birthTime, "00:00");
  assert.throws(() => validateInput({ ...sample, birthCalendar: "lunar" }), { code: "INVALID_INPUT" });
});

test("reject unsafe origins and accidental unsupported flags", async () => {
  for (const origin of ["http://example.com", "https://user:secret@example.com", "https://example.com/private", "https://example.com/?key=x"]) assert.throws(() => apiOrigin(origin));
  assert.equal(apiOrigin("http://127.0.0.1:3000"), "http://127.0.0.1:3000");
  await assert.rejects(run("chart", "--input", example, "--locale", "en", "--json"), error => {
    assert.equal(JSON.parse(error.stdout).error.code, "INVALID_OPTION");
    return true;
  });
});

test("CLI transports JSON, handles limits without retries, and refuses redirects", async t => {
  let calls = 0; let mode = "success";
  const server = createServer(async (req, res) => {
    calls++;
    assert.equal(req.url, "/api/v1/chart");
    assert.equal(req.method, "POST");
    let body = "";
    for await (const chunk of req) body += chunk;
    assert.equal(JSON.parse(body).birthTime, "21:10");
    assert.equal(req.headers["x-locale"], "zh-CN");
    assert.equal(req.headers.cookie, undefined);
    if (mode === "redirect") { res.writeHead(307, { Location: "/capture" }); res.end(); return; }
    res.setHeader("Content-Type", "application/json");
    if (mode === "limited") { res.writeHead(429, { "Retry-After": "60" }); res.end(JSON.stringify({ ok: false, error: { code: "RATE_LIMITED", message: "Wait." } })); return; }
    res.end(JSON.stringify({ ok: true, apiVersion: "1", facts: { pillars: [] }, display: { pillars: [] } }));
  });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise(resolve => { server.closeAllConnections(); server.close(resolve); }));
  const origin = `http://127.0.0.1:${server.address().port}`;
  assert.equal(JSON.parse((await run("chart", "--input", example, "--origin", origin, "--json")).stdout).ok, true);
  mode = "limited";
  await assert.rejects(run("chart", "--input", example, "--origin", origin, "--json"), error => {
    const failure = JSON.parse(error.stdout);
    assert.equal(failure.error.code, "RATE_LIMITED");
    assert.equal(failure.error.details.retryAfter, "60");
    return true;
  });
  mode = "redirect";
  await assert.rejects(run("chart", "--input", example, "--origin", origin, "--json"), error => JSON.parse(error.stdout).error.code === "CONNECTION_FAILED");
  assert.equal(calls, 3);
});
