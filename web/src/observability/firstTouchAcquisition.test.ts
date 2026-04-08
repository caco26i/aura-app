import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import {
  captureFirstTouchAcquisitionIfNeeded,
  getAcquisitionTelemetry,
  parseAcquisitionFromSearch,
  sanitizeAcquisitionValue,
} from './firstTouchAcquisition';

describe('sanitizeAcquisitionValue', () => {
  it('trims and drops empty', () => {
    expect(sanitizeAcquisitionValue('  x  ')).toBe('x');
    expect(sanitizeAcquisitionValue('')).toBeUndefined();
    expect(sanitizeAcquisitionValue('   ')).toBeUndefined();
    expect(sanitizeAcquisitionValue(null)).toBeUndefined();
  });

  it('strips ASCII control characters', () => {
    expect(sanitizeAcquisitionValue('a\u0000b')).toBe('ab');
    expect(sanitizeAcquisitionValue('\x7F')).toBeUndefined();
  });

  it('caps length at 256', () => {
    const long = 'a'.repeat(300);
    expect(sanitizeAcquisitionValue(long)!.length).toBe(256);
  });
});

describe('parseAcquisitionFromSearch', () => {
  it('parses ref and utm_* keys', () => {
    expect(
      parseAcquisitionFromSearch('?ref=newsletter&utm_source=email&utm_medium=cpc&utm_campaign=spring'),
    ).toEqual({
      ref: 'newsletter',
      utmSource: 'email',
      utmMedium: 'cpc',
      utmCampaign: 'spring',
    });
  });

  it('accepts search without leading ?', () => {
    expect(parseAcquisitionFromSearch('utm_term=x')).toEqual({ utmTerm: 'x' });
  });

  it('ignores unknown params', () => {
    expect(parseAcquisitionFromSearch('?email=user@test.com&gclid=abc')).toEqual({});
  });
});

describe('captureFirstTouchAcquisitionIfNeeded', () => {
  const key = 'aura:first_touch_acquisition:v1';

  function memoryStorage(): Storage {
    const m = new Map<string, string>();
    return {
      get length() {
        return m.size;
      },
      clear() {
        m.clear();
      },
      getItem: (k: string) => (m.has(k) ? m.get(k)! : null),
      key: (i: number) => Array.from(m.keys())[i] ?? null,
      removeItem: (k: string) => {
        m.delete(k);
      },
      setItem: (k: string, v: string) => {
        m.set(k, v);
      },
    };
  }

  let loc: { search: string };
  let storage: Storage;

  beforeEach(() => {
    storage = memoryStorage();
    loc = { search: '?utm_source=first' };
    vi.stubGlobal('localStorage', storage);
    vi.stubGlobal('window', { location: loc });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('writes once and does not overwrite on second call', () => {
    captureFirstTouchAcquisitionIfNeeded();
    expect(JSON.parse(storage.getItem(key)!)).toMatchObject({
      v: 1,
      utmSource: 'first',
    });
    loc.search = '?utm_source=second';
    captureFirstTouchAcquisitionIfNeeded();
    expect(JSON.parse(storage.getItem(key)!).utmSource).toBe('first');
  });

  it('getAcquisitionTelemetry returns nested utm shape', () => {
    captureFirstTouchAcquisitionIfNeeded();
    expect(getAcquisitionTelemetry()).toEqual({
      firstTouchAt: expect.any(String),
      utm: { source: 'first' },
    });
  });
});
