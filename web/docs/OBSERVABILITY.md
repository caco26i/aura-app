# Observability (Aura web)

## API request correlation (authoritative server)

The Aura API (`server/`) sets **`X-Request-Id`** on every HTTP response. Clients may send **`X-Request-Id`** or **`X-Correlation-Id`** (printable ASCII, max 128 characters); invalid or oversized values are ignored and a new UUID is used. JSONL audit events written by the API include the same value as **`requestId`** so operators can join access logs, audit files, and client-reported ids. Details: [`API_CONTRACT.md`](./API_CONTRACT.md) (transport + response headers).

The same API applies a **per-IP read-path rate limit** (shared bucket) to **`GET /health`**, **`GET /ready`**, and opt-in **`GET /metrics`**, tunable via **`AURA_API_RATE_LIMIT_READ_*`** (see [`../../server/README.md`](../../server/README.md)). **429** responses use the same JSON `rate_limited` envelope as mutating routes and emit **`audit.rate_limited`** with `route` **`health`**, **`ready`**, or **`metrics`**. Prefer edge/WAF throttling for heavy abuse; this limiter caps scrape or probe storms at the process.

The SPA sends a fresh **`X-Request-Id`** (UUID) on each `fetch` from `src/api/auraBackend.ts` to the Aura API; backend telemetry events include the same `requestId` when the call hits the network.

### Authoritative API Prometheus scrape (optional)

The Aura API (`server/`) can expose **`GET /metrics`** in Prometheus text format when operators set **`AURA_API_PROMETHEUS_METRICS`** to a non-empty value (see [`../../server/README.md`](../../server/README.md) env table). The endpoint is **off by default**; it does **not** require a bearer token (same class as **`GET /health`**). Use it only on **internal** networks or behind ACLs — do not publish scrape URLs on the public internet. Metrics include standard process stats from **`prom-client`** and an **`http_requests_total`** counter labeled by HTTP method, status code, and route bucket.

### API audit file (staging / production)

The authoritative API (`server/`) appends **one JSON object per line** (NDJSON) to **`AUDIT_LOG_PATH`** (default `data/audit.log`). **Ship** these lines with your log agent, sidecar, or periodic upload to object storage / SIEM; correlate with edge access logs using **`requestId`** (same as **`X-Request-Id`** on responses). **Rotation:** on Linux, prefer **logrotate** with `postrotate` **`kill -USR2`** to the API process so it **reopens** the file after the path is recreated at the same pathname (no full restart). **Windows** hosts do not get this signal path — use process restart or a new `AUDIT_LOG_PATH` per deploy. **Retention:** keep rotated objects long enough for incident review (often **30–90 days** minimum, per policy); rotation, retention policy notes, and SIEM forwarding are spelled out in [`../../server/docs/RUNBOOK_AUDIT.md`](../../server/docs/RUNBOOK_AUDIT.md). Example stanza (paths + PID 1 / container notes): [`../../server/docs/examples/audit-logrotate.example.conf`](../../server/docs/examples/audit-logrotate.example.conf). **Docker Compose:** root [`docker-compose.yml`](../../docker-compose.yml) mounts durable **`/app/data`** and sets `AUDIT_LOG_PATH` for `aura-api` — align rotation and signals with that layout.

## Structured logs

The app emits **one JSON object per line** prefixed with `[aura.telemetry]` from `src/observability/auraTelemetry.ts`.

### First-touch acquisition (`auth.bootstrap`, optional `journey.started`)

On the **first** page load in a browser profile, the SPA reads the landing URL query string once and persists allowed keys to **`localStorage`** key `aura:first_touch_acquisition:v1`. Later navigations do **not** update this snapshot. Parsed keys (non-PII, length-capped): `ref`, `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`.

When present, events include an **`acquisition`** object:

| Field | Type | Meaning |
| ----- | ---- | ------- |
| `firstTouchAt` | string (ISO-8601) | When the first-touch record was written |
| `ref` | string (optional) | `ref` query value |
| `utm` | object (optional) | Subset of UTM fields that were present: `source`, `medium`, `campaign`, `term`, `content` (from `utm_*` query params) |

Implementation: `src/observability/firstTouchAcquisition.ts`. If `localStorage` is unavailable, acquisition fields may be omitted.

Categories:

| Category   | Events (examples) |
| ---------- | ----------------- |
| `auth`     | `bootstrap` (Google OAuth enabled vs stub, optional **`acquisition`** — first-touch ref/UTM, see below) |
| `backend`  | `request`, `success`, `error` for journey and SOS API calls; remote calls include `requestId` matching `X-Request-Id`; successful responses may include `anomalyHeader` when the API returns `X-Aura-Anomaly` (ops signal, not an error) |
| `journey`  | `started` (may repeat **`acquisition`** when present), `track_state`, `ended`, `im_safe`, `share_location` |
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

**Docker Compose (root `docker-compose.yml` / BFF merge):** set runtime env **`AURA_TELEMETRY_PROXY_TARGET`** on `aura-web` to the **full URL** nginx should use in `proxy_pass` (for example `https://collector.internal/ingest/aura`). Build with **`VITE_AURA_TELEMETRY_ENDPOINT=/ingest/aura`**. If the proxy env is unset, nginx does not expose `/ingest/aura` — use a full `VITE_AURA_TELEMETRY_*` URL at build time instead. See [`DEPLOY.md`](./DEPLOY.md#root-compose-telemetry-proxy-operator-checklist) for operator checklists and [`docker-compose.telemetry-smoke.yml`](../../docker-compose.telemetry-smoke.yml) for the local echo-stub override used in CI.

### Docker Compose telemetry proxy smoke (operators / CI)

Manual replay of GitHub Actions: [`.github/workflows/compose-smoke.yml`](../../.github/workflows/compose-smoke.yml) (`workflow_dispatch`) jobs **`compose-telemetry-proxy-smoke`** (static bearer) and **`compose-bff-telemetry-proxy-smoke`** (BFF + stub).

**Static-bearer + echo stub** (no real collector):

```bash
echo "AURA_API_BEARER_TOKEN=$(openssl rand -hex 24)" > .env
echo "VITE_AURA_TELEMETRY_ENDPOINT=/ingest/aura" >> .env
docker compose -f docker-compose.yml -f docker-compose.telemetry-smoke.yml up --build
```

[`docker-compose.telemetry-smoke.yml`](../../docker-compose.telemetry-smoke.yml) adds service **`aura-telemetry-stub`** (`mendhak/http-https-echo:35`) and sets **`AURA_TELEMETRY_PROXY_TARGET=http://aura-telemetry-stub:8080/ingest/aura`** on `aura-web`. You do **not** need `AURA_TELEMETRY_PROXY_TARGET` in `.env` for this override — only **`VITE_AURA_TELEMETRY_ENDPOINT=/ingest/aura`** (build-time via `.env`).

**Smoke assertions** (match CI):

1. `GET http://127.0.0.1:${WEB_PORT:-8080}/health` and `/ready` through nginx (with optional `AURA_API_GIT_SHA` / `AURA_API_DEPLOY_VERSION` checks).
2. `POST http://127.0.0.1:${WEB_PORT:-8080}/ingest/aura` with `Content-Type: application/json` — expect **HTTP 200** from the echo stub.

**BFF + telemetry stub:** merge compose files in order **`docker-compose.yml`** → **`docker-compose.bff.yml`** → **`docker-compose.telemetry-smoke.yml`**. Required `.env`: BFF secrets (`AURA_API_BFF_JWT_SECRET`, `AURA_BFF_SESSION_SECRET`, `VITE_GOOGLE_CLIENT_ID`) plus **`VITE_AURA_TELEMETRY_ENDPOINT=/ingest/aura`**. The override sets the stub proxy URL on `aura-web`; CI also documents `AURA_TELEMETRY_PROXY_TARGET=http://aura-telemetry-stub:8080/ingest/aura` in `.env` (equivalent). Merged `depends_on` requires `aura-web` to wait on **`aura-api`**, **`aura-bff`**, and **`aura-telemetry-stub`**.

Full env matrix: [`DEPLOY.md`](./DEPLOY.md#root-compose-telemetry-proxy-operator-checklist).

### Local development (`npm run dev`)

- Default: dev server accepts `POST /ingest/aura` and responds **204** with an empty body (no collector required). Use `VITE_AURA_TELEMETRY_ENDPOINT=/ingest/aura` in `.env.local` to mirror staging’s same-origin pattern.
- Optional: set `VITE_AURA_DEV_TELEMETRY_PROXY` to a full base URL (for example `http://127.0.0.1:9999`) to **proxy** `/ingest/aura` to that target instead of the stub (see `web/.env.example`).

### General

1. Point the endpoint at any service that accepts `POST` + `application/json`.
2. If you cannot POST from the client (CORS): prefer option B on the static host or a small BFF rather than disabling CSP.

## Production notes

- Avoid logging PII (no raw emails, phone numbers, or precise coordinates in events).
- Prefer sampling for high-volume map tile errors if needed.
