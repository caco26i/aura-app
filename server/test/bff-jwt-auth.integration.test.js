/**
 * BFF-shaped HS256 JWTs: same minting as server/bff (mintAccessJwt) vs API verifyBffJwt.
 * Covers mutating routes + readiness read in JWT-only production mode and negative cases.
 */

import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { after, describe, test } from 'node:test';
import request from 'supertest';

import { mintAccessJwt } from '../bff/src/mintAccessJwt.js';

const JWT_SECRET = 'integration-bff-jwt-secret-32chars-min!!';
const JWT_ISS = 'aura-bff';
const JWT_AUD = 'aura-api';

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aura-bff-jwt-contract-'));
const auditPath = path.join(tmpDir, 'audit.log');

process.env.NODE_ENV = 'production';
delete process.env.AURA_API_BEARER_TOKEN;
delete process.env.AURA_API_BEARER_TOKEN_ALT;
process.env.AURA_API_BFF_JWT_SECRET = JWT_SECRET;
process.env.AURA_API_BFF_JWT_ISSUER = JWT_ISS;
process.env.AURA_API_BFF_JWT_AUDIENCE = JWT_AUD;
process.env.AURA_API_SKIP_LISTEN = '1';
process.env.AUDIT_LOG_PATH = auditPath;
process.env.AURA_API_JOURNEY_STORE = 'memory';

const { app } = await import('../src/index.js');

function authFromMint(sub, overrides = {}) {
  const { token } = mintAccessJwt({
    secret: JWT_SECRET,
    sub,
    ttlSeconds: 3600,
    issuer: JWT_ISS,
    audience: JWT_AUD,
    ...overrides,
  });
  return { Authorization: `Bearer ${token}` };
}

/** Valid shape but signed with a different secret than the API. */
function tokenSignedWithWrongSecret(sub) {
  const wrong = 'wrong-secret-but-still-16+chars!!';
  const { token } = mintAccessJwt({
    secret: wrong,
    sub,
    ttlSeconds: 3600,
    issuer: JWT_ISS,
    audience: JWT_AUD,
  });
  return { Authorization: `Bearer ${token}` };
}

function hs256JwtWrongAlgInHeader(sub) {
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(
    JSON.stringify({
      sub,
      exp: Math.floor(Date.now() / 1000) + 3600,
    }),
  ).toString('base64url');
  const sig = createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
  return { Authorization: `Bearer ${header}.${body}.${sig}` };
}

describe('BFF JWT contract (API integration)', () => {
  after(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('GET /ready succeeds in JWT-only production config (read path)', async () => {
    const res = await request(app).get('/ready').expect(200);
    assert.equal(res.body.ready, true);
    assert.equal(res.body.service, 'aura-api');
  });

  test('POST /v1/journeys accepts BFF mintAccessJwt (mutating)', async () => {
    const res = await request(app)
      .post('/v1/journeys')
      .set(authFromMint('google|bff-contract-1'))
      .send({})
      .expect(201);
    assert.equal(res.body.ok, true);
    assert.match(res.body.data.journeyId, /^[0-9a-f-]{36}$/i);
  });

  test('POST /v1/journeys/:id/location-shares accepts same BFF token for journey owner (mutating)', async () => {
    const sub = 'google|bff-contract-share';
    const create = await request(app).post('/v1/journeys').set(authFromMint(sub)).send({}).expect(201);
    const journeyId = create.body.data.journeyId;
    const res = await request(app)
      .post(`/v1/journeys/${journeyId}/location-shares`)
      .set(authFromMint(sub))
      .send({})
      .expect(201);
    assert.equal(res.body.ok, true);
    assert.match(res.body.data.shareId, /^[0-9a-f-]{36}$/i);
  });

  test('wrong HS256 signature → 403 forbidden', async () => {
    const res = await request(app)
      .post('/v1/journeys')
      .set(tokenSignedWithWrongSecret('google|bad-sig'))
      .send({})
      .expect(403);
    assert.equal(res.body.error, 'forbidden');
  });

  test('expired exp → 403 forbidden', async () => {
    const res = await request(app)
      .post('/v1/journeys')
      .set(authFromMint('google|expired', { ttlSeconds: -60 }))
      .send({})
      .expect(403);
    assert.equal(res.body.error, 'forbidden');
  });

  test('wrong iss when API enforces issuer → 403 forbidden', async () => {
    const { token } = mintAccessJwt({
      secret: JWT_SECRET,
      sub: 'google|bad-iss',
      ttlSeconds: 3600,
      issuer: 'not-aura-bff',
      audience: JWT_AUD,
    });
    const res = await request(app)
      .post('/v1/journeys')
      .set('Authorization', `Bearer ${token}`)
      .send({})
      .expect(403);
    assert.equal(res.body.error, 'forbidden');
  });

  test('wrong aud when API enforces audience → 403 forbidden', async () => {
    const { token } = mintAccessJwt({
      secret: JWT_SECRET,
      sub: 'google|bad-aud',
      ttlSeconds: 3600,
      issuer: JWT_ISS,
      audience: 'wrong-api',
    });
    const res = await request(app)
      .post('/v1/journeys')
      .set('Authorization', `Bearer ${token}`)
      .send({})
      .expect(403);
    assert.equal(res.body.error, 'forbidden');
  });

  test('JWT-shaped token with non-HS256 alg in header → 403 forbidden', async () => {
    const res = await request(app)
      .post('/v1/journeys')
      .set(hs256JwtWrongAlgInHeader('google|rs256-hdr'))
      .send({})
      .expect(403);
    assert.equal(res.body.error, 'forbidden');
  });

  test('three-segment token with invalid base64 payload → 403 forbidden', async () => {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const junk = 'not-valid-base64url!!!';
    const sig = createHmac('sha256', JWT_SECRET).update(`${header}.${junk}`).digest('base64url');
    const res = await request(app)
      .post('/v1/journeys')
      .set('Authorization', `Bearer ${header}.${junk}.${sig}`)
      .send({})
      .expect(403);
    assert.equal(res.body.error, 'forbidden');
  });
});
