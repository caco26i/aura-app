import assert from 'node:assert';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { createAuditWriter } from '../src/auditWriter.js';

test('audit writer append then reopen writes to fresh file at same path', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'aura-audit-'));
  const logPath = path.join(dir, 'audit.log');
  let envPath = logPath;
  const w = createAuditWriter({ getLogPath: () => envPath });

  w.appendJson({ n: 1 });
  assert.strictEqual(fs.readFileSync(logPath, 'utf8').trim(), '{"n":1}');

  const rotated = path.join(dir, 'audit.log.1');
  fs.renameSync(logPath, rotated);
  fs.writeFileSync(logPath, '', 'utf8');

  w.reopenAuditLog();
  w.appendJson({ n: 2 });

  assert.strictEqual(fs.readFileSync(rotated, 'utf8').trim(), '{"n":1}');
  assert.strictEqual(fs.readFileSync(logPath, 'utf8').trim(), '{"n":2}');
});

test('audit writer follows AUDIT_LOG_PATH change without reopen signal', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'aura-audit-'));
  const a = path.join(dir, 'a.log');
  const b = path.join(dir, 'b.log');
  let target = a;
  const w = createAuditWriter({ getLogPath: () => target });

  w.appendJson({ file: 'a' });
  target = b;
  w.appendJson({ file: 'b' });

  assert.strictEqual(fs.readFileSync(a, 'utf8').trim(), '{"file":"a"}');
  assert.strictEqual(fs.readFileSync(b, 'utf8').trim(), '{"file":"b"}');
});

test('each append line is a single write (one NDJSON line)', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'aura-audit-'));
  const logPath = path.join(dir, 'line.log');
  const w = createAuditWriter({ getLogPath: () => logPath });
  w.appendJson({ ok: true });
  const lines = fs.readFileSync(logPath, 'utf8').split('\n').filter(Boolean);
  assert.strictEqual(lines.length, 1);
  assert.deepStrictEqual(JSON.parse(lines[0]), { ok: true });
});
