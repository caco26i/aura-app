# Aura API (authoritative boundary)

Validates SOS, location share, and “I’m safe” payloads; enforces **static bearer** and/or **BFF HS256 JWT** auth, rate limits, and append-only **JSON-lines audit** (treat the log file as WORM in production — ship to object storage / SIEM). Ops: [`docs/RUNBOOK_AUDIT.md`](./docs/RUNBOOK_AUDIT.md).

**BFF (Google → session → access JWT):** in-repo service at [`bff/`](./bff/) signs **`sub`-scoped** HS256 tokens with the same `AURA_API_BFF_JWT_SECRET` this API verifies. Production/staging should omit static `VITE_AURA_API_TOKEN` and use the BFF + web `VITE_AURA_BFF_URL` path (see [`../web/docs/BETA_BACKEND.md`](../web/docs/BETA_BACKEND.md)).

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

```bash
npm test
```

Integration tests exercise auth (static bearer, **BFF JWT** `sub`-scoped journey ownership), Zod validation, wrong-method and CORS preflight, malformed JSON → **`400 invalid_json`**, SOS **`429 rate_limited`** (hourly cap; emergency tests grouped at the **end** of `api.integration.test.js`), **im-safe** hourly cap (`audit.rate_limited` route `im-safe`), **minute-window** journey limiter (`api.rate-limit-minute.integration.test.js`), append-only audit writes, **journey store unit restart checks** (`journey-registry.restart.test.js`), and **HTTP continuity across two Node processes** (`journey-http-restart.integration.test.js` + `journey-restart-phase.mjs`). Default API tests set `AURA_API_JOURNEY_STORE=memory`; subprocess test uses a temp SQLite file.

On GitHub, the **Server API tests** workflow runs `npm ci` + `npm test` in `server/` and a **`docker build`** smoke on `server/Dockerfile` when `server/`, `web/docs/API_CONTRACT.md`, or that workflow file changes.

## Env

| Variable | Required | Description |
|----------|----------|-------------|
| `AURA_API_BEARER_TOKEN` | one of | Shared secret for beta / dev; use with `Authorization: Bearer …`. Omit in production if you rely only on JWTs. |
| `AURA_API_BFF_JWT_SECRET` | one of | HS256 secret for **BFF-issued** access tokens. When set, a **three-segment** Bearer value is verified as JWT (claims: **`sub`** required, **`exp`** enforced; optional **`iss`** / **`aud`** via env below). Journey ownership is keyed by `sub`, so refreshed tokens for the same user stay compatible. |
| `AURA_API_BFF_JWT_ISSUER` | no | If set, JWT `iss` must match. |
| `AURA_API_BFF_JWT_AUDIENCE` | no | If set, JWT `aud` must match (string or array). |
| `AURA_API_BEARER_TOKEN_ALT` | no | Optional second static bearer (separate actor). Tests use it for `journey_forbidden` across actors. |
| `PORT` | no | Default `8787` |
| `AUDIT_LOG_PATH` | no | Default `./data/audit.log` |
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

## Routes

- `POST /v1/journeys` — body `{}`; creates a journey bound to the current bearer actor and returns `{ journeyId }` (audit: `journey.created`). **Call this before** location-share or I’m-safe for that id.
- `POST /v1/emergency-alerts` — body `{ "mode": "silent" \| "visible" }`
- `POST /v1/journeys/:journeyId/location-shares` — UUID journey id **registered via** `POST /v1/journeys` **for this token**; otherwise `404 journey_not_found` or `403 journey_forbidden`. JSON body `{}` or optional `{ latitude, longitude, accuracyM?, recordedAt? }` (lat/lon must appear together). Hourly rate limit + burst anomaly header `X-Aura-Anomaly: burst_location_share` when thresholds are exceeded.
- `POST /v1/journeys/:journeyId/im-safe` — same ownership rules as location-shares; **hourly** rate limit (layered under global + per-minute journey limits)
- `GET /health` — liveness (process up).
- `GET /ready` — readiness: **at least one** of `AURA_API_BEARER_TOKEN` or `AURA_API_BFF_JWT_SECRET` set, and directories for `AUDIT_LOG_PATH`, `AURA_API_JOURNEY_STORE_SQLITE_PATH`, and `AURA_API_JOURNEY_STORE_JSONL_PATH` writable (**503** `not_ready` otherwise). Use for orchestration / load balancer health when persistence must succeed.

All JSON responses include baseline headers: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`, and **`X-Request-Id`** (request correlation; see [`API_CONTRACT.md`](../web/docs/API_CONTRACT.md)).

Optional request headers: `X-Request-Id` / `X-Correlation-Id` (printable ASCII, max 128 characters) to supply a client trace id; otherwise the server generates a UUID. Optional: `X-Aura-Device-Fingerprint` (opaque client id; stored hashed in audit).

Append-only audit lines for mutations, validation failures, and rate limits include a **`requestId`** field matching the response `X-Request-Id`.

When burst SOS threshold is exceeded within 10 minutes, responses may include `X-Aura-Anomaly: burst_sos` for downstream alerting. Location shares use a separate burst detector (`burst_location_share`). Dedicated rate-limit responses append `audit.rate_limited` lines to the audit log.
