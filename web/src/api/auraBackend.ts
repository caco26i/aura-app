/**
 * Boundary for a future real backend (Supabase, Firebase, REST).
 * When `VITE_AURA_API_TOKEN` is set, calls the authoritative Aura API in `../../server` (local dev).
 * When `VITE_AURA_BFF_URL` is set without a static token, obtains a short-lived JWT via the BFF (`GET /session` with session cookie).
 * `VITE_AURA_API_URL` is optional: omit or leave empty to use same-origin URLs (Vite dev proxy → local `server/`).
 */

import { emitTelemetry } from '../observability/auraTelemetry';
import { auraRemoteApiMode, resolveAuraApiBearer } from './auraBackendAuth';
import {
  isOfflineError,
  noticeForAnomalyHeader,
  userMessageForBffSignIn,
  userMessageForHttpFailure,
  userMessageForMisconfiguration,
  userMessageForNetworkFailure,
  userMessageForUnknownError,
  type ApiSurface,
} from './auraApiMessages';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export type BackendResult<T> =
  | { ok: true; data: T; notice?: string; anomalyHeader?: string }
  | { ok: false; error: string; userMessage: string };

function deviceFingerprint(): string | undefined {
  if (typeof window === 'undefined' || !window.localStorage) return undefined;
  const key = 'aura_device_fp_v1';
  let fp = localStorage.getItem(key);
  if (!fp) {
    fp = crypto.randomUUID();
    localStorage.setItem(key, fp);
  }
  return fp;
}

function apiBase(): string {
  const raw = import.meta.env.VITE_AURA_API_URL;
  const base =
    raw === undefined || raw === null || String(raw).trim() === ''
      ? ''
      : String(raw).replace(/\/$/, '');
  return base;
}

async function remotePost<T>(path: string, body: unknown | undefined, surface: ApiSurface): Promise<BackendResult<T>> {
  const auth = await resolveAuraApiBearer();
  if (auth.kind === 'off') {
    return { ok: false, error: 'Backend not configured', userMessage: userMessageForMisconfiguration() };
  }
  if (auth.kind === 'sign_in_required') {
    return { ok: false, error: 'not_authenticated', userMessage: userMessageForBffSignIn() };
  }
  if (auth.kind === 'error') {
    return {
      ok: false,
      error: auth.error,
      userMessage: userMessageForUnknownError(surface),
    };
  }

  const base = apiBase();
  const fp = deviceFingerprint();
  try {
    const res = await fetch(`${base}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${auth.token}`,
        ...(fp ? { 'X-Aura-Device-Fingerprint': fp } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const anomaly = res.headers.get('X-Aura-Anomaly');
    const json = (await res.json().catch(() => null)) as
      | { ok: true; data: T }
      | { ok: false; error?: string; detail?: string }
      | null;
    if (!res.ok) {
      const technical =
        json && typeof json === 'object' && 'error' in json && json.error
          ? String(json.error)
          : `HTTP ${res.status}`;
      return {
        ok: false,
        error: technical,
        userMessage: userMessageForHttpFailure(res.status, json, surface),
      };
    }
    if (json && typeof json === 'object' && 'ok' in json && json.ok === true && 'data' in json) {
      const notice = noticeForAnomalyHeader(anomaly);
      const trimmedAnomaly = anomaly?.trim() ?? '';
      return {
        ok: true,
        data: (json as { data: T }).data,
        ...(notice ? { notice } : {}),
        ...(trimmedAnomaly ? { anomalyHeader: trimmedAnomaly } : {}),
      };
    }
    return {
      ok: false,
      error: 'Invalid response',
      userMessage: 'We got an unexpected reply from Aura. Try again.',
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Network error';
    const userMessage = isOfflineError(e)
      ? userMessageForNetworkFailure(surface)
      : userMessageForUnknownError(surface);
    return { ok: false, error: msg, userMessage };
  }
}

/** When API is configured, registers a server-side journey for the current bearer; required before share / im-safe. */
export async function postCreateJourney(): Promise<BackendResult<{ journeyId: string }>> {
  const mode = auraRemoteApiMode();
  if (mode === 'off') {
    return { ok: true, data: { journeyId: crypto.randomUUID() } };
  }
  return remotePost<{ journeyId: string }>('/v1/journeys', {}, 'journey');
}

export async function postImSafe(journeyId: string): Promise<BackendResult<{ receivedAt: string }>> {
  emitTelemetry({ category: 'backend', event: 'request', operation: 'im_safe', journeyId });
  const mode = auraRemoteApiMode();
  if (mode === 'off') {
    await delay(450);
    emitTelemetry({ category: 'backend', event: 'success', operation: 'im_safe', journeyId });
    return { ok: true, data: { receivedAt: new Date().toISOString() } };
  }
  const res = await remotePost<{ receivedAt: string }>(
    `/v1/journeys/${encodeURIComponent(journeyId)}/im-safe`,
    undefined,
    'journey',
  );
  if (res.ok) {
    emitTelemetry({
      category: 'backend',
      event: 'success',
      operation: 'im_safe',
      journeyId,
      ...(res.anomalyHeader ? { anomalyHeader: res.anomalyHeader } : {}),
    });
  } else {
    emitTelemetry({ category: 'backend', event: 'error', operation: 'im_safe', journeyId, error: res.error });
  }
  return res;
}

export async function postShareLocation(journeyId: string): Promise<BackendResult<{ shareId: string }>> {
  emitTelemetry({ category: 'backend', event: 'request', operation: 'share_location', journeyId });
  const mode = auraRemoteApiMode();
  if (mode === 'off') {
    await delay(550);
    emitTelemetry({ category: 'backend', event: 'success', operation: 'share_location', journeyId });
    return { ok: true, data: { shareId: crypto.randomUUID() } };
  }
  const res = await remotePost<{ shareId: string }>(
    `/v1/journeys/${encodeURIComponent(journeyId)}/location-shares`,
    {},
    'journey',
  );
  if (res.ok) {
    emitTelemetry({
      category: 'backend',
      event: 'success',
      operation: 'share_location',
      journeyId,
      ...(res.anomalyHeader ? { anomalyHeader: res.anomalyHeader } : {}),
    });
  } else {
    emitTelemetry({
      category: 'backend',
      event: 'error',
      operation: 'share_location',
      journeyId,
      error: res.error,
    });
  }
  return res;
}

export async function postEmergencyAlert(mode: 'silent' | 'visible'): Promise<BackendResult<{ alertId: string }>> {
  emitTelemetry({ category: 'backend', event: 'request', operation: 'emergency_alert', mode });
  const apiMode = auraRemoteApiMode();
  if (apiMode === 'off') {
    await delay(600);
    emitTelemetry({ category: 'backend', event: 'success', operation: 'emergency_alert', mode });
    return { ok: true, data: { alertId: crypto.randomUUID() } };
  }
  const res = await remotePost<{ alertId: string }>('/v1/emergency-alerts', { mode }, 'sos');
  if (res.ok) {
    emitTelemetry({
      category: 'backend',
      event: 'success',
      operation: 'emergency_alert',
      mode,
      ...(res.anomalyHeader ? { anomalyHeader: res.anomalyHeader } : {}),
    });
  } else {
    emitTelemetry({ category: 'backend', event: 'error', operation: 'emergency_alert', mode, error: res.error });
  }
  return res;
}
