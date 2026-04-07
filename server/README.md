# Aura API (authoritative boundary)

Validates SOS, location share, and “I’m safe” payloads; enforces bearer auth and rate limits; appends an **immutable JSON-lines audit log** (treat the log file as WORM in production — ship to object storage / SIEM).

## Run locally

```bash
export AURA_API_BEARER_TOKEN="$(openssl rand -hex 24)"
npm install
npm run dev
```

## Env

| Variable | Required | Description |
|----------|----------|-------------|
| `AURA_API_BEARER_TOKEN` | yes | Shared secret; `Authorization: Bearer …` on all mutating routes |
| `PORT` | no | Default `8787` |
| `AUDIT_LOG_PATH` | no | Default `./data/audit.log` |
| `CORS_ORIGIN` | no | `*` or comma-separated allowlist |

## Routes

- `POST /v1/emergency-alerts` — body `{ "mode": "silent" \| "visible" }`
- `POST /v1/journeys/:journeyId/location-shares` — UUID journey id
- `POST /v1/journeys/:journeyId/im-safe` — UUID journey id
- `GET /health`

Optional header: `X-Aura-Device-Fingerprint` (opaque client id; stored hashed in audit).

When burst SOS threshold is exceeded within 10 minutes, responses may include `X-Aura-Anomaly: burst_sos` for downstream alerting.
