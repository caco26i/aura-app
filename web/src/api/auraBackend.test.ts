import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('./auraBackendAuth', () => ({
  auraRemoteApiMode: vi.fn(() => 'static'),
  resolveAuraApiBearer: vi.fn(async () => ({ kind: 'ready' as const, token: 'test-bearer' })),
}));

vi.mock('../observability/auraTelemetry', () => ({
  emitTelemetry: vi.fn(),
}));

import { postCreateJourney } from './auraBackend';

const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe('auraBackend remote fetch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      status: 200,
      headers: { get: () => null },
      json: async () => ({ ok: true, data: { journeyId: 'journey-test' } }),
    })) as unknown as typeof fetch;
  });

  it('sends X-Request-Id on Aura API POST', async () => {
    await postCreateJourney();
    expect(fetch).toHaveBeenCalledTimes(1);
    const init = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][1] as RequestInit;
    const headers = init.headers as Record<string, string>;
    expect(headers['X-Request-Id']).toBeDefined();
    expect(headers['X-Request-Id']).toMatch(uuidRe);
    expect(headers['X-Request-Id']!.length).toBeLessThanOrEqual(128);
  });

  it('uses a new X-Request-Id per request', async () => {
    await postCreateJourney();
    await postCreateJourney();
    const first = ((fetch as ReturnType<typeof vi.fn>).mock.calls[0][1] as RequestInit).headers as Record<
      string,
      string
    >;
    const second = ((fetch as ReturnType<typeof vi.fn>).mock.calls[1][1] as RequestInit).headers as Record<
      string,
      string
    >;
    expect(first['X-Request-Id']).not.toBe(second['X-Request-Id']);
  });

  it('surfaces server X-Request-Id echo on success for audit correlation', async () => {
    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      status: 200,
      headers: {
        get: (name: string) => (name.toLowerCase() === 'x-request-id' ? 'echoed-from-server' : null),
      },
      json: async () => ({ ok: true, data: { journeyId: 'journey-test' } }),
    })) as unknown as typeof fetch;
    const r = await postCreateJourney();
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.requestId).toBe('echoed-from-server');
  });

  it('surfaces server X-Request-Id echo on API error responses', async () => {
    globalThis.fetch = vi.fn(async () => ({
      ok: false,
      status: 429,
      headers: {
        get: (name: string) => (name.toLowerCase() === 'x-request-id' ? 'rate-limit-req' : null),
      },
      json: async () => ({ ok: false, error: 'rate_limited' }),
    })) as unknown as typeof fetch;
    const r = await postCreateJourney();
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.requestId).toBe('rate-limit-req');
      expect(r.error).toBe('rate_limited');
    }
  });
});
