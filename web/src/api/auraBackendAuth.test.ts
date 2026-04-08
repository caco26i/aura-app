import { describe, expect, it } from 'vitest';
import { sessionResponseCacheExpiryMs } from './auraBackendAuth';

describe('sessionResponseCacheExpiryMs', () => {
  it('prefers expiresAt ISO when present', () => {
    const t = sessionResponseCacheExpiryMs({
      accessToken: 'a.b.c',
      expiresAt: '2030-01-01T00:00:00.000Z',
    });
    expect(t).toBe(Date.parse('2030-01-01T00:00:00.000Z'));
  });

  it('falls back to JWT exp claim', () => {
    const payload = { exp: Math.floor(Date.now() / 1000) + 600 };
    const body = btoa(JSON.stringify(payload)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    const token = `x.${body}.z`;
    const t = sessionResponseCacheExpiryMs({ accessToken: token });
    expect(t).toBe(payload.exp * 1000);
  });
});
