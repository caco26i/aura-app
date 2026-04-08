/**
 * Integration tests for Aura API (auth, journeys, audit-backed routes).
 * Run: npm test (from server/)
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { after, describe, test } from 'node:test';
import request from 'supertest';

const TOKEN = 'integration-test-bearer-token';
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aura-api-test-'));
const auditPath = path.join(tmpDir, 'audit.log');

process.env.AURA_API_BEARER_TOKEN = TOKEN;
process.env.AURA_API_SKIP_LISTEN = '1';
process.env.AUDIT_LOG_PATH = auditPath;

const { app } = await import('../src/index.js');

const bearer = { Authorization: `Bearer ${TOKEN}` };

describe('Aura API', () => {
  after(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('GET /health returns service id', async () => {
    const res = await request(app).get('/health').expect(200);
    assert.equal(res.body.ok, true);
    assert.equal(res.body.service, 'aura-api');
  });

  test('unknown GET path returns not_found', async () => {
    const res = await request(app).get('/v1/no-such-route').expect(404);
    assert.equal(res.body.ok, false);
    assert.equal(res.body.error, 'not_found');
  });

  test('unknown POST path returns not_found', async () => {
    const res = await request(app).post('/v1/obsolete-endpoint').set(bearer).send({}).expect(404);
    assert.equal(res.body.ok, false);
    assert.equal(res.body.error, 'not_found');
  });

  test('mutating routes require bearer token', async () => {
    await request(app).post('/v1/journeys').send({}).expect(401);
  });

  test('mutating routes reject wrong bearer', async () => {
    await request(app)
      .post('/v1/journeys')
      .set('Authorization', 'Bearer wrong')
      .send({})
      .expect(403);
  });

  test('POST /v1/journeys creates journey and accepts empty object body', async () => {
    const res = await request(app).post('/v1/journeys').set(bearer).send({}).expect(201);
    assert.equal(res.body.ok, true);
    assert.match(res.body.data.journeyId, /^[0-9a-f-]{36}$/i);
  });

  test('POST /v1/journeys rejects non-empty body', async () => {
    const res = await request(app).post('/v1/journeys').set(bearer).send({ extra: 1 }).expect(400);
    assert.equal(res.body.ok, false);
    assert.equal(res.body.error, 'validation_failed');
  });

  test('location-shares returns journey_not_found for unknown id', async () => {
    const res = await request(app)
      .post('/v1/journeys/00000000-0000-4000-8000-000000000001/location-shares')
      .set(bearer)
      .send({})
      .expect(404);
    assert.equal(res.body.error, 'journey_not_found');
  });

  test('location-shares returns invalid_journey_id for non-uuid param', async () => {
    const res = await request(app)
      .post('/v1/journeys/not-a-uuid/location-shares')
      .set(bearer)
      .send({})
      .expect(400);
    assert.equal(res.body.error, 'invalid_journey_id');
  });

  test('im-safe returns invalid_journey_id for non-uuid param', async () => {
    const res = await request(app).post('/v1/journeys/bad/im-safe').set(bearer).expect(400);
    assert.equal(res.body.error, 'invalid_journey_id');
  });

  test('im-safe works with no JSON body (client sends fetch without body)', async () => {
    const create = await request(app).post('/v1/journeys').set(bearer).send({}).expect(201);
    const { journeyId } = create.body.data;
    const res = await request(app)
      .post(`/v1/journeys/${journeyId}/im-safe`)
      .set(bearer)
      .expect(201);
    assert.equal(res.body.ok, true);
    assert.ok(typeof res.body.data.receivedAt === 'string');
  });

  test('happy path: journey then location-share then im-safe', async () => {
    const create = await request(app).post('/v1/journeys').set(bearer).send({}).expect(201);
    const { journeyId } = create.body.data;

    const share = await request(app)
      .post(`/v1/journeys/${journeyId}/location-shares`)
      .set(bearer)
      .set('X-Aura-Device-Fingerprint', 'device-test-fp')
      .send({
        latitude: 37.77,
        longitude: -122.42,
        accuracyM: 12,
      })
      .expect(201);
    assert.equal(share.body.ok, true);
    assert.ok(share.body.data.shareId);

    const safe = await request(app)
      .post(`/v1/journeys/${journeyId}/im-safe`)
      .set(bearer)
      .send({})
      .expect(201);
    assert.equal(safe.body.ok, true);
  });

  test('location-shares rejects latitude without longitude', async () => {
    const create = await request(app).post('/v1/journeys').set(bearer).send({}).expect(201);
    const { journeyId } = create.body.data;
    const res = await request(app)
      .post(`/v1/journeys/${journeyId}/location-shares`)
      .set(bearer)
      .send({ latitude: 1 })
      .expect(400);
    assert.equal(res.body.error, 'validation_failed');
  });

  test('emergency-alerts validates mode', async () => {
    await request(app).post('/v1/emergency-alerts').set(bearer).send({ mode: 'invalid' }).expect(400);
    const ok = await request(app).post('/v1/emergency-alerts').set(bearer).send({ mode: 'silent' }).expect(201);
    assert.equal(ok.body.ok, true);
    assert.ok(ok.body.data.alertId);
  });

  test('append-only audit log receives journey.created', async () => {
    const beforeLen = fs.existsSync(auditPath) ? fs.readFileSync(auditPath, 'utf8').length : 0;
    await request(app).post('/v1/journeys').set(bearer).send({}).expect(201);
    const log = fs.readFileSync(auditPath, 'utf8');
    assert.ok(log.length > beforeLen);
    const last = log.trim().split('\n').pop();
    const row = JSON.parse(last);
    assert.equal(row.type, 'journey.created');
  });
});
