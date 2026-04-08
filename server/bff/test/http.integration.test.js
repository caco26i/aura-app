import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import request from 'supertest';
import { createApp } from '../src/createApp.js';

const mockVerifyOk = async () => ({
  getPayload: () => ({ sub: 'google-sub-integration-test' }),
});

const mockFirebaseVerifyOk = async () => ({ uid: 'firebase-uid-integration-test' });

function assertResponseSecurityHeaders(res, opts = {}) {
  assert.equal(res.headers['x-content-type-options'], 'nosniff');
  assert.equal(res.headers['x-frame-options'], 'DENY');
  assert.equal(res.headers['referrer-policy'], 'no-referrer');
  const rid = res.headers['x-request-id'];
  assert.ok(typeof rid === 'string' && rid.length > 0);
  if (opts.requestId !== undefined) {
    assert.equal(rid, opts.requestId);
  }
}

describe('BFF HTTP (session + auth)', { concurrency: false }, () => {
  test('GET /health includes X-Request-Id, security headers, and stable echo of valid X-Request-Id', async () => {
    const app = createApp({ verifyIdToken: mockVerifyOk });
    const gen = await request(app).get('/health').expect(200);
    assertResponseSecurityHeaders(gen);
    assert.match(String(gen.headers['x-request-id']), /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);

    const echoed = await request(app)
      .get('/health')
      .set('X-Request-Id', 'bff-req-1')
      .expect(200);
    assertResponseSecurityHeaders(echoed, { requestId: 'bff-req-1' });
  });

  test('GET /health accepts X-Correlation-Id when X-Request-Id omitted', async () => {
    const app = createApp({ verifyIdToken: mockVerifyOk });
    const res = await request(app)
      .get('/health')
      .set('X-Correlation-Id', 'corr-bff-9')
      .expect(200);
    assertResponseSecurityHeaders(res, { requestId: 'corr-bff-9' });
  });

  test('GET /health ignores over-long X-Request-Id and issues a UUID', async () => {
    const app = createApp({ verifyIdToken: mockVerifyOk });
    const tooLong = 'a'.repeat(129);
    const res = await request(app).get('/health').set('X-Request-Id', tooLong).expect(200);
    assertResponseSecurityHeaders(res);
    assert.match(String(res.headers['x-request-id']), /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });

  test('GET /ready returns 200 with ready true when JWT and session secrets are configured (test harness)', async () => {
    const app = createApp({ verifyIdToken: mockVerifyOk });
    const res = await request(app).get('/ready').expect(200);
    assert.equal(res.body.ok, true);
    assert.equal(res.body.service, 'aura-bff');
    assert.equal(res.body.ready, true);
    assertResponseSecurityHeaders(res);
  });

  test('GET /ready returns 503 not_ready when secrets are missing', async () => {
    const prevJwt = process.env.AURA_API_BFF_JWT_SECRET;
    const prevSess = process.env.AURA_BFF_SESSION_SECRET;
    delete process.env.AURA_API_BFF_JWT_SECRET;
    delete process.env.AURA_BFF_SESSION_SECRET;
    try {
      const app = createApp({ verifyIdToken: mockVerifyOk });
      const res = await request(app).get('/ready').set('X-Request-Id', 'ready-missing-secrets').expect(503);
      assert.equal(res.body.ok, false);
      assert.equal(res.body.error, 'not_ready');
      assert.equal(res.body.ready, false);
      assert.equal(res.body.service, 'aura-bff');
      assert.ok(typeof res.body.detail === 'string' && res.body.detail.length > 0);
      assertResponseSecurityHeaders(res, { requestId: 'ready-missing-secrets' });
    } finally {
      if (prevJwt === undefined) delete process.env.AURA_API_BFF_JWT_SECRET;
      else process.env.AURA_API_BFF_JWT_SECRET = prevJwt;
      if (prevSess === undefined) delete process.env.AURA_BFF_SESSION_SECRET;
      else process.env.AURA_BFF_SESSION_SECRET = prevSess;
    }
  });

  test('GET /ready accepts X-Correlation-Id when X-Request-Id omitted', async () => {
    const app = createApp({ verifyIdToken: mockVerifyOk });
    const res = await request(app)
      .get('/ready')
      .set('X-Correlation-Id', 'corr-bff-ready-1')
      .expect(200);
    assertResponseSecurityHeaders(res, { requestId: 'corr-bff-ready-1' });
  });

  test('GET /session returns 401 when no session cookie', async () => {
    const app = createApp({ verifyIdToken: mockVerifyOk });
    const res = await request(app).get('/session').expect(401);
    assert.equal(res.body.ok, false);
    assert.equal(res.body.error, 'not_authenticated');
  });

  test('POST /logout then GET /session stays unauthenticated (401)', async () => {
    const app = createApp({ verifyIdToken: mockVerifyOk });
    const agent = request.agent(app);
    await agent.post('/logout').expect(200);
    const res = await agent.get('/session').expect(401);
    assert.equal(res.body.error, 'not_authenticated');
  });

  test('POST /auth/google returns 413 when JSON body exceeds AURA_BFF_JSON_BODY_LIMIT', async () => {
    const prev = process.env.AURA_BFF_JSON_BODY_LIMIT;
    process.env.AURA_BFF_JSON_BODY_LIMIT = '200b';
    try {
      const app = createApp({ verifyIdToken: mockVerifyOk });
      const res = await request(app)
        .post('/auth/google')
        .set('X-Request-Id', 'oversize-body-test')
        .send({ pad: 'x'.repeat(5000) });
      assert.equal(res.status, 413);
      assert.equal(res.body.ok, false);
      assert.equal(res.body.error, 'payload_too_large');
      assertResponseSecurityHeaders(res, { requestId: 'oversize-body-test' });
    } finally {
      if (prev === undefined) delete process.env.AURA_BFF_JSON_BODY_LIMIT;
      else process.env.AURA_BFF_JSON_BODY_LIMIT = prev;
    }
  });

  test('POST /auth/google returns 400 invalid_json for malformed JSON body', async () => {
    const app = createApp({ verifyIdToken: mockVerifyOk });
    const res = await request(app)
      .post('/auth/google')
      .set('Content-Type', 'application/json')
      .set('X-Request-Id', 'bad-json-test')
      .send('{ not json');
    assert.equal(res.status, 400);
    assert.equal(res.body.error, 'invalid_json');
    assertResponseSecurityHeaders(res, { requestId: 'bad-json-test' });
  });

  test('POST /auth/google returns 400 when idToken is missing', async () => {
    const app = createApp({ verifyIdToken: mockVerifyOk });
    const res = await request(app)
      .post('/auth/google')
      .set('X-Request-Id', 'missing-id-token')
      .send({})
      .expect(400);
    assert.equal(res.body.error, 'invalid_request');
    assertResponseSecurityHeaders(res, { requestId: 'missing-id-token' });
  });

  test('POST /auth/firebase returns 400 when idToken is missing', async () => {
    const app = createApp({ verifyIdToken: mockVerifyOk, verifyFirebaseIdToken: mockFirebaseVerifyOk });
    const res = await request(app).post('/auth/firebase').send({}).expect(400);
    assert.equal(res.body.error, 'invalid_request');
  });

  test('POST /auth/firebase happy path: mocked verify sets cookie; GET /session uses firebase uid', async () => {
    const app = createApp({ verifyIdToken: mockVerifyOk, verifyFirebaseIdToken: mockFirebaseVerifyOk });
    const agent = request.agent(app);
    await agent.post('/auth/firebase').send({ idToken: 'synthetic.firebase.jwt' }).expect(200);
    const sess = await agent.get('/session').expect(200);
    assert.equal(sess.body.ok, true);
    assert.ok(typeof sess.body.accessToken === 'string');
  });

  test('POST /auth/firebase returns 503 firebase_not_configured without override or env', async () => {
    const prevSa = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    const prevGac = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    delete process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    delete process.env.GOOGLE_APPLICATION_CREDENTIALS;
    try {
      const app = createApp({ verifyIdToken: mockVerifyOk });
      const res = await request(app).post('/auth/firebase').send({ idToken: 'x' }).expect(503);
      assert.equal(res.body.error, 'firebase_not_configured');
    } finally {
      if (prevSa === undefined) delete process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
      else process.env.FIREBASE_SERVICE_ACCOUNT_JSON = prevSa;
      if (prevGac === undefined) delete process.env.GOOGLE_APPLICATION_CREDENTIALS;
      else process.env.GOOGLE_APPLICATION_CREDENTIALS = prevGac;
    }
  });

  test('POST /auth/google returns 400 when idToken is not a non-empty string', async () => {
    const app = createApp({ verifyIdToken: mockVerifyOk });
    await request(app).post('/auth/google').send({ idToken: '   ' }).expect(400);
    await request(app).post('/auth/google').send({ idToken: 1 }).expect(400);
  });

  test('POST /auth/google returns 401 when verification fails (no Google network)', async () => {
    const app = createApp({
      verifyIdToken: async () => {
        throw new Error('simulated verify failure');
      },
    });
    const res = await request(app).post('/auth/google').send({ idToken: 'not-a-real-google-jwt' }).expect(401);
    assert.equal(res.body.error, 'invalid_token');
  });

  test('happy path: mocked verify sets httpOnly cookie; GET /session returns accessToken + expiresAt', async () => {
    const app = createApp({ verifyIdToken: mockVerifyOk });
    const agent = request.agent(app);
    const authRes = await agent
      .post('/auth/google')
      .send({ idToken: 'synthetic.id.token' })
      .expect(200);
    assert.equal(authRes.body.ok, true);
    const setCookie = authRes.headers['set-cookie'];
    assert.ok(Array.isArray(setCookie));
    assert.ok(setCookie.some((c) => c.includes('HttpOnly')));

    const sess = await agent.get('/session').expect(200);
    assert.equal(sess.body.ok, true);
    assert.ok(typeof sess.body.accessToken === 'string' && sess.body.accessToken.length > 10);
    assert.ok(typeof sess.body.expiresAt === 'string');
    assert.doesNotThrow(() => new Date(sess.body.expiresAt).toISOString());
  });

  test('after login, POST /logout clears session for subsequent GET /session', async () => {
    const app = createApp({ verifyIdToken: mockVerifyOk });
    const agent = request.agent(app);
    await agent.post('/auth/google').send({ idToken: 'token.one' }).expect(200);
    await agent.get('/session').expect(200);
    await agent.post('/logout').expect(200);
    await agent.get('/session').expect(401);
  });

  test('POST /auth/google returns 429 rate_limited after burst when limit env is low', async () => {
    const keys = [
      'AURA_BFF_RATE_LIMIT_AUTH_GOOGLE_WINDOW_MS',
      'AURA_BFF_RATE_LIMIT_AUTH_GOOGLE_MAX',
    ];
    const prev = Object.fromEntries(keys.map((k) => [k, process.env[k]]));
    process.env.AURA_BFF_RATE_LIMIT_AUTH_GOOGLE_WINDOW_MS = '60000';
    process.env.AURA_BFF_RATE_LIMIT_AUTH_GOOGLE_MAX = '2';
    try {
      const app = createApp({ verifyIdToken: mockVerifyOk });
      await request(app).post('/auth/google').send({ idToken: 'a' }).expect(200);
      await request(app).post('/auth/google').send({ idToken: 'b' }).expect(200);
      const res = await request(app)
        .post('/auth/google')
        .set('X-Request-Id', 'rate-limit-auth')
        .send({ idToken: 'c' })
        .expect(429);
      assert.equal(res.body.ok, false);
      assert.equal(res.body.error, 'rate_limited');
      assert.ok(typeof res.body.detail === 'string');
      assertResponseSecurityHeaders(res, { requestId: 'rate-limit-auth' });
    } finally {
      for (const k of keys) {
        if (prev[k] === undefined) delete process.env[k];
        else process.env[k] = prev[k];
      }
    }
  });

  test('GET /session returns 429 rate_limited after burst when limit env is low', async () => {
    const keys = ['AURA_BFF_RATE_LIMIT_SESSION_WINDOW_MS', 'AURA_BFF_RATE_LIMIT_SESSION_MAX'];
    const prev = Object.fromEntries(keys.map((k) => [k, process.env[k]]));
    process.env.AURA_BFF_RATE_LIMIT_SESSION_WINDOW_MS = '60000';
    process.env.AURA_BFF_RATE_LIMIT_SESSION_MAX = '2';
    try {
      const app = createApp({ verifyIdToken: mockVerifyOk });
      const agent = request.agent(app);
      await agent.post('/auth/google').send({ idToken: 'sess.burst' }).expect(200);
      await agent.get('/session').expect(200);
      await agent.get('/session').expect(200);
      const res = await agent.get('/session').expect(429);
      assert.equal(res.body.error, 'rate_limited');
    } finally {
      for (const k of keys) {
        if (prev[k] === undefined) delete process.env[k];
        else process.env[k] = prev[k];
      }
    }
  });

  test('POST /logout returns 429 rate_limited after burst when limit env is low', async () => {
    const keys = ['AURA_BFF_RATE_LIMIT_LOGOUT_WINDOW_MS', 'AURA_BFF_RATE_LIMIT_LOGOUT_MAX'];
    const prev = Object.fromEntries(keys.map((k) => [k, process.env[k]]));
    process.env.AURA_BFF_RATE_LIMIT_LOGOUT_WINDOW_MS = '60000';
    process.env.AURA_BFF_RATE_LIMIT_LOGOUT_MAX = '2';
    try {
      const app = createApp({ verifyIdToken: mockVerifyOk });
      await request(app).post('/logout').expect(200);
      await request(app).post('/logout').expect(200);
      const res = await request(app).post('/logout').expect(429);
      assert.equal(res.body.error, 'rate_limited');
    } finally {
      for (const k of keys) {
        if (prev[k] === undefined) delete process.env[k];
        else process.env[k] = prev[k];
      }
    }
  });

  test('GET /health returns 429 after read-path burst when limit env is low', async () => {
    const keys = ['AURA_BFF_RATE_LIMIT_READ_WINDOW_MS', 'AURA_BFF_RATE_LIMIT_READ_MAX'];
    const prev = Object.fromEntries(keys.map((k) => [k, process.env[k]]));
    process.env.AURA_BFF_RATE_LIMIT_READ_WINDOW_MS = '60000';
    process.env.AURA_BFF_RATE_LIMIT_READ_MAX = '3';
    try {
      const app = createApp({ verifyIdToken: mockVerifyOk });
      for (let i = 0; i < 3; i += 1) {
        await request(app).get('/health').expect(200);
      }
      const res = await request(app).get('/health').expect(429);
      assert.equal(res.body.error, 'rate_limited');
    } finally {
      for (const k of keys) {
        if (prev[k] === undefined) delete process.env[k];
        else process.env[k] = prev[k];
      }
    }
  });
});
