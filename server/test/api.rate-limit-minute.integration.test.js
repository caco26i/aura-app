/**
 * Minute-window rate limiter coverage (isolated import — env must be set before loading `../src/index.js`).
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { after, describe, test } from 'node:test';
import request from 'supertest';

const TOKEN = 'integration-test-bearer-token-minute-rl';
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aura-api-minute-rl-'));
const auditPath = path.join(tmpDir, 'audit.log');

process.env.AURA_API_BEARER_TOKEN = TOKEN;
process.env.AURA_API_SKIP_LISTEN = '1';
process.env.AUDIT_LOG_PATH = auditPath;
process.env.AURA_API_RATE_LIMIT_JOURNEY_MAX = '5';
process.env.AURA_API_RATE_LIMIT_GLOBAL_MAX = '9999';

const { app } = await import('../src/index.js');

const bearer = { Authorization: `Bearer ${TOKEN}` };

describe('Aura API minute-window rate limits', () => {
  after(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('POST /v1/journeys returns rate_limited after journey minute cap with audit line', async () => {
    for (let i = 0; i < 5; i += 1) {
      await request(app).post('/v1/journeys').set(bearer).send({}).expect(201);
    }
    const limited = await request(app).post('/v1/journeys').set(bearer).send({}).expect(429);
    assert.equal(limited.body.ok, false);
    assert.equal(limited.body.error, 'rate_limited');
    assert.ok(typeof limited.body.detail === 'string');
    const log = fs.readFileSync(auditPath, 'utf8');
    assert.match(log, /"type":"audit\.rate_limited"/);
    assert.match(log, /"route":"journeys-create"/);
  });
});
