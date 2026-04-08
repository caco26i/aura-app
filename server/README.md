# Aura API (authoritative boundary)

Validates SOS, location share, and “I’m safe” payloads; enforces **static bearer** and/or **BFF HS256 JWT** auth, rate limits, and append-only **JSON-lines audit** (treat the log file as WORM in production — ship to object storage / SIEM). Ops: [`docs/RUNBOOK_AUDIT.md`](./docs/RUNBOOK_AUDIT.md).

**BFF (Google → session → access JWT):** in-repo service at [`bff/`](./bff/) signs **`sub`-scoped** HS256 tokens with the same `AURA_API_BFF_JWT_SECRET` this API verifies. Production/staging should omit static `VITE_AURA_API_TOKEN` and use the BFF + web `VITE_AURA_BFF_URL` path (see [`../web/docs/BETA_BACKEND.md`](../web/docs/BETA_BACKEND.md) and [`../web/docs/DEPLOY.md`](../web/docs/DEPLOY.md#bff-first-env-matrix-staging--production)). The web package’s production build **fails** if both vars are non-empty so operators cannot accidentally bake a static bearer alongside the BFF URL. Probe **`GET /health`** vs **`GET /ready`** on the BFF the same way as this API (liveness vs readiness); see [`bff/README.md`](./bff/README.md).

**Client contract:** [`../web/docs/API_CONTRACT.md`](../web/docs/API_CONTRACT.md) (envelopes, error codes, headers). Change it in lockstep with `web/src/api/auraBackend.ts` / `auraApiMessages.ts`.

## Related docs (web package)

Stack setup beyond this README (client auth, deploy, security, observability, and **client ↔ API** integration) lives under **[`../web/docs/`](../web/docs/)** in the web package. For local wiring, start with [`../web/docs/BETA_BACKEND.md`](../web/docs/BETA_BACKEND.md) alongside the env table below. That doc ties **PDR §4.2** to the web app: create journey first, then share / I’m safe; the web client maps `journey_not_found`, `journey_forbidden`, and related codes to calm session-style copy in [`../web/src/api/auraApiMessages.ts`](../web/src/api/auraApiMessages.ts).

## Run locally

```bash
export AURA_API_BEARER_TOKEN="$(openssl rand -hex 24)"
# Or for JWT-only local tests: export AURA_API_BFF_JWT_SECRET="$(openssl rand -hex 32)"
npm install
npm run dev
```

## Docker

The API image compiles **`better-sqlite3`** during `npm ci`, so the build stage uses **Debian bookworm-slim** with `python3`, `make`, and `g++`. The runtime image stays slim and reuses the compiled `node_modules` from the build stage. **CI:** the [Server API tests](../.github/workflows/server-tests.yml) workflow runs **`docker build -f server/Dockerfile server`** on pushes/PRs that touch `server/` (same triggers as `npm test`) so native compile regressions fail in GitHub Actions, not only locally.

```bash
cd server
docker build -t aura-api:local .
export AURA_API_BEARER_TOKEN="$(openssl rand -hex 24)"
docker run --rm -e AURA_API_BEARER_TOKEN -p 8787:8787 \
  -v aura-data:/app/data \
  aura-api:local
```

**Compose (example):** [`docker-compose.yml`](./docker-compose.yml) mounts a named volume at `/app/data` and sets `AUDIT_LOG_PATH`, `AURA_API_JOURNEY_STORE_SQLITE_PATH`, and `AURA_API_JOURNEY_STORE_JSONL_PATH` under that path. Set `AURA_API_BEARER_TOKEN` in the environment or a `.env` file next to the compose file, then:

```bash
cd server
docker compose up --build
```

- **Liveness:** `GET /health` (Docker `HEALTHCHECK` and compose `healthcheck` use this).
- **Readiness:** `GET /ready` — use from your orchestrator or load balancer once at least one of `AURA_API_BEARER_TOKEN` or `AURA_API_BFF_JWT_SECRET` is set and `/app/data` is writable (see route list above).

Web deploy cross-links: [`web/docs/DEPLOY.md`](../web/docs/DEPLOY.md).

## Tests

There is no separate `lint` script in this package’s `package.json`; quality gates are **`npm test`** (Node’s test runner + integration suites) and the [Server API tests](../../.github/workflows/server-tests.yml) workflow.

```bash
npm test
```

Integration tests exercise auth (static bearer, **BFF JWT** `sub`-scoped journey ownership), Zod validation, wrong-method and CORS preflight, malformed JSON → **`400 invalid_json`**, SOS **`429 rate_limited`** (hourly cap; emergency tests grouped at the **end** of `api.integration.test.js`), **im-safe** hourly cap (`audit.rate_limited` route `im-safe`), **minute-window** journey limiter (`api.rate-limit-minute.integration.test.js`), **minute-window global** limiter on **`POST /v1/emergency-alerts`** (`api.rate-limit-global.integration.test.js`), append-only audit writes, **audit log reopen after rotation** (`audit-writer.test.js`), **journey store unit restart checks** (`journey-registry.restart.test.js`), **HTTP continuity across two Node processes** (`journey-http-restart.integration.test.js` + `journey-restart-phase.mjs`), **optional deploy metadata** on `/health` / `/ready` (`deploy-metadata.health-ready.integration.test.js`), and **optional Prometheus** `GET /metrics` when `AURA_API_PROMETHEUS_METRICS` is set (`prometheus-metrics.integration.test.js` + subprocess `prometheus-metrics-phase.mjs`), **production JWT-only happy path** (`production-jwt-happy.integration.test.js`), and **production static+bearer misconfig** (`production-jwt-only.integration.test.js`). Default API tests set `AURA_API_JOURNEY_STORE=memory`; subprocess test uses a temp SQLite file.

On GitHub, the **Server API tests** workflow runs `npm ci` + `npm test` in `server/` and a **`docker build`** smoke on `server/Dockerfile` when `server/`, `web/docs/API_CONTRACT.md`, or that workflow file changes.

## Env

| Variable | Required | Description |
|----------|----------|-------------|
| `AURA_API_BEARER_TOKEN` | one of | Shared secret for beta / dev; use with `Authorization: Bearer …`. Omit for **JWT-only** / BFF-first production (`AURA_API_BFF_JWT_SECRET` only). When **`NODE_ENV=production`**, a non-empty `AURA_API_BEARER_TOKEN` or `AURA_API_BEARER_TOKEN_ALT` together with `AURA_API_BFF_JWT_SECRET` makes **`GET /ready`** and authenticated routes return **503** — clear static bearer vars on the API container for BFF-first deploys. |
| `AURA_API_BFF_JWT_SECRET` | one of | HS256 secret for **BFF-issued** access tokens. When set, a **three-segment** Bearer value is verified as JWT (claims: **`sub`** required, **`exp`** enforced; optional **`iss`** / **`aud`** via env below). Journey ownership is keyed by `sub`, so refreshed tokens for the same user stay compatible. |
| `AURA_API_BFF_JWT_ISSUER` | no | If set, JWT `iss` must match. |
| `AURA_API_BFF_JWT_AUDIENCE` | no | If set, JWT `aud` must match (string or array). |
| `AURA_API_BEARER_TOKEN_ALT` | no | Optional second static bearer (separate actor). Tests use it for `journey_forbidden` across actors. |
| `PORT` | no | Default `8787` |
| `AURA_API_DEPLOY_VERSION` | no | Optional release label (e.g. `1.2.3`, image tag). When set (non-empty after trim), included as **`deployVersion`** on **`GET /health`** and **`GET /ready`** JSON. Omit in env to keep the default response shape unchanged. Values longer than **256** characters are truncated; must not contain secrets. |
| `AURA_API_GIT_SHA` | no | Optional VCS revision (short SHA). When set (non-empty after trim), included as **`gitSha`** on **`GET /health`** and **`GET /ready`** (including **`503`** `not_ready` on `/ready`). Same length and secrecy rules as `AURA_API_DEPLOY_VERSION`. |
| `AUDIT_LOG_PATH` | no | Default `./data/audit.log`. On **Unix**, the process handles **`SIGUSR2`**: closes the audit fd and reopens this path (use after logrotate `mv` + recreate). **Windows:** not supported — restart or rotate by changing the env path. See [`docs/RUNBOOK_AUDIT.md`](./docs/RUNBOOK_AUDIT.md). |
| `AURA_API_JOURNEY_STORE_SQLITE_PATH` | no | SQLite **WAL** journey store (default `./data/journeys.sqlite`). Primary backend when `AURA_API_JOURNEY_STORE=auto` and the driver opens successfully. Legacy alias: `AURA_API_JOURNEY_SQLITE_PATH`. |
| `AURA_API_JOURNEY_STORE_JSONL_PATH` | no | Append-only **JSONL** fallback (default `./data/journeys.jsonl`): used when SQLite cannot be opened, or when `AURA_API_JOURNEY_STORE=jsonl`. Each append **fsync**s. Legacy alias: `AURA_API_JOURNEY_JSONL_PATH`. |
| `AURA_API_JOURNEY_STORE` | no | `auto` (default): SQLite then JSONL fallback. `sqlite` / `jsonl` / `memory`: force backend (`memory` = in-process `Map`, for fast tests). Legacy alias: `AURA_API_JOURNEY_BACKEND`. |
| `CORS_ORIGIN` | no | `*` or comma-separated allowlist |
| `AURA_API_JSON_BODY_LIMIT` | no | Express JSON body size (default `32kb`, same as BFF `express.json` limit) |
| `AURA_API_RATE_LIMIT_GLOBAL_WINDOW_MS` | no | Per-IP+actor minute window for **`globalLimiter`** on all mutating routes (default `60000`) |
| `AURA_API_RATE_LIMIT_GLOBAL_MAX` | no | Max mutating requests per **`globalLimiter`** window (default `120`) |
| `AURA_API_RATE_LIMIT_JOURNEY_WINDOW_MS` | no | Per-IP+actor minute window for **`journeyLimiter`** on journey routes (default `60000`) |
| `AURA_API_RATE_LIMIT_JOURNEY_MAX` | no | Max requests per **`journeyLimiter`** window (default `40`) |
| `AURA_API_RATE_LIMIT_SOS_WINDOW_MS` | no | Window for **`sosLimiter`** on `POST /v1/emergency-alerts` (default `3600000`, one hour) |
| `AURA_API_RATE_LIMIT_SOS_MAX` | no | Max SOS posts per SOS window (default `8`) |
| `AURA_API_RATE_LIMIT_LOCATION_SHARE_WINDOW_MS` | no | Window for hourly location-share cap (default `3600000`) |
| `AURA_API_RATE_LIMIT_LOCATION_SHARE_MAX` | no | Max location shares per share window (default `48`) |
| `AURA_API_RATE_LIMIT_IM_SAFE_WINDOW_MS` | no | Window for hourly im-safe cap (default `3600000`) |
| `AURA_API_RATE_LIMIT_IM_SAFE_MAX` | no | Max im-safe posts per im-safe window (default `36`) |
| `AURA_API_RATE_LIMIT_SOS_BURST_WINDOW_MS` | no | Rolling window for SOS burst anomaly scoring only (default `600000`, ten minutes) |
| `AURA_API_RATE_LIMIT_SOS_BURST_THRESHOLD` | no | SOS posts in burst window before `X-Aura-Anomaly: burst_sos` on success (default `3`) |
| `AURA_API_RATE_LIMIT_LOCATION_SHARE_BURST_WINDOW_MS` | no | Rolling window for location-share burst anomaly (default `600000`) |
| `AURA_API_RATE_LIMIT_LOCATION_SHARE_BURST_THRESHOLD` | no | Shares in burst window before `burst_location_share` anomaly header (default `12`) |
| `AURA_API_PROMETHEUS_METRICS` | no | When set to a **non-empty** value after trim (and not `0` / `false` / `no`), enables **`GET /metrics`** in Prometheus text exposition format (`text/plain`), **no bearer required** — same exposure model as **`GET /health`**. Includes Node **default process metrics** (`prom-client`) plus **`http_requests_total`** labeled by **`method`**, **`status_code`**, and **`route`** (Express route pattern when matched, else `unmatched` or well-known paths). **Default: disabled** (unset or empty) — `GET /metrics` then returns **`404`** `not_found` like any unknown path. **Do not** put `/metrics` on the public internet; restrict by network policy, internal scrape addresses, or reverse-proxy ACLs. |

## Routes

- `POST /v1/journeys` — body `{}`; creates a journey bound to the current bearer actor and returns `{ journeyId }` (audit: `journey.created`). **Call this before** location-share or I’m-safe for that id.
- `POST /v1/emergency-alerts` — body `{ "mode": "silent" \| "visible" }`
- `POST /v1/journeys/:journeyId/location-shares` — UUID journey id **registered via** `POST /v1/journeys` **for this token**; otherwise `404 journey_not_found` or `403 journey_forbidden`. JSON body `{}` or optional `{ latitude, longitude, accuracyM?, recordedAt? }` (lat/lon must appear together). Hourly rate limit + burst anomaly header `X-Aura-Anomaly: burst_location_share` when thresholds are exceeded.
- `POST /v1/journeys/:journeyId/im-safe` — same ownership rules as location-shares; **hourly** rate limit (layered under global + per-minute journey limits)
- `GET /health` — liveness (process up). JSON is `{ ok, service }`; when `AURA_API_DEPLOY_VERSION` and/or `AURA_API_GIT_SHA` are set, response also includes **`deployVersion`** and/or **`gitSha`**.
- `GET /ready` — readiness: **at least one** of `AURA_API_BEARER_TOKEN` or `AURA_API_BFF_JWT_SECRET` set, and directories for `AUDIT_LOG_PATH`, `AURA_API_JOURNEY_STORE_SQLITE_PATH`, and `AURA_API_JOURNEY_STORE_JSONL_PATH` writable (**503** `not_ready` otherwise). In **`NODE_ENV=production`**, **503** `not_ready` also applies if both a non-empty static bearer (`AURA_API_BEARER_TOKEN` or `AURA_API_BEARER_TOKEN_ALT`) and `AURA_API_BFF_JWT_SECRET` are set. Base JSON includes `ready`; optional **`deployVersion`** / **`gitSha`** are merged into both **200** and **503** responses when those env vars are set.
- `GET /metrics` — **optional operator surface** when `AURA_API_PROMETHEUS_METRICS` is enabled (see env table). **200** `text/plain` Prometheus exposition; **no** `Authorization` required. Omitted from the process (same as unknown paths → **404** `not_found`) when the flag is off.

All JSON responses include baseline headers: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`, and **`X-Request-Id`** (request correlation; see [`API_CONTRACT.md`](../web/docs/API_CONTRACT.md)).

Optional request headers: `X-Request-Id` / `X-Correlation-Id` (printable ASCII, max 128 characters) to supply a client trace id; otherwise the server generates a UUID. Optional: `X-Aura-Device-Fingerprint` (opaque client id; stored hashed in audit).

Append-only audit lines for mutations, validation failures, and rate limits include a **`requestId`** field matching the response `X-Request-Id`.

When burst SOS threshold is exceeded within 10 minutes, responses may include `X-Aura-Anomaly: burst_sos` for downstream alerting. Location shares use a separate burst detector (`burst_location_share`). Dedicated rate-limit responses append `audit.rate_limited` lines to the audit log.
