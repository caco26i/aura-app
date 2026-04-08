/**
 * Production: static bearer must not be configured alongside AURA_API_BFF_JWT_SECRET.
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { after, describe, test } from 'node:test';
import request from 'supertest';

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aura-prod-jwt-only-'));
const auditPath = path.join(tmpDir, 'audit.log');

process.env.NODE_ENV = 'production';
process.env.AURA_API_BEARER_TOKEN = 'static-must-not-coexist-in-prod';
process.env.AURA_API_BFF_JWT_SECRET = 'integration-jwt-bff-secret-32chars-minimum!!';
process.env.AURA_API_SKIP_LISTEN = '1';
process.env.AUDIT_LOG_PATH = auditPath;
process.env.AURA_API_JOURNEY_STORE = 'memory';

const { app } = await import('../src/index.js');

describe('Production JWT-only API config', () => {
  after(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('GET /ready is not_ready when static bearer and BFF JWT secret both set', async () => {
    const res = await request(app).get('/ready').expect(503);
    assert.equal(res.body.ok, false);
    assert.equal(res.body.ready, false);
    assert.equal(res.body.error, 'not_ready');
    assert.match(String(res.body.detail), /NODE_ENV=production/);
  });

  test('POST /v1/journeys returns server_misconfigured (no static fallback)', async () => {
    const res = await request(app)
      .post('/v1/journeys')
      .set('Authorization', 'Bearer static-must-not-coexist-in-prod')
      .send({})
      .expect(503);
    assert.equal(res.body.error, 'server_misconfigured');
    assert.match(String(res.body.detail), /NODE_ENV=production/);
  });
});
