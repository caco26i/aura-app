# Aura HTTP API contract (beta)

Canonical server behavior: [`../../server/README.md`](../../server/README.md). This page is the **cross-team handshake** for response envelopes, error codes, and headers the web client relies on (`src/api/auraBackend.ts`, `src/api/auraApiMessages.ts`).

**Coordination:** Backend track [AURA-60](/AURA/issues/AURA-60); parallel UI work [AURA-59](/AURA/issues/AURA-59). Treat changes to paths, envelopes, or `error` **codes** as breaking unless both sides ship together.

**Beta approval:** CTO ack on this handshake — [comment 4ea48512](/AURA/issues/AURA-60#comment-4ea48512-499f-49f8-8fd8-23a7902b8cb2) (review-only; ship FE/BE together or version when changing the contract).

## Transport and auth (beta)

| Item | Rule |
|------|------|
| Base URL | Same-origin in dev (Vite proxy → `server/`), or `VITE_AURA_API_URL` when set |
| Auth | `Authorization: Bearer <token>` — **static secret** matching `AURA_API_BEARER_TOKEN` (and optional `AURA_API_BEARER_TOKEN_ALT`), **or** a **three-segment HS256 JWT** signed with `AURA_API_BFF_JWT_SECRET` with claim **`sub`** (stable user id) and valid **`exp`**. Optional `iss` / `aud` enforced when `AURA_API_BFF_JWT_ISSUER` / `AURA_API_BFF_JWT_AUDIENCE` are set. Other schemes or missing `Bearer ` → **401** `unauthorized`. Invalid JWT or wrong static secret → **403** `forbidden`. |
| Browser clients | Prefer **OAuth → BFF** (`GET /session` issues the Bearer JWT); do not ship a static web token when using `VITE_AURA_BFF_URL` — production Vite builds error if both are set ([BETA_BACKEND.md](./BETA_BACKEND.md), [DEPLOY.md](./DEPLOY.md)). |
| Fingerprint | Optional `X-Aura-Device-Fingerprint` (opaque); server stores a hash in audit only |
| Correlation | Optional `X-Request-Id` or `X-Correlation-Id` — printable ASCII, max **128** chars; server echoes **`X-Request-Id`** on every response (generated UUID when omitted or invalid). The in-repo BFF (`server/bff`) follows the same rules on its routes. |
| Content-Type | `application/json` on POST bodies when a body is sent |
| JSON body size | Default **32kb** per route (`express.json`); override with **`AURA_API_JSON_BODY_LIMIT`** (authoritative API) — aligned with the in-repo BFF |
| Minute-window rate limits (mutating routes) | Tunable **`AURA_API_RATE_LIMIT_GLOBAL_WINDOW_MS`** / **`AURA_API_RATE_LIMIT_GLOBAL_MAX`** (`globalLimiter`) and **`AURA_API_RATE_LIMIT_JOURNEY_WINDOW_MS`** / **`AURA_API_RATE_LIMIT_JOURNEY_MAX`** (`journeyLimiter`); defaults and hourly caps in [`../../server/README.md`](../../server/README.md) |

## Success envelope

HTTP **201** (creates) or **200** (`GET /health`, `GET /ready` when ready). Body shape:

```json
{ "ok": true, "data": { /* route-specific */ } }
```

| Route | `data` shape |
|-------|----------------|
| `POST /v1/journeys` | `{ "journeyId": "<uuid>" }` |
| `POST /v1/emergency-alerts` | `{ "alertId": "<uuid>" }` |
| `POST /v1/journeys/:id/location-shares` | `{ "shareId": "<uuid>" }` |
| `POST /v1/journeys/:id/im-safe` | `{ "receivedAt": "<ISO-8601>" }` |
| `GET /health` | `{ "ok": true, "service": "aura-api" }` (no nested `data`). If `AURA_API_DEPLOY_VERSION` / `AURA_API_GIT_SHA` are set on the server, responses may also include string fields **`deployVersion`** and/or **`gitSha`**. |
| `GET /ready` | `{ "ok": true, "service": "aura-api", "ready": true }` when configured and audit dir writable; **503** with `error: "not_ready"` otherwise (no nested `data`). Optional **`deployVersion`** / **`gitSha`** use the same env vars and appear on both **200** and **503** when configured. |

**Note:** `/health` and `/ready` are documented JSON successes without `{ ok, data }`; the web app does not call them through `auraBackend.ts`.

## Error envelope

```json
{ "ok": false, "error": "<code>", "detail": /* optional; often Zod flatten object */ }
```

The client reads **`error`** (string) for mapping; `detail` is diagnostic.

## HTTP status ↔ `error` (authoritative API)

| Status | Typical `error` | Meaning |
|--------|-----------------|--------|
| 400 | `validation_failed` | Body or params failed Zod |
| 400 | `invalid_json` | `Content-Type: application/json` but body is not valid JSON (Express `entity.parse.failed`) |
| 413 | `payload_too_large` | JSON body over **`AURA_API_JSON_BODY_LIMIT`** (default 32kb); Express **`entity.too.large`** — same `{ ok, error, detail }` envelope as other API errors |
| 400 | `invalid_journey_id` | `:journeyId` is not a UUID |
| 401 | `unauthorized` | Missing / malformed `Authorization` |
| 403 | `forbidden` | Bearer does not match server secret |
| 403 | `journey_forbidden` | UUID valid but owned by another actor (future multi-token / BFF) |
| 404 | `journey_not_found` | Journey id unknown to server for this deployment |
| 404 | `not_found` | Unknown path |
| 429 | `rate_limited` | express-rate-limit — **minute** windows (`globalLimiter` / `journeyLimiter` on mutating routes) or **hourly** caps (SOS, location-shares, im-safe); JSON envelope `{ ok: false, error, detail }`; `audit.rate_limited` with a `route` label |
| 503 | `server_misconfigured` | Neither `AURA_API_BEARER_TOKEN` nor `AURA_API_BFF_JWT_SECRET` configured |
| 503 | `not_ready` | `GET /ready` only: neither static bearer nor BFF JWT secret configured, or audit log directory not writable |

## Response headers

| Header | When | Client use |
|--------|------|------------|
| `X-Content-Type-Options: nosniff` | All responses | Reduces MIME sniffing risk for JSON API |
| `X-Frame-Options: DENY` | All responses | Clickjacking hardening (API not intended in frames) |
| `Referrer-Policy: no-referrer` | All responses | Limits referrer leakage on cross-origin navigations from error pages |
| `X-Request-Id` | All responses | Same value as the request’s accepted id (from `X-Request-Id` / `X-Correlation-Id` when valid) or a server-generated UUID; correlate with JSONL audit `requestId` |
| `X-Aura-Anomaly` | Optional on **successful** SOS or location-share | `noticeForAnomalyHeader()` → soft notice (still `ok: true`) |
| Rate-limit headers | Standard `express-rate-limit` | Browser surfaces 429 via `userMessageForHttpFailure` |

Allowed anomaly tokens today: `burst_sos`, `burst_location_share` (comma-separated if multiple).

## Request bodies (current web usage)

| Call in `auraBackend.ts` | Body |
|---------------------------|------|
| `postCreateJourney` | `{}` |
| `postEmergencyAlert` | `{ "mode": "silent" }` or `{ "mode": "visible" }` |
| `postShareLocation` | `{}` (UI does not send lat/lon yet; server accepts optional coordinates) |
| `postImSafe` | No body (fetch without `body`); server rejects any non-empty JSON with `validation_failed` |

## Regression coverage

Server integration tests: `server/test/api.integration.test.js`, `server/test/api.rate-limit-minute.integration.test.js`, `server/test/journey-registry.restart.test.js`, and `server/test/journey-http-restart.integration.test.js` (`npm test` in `server/`). Includes **BFF JWT** path (`AURA_API_BFF_JWT_SECRET` in tests): same **`sub`** across two tokens can **`im-safe`** on an owned journey; invalid signature / expired **`exp`** → **`403`**. Also: `invalid_journey_id` on `:journeyId` routes, **`im-safe` non-empty body → `validation_failed`**, malformed JSON → **`invalid_json`**, **oversized JSON body → `413` `payload_too_large`** (default limit), **`401`** for non-`Bearer` `Authorization`, unknown-path / wrong-method **`not_found`**, **OPTIONS** CORS preflight, **`403` `journey_forbidden`** when a second static bearer (`AURA_API_BEARER_TOKEN_ALT`) calls **location-share** or **`im-safe`** on another actor’s journey, baseline **security headers** on `GET /health` and sample **error** responses (`404`, `401`), **`429` `rate_limited`** on **`POST /v1/emergency-alerts`** after the hourly SOS cap (emergency tests grouped at the **end** of the main suite; `audit.rate_limited` in the audit file), **`429`** when the **minute-window journey** limiter trips on **`POST /v1/journeys`** (dedicated env-tuned test file). **im-safe** has an additional hourly cap. Production: prefer **`AURA_API_BFF_JWT_SECRET`** without static bearer in the browser; optional `AURA_API_BEARER_TOKEN_ALT` for two static actors in staging.
