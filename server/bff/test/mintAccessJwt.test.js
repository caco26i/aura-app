import { createHmac, timingSafeEqual } from 'node:crypto';
import test from 'node:test';
import assert from 'node:assert/strict';
import { mintAccessJwt } from '../src/mintAccessJwt.js';

function verifyHs256Jwt(secret, token) {
  const parts = token.split('.');
  assert.equal(parts.length, 3);
  const [h64, p64, s64] = parts;
  const signingInput = `${h64}.${p64}`;
  const expected = createHmac('sha256', secret).update(signingInput).digest();
  const got = Buffer.from(s64, 'base64url');
  assert.equal(expected.length, got.length);
  assert.ok(timingSafeEqual(expected, got));
  return JSON.parse(Buffer.from(p64, 'base64url').toString('utf8'));
}

test('mintAccessJwt includes sub, exp, optional iss/aud', () => {
  const secret = 'test-secret-at-least-16-chars!!';
  const { token, exp } = mintAccessJwt({
    secret,
    sub: 'google|123',
    ttlSeconds: 120,
    issuer: 'aura-bff',
    audience: 'aura-api',
  });
  const payload = verifyHs256Jwt(secret, token);
  assert.equal(payload.sub, 'google|123');
  assert.equal(payload.iss, 'aura-bff');
  assert.equal(payload.aud, 'aura-api');
  assert.ok(typeof payload.exp === 'number');
  assert.ok(payload.exp <= exp);
  assert.ok(payload.iat < payload.exp);
});

test('mintAccessJwt exp is in the future', () => {
  const { token } = mintAccessJwt({
    secret: 'another-test-secret-16+chars',
    sub: 'u1',
    ttlSeconds: 60,
  });
  const payload = verifyHs256Jwt('another-test-secret-16+chars', token);
  const now = Math.floor(Date.now() / 1000);
  assert.ok(payload.exp > now);
});
