/**
 * Per-IP minute-window limiter on GET /health, /ready, and opt-in /metrics.
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { after, describe, test } from 'node:test';
import request from 'supertest';

const TOKEN = 'integration-test-bearer-token-read-rl';
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aura-api-read-rl-'));
const auditPath = path.join(tmpDir, 'audit.log');

process.env.AURA_API_BEARER_TOKEN = TOKEN;
process.env.AURA_API_SKIP_LISTEN = '1';
process.env.AUDIT_LOG_PATH = auditPath;
process.env.AURA_API_JOURNEY_STORE = 'memory';
process.env.AURA_API_RATE_LIMIT_READ_MAX = '3';

const { app } = await import('../src/index.js');

describe('Aura API read-path rate limits', () => {
  after(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('GET /health returns rate_limited after read cap with audit line', async () => {
    for (let i = 0; i < 3; i += 1) {
      await request(app).get('/health').expect(200);
    }
    const limited = await request(app).get('/health').expect(429);
    assert.equal(limited.body.ok, false);
    assert.equal(limited.body.error, 'rate_limited');
    const log = fs.readFileSync(auditPath, 'utf8');
    assert.match(log, /"type":"audit\.rate_limited"/);
    assert.match(log, /"route":"health"/);
  });
});
