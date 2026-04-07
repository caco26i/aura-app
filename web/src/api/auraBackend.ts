/**
 * Boundary for a future real backend (Supabase, Firebase, REST).
 * Replace implementations; keep call sites stable for UI tests.
 */

import { emitTelemetry } from '../observability/auraTelemetry';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export type BackendResult<T> = { ok: true; data: T } | { ok: false; error: string };

export async function postImSafe(journeyId: string): Promise<BackendResult<{ receivedAt: string }>> {
  emitTelemetry({ category: 'backend', event: 'request', operation: 'im_safe', journeyId });
  await delay(450);
  emitTelemetry({ category: 'backend', event: 'success', operation: 'im_safe', journeyId });
  return { ok: true, data: { receivedAt: new Date().toISOString() } };
}

export async function postShareLocation(journeyId: string): Promise<BackendResult<{ shareId: string }>> {
  emitTelemetry({ category: 'backend', event: 'request', operation: 'share_location', journeyId });
  await delay(550);
  emitTelemetry({ category: 'backend', event: 'success', operation: 'share_location', journeyId });
  return { ok: true, data: { shareId: crypto.randomUUID() } };
}

export async function postEmergencyAlert(mode: 'silent' | 'visible'): Promise<BackendResult<{ alertId: string }>> {
  emitTelemetry({ category: 'backend', event: 'request', operation: 'emergency_alert', mode });
  await delay(600);
  emitTelemetry({ category: 'backend', event: 'success', operation: 'emergency_alert', mode });
  return { ok: true, data: { alertId: crypto.randomUUID() } };
}
