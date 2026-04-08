/**
 * HS256 JWT minting compatible with Aura API verification (`server/src/index.js` verifyBffJwt).
 */

import { createHmac } from 'node:crypto';

/**
 * @param {object} opts
 * @param {string} opts.secret
 * @param {string} opts.sub
 * @param {number} opts.ttlSeconds
 * @param {string} [opts.issuer]
 * @param {string} [opts.audience]
 * @returns {{ token: string, exp: number }}
 */
export function mintAccessJwt({ secret, sub, ttlSeconds, issuer, audience }) {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + ttlSeconds;
  /** @type {Record<string, unknown>} */
  const payload = { sub, exp, iat: now };
  if (issuer) payload.iss = issuer;
  if (audience) payload.aud = audience;

  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signingInput = `${header}.${body}`;
  const sig = createHmac('sha256', secret).update(signingInput).digest('base64url');
  return { token: `${signingInput}.${sig}`, exp };
}
