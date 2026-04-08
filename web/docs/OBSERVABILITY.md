# Observability (Aura web)

## Structured logs

The app emits **one JSON object per line** prefixed with `[aura.telemetry]` from `src/observability/auraTelemetry.ts`.

Categories:

| Category   | Events (examples) |
| ---------- | ----------------- |
| `auth`     | `bootstrap` (google_enabled / stub) |
| `backend`  | `request`, `success`, `error` for journey and SOS API stubs; successful responses may include `anomalyHeader` when the API returns `X-Aura-Anomaly` (ops signal, not an error) |
| `journey`  | `started`, `track_state`, `ended`, `im_safe`, `share_location` |
| `sos`      | `fab_open`, `alert_sent` (optional `anomalyHeader`), `alert_failed` |
| `map`      | `tile_error` |

## Metrics

In-memory counters are incremented per event (`event.<category>.<event>`) and ship success/failure (`telemetry.ship_*`). For ad-hoc inspection in a staging build, set:

```bash
VITE_AURA_TELEMETRY_DEBUG=true
```

Then in the browser console: `window.__auraTelemetryMetrics()`.

## Wiring staging

1. Build with your staging env file, for example:

```bash
VITE_AURA_TELEMETRY_ENDPOINT=https://your-collector.example/ingest/aura
```

2. Point the endpoint at any service that accepts `POST` + `application/json` (Logstash HTTP, custom worker, Datadog Log API via proxy, etc.).
3. Ship browser console logs if you cannot POST from the client (CORS): use a **same-origin** ingest path on the static host or a small BFF.

## Production notes

- Avoid logging PII (no raw emails, phone numbers, or precise coordinates in events).
- Prefer sampling for high-volume map tile errors if needed.
