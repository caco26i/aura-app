# Aura API (authoritative boundary)

Validates SOS, location share, and “I’m safe” payloads; enforces **static bearer** and/or **BFF HS256 JWT** auth, rate limits, and append-only **JSON-lines audit** (treat the log file as WORM in production — ship to object storage / SIEM). Ops: [`docs/RUNBOOK_AUDIT.md`](./docs/RUNBOOK_AUDIT.md).

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

## Tests

```bash
npm test
```

Integration tests exercise auth (static bearer, **BFF JWT** `sub`-scoped journey ownership), Zod validation, wrong-method and CORS preflight, malformed JSON → **`400 invalid_json`**, SOS **`429 rate_limited`** (hourly cap; emergency tests grouped at the **end** of the file), **im-safe** hourly cap (`audit.rate_limited` route `im-safe`), and append-only audit writes (`test/api.integration.test.js`). They use `AURA_API_SKIP_LISTEN=1` and a temp audit file via env.

On GitHub, the **Server API tests** workflow runs `npm ci` + `npm test` in `server/` when `server/` or that workflow file changes.

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
| `CORS_ORIGIN` | no | `*` or comma-separated allowlist |
| `AURA_API_JSON_BODY_LIMIT` | no | Express JSON body size (default `24kb`) |

## Routes

- `POST /v1/journeys` — body `{}`; creates a journey bound to the current bearer actor and returns `{ journeyId }` (audit: `journey.created`). **Call this before** location-share or I’m-safe for that id.
- `POST /v1/emergency-alerts` — body `{ "mode": "silent" \| "visible" }`
- `POST /v1/journeys/:journeyId/location-shares` — UUID journey id **registered via** `POST /v1/journeys` **for this token**; otherwise `404 journey_not_found` or `403 journey_forbidden`. JSON body `{}` or optional `{ latitude, longitude, accuracyM?, recordedAt? }` (lat/lon must appear together). Hourly rate limit + burst anomaly header `X-Aura-Anomaly: burst_location_share` when thresholds are exceeded.
- `POST /v1/journeys/:journeyId/im-safe` — same ownership rules as location-shares; **hourly** rate limit (layered under global + per-minute journey limits)
- `GET /health` — liveness (process up).
- `GET /ready` — readiness: **at least one** of `AURA_API_BEARER_TOKEN` or `AURA_API_BFF_JWT_SECRET` set, and `AUDIT_LOG_PATH` directory writable (**503** `not_ready` otherwise). Use for orchestration / load balancer health when audit persistence must succeed.

All JSON responses include baseline headers: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer` (see [`API_CONTRACT.md`](../web/docs/API_CONTRACT.md)).

Optional header: `X-Aura-Device-Fingerprint` (opaque client id; stored hashed in audit).

When burst SOS threshold is exceeded within 10 minutes, responses may include `X-Aura-Anomaly: burst_sos` for downstream alerting. Location shares use a separate burst detector (`burst_location_share`). Dedicated rate-limit responses append `audit.rate_limited` lines to the audit log.
