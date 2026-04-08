/**
 * Process-boundary continuity: two separate Node processes share one SQLite journey store.
 */

import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { after, describe, test } from 'node:test';

const phaseScript = fileURLToPath(new URL('./journey-restart-phase.mjs', import.meta.url));
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aura-journey-http-restart-'));
const auditPath = path.join(tmpDir, 'audit.log');
const sqlitePath = path.join(tmpDir, 'journeys.sqlite');
const token = 'restart-http-test-bearer';

function baseEnv() {
  const env = { ...process.env };
  env.AURA_API_BEARER_TOKEN = token;
  env.AURA_API_SKIP_LISTEN = '1';
  env.AUDIT_LOG_PATH = auditPath;
  env.AURA_API_JOURNEY_STORE_SQLITE_PATH = sqlitePath;
  env.AURA_API_JOURNEY_STORE = 'auto';
  env.AURA_RESTART_TEST_TOKEN = token;
  delete env.AURA_API_BFF_JWT_SECRET;
  delete env.AURA_API_BEARER_TOKEN_ALT;
  delete env.AURA_API_JOURNEY_STORE_JSONL_PATH;
  delete env.AURA_API_JOURNEY_SQLITE_PATH;
  delete env.AURA_API_JOURNEY_JSONL_PATH;
  return env;
}

describe('journey HTTP restart continuity', () => {
  after(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('create + location-share, new process: im-safe succeeds on same journeyId', () => {
    const envCreate = { ...baseEnv(), AURA_RESTART_PHASE: 'create' };
    const r1 = spawnSync(process.execPath, [phaseScript], {
      env: envCreate,
      encoding: 'utf8',
      cwd: path.dirname(phaseScript),
    });
    if (r1.status !== 0) {
      assert.fail(`phase create failed: ${r1.stderr || r1.stdout}`);
    }
    const journeyId = r1.stdout.trim();
    assert.match(journeyId, /^[0-9a-f-]{36}$/i);

    const envShare = { ...baseEnv(), AURA_RESTART_PHASE: 'location-share' };
    const rShare = spawnSync(process.execPath, [phaseScript, journeyId], {
      env: envShare,
      encoding: 'utf8',
      cwd: path.dirname(phaseScript),
    });
    if (rShare.status !== 0) {
      assert.fail(`phase location-share failed: ${rShare.stderr || rShare.stdout}`);
    }
    assert.equal(rShare.stdout.trim(), 'ok');

    const envImSafe = { ...baseEnv(), AURA_RESTART_PHASE: 'im-safe' };
    const r2 = spawnSync(process.execPath, [phaseScript, journeyId], {
      env: envImSafe,
      encoding: 'utf8',
      cwd: path.dirname(phaseScript),
    });
    if (r2.status !== 0) {
      assert.fail(`phase im-safe failed: ${r2.stderr || r2.stdout}`);
    }
    assert.equal(r2.stdout.trim(), 'ok');
  });
});
