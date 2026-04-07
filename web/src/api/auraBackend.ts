/**
 * Boundary for a future real backend (Supabase, Firebase, REST).
 * When `VITE_AURA_API_URL` + `VITE_AURA_API_TOKEN` are set, calls the authoritative Aura API in `../../server`.
 */

import { emitTelemetry } from '../observability/auraTelemetry';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export type BackendResult<T> = { ok: true; data: T } | { ok: false; error: string };

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

function remoteConfig(): { base: string; token: string } | null {
  const base = import.meta.env.VITE_AURA_API_URL?.replace(/\/$/, '');
  const token = import.meta.env.VITE_AURA_API_TOKEN;
  if (base && token) return { base, token };
  return null;
}

async function remotePost<T>(path: string, body?: unknown): Promise<BackendResult<T>> {
  const cfg = remoteConfig();
  if (!cfg) {
    return { ok: false, error: 'Backend not configured' };
  }
  const fp = deviceFingerprint();
  try {
    const res = await fetch(`${cfg.base}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cfg.token}`,
        ...(fp ? { 'X-Aura-Device-Fingerprint': fp } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const json = (await res.json().catch(() => null)) as
      | { ok: true; data: T }
      | { ok: false; error?: string; detail?: string }
      | null;
    if (!res.ok) {
      const msg =
        json && typeof json === 'object' && 'error' in json && json.error
          ? String(json.error)
          : `HTTP ${res.status}`;
      return { ok: false, error: msg };
    }
    if (json && typeof json === 'object' && 'ok' in json && json.ok === true && 'data' in json) {
      return { ok: true, data: (json as { data: T }).data };
    }
    return { ok: false, error: 'Invalid response' };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Network error';
    return { ok: false, error: msg };
  }
}

export async function postImSafe(journeyId: string): Promise<BackendResult<{ receivedAt: string }>> {
  emitTelemetry({ category: 'backend', event: 'request', operation: 'im_safe', journeyId });
  const cfg = remoteConfig();
  if (cfg) {
    const res = await remotePost<{ receivedAt: string }>(`/v1/journeys/${encodeURIComponent(journeyId)}/im-safe`);
    if (res.ok) {
      emitTelemetry({ category: 'backend', event: 'success', operation: 'im_safe', journeyId });
    } else {
      emitTelemetry({ category: 'backend', event: 'error', operation: 'im_safe', journeyId, error: res.error });
    }
    return res;
  }
  await delay(450);
  emitTelemetry({ category: 'backend', event: 'success', operation: 'im_safe', journeyId });
  return { ok: true, data: { receivedAt: new Date().toISOString() } };
}

export async function postShareLocation(journeyId: string): Promise<BackendResult<{ shareId: string }>> {
  emitTelemetry({ category: 'backend', event: 'request', operation: 'share_location', journeyId });
  const cfg = remoteConfig();
  if (cfg) {
    const res = await remotePost<{ shareId: string }>(
      `/v1/journeys/${encodeURIComponent(journeyId)}/location-shares`,
      {},
    );
    if (res.ok) {
      emitTelemetry({ category: 'backend', event: 'success', operation: 'share_location', journeyId });
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
  await delay(550);
  emitTelemetry({ category: 'backend', event: 'success', operation: 'share_location', journeyId });
  return { ok: true, data: { shareId: crypto.randomUUID() } };
}

export async function postEmergencyAlert(mode: 'silent' | 'visible'): Promise<BackendResult<{ alertId: string }>> {
  emitTelemetry({ category: 'backend', event: 'request', operation: 'emergency_alert', mode });
  const cfg = remoteConfig();
  if (cfg) {
    const res = await remotePost<{ alertId: string }>('/v1/emergency-alerts', { mode });
    if (res.ok) {
      emitTelemetry({ category: 'backend', event: 'success', operation: 'emergency_alert', mode });
    } else {
      emitTelemetry({ category: 'backend', event: 'error', operation: 'emergency_alert', mode, error: res.error });
    }
    return res;
  }
  await delay(600);
  emitTelemetry({ category: 'backend', event: 'success', operation: 'emergency_alert', mode });
  return { ok: true, data: { alertId: crypto.randomUUID() } };
}
