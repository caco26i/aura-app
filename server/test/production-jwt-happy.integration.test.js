/**
 * Production BFF-first: JWT-only API (no static bearer env) — readiness and journey create.
 */

import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { after, describe, test } from 'node:test';
import request from 'supertest';

const JWT_SECRET = 'integration-jwt-bff-secret-32chars-minimum!!';
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aura-prod-jwt-happy-'));
const auditPath = path.join(tmpDir, 'audit.log');

process.env.NODE_ENV = 'production';
delete process.env.AURA_API_BEARER_TOKEN;
delete process.env.AURA_API_BEARER_TOKEN_ALT;
process.env.AURA_API_BFF_JWT_SECRET = JWT_SECRET;
process.env.AURA_API_SKIP_LISTEN = '1';
process.env.AUDIT_LOG_PATH = auditPath;
process.env.AURA_API_JOURNEY_STORE = 'memory';

const { app } = await import('../src/index.js');

function mintJwt(payload) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${sig}`;
}

function jwtAuth(sub) {
  return {
    Authorization: `Bearer ${mintJwt({
      sub,
      exp: Math.floor(Date.now() / 1000) + 3600,
    })}`,
  };
}

describe('Production JWT-only API (happy path)', () => {
  after(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('GET /ready is ready when only BFF JWT secret is configured', async () => {
    const res = await request(app).get('/ready').expect(200);
    assert.equal(res.body.ok, true);
    assert.equal(res.body.ready, true);
    assert.equal(res.body.service, 'aura-api');
  });

  test('POST /v1/journeys succeeds with valid HS256 access JWT', async () => {
    const res = await request(app).post('/v1/journeys').set(jwtAuth('prod-bff-user-1')).send({}).expect(201);
    assert.equal(res.body.ok, true);
    assert.match(res.body.data.journeyId, /^[0-9a-f-]{36}$/i);
  });

  test('plain static bearer string is rejected when no AURA_API_BEARER_TOKEN', async () => {
    const res = await request(app)
      .post('/v1/journeys')
      .set('Authorization', 'Bearer some-static-secret')
      .send({})
      .expect(403);
    assert.equal(res.body.ok, false);
    assert.equal(res.body.error, 'forbidden');
  });
});
