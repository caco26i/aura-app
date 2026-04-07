/**
 * Client-side structured telemetry for staging/production log shipping.
 * Set VITE_AURA_TELEMETRY_ENDPOINT to POST JSON lines to your collector.
 * See web/docs/OBSERVABILITY.md.
 */

export type TelemetryCategory = 'auth' | 'journey' | 'sos' | 'map' | 'backend';

export type TelemetryEvent = {
  category: TelemetryCategory;
  event: string;
  [key: string]: unknown;
};

const SERVICE = 'aura-web';
const metricCounts = new Map<string, number>();

function bumpMetric(key: string, delta = 1) {
  metricCounts.set(key, (metricCounts.get(key) ?? 0) + delta);
}

function buildPayload(partial: TelemetryEvent) {
  return {
    ts: new Date().toISOString(),
    service: SERVICE,
    env: import.meta.env.MODE,
    ...partial,
  };
}

function logStructured(payload: Record<string, unknown>) {
  const line = JSON.stringify(payload);
  console.info(`[aura.telemetry] ${line}`);
}

async function postToCollector(body: Record<string, unknown>) {
  const url = import.meta.env.VITE_AURA_TELEMETRY_ENDPOINT as string | undefined;
  if (!url) return;
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      keepalive: true,
    });
    bumpMetric('telemetry.ship_ok');
  } catch {
    bumpMetric('telemetry.ship_failed');
  }
}

/** Emit one structured log line and optional HTTP mirror for staging. */
export function emitTelemetry(partial: TelemetryEvent) {
  const payload = buildPayload(partial);
  logStructured(payload);
  bumpMetric(`event.${partial.category}.${partial.event}`);
  void postToCollector(payload);
}

/** Increment a counter (included in getTelemetryMetricsSnapshot). */
export function recordMetric(name: string, delta = 1) {
  bumpMetric(name, delta);
}

export function getTelemetryMetricsSnapshot(): Record<string, number> {
  return Object.fromEntries(metricCounts);
}

declare global {
  interface Window {
    __auraTelemetryMetrics?: () => Record<string, number>;
  }
}

if (typeof window !== 'undefined' && import.meta.env.VITE_AURA_TELEMETRY_DEBUG === 'true') {
  window.__auraTelemetryMetrics = () => getTelemetryMetricsSnapshot();
}
