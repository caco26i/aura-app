/**
 * First-visit marketing attribution (non-PII): ref + standard UTM keys.
 * Parsed once from the landing URL and stored in localStorage; never overwritten.
 * See web/docs/OBSERVABILITY.md (auth.bootstrap acquisition fields).
 */

const STORAGE_KEY = 'aura:first_touch_acquisition:v1';
const MAX_VALUE_LEN = 256;

const PARAM_MAP = [
  ['ref', 'ref'],
  ['utm_source', 'utmSource'],
  ['utm_medium', 'utmMedium'],
  ['utm_campaign', 'utmCampaign'],
  ['utm_term', 'utmTerm'],
  ['utm_content', 'utmContent'],
] as const;

type StoredV1 = {
  v: 1;
  firstTouchAt: string;
  ref?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
};

export type AcquisitionTelemetry = {
  firstTouchAt: string;
  ref?: string;
  utm?: {
    source?: string;
    medium?: string;
    campaign?: string;
    term?: string;
    content?: string;
  };
};

/** Trim, strip control characters, cap length — drops empty results. */
export function sanitizeAcquisitionValue(raw: string | null): string | undefined {
  if (raw == null) return undefined;
  const t = raw.trim();
  if (!t) return undefined;
  const cleaned = t.replace(/[\u0000-\u001F\u007F]/g, '');
  if (!cleaned) return undefined;
  return cleaned.length > MAX_VALUE_LEN ? cleaned.slice(0, MAX_VALUE_LEN) : cleaned;
}

/** Parse allowed query keys from a search string (including leading `?`). */
export function parseAcquisitionFromSearch(search: string): Omit<StoredV1, 'v' | 'firstTouchAt'> {
  const q = search.startsWith('?') ? search.slice(1) : search;
  const params = new URLSearchParams(q);
  const out: Omit<StoredV1, 'v' | 'firstTouchAt'> = {};
  for (const [queryKey, prop] of PARAM_MAP) {
    const v = sanitizeAcquisitionValue(params.get(queryKey));
    if (v) {
      (out as Record<string, string>)[prop] = v;
    }
  }
  return out;
}

function storedToTelemetry(stored: StoredV1): AcquisitionTelemetry {
  const { firstTouchAt, ref, utmSource, utmMedium, utmCampaign, utmTerm, utmContent } = stored;
  const utm: NonNullable<AcquisitionTelemetry['utm']> = {};
  if (utmSource) utm.source = utmSource;
  if (utmMedium) utm.medium = utmMedium;
  if (utmCampaign) utm.campaign = utmCampaign;
  if (utmTerm) utm.term = utmTerm;
  if (utmContent) utm.content = utmContent;
  const hasUtm = Object.keys(utm).length > 0;
  return {
    firstTouchAt,
    ...(ref ? { ref } : {}),
    ...(hasUtm ? { utm } : {}),
  };
}

/**
 * On first app load in this browser profile, persist ref/UTM from the current URL if not already stored.
 * Safe to call multiple times; no-op after the first successful write.
 */
export function captureFirstTouchAcquisitionIfNeeded(): void {
  if (typeof window === 'undefined') return;
  try {
    if (localStorage.getItem(STORAGE_KEY) != null) return;
    const parsed = parseAcquisitionFromSearch(window.location.search);
    const record: StoredV1 = {
      v: 1,
      firstTouchAt: new Date().toISOString(),
      ...parsed,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
  } catch {
    /* quota / private mode */
  }
}

/** Telemetry subset for `auth.bootstrap` / optional `journey.started`. */
export function getAcquisitionTelemetry(): AcquisitionTelemetry | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return undefined;
    const o = JSON.parse(raw) as Partial<StoredV1>;
    if (o.v !== 1 || typeof o.firstTouchAt !== 'string') return undefined;
    return storedToTelemetry(o as StoredV1);
  } catch {
    return undefined;
  }
}
