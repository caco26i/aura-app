# Aura BFF (OAuth → session → API JWT)

Small **backend-for-frontend** that turns **Google or Firebase Authentication** into **short-lived HS256 JWTs** the Aura API accepts (`AURA_API_BFF_JWT_SECRET` — same verification as [`../README.md`](../README.md)).

## Request correlation and response headers

Every response includes the same baseline headers as the authoritative Aura API ([`../src/index.js`](../src/index.js), [`../../web/docs/API_CONTRACT.md`](../../web/docs/API_CONTRACT.md)). That includes **`GET /ready`** (readiness): **200** `{ ok, service, ready: true }` when **`AURA_API_BFF_JWT_SECRET`** and **`AURA_BFF_SESSION_SECRET`** meet the same minimum rules as `POST /auth/google` / `GET /session` (≥16 chars, non-empty — see `readBffConfigErrors()` in [`src/createApp.js`](src/createApp.js)); otherwise **503** with `{ ok: false, error: "not_ready", detail, service, ready: false }`, matching the API’s `not_ready` pattern in [`../../web/docs/API_CONTRACT.md`](../../web/docs/API_CONTRACT.md). **`GET /health`** stays **200** whenever the process is up (liveness); the BFF image **`HEALTHCHECK`** continues to use **`/health`** so containers are not marked unhealthy during secret rotation or misconfiguration windows where **`/ready`** is **503**.

- **`X-Request-Id`** — echoed from a valid **`X-Request-Id`** or **`X-Correlation-Id`** (printable ASCII, max **128** chars) or a generated UUID when missing/invalid.
- **`X-Content-Type-Options: nosniff`**, **`X-Frame-Options: DENY`**, **`Referrer-Policy: no-referrer`**.

CORS is configured with **`X-Request-Id` / `X-Correlation-Id`** in **allowed** and **exposed** headers so cross-origin browser clients can send and read the correlation id where applicable. Oversized or malformed JSON bodies on POST routes return **`413` `payload_too_large`** or **`400` `invalid_json`** (same envelope shape as the API) with these headers still present.

## Rate limiting

`express-rate-limit` applies **separate per-IP** caps to `POST /auth/google`, `POST /auth/firebase`, `GET /session`, and `POST /logout` (see env table), plus a **shared read-path** bucket for **`GET /health`** and **`GET /ready`** (`AURA_BFF_RATE_LIMIT_READ_*`). On exceed: **429** with `{ ok: false, error: "rate_limited", detail }` (same `error` code as the authoritative API in [`../../web/docs/API_CONTRACT.md`](../../web/docs/API_CONTRACT.md)). Standard rate-limit response headers are enabled. At the edge, a WAF or CDN should still enforce broader abuse controls; these knobs protect the BFF process when traffic reaches origin.

## Threat model (SPA + `GET /session`)

- The access token is returned as JSON and held in **memory** in the browser for API `Authorization: Bearer …`. Any **XSS** can exfiltrate it; mitigate with CSP, dependency hygiene, and short TTL (`AURA_BFF_JWT_TTL_SECONDS`, default 900).
- The BFF session cookie is **httpOnly** → JS cannot read it; reduces credential theft vs storing the API JWT in `localStorage`.
- **CSRF:** `POST /auth/google`, `POST /auth/firebase`, and `GET /session` use **same-site** cookies (`Lax`). Cross-site form posts to the BFF do not send the cookie on unsafe methods in modern browsers; prefer explicit CORS allowlists in production.

## Flows

1. **Recommended (matches `@react-oauth/google`):** After the SPA obtains a Google **ID token** (`credential`), call `POST /auth/google` with `{ "idToken": "…" }` and `credentials: 'include'`. Then `GET /session` returns `{ accessToken, expiresAt }`. **No Google client secret** required on the server for this path.
2. **Optional redirect:** Set `AURA_BFF_GOOGLE_CLIENT_SECRET` and `AURA_BFF_PUBLIC_URL`, add the callback URL in Google Cloud Console, then send the user to `GET /auth/google/start?returnTo=/path`.
3. **Firebase (email/password on the web app):** After the SPA signs in with the Firebase Web SDK, call `POST /auth/firebase` with `{ "idToken": "<Firebase ID token>" }` and `credentials: 'include'`. The BFF verifies the token with **Firebase Admin** and stores the Firebase `uid` in the session; `GET /session` mints the same API JWT shape as Google. Configure **`FIREBASE_SERVICE_ACCOUNT_JSON`** (full JSON string of a service account with *Token Verification* / project access) or **`GOOGLE_APPLICATION_CREDENTIALS`** (path to that JSON file).

## Env

| Variable | Required | Description |
|----------|----------|-------------|
| `AURA_BFF_GOOGLE_CLIENT_ID` | Google routes | Same as web `VITE_GOOGLE_CLIENT_ID` — required for `POST /auth/google` and redirect OAuth |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Firebase route | Inline JSON for a Firebase Admin service account (alternative to file path below) |
| `GOOGLE_APPLICATION_CREDENTIALS` | Firebase route | Path to service account JSON when using Firebase Admin verification |
| `AURA_API_BFF_JWT_SECRET` | yes | Shared with Aura API — signs access JWTs |
| `AURA_BFF_SESSION_SECRET` | yes | `express-session` signing secret (≥16 chars) |
| `AURA_BFF_CORS_ORIGIN` | prod | Comma-separated browser origins allowed for credentialed CORS (omit in dev to reflect request `Origin`) |
| `AURA_BFF_GOOGLE_CLIENT_SECRET` | redirect only | OAuth client secret |
| `AURA_BFF_PUBLIC_URL` | redirect only | Public base URL of this BFF (no trailing slash) |
| `AURA_BFF_JWT_TTL_SECONDS` | no | Access JWT lifetime (default `900`) |
| `AURA_BFF_JWT_ISSUER` / `AURA_BFF_JWT_AUDIENCE` | no | If set, must match API `AURA_API_BFF_JWT_ISSUER` / `AURA_API_BFF_JWT_AUDIENCE` |
| `AURA_BFF_JSON_BODY_LIMIT` | no | Max JSON body size for `express.json` (default `32kb`; mirrors API `AURA_API_JSON_BODY_LIMIT`) |
| `AURA_BFF_RATE_LIMIT_AUTH_GOOGLE_WINDOW_MS` / `AURA_BFF_RATE_LIMIT_AUTH_GOOGLE_MAX` | no | Per-IP window + max requests for `POST /auth/google` and `POST /auth/firebase` (defaults `60000` / `5000` — permissive for dev/CI; **lower in production**, e.g. `900000` / `30` for a 15‑minute brute-force throttle) |
| `AURA_BFF_RATE_LIMIT_SESSION_WINDOW_MS` / `AURA_BFF_RATE_LIMIT_SESSION_MAX` | no | Per-IP limits for `GET /session` (defaults `60000` / `10000`) |
| `AURA_BFF_RATE_LIMIT_LOGOUT_WINDOW_MS` / `AURA_BFF_RATE_LIMIT_LOGOUT_MAX` | no | Per-IP limits for `POST /logout` (defaults `60000` / `2000`) |
| `AURA_BFF_RATE_LIMIT_READ_WINDOW_MS` / `AURA_BFF_RATE_LIMIT_READ_MAX` | no | Per-IP shared bucket for **`GET /health`** + **`GET /ready`** (defaults `60000` / `600`) |
| `AURA_BFF_RATE_LIMIT_READ_SKIP` | no | When `1`, disables the read-path limiter |
| `PORT` | no | Default `8790` |

Aliases: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` are accepted.

## Staging and production (reverse proxy + CORS)

- **Same-origin BFF (typical):** The SPA is built with `VITE_AURA_BFF_URL=/aura-bff` (or another path). Terminate TLS at your edge, then forward that path to this process. Match prefix handling to your web server (reference: [`web/nginx-docker-bff.conf`](../../web/nginx-docker-bff.conf) in the repo root stack).
- **Cross-origin BFF:** If the browser calls a different host than the static SPA, set **`AURA_BFF_CORS_ORIGIN`** to the exact SPA origin(s); credentialed `fetch` to `POST /auth/google`, `POST /auth/firebase`, and `GET /session` requires an explicit allowlist in production.
- **JWT secret parity:** `AURA_API_BFF_JWT_SECRET` must match the Aura API service **byte-for-byte**. Rotate by deploying API and BFF together with the new value.

## Run

```bash
cd server/bff
export AURA_BFF_GOOGLE_CLIENT_ID="…"
export AURA_API_BFF_JWT_SECRET="$(openssl rand -hex 32)"
export AURA_BFF_SESSION_SECRET="$(openssl rand -hex 32)"
npm install
npm run dev
```

## Tests

HTTP-level integration tests use **supertest** against `createApp()` from [`src/createApp.js`](src/createApp.js). Google ID token verification is **injected** in tests so CI never calls Google.

```bash
cd server/bff
npm install
npm test
```

Tests load minimal env via `test/load-test-env.mjs` (see `npm test` script). The main entry [`src/index.js`](src/index.js) only binds a listening port when executed directly (`npm start` / `node src/index.js`), so imports do not accidentally listen during tests.

## Routes

- `GET /health` — liveness (process up)
- `GET /ready` — readiness (JWT + session secrets configured for issuing tokens; **503** `not_ready` otherwise). Use behind a load balancer for traffic routing; keep Docker **`HEALTHCHECK`** on **`/health`** (see above).
- `POST /auth/google` — body `{ idToken }` (Google credential JWT)
- `POST /auth/firebase` — body `{ idToken }` (Firebase ID token from the Web SDK)
- `GET /session` — `{ ok, accessToken, expiresAt }` or `401 not_authenticated`
- `POST /logout` — clear session
- `GET /auth/google/start` — redirect OAuth (requires secret + public URL)
- `GET /auth/google/callback` — OAuth callback

Web integration: [`../../web/docs/BETA_BACKEND.md`](../../web/docs/BETA_BACKEND.md), `VITE_AURA_BFF_URL`.
