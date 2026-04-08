/**
 * Resolves Aura API bearer: static dev token (VITE_AURA_API_TOKEN) or BFF session (VITE_AURA_BFF_URL).
 */

const staticToken = import.meta.env.VITE_AURA_API_TOKEN?.trim();
const bffRaw = import.meta.env.VITE_AURA_BFF_URL?.trim();

export type AuraApiAuthResolution =
  | { kind: 'off' }
  | { kind: 'ready'; token: string }
  | { kind: 'sign_in_required' }
  | { kind: 'error'; error: string };

let cached: { token: string; expMs: number } | null = null;
let inflight: Promise<AuraApiAuthResolution> | null = null;

/** Exported for unit tests — computes when to refresh the in-memory access token. */
export function sessionResponseCacheExpiryMs(body: { accessToken: string; expiresAt?: string }): number {
  if (body.expiresAt) {
    const t = Date.parse(body.expiresAt);
    if (Number.isFinite(t)) return t;
  }
  const jwtExp = jwtExpMs(body.accessToken);
  if (jwtExp !== null) return jwtExp;
  return Date.now() + 120_000;
}

function jwtExpMs(accessToken: string): number | null {
  try {
    const p64 = accessToken.split('.')[1];
    if (!p64) return null;
    const padded = p64.replace(/-/g, '+').replace(/_/g, '/');
    const json = JSON.parse(atob(padded)) as { exp?: unknown };
    if (typeof json.exp === 'number' && Number.isFinite(json.exp)) {
      return json.exp * 1000;
    }
  } catch {
    return null;
  }
  return null;
}

function resolveBffOrigin(): string | null {
  if (!bffRaw) return null;
  if (bffRaw.startsWith('/')) {
    if (typeof window === 'undefined') return null;
    return `${window.location.origin}${bffRaw.replace(/\/$/, '')}`;
  }
  return bffRaw.replace(/\/$/, '');
}

export function auraRemoteApiMode(): 'off' | 'static' | 'bff' {
  if (staticToken) return 'static';
  if (bffRaw) return 'bff';
  return 'off';
}

export function clearAuraBffTokenCache(): void {
  cached = null;
}

/** After Google sign-in (`credential` JWT), bind an httpOnly BFF session for `/session` token minting. */
export async function establishAuraBffSessionWithGoogleIdToken(idToken: string): Promise<boolean> {
  const origin = resolveBffOrigin();
  if (!origin) return false;
  const res = await fetch(`${origin}/auth/google`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });
  clearAuraBffTokenCache();
  return res.ok;
}

/** After Firebase email/password sign-in, exchange the Firebase ID token for the same BFF session cookie. */
export async function establishAuraBffSessionWithFirebaseIdToken(idToken: string): Promise<boolean> {
  const origin = resolveBffOrigin();
  if (!origin) return false;
  const res = await fetch(`${origin}/auth/firebase`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });
  clearAuraBffTokenCache();
  return res.ok;
}

async function fetchBffSession(): Promise<AuraApiAuthResolution> {
  const origin = resolveBffOrigin();
  if (!origin) return { kind: 'off' };

  let res: Response;
  try {
    res = await fetch(`${origin}/session`, { credentials: 'include' });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Network error';
    return { kind: 'error', error: msg };
  }

  if (res.status === 401) {
    return { kind: 'sign_in_required' };
  }
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    return { kind: 'error', error: text || `HTTP ${res.status}` };
  }

  let json: unknown;
  try {
    json = await res.json();
  } catch {
    return { kind: 'error', error: 'Invalid session response' };
  }

  if (!json || typeof json !== 'object') {
    return { kind: 'error', error: 'Invalid session response' };
  }
  const accessToken = (json as { accessToken?: unknown }).accessToken;
  if (typeof accessToken !== 'string' || !accessToken) {
    return { kind: 'error', error: 'Invalid session response' };
  }

  const expMs = sessionResponseCacheExpiryMs({
    accessToken,
    expiresAt:
      typeof (json as { expiresAt?: unknown }).expiresAt === 'string'
        ? (json as { expiresAt: string }).expiresAt
        : undefined,
  });
  cached = { token: accessToken, expMs };
  return { kind: 'ready', token: accessToken };
}

export async function resolveAuraApiBearer(): Promise<AuraApiAuthResolution> {
  if (staticToken) {
    return { kind: 'ready', token: staticToken };
  }
  if (!bffRaw) {
    return { kind: 'off' };
  }

  const now = Date.now();
  if (cached && cached.expMs - 60_000 > now) {
    return { kind: 'ready', token: cached.token };
  }

  if (inflight) {
    return inflight;
  }

  inflight = (async () => {
    try {
      return await fetchBffSession();
    } finally {
      inflight = null;
    }
  })();

  return inflight;
}
