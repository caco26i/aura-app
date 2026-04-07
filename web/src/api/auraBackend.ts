/**
 * Boundary for a future real backend (Supabase, Firebase, REST).
 * Replace implementations; keep call sites stable for UI tests.
 */

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export type BackendResult<T> = { ok: true; data: T } | { ok: false; error: string };

export async function postImSafe(journeyId: string): Promise<BackendResult<{ receivedAt: string }>> {
  await delay(450);
  console.info('[auraBackend] POST /journeys/im-safe', { journeyId });
  return { ok: true, data: { receivedAt: new Date().toISOString() } };
}

export async function postShareLocation(journeyId: string): Promise<BackendResult<{ shareId: string }>> {
  await delay(550);
  console.info('[auraBackend] POST /journeys/share-location', { journeyId });
  return { ok: true, data: { shareId: crypto.randomUUID() } };
}

export async function postEmergencyAlert(mode: 'silent' | 'visible'): Promise<BackendResult<{ alertId: string }>> {
  await delay(600);
  console.info('[auraBackend] POST /emergency/alert', { mode });
  return { ok: true, data: { alertId: crypto.randomUUID() } };
}
