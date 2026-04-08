import { describe, expect, it } from 'vitest';
import { userMessageForHttpFailure } from './auraApiMessages';

describe('userMessageForHttpFailure', () => {
  it('maps invalid_json from contract envelope', () => {
    const msg = userMessageForHttpFailure(400, { ok: false, error: 'invalid_json' }, 'journey');
    expect(msg).toContain('JSON');
  });

  it('maps not_ready from contract envelope', () => {
    const msg = userMessageForHttpFailure(503, { ok: false, error: 'not_ready' }, 'sos');
    expect(msg).toContain('ready');
  });

  it('maps rate_limited by error code for SOS surface', () => {
    const msg = userMessageForHttpFailure(429, { ok: false, error: 'rate_limited' }, 'sos');
    expect(msg).toContain('emergency services');
  });
});
