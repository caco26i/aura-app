/**
 * Optional deploy metadata on /health and /ready (separate module + subprocess for 503 so default tests stay isolated).
 */

import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { after, describe, test } from 'node:test';
import request from 'supertest';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const probeScript = path.join(__dirname, 'ready-503-deploy-probe.mjs');

const TOKEN = 'deploy-meta-test-bearer';
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aura-deploy-meta-'));
const auditPath = path.join(tmpDir, 'audit.log');

process.env.AURA_API_BEARER_TOKEN = TOKEN;
process.env.AURA_API_SKIP_LISTEN = '1';
process.env.AUDIT_LOG_PATH = auditPath;
process.env.AURA_API_JOURNEY_STORE = 'memory';
process.env.AURA_API_DEPLOY_VERSION = '  1.4.2-rc1  ';
process.env.AURA_API_GIT_SHA = 'a1b2c3d4';

const { app } = await import('../src/index.js');

describe('deploy metadata on /health and /ready', () => {
  after(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('GET /health includes trimmed deployVersion and gitSha', async () => {
    const res = await request(app).get('/health').expect(200);
    assert.equal(res.body.ok, true);
    assert.equal(res.body.service, 'aura-api');
    assert.equal(res.body.deployVersion, '1.4.2-rc1');
    assert.equal(res.body.gitSha, 'a1b2c3d4');
  });

  test('GET /health keeps X-Request-Id behavior with X-Correlation-Id', async () => {
    const cid = 'deploy-meta-corr-1';
    const res = await request(app).get('/health').set('X-Correlation-Id', cid).expect(200);
    assert.equal(res.headers['x-request-id'], cid);
  });

  test('GET /ready 200 includes deploy metadata', async () => {
    const res = await request(app).get('/ready').expect(200);
    assert.equal(res.body.ok, true);
    assert.equal(res.body.ready, true);
    assert.equal(res.body.deployVersion, '1.4.2-rc1');
    assert.equal(res.body.gitSha, 'a1b2c3d4');
  });

  test('GET /ready 503 includes deploy metadata in child process', () => {
    const env = { ...process.env };
    delete env.AURA_API_BEARER_TOKEN;
    delete env.AURA_API_BEARER_TOKEN_ALT;
    delete env.AURA_API_BFF_JWT_SECRET;
    env.AURA_API_SKIP_LISTEN = '1';
    env.AURA_API_DEPLOY_VERSION = 'rel-503';
    env.AURA_API_GIT_SHA = 'abc503';

    const r = spawnSync(process.execPath, [probeScript], {
      encoding: 'utf8',
      env,
      cwd: path.join(__dirname, '..'),
    });
    if (r.status !== 0) {
      assert.fail(
        `probe failed (${r.status})\nstdout:\n${r.stdout}\nstderr:\n${r.stderr}`,
      );
    }
  });
});
