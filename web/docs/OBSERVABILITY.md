# Observability (Aura web)

## API request correlation (authoritative server)

The Aura API (`server/`) sets **`X-Request-Id`** on every HTTP response. Clients may send **`X-Request-Id`** or **`X-Correlation-Id`** (printable ASCII, max 128 characters); invalid or oversized values are ignored and a new UUID is used. JSONL audit events written by the API include the same value as **`requestId`** so operators can join access logs, audit files, and client-reported ids. Details: [`API_CONTRACT.md`](./API_CONTRACT.md) (transport + response headers).

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

In-memory counters are incremented per event (`event.<category>.<event>`) and ship success/failure (`telemetry.ship_*`). For ad-hoc inspection in a staging build, set `VITE_AURA_TELEMETRY_DEBUG` to `true` or `1` (see [`DEPLOY.md`](./DEPLOY.md) staging row).

Then in the browser console: `window.__auraTelemetryMetrics()`.

## Wiring staging

Pick one of the following; both are valid for production CSP as long as you **build with the same `VITE_*` values** you use in that environment (see [`DEPLOY.md`](./DEPLOY.md) CSP section).

### A — Cross-origin collector URL

```bash
VITE_AURA_TELEMETRY_ENDPOINT=https://your-collector.example/ingest/aura
```

The production CSP plugin adds that URL’s **origin** to `connect-src`. The collector must allow CORS from your SPA origin, or you must use same-origin proxying (option B).

### B — Same-origin path (recommended when the edge can proxy)

Set a **relative** path so the browser posts to your static host origin; terminate TLS at the CDN/reverse proxy and forward `POST` bodies to the real collector (Logstash HTTP, custom worker, vendor API behind your network, etc.):

```bash
VITE_AURA_TELEMETRY_ENDPOINT=/ingest/aura
```

Relative URLs do not add a second origin to CSP: `connect-src` already includes `'self'`, which covers this path.

### Local development (`npm run dev`)

- Default: dev server accepts `POST /ingest/aura` and responds **204** with an empty body (no collector required). Use `VITE_AURA_TELEMETRY_ENDPOINT=/ingest/aura` in `.env.local` to mirror staging’s same-origin pattern.
- Optional: set `VITE_AURA_DEV_TELEMETRY_PROXY` to a full base URL (for example `http://127.0.0.1:9999`) to **proxy** `/ingest/aura` to that target instead of the stub (see `web/.env.example`).

### General

1. Point the endpoint at any service that accepts `POST` + `application/json`.
2. If you cannot POST from the client (CORS): prefer option B on the static host or a small BFF rather than disabling CSP.

## Production notes

- Avoid logging PII (no raw emails, phone numbers, or precise coordinates in events).
- Prefer sampling for high-volume map tile errors if needed.
