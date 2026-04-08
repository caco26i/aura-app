# Aura BFF (OAuth → session → API JWT)

Small **backend-for-frontend** that turns **Google sign-in** into **short-lived HS256 JWTs** the Aura API accepts (`AURA_API_BFF_JWT_SECRET` — same verification as [`../README.md`](../README.md)).

## Threat model (SPA + `GET /session`)

- The access token is returned as JSON and held in **memory** in the browser for API `Authorization: Bearer …`. Any **XSS** can exfiltrate it; mitigate with CSP, dependency hygiene, and short TTL (`AURA_BFF_JWT_TTL_SECONDS`, default 900).
- The BFF session cookie is **httpOnly** → JS cannot read it; reduces credential theft vs storing the API JWT in `localStorage`.
- **CSRF:** `POST /auth/google` and `GET /session` use **same-site** cookies (`Lax`). Cross-site form posts to the BFF do not send the cookie on unsafe methods in modern browsers; prefer explicit CORS allowlists in production.

## Flows

1. **Recommended (matches `@react-oauth/google`):** After the SPA obtains a Google **ID token** (`credential`), call `POST /auth/google` with `{ "idToken": "…" }` and `credentials: 'include'`. Then `GET /session` returns `{ accessToken, expiresAt }`. **No Google client secret** required on the server for this path.
2. **Optional redirect:** Set `AURA_BFF_GOOGLE_CLIENT_SECRET` and `AURA_BFF_PUBLIC_URL`, add the callback URL in Google Cloud Console, then send the user to `GET /auth/google/start?returnTo=/path`.

## Env

| Variable | Required | Description |
|----------|----------|-------------|
| `AURA_BFF_GOOGLE_CLIENT_ID` | yes | Same as web `VITE_GOOGLE_CLIENT_ID` |
| `AURA_API_BFF_JWT_SECRET` | yes | Shared with Aura API — signs access JWTs |
| `AURA_BFF_SESSION_SECRET` | yes | `express-session` signing secret (≥16 chars) |
| `AURA_BFF_CORS_ORIGIN` | prod | Comma-separated browser origins allowed for credentialed CORS (omit in dev to reflect request `Origin`) |
| `AURA_BFF_GOOGLE_CLIENT_SECRET` | redirect only | OAuth client secret |
| `AURA_BFF_PUBLIC_URL` | redirect only | Public base URL of this BFF (no trailing slash) |
| `AURA_BFF_JWT_TTL_SECONDS` | no | Access JWT lifetime (default `900`) |
| `AURA_BFF_JWT_ISSUER` / `AURA_BFF_JWT_AUDIENCE` | no | If set, must match API `AURA_API_BFF_JWT_ISSUER` / `AURA_API_BFF_JWT_AUDIENCE` |
| `PORT` | no | Default `8790` |

Aliases: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` are accepted.

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

- `GET /health` — liveness
- `POST /auth/google` — body `{ idToken }` (Google credential JWT)
- `GET /session` — `{ ok, accessToken, expiresAt }` or `401 not_authenticated`
- `POST /logout` — clear session
- `GET /auth/google/start` — redirect OAuth (requires secret + public URL)
- `GET /auth/google/callback` — OAuth callback

Web integration: [`../../web/docs/BETA_BACKEND.md`](../../web/docs/BETA_BACKEND.md), `VITE_AURA_BFF_URL`.
