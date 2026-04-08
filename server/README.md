# Aura API (authoritative boundary)

Validates SOS, location share, and “I’m safe” payloads; enforces bearer auth and rate limits; appends an **immutable JSON-lines audit log** (treat the log file as WORM in production — ship to object storage / SIEM).

**Client contract:** [`../web/docs/API_CONTRACT.md`](../web/docs/API_CONTRACT.md) (envelopes, error codes, headers). Change it in lockstep with `web/src/api/auraBackend.ts` / `auraApiMessages.ts`.

## Related docs (web package)

Stack setup beyond this README (client auth, deploy, security, observability, and **client ↔ API** integration) lives under **[`../web/docs/`](../web/docs/)** in the web package. For local wiring, start with [`../web/docs/BETA_BACKEND.md`](../web/docs/BETA_BACKEND.md) alongside the env table below. That doc ties **PDR §4.2** to the web app: create journey first, then share / I’m safe; the web client maps `journey_not_found`, `journey_forbidden`, and related codes to calm session-style copy in [`../web/src/api/auraApiMessages.ts`](../web/src/api/auraApiMessages.ts).

## Run locally

```bash
export AURA_API_BEARER_TOKEN="$(openssl rand -hex 24)"
npm install
npm run dev
```

## Tests

```bash
npm test
```

Integration tests exercise auth, Zod validation, journey ownership, rate-limit-adjacent routes, and append-only audit writes (see `test/api.integration.test.js`). They use `AURA_API_SKIP_LISTEN=1` and a temp audit file via env.

## Env

| Variable | Required | Description |
|----------|----------|-------------|
| `AURA_API_BEARER_TOKEN` | yes | Shared secret; `Authorization: Bearer …` on all mutating routes |
| `PORT` | no | Default `8787` |
| `AUDIT_LOG_PATH` | no | Default `./data/audit.log` |
| `CORS_ORIGIN` | no | `*` or comma-separated allowlist |

## Routes

- `POST /v1/journeys` — body `{}`; creates a journey bound to the current bearer actor and returns `{ journeyId }` (audit: `journey.created`). **Call this before** location-share or I’m-safe for that id.
- `POST /v1/emergency-alerts` — body `{ "mode": "silent" \| "visible" }`
- `POST /v1/journeys/:journeyId/location-shares` — UUID journey id **registered via** `POST /v1/journeys` **for this token**; otherwise `404 journey_not_found` or `403 journey_forbidden`. JSON body `{}` or optional `{ latitude, longitude, accuracyM?, recordedAt? }` (lat/lon must appear together). Hourly rate limit + burst anomaly header `X-Aura-Anomaly: burst_location_share` when thresholds are exceeded.
- `POST /v1/journeys/:journeyId/im-safe` — same ownership rules as location-shares
- `GET /health`

Optional header: `X-Aura-Device-Fingerprint` (opaque client id; stored hashed in audit).

When burst SOS threshold is exceeded within 10 minutes, responses may include `X-Aura-Anomaly: burst_sos` for downstream alerting. Location shares use a separate burst detector (`burst_location_share`). Dedicated rate-limit responses append `audit.rate_limited` lines to the audit log.
