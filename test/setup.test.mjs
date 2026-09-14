import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, readdir, writeFile, rm, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createServer } from 'node:http';
import { installSkill, skillDirectory } from '../src/setup.mjs';

const exec = promisify(execFile);
const bin = fileURLToPath(new URL('../bin/mingshu.mjs', import.meta.url));
const source = await readFile(new URL('../skills/mingshu-bazi/SKILL.md', import.meta.url), 'utf8');
async function fixture(t) {
  const dir = await mkdtemp(join(tmpdir(), 'mingshu-setup-test-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  return dir;
}
const run = (args, env = {}) => exec(process.execPath, [bin, ...args], { env: { ...process.env, MINGSHU_API_ORIGIN: '', ...env }, timeout: 10000 });

test('host targets are explicit and custom directories contain the named Skill', () => {
  const home = join(tmpdir(), 'example-home');
  assert.equal(skillDirectory({ agent: 'codex' }, home), join(home, '.agents', 'skills', 'mingshu-bazi'));
  assert.equal(skillDirectory({ agent: 'claude' }, home), join(home, '.claude', 'skills', 'mingshu-bazi'));
  assert.equal(skillDirectory({ dir: home }), join(home, 'mingshu-bazi'));
  for (const value of [{ agent: 'all' }, {}, { dir: '' }, { dir: '  ' }, { agent: 'codex', dir: home }]) assert.throws(() => skillDirectory(value));
});

test('installation is idempotent and never overwrites custom content without a backup', async t => {
  const root = await fixture(t);
  const dir = join(root, '技能 with spaces', 'mingshu-bazi');
  const first = await installSkill(dir);
  assert.equal(first.status, 'installed');
  assert.equal(await readFile(first.path, 'utf8'), source);
  assert.equal((await installSkill(dir)).status, 'unchanged');
  await writeFile(first.path, 'my customized instructions');
  await writeFile(join(dir, 'notes.txt'), 'keep me');
  await assert.rejects(installSkill(dir), { code: 'SKILL_CONFLICT' });
  assert.equal(await readFile(first.path, 'utf8'), 'my customized instructions');
  const updated = await installSkill(dir, { force: true });
  assert.equal(updated.status, 'updated');
  assert.equal(await readFile(updated.backup, 'utf8'), 'my customized instructions');
  assert.equal(await readFile(first.path, 'utf8'), source);
  assert.equal(await readFile(join(dir, 'notes.txt'), 'utf8'), 'keep me');
  assert.equal((await readdir(dir)).some(name => name.endsWith('.tmp')), false);
});

test('a directory masquerading as SKILL.md is refused even with force', async t => {
  const root = await fixture(t);
  await mkdir(join(root, 'SKILL.md'));
  await assert.rejects(installSkill(root, { force: true }), { code: 'UNSAFE_TARGET' });
});

test('linked Skill directories cannot overwrite their destination', async t => {
  const root = await fixture(t);
  const actual = join(root, 'actual');
  const linked = join(root, 'linked');
  await mkdir(actual);
  await writeFile(join(actual, 'SKILL.md'), 'keep');
  await symlink(actual, linked, process.platform === 'win32' ? 'junction' : 'dir');
  await assert.rejects(installSkill(linked, { force: true }), { code: 'UNSAFE_TARGET' });
  assert.equal(await readFile(join(actual, 'SKILL.md'), 'utf8'), 'keep');
});

test('missing target fails promptly with actionable single-line JSON and no prompt', async () => {
  for (const args of [['setup'], ['setup', '--json']]) {
    await assert.rejects(run(args), error => {
      assert.equal(JSON.parse(error.stdout).error.code, 'SETUP_TARGET_REQUIRED');
      assert.equal(error.stdout.trim().split('\n').length, 1);
      assert.equal(error.stderr, '');
      return true;
    });
  }
});

test('CLI supports offline setup in a Unicode directory without checking the network', async t => {
  const root = await fixture(t);
  const { stdout, stderr } = await run(['setup', '--dir', join(root, '个人 Skill'), '--skip-check', '--json'], { MINGSHU_API_ORIGIN: 'http://127.0.0.1:1' });
  const result = JSON.parse(stdout);
  assert.equal(result.ok, true);
  assert.equal(result.connection.status, 'skipped');
  assert.equal(result.installation.status, 'installed');
  assert.equal(stderr, '');
  assert.equal(stdout.trim().split('\n').length, 1);
  assert.equal(await readFile(result.installation.path, 'utf8'), source);
});

test('setup checks discovery only and preserves successful installation on network failures', async t => {
  const root = await fixture(t);
  let calls = 0;
  let compatible = true;
  const server = createServer(async (req, res) => {
    calls++;
    assert.equal(req.url, '/api/v1/capabilities');
    assert.equal(req.method, 'GET');
    let body = '';
    for await (const chunk of req) body += chunk;
    assert.equal(body, '');
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ ok: true, apiVersion: compatible ? '1' : '2' }));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => { server.closeAllConnections(); server.close(resolve); }));
  const env = { MINGSHU_API_ORIGIN: `http://127.0.0.1:${server.address().port}` };
  const args = ['setup', '--dir', root, '--json'];
  assert.equal(JSON.parse((await run(args, env)).stdout).connection.status, 'reachable');
  compatible = false;
  await assert.rejects(run(args, env), error => {
    const result = JSON.parse(error.stdout);
    assert.equal(result.ok, false);
    assert.equal(result.installation.status, 'unchanged');
    assert.equal(result.connection.error.code, 'INCOMPATIBLE_API');
    return true;
  });
  assert.equal(calls, 2);
  assert.equal(await readFile(join(root, 'mingshu-bazi', 'SKILL.md'), 'utf8'), source);
});

test('invalid origin and mutually exclusive targets fail before creating files', async t => {
  const root = await fixture(t);
  await assert.rejects(run(['setup', '--dir', root, '--skip-check', '--json'], { MINGSHU_API_ORIGIN: 'http://unsafe.example' }), error => JSON.parse(error.stdout).error.code === 'INVALID_ORIGIN');
  await assert.rejects(run(['setup', '--agent', 'codex', '--dir', root, '--json']), error => JSON.parse(error.stdout).error.code === 'INVALID_OPTION');
  assert.deepEqual(await readdir(root), []);
});

test('version and CLI discovery include setup without changing the API version', async () => {
  const version = JSON.parse((await run(['version', '--json'])).stdout);
  assert.equal(version.version, '0.2.0');
  const discovery = JSON.parse((await run(['capabilities', '--json'])).stdout);
  assert.equal(discovery.apiVersion, '1');
  assert.ok(discovery.commands.includes('setup'));
  assert.deepEqual(discovery.setup.agents, ['codex', 'claude']);
});

test('interactive selection retries invalid input and accepts a custom directory', async () => {
  const { PassThrough } = await import('node:stream');
  const { chooseTarget } = await import('../src/setup.mjs');
  const input = new PassThrough();
  const output = new PassThrough();
  input.isTTY = output.isTTY = true;
  let step = 0;
  output.on('data', chunk => {
    const text = chunk.toString();
    if (text.includes('输入 q 退出')) setImmediate(() => input.write(step++ === 0 ? 'invalid\n' : '3\n'));
    if (text.includes('请输入该工具的 Skill')) setImmediate(() => input.write('D:/我的 Skills\n'));
  });
  const selected = await chooseTarget({}, { input, output });
  assert.equal(selected.dir, 'D:/我的 Skills');
  input.destroy(); output.destroy();
});

test('interactive cancellation via q or Ctrl+C does not hang or report success', async () => {
  const { PassThrough } = await import('node:stream');
  const { chooseTarget } = await import('../src/setup.mjs');
  for (const answer of ['q\n', '\u0003']) {
    const input = new PassThrough();
    const output = new PassThrough();
    input.isTTY = output.isTTY = true;
    output.on('data', chunk => {
      if (chunk.toString().includes('输入 q 退出')) setImmediate(() => input.write(answer));
    });
    await assert.rejects(chooseTarget({}, { input, output }), { code: 'SETUP_CANCELLED' });
    input.destroy(); output.destroy();
  }
});
