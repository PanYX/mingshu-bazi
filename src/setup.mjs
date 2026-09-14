import { constants } from "node:fs";
import { copyFile, lstat, mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { randomUUID } from "node:crypto";
import { createInterface } from "node:readline/promises";
import { CliError } from "./contract.mjs";
import { apiOrigin, requestApi } from "./client.mjs";

export const SETUP_AGENTS = ["codex", "claude"];
const source = new URL("../skills/mingshu-bazi/SKILL.md", import.meta.url);

export function skillDirectory({ agent, dir }, home = homedir()) {
  if (agent && dir) throw new CliError("INVALID_OPTION", "Choose --agent or --dir, not both.");
  if (dir !== undefined) {
    if (!dir.trim()) throw new CliError("INVALID_DIRECTORY", "--dir must name the host's skills directory.");
    return join(resolve(dir), "mingshu-bazi");
  }
  if (!SETUP_AGENTS.includes(agent)) throw new CliError("INVALID_AGENT", "Use --agent codex, --agent claude, or --dir <skills-directory>.");
  return join(home, agent === "codex" ? ".agents" : ".claude", "skills", "mingshu-bazi");
}

async function stat(path) {
  try { return await lstat(path); } catch (error) { if (error.code === "ENOENT") return null; throw error; }
}

export async function installSkill(directory, { force = false } = {}) {
  const content = await readFile(source, "utf8");
  const file = join(directory, "SKILL.md");
  let temporary;
  try {
    const folder = await stat(directory);
    if (folder && (!folder.isDirectory() || folder.isSymbolicLink())) throw new CliError("UNSAFE_TARGET", "The skill destination must be a regular directory, not a link.", { path: directory });
    await mkdir(directory, { recursive: true });
    const existing = await stat(file);
    if (existing && (!existing.isFile() || existing.isSymbolicLink())) throw new CliError("UNSAFE_TARGET", "SKILL.md must be a regular file, not a link.", { path: file });
    if (!existing) {
      await writeFile(file, content, { encoding: "utf8", flag: "wx" });
      return { status: "installed", path: file };
    }
    if (await readFile(file, "utf8") === content) return { status: "unchanged", path: file };
    if (!force) throw new CliError("SKILL_CONFLICT", "An existing Skill differs. Keep it, or rerun setup with --force to back it up before replacing it.", { path: file });
    const backup = join(directory, `SKILL.md.backup-${randomUUID()}`);
    await copyFile(file, backup, constants.COPYFILE_EXCL);
    temporary = join(directory, `.SKILL-${randomUUID()}.tmp`);
    await writeFile(temporary, content, { encoding: "utf8", flag: "wx" });
    await rename(temporary, file);
    temporary = undefined;
    return { status: "updated", path: file, backup };
  } catch (error) {
    if (error instanceof CliError) throw error;
    throw new CliError("INSTALL_FAILED", "Could not install the Skill. Check directory permissions and rerun setup; existing files are not intentionally removed.", { path: file, cause: error.code });
  } finally {
    if (temporary) await unlink(temporary).catch(() => {});
  }
}

export async function checkConnection(origin) {
  const remote = await requestApi(origin, "/api/v1/capabilities");
  if (remote?.apiVersion !== "1" || remote?.ok !== true) throw new CliError("INCOMPATIBLE_API", "The origin does not provide API version 1.");
  return { ok: true, origin, node: process.versions.node, apiVersion: remote.apiVersion, note: "Discovery is reachable; chart runtime and place availability are checked on each chart request." };
}

export async function chooseTarget(values, { input = process.stdin, output = process.stderr } = {}) {
  if (values.agent !== undefined || values.dir !== undefined) return values;
  if (values.json || !input.isTTY || !output.isTTY) throw new CliError("SETUP_TARGET_REQUIRED", "Run mingshu setup --agent codex, --agent claude, or --dir <skills-directory>. Interactive setup needs a terminal.");
  const prompt = createInterface({ input, output });
  const cancelled = new AbortController();
  prompt.on("close", () => cancelled.abort());
  prompt.on("SIGINT", () => prompt.close());
  try {
    output.write("个人命书 · 接入 AI 助手\n1. Codex\n2. Claude Code\n3. 其他工具（自定义 Skill 目录）\n");
    while (true) {
      const answer = (await prompt.question("请选择 1 / 2 / 3，输入 q 退出： ", { signal: cancelled.signal })).trim().toLowerCase();
      if (answer === "q") throw new CliError("SETUP_CANCELLED", "Setup cancelled; no Skill was installed.");
      if (answer === "1" || answer === "2") return { ...values, agent: answer === "1" ? "codex" : "claude" };
      if (answer === "3") {
        const dir = (await prompt.question("请输入该工具的 Skill 目录（将自动创建 mingshu-bazi 子目录）： ", { signal: cancelled.signal })).trim();
        if (dir) return { ...values, dir };
      }
      output.write("请输入有效选项。\n");
    }
  } catch (error) {
    if (error instanceof CliError) throw error;
    throw new CliError("SETUP_CANCELLED", "Setup cancelled; no Skill was installed.");
  } finally { prompt.close(); }
}

export async function setup(values) {
  const selected = await chooseTarget(values);
  const directory = skillDirectory(selected);
  // Validate the origin before writing, even when the online check is skipped.
  const origin = apiOrigin(process.env.MINGSHU_API_ORIGIN);
  if (!values.json) process.stderr.write(`安装位置：${directory}\n`);
  const installation = await installSkill(directory, { force: values.force });
  let connection = { status: "skipped", origin };
  if (!values["skip-check"]) {
    if (!values.json) process.stderr.write(`检查服务连接：${origin}（不发送出生资料）\n`);
    try { connection = { status: "reachable", ...await checkConnection(origin) }; }
    catch (error) { connection = { status: "failed", origin, error: { code: error.code || "CONNECTION_FAILED", message: error.message } }; }
  }
  const result = { ok: connection.status !== "failed", installation, connection, next: "回到 AI 助手，新开一个对话，说：使用个人命书，帮我排八字。若未识别到 Skill，请重启助手，并确认它能运行 mingshu --help。" };
  if (values.json) process.stdout.write(JSON.stringify(result) + "\n");
  else {
    process.stdout.write(`${installation.status === "unchanged" ? "Skill 已是当前版本" : "Skill 安装完成"}：${installation.path}\n`);
    if (installation.backup) process.stdout.write(`原文件已备份：${installation.backup}\n`);
    if (connection.status === "reachable") process.stdout.write("服务接口连接正常；实际排盘会再检查出生资料和地点。\n");
    if (connection.status === "skipped") process.stdout.write("已跳过联网检查。需要时运行 mingshu doctor --json。\n");
    if (connection.status === "failed") process.stdout.write(`Skill 已保留，但服务检查未通过（${connection.error.code}）。检查网络和 MINGSHU_API_ORIGIN 后运行 mingshu doctor --json，无需重新安装。\n`);
    process.stdout.write(result.next + "\n");
  }
  if (!result.ok) process.exitCode = 1;
  return result;
}
