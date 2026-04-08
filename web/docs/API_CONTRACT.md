# Aura HTTP API contract (beta)

Canonical server behavior: [`../../server/README.md`](../../server/README.md). This page is the **cross-team handshake** for response envelopes, error codes, and headers the web client relies on (`src/api/auraBackend.ts`, `src/api/auraApiMessages.ts`).

**Coordination:** Backend track [AURA-60](/AURA/issues/AURA-60); parallel UI work [AURA-59](/AURA/issues/AURA-59). Treat changes to paths, envelopes, or `error` **codes** as breaking unless both sides ship together.

**Beta approval:** CTO ack on this handshake — [comment 4ea48512](/AURA/issues/AURA-60#comment-4ea48512-499f-49f8-8fd8-23a7902b8cb2) (review-only; ship FE/BE together or version when changing the contract).

## Transport and auth (beta)

| Item | Rule |
|------|------|
| Base URL | Same-origin in dev (Vite proxy → `server/`), or `VITE_AURA_API_URL` when set |
| Auth | `Authorization: Bearer <token>` must match server `AURA_API_BEARER_TOKEN` |
| Fingerprint | Optional `X-Aura-Device-Fingerprint` (opaque); server stores a hash in audit only |
| Content-Type | `application/json` on POST bodies when a body is sent |

## Success envelope

HTTP **201** (creates) or **200** (`GET /health`). Body shape:

```json
{ "ok": true, "data": { /* route-specific */ } }
```

| Route | `data` shape |
|-------|----------------|
| `POST /v1/journeys` | `{ "journeyId": "<uuid>" }` |
| `POST /v1/emergency-alerts` | `{ "alertId": "<uuid>" }` |
| `POST /v1/journeys/:id/location-shares` | `{ "shareId": "<uuid>" }` |
| `POST /v1/journeys/:id/im-safe` | `{ "receivedAt": "<ISO-8601>" }` |
| `GET /health` | `{ "ok": true, "service": "aura-api" }` (no nested `data`) |

**Note:** `/health` is the only documented JSON success without `{ ok, data }`; the web app does not call it through `auraBackend.ts`.

## Error envelope

```json
{ "ok": false, "error": "<code>", "detail": /* optional; often Zod flatten object */ }
```

The client reads **`error`** (string) for mapping; `detail` is diagnostic.

## HTTP status ↔ `error` (authoritative API)

| Status | Typical `error` | Meaning |
|--------|-----------------|--------|
| 400 | `validation_failed` | Body or params failed Zod |
| 400 | `invalid_journey_id` | `:journeyId` is not a UUID |
| 401 | `unauthorized` | Missing / malformed `Authorization` |
| 403 | `forbidden` | Bearer does not match server secret |
| 403 | `journey_forbidden` | UUID valid but owned by another actor (future multi-token / BFF) |
| 404 | `journey_not_found` | Journey id unknown to server for this deployment |
| 404 | `not_found` | Unknown path |
| 429 | `rate_limited` | express-rate-limit (SOS or location-shares) |
| 503 | `server_misconfigured` | e.g. `AURA_API_BEARER_TOKEN` unset |

## Response headers

| Header | When | Client use |
|--------|------|------------|
| `X-Aura-Anomaly` | Optional on **successful** SOS or location-share | `noticeForAnomalyHeader()` → soft notice (still `ok: true`) |
| Rate-limit headers | Standard `express-rate-limit` | Browser surfaces 429 via `userMessageForHttpFailure` |

Allowed anomaly tokens today: `burst_sos`, `burst_location_share` (comma-separated if multiple).

## Request bodies (current web usage)

| Call in `auraBackend.ts` | Body |
|---------------------------|------|
| `postCreateJourney` | `{}` |
| `postEmergencyAlert` | `{ "mode": "silent" }` or `{ "mode": "visible" }` |
| `postShareLocation` | `{}` (UI does not send lat/lon yet; server accepts optional coordinates) |
| `postImSafe` | No body (fetch without `body`) |

## Regression coverage

Server integration tests: `server/test/api.integration.test.js` (`npm test` in `server/`).
