/**
 * Child entry for deploy-metadata test: API not configured, /ready returns 503 with optional deploy fields.
 * Invoked via spawn from deploy-metadata.health-ready.integration.test.js.
 */
import assert from 'node:assert/strict';
import request from 'supertest';

const { app } = await import('../src/index.js');

const res = await request(app).get('/ready').expect(503);
assert.equal(res.body.ok, false);
assert.equal(res.body.error, 'not_ready');
assert.equal(res.body.deployVersion, 'rel-503');
assert.equal(res.body.gitSha, 'abc503');
