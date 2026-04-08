# Deployment runbook (Aura web)

## Hosting target

- **Static SPA:** Build output is `web/dist` after `npm run build` in the `web` directory. Host on any static object store + CDN (S3 + CloudFront, Cloudflare Pages, Netlify, Vercel, etc.).
- **Router:** Configure the host to **fallback all non-file routes to `index.html`** for React Router (`BrowserRouter`).
- **Aura API:** Run the Node service in `../server` behind your edge (Fly.io, Cloud Run, ECS, etc.). For **JWT-only** production, set **`AURA_API_BFF_JWT_SECRET`** and **omit** `AURA_API_BEARER_TOKEN`; otherwise set `AURA_API_BEARER_TOKEN` for static bearer. Configure `AUDIT_LOG_PATH` (durable volume or shipped logs) and `CORS_ORIGIN` to your SPA origin. Point `VITE_AURA_API_URL` at the public API base URL when the API is on another origin (see `server/README.md`). **Container:** build from [`server/Dockerfile`](../../server/Dockerfile); example Compose with SQLite + audit volumes is [`server/docker-compose.yml`](../../server/docker-compose.yml).
- **Aura BFF:** Run [`server/bff`](../../server/bff) beside the API; it must share **`AURA_API_BFF_JWT_SECRET`** with `server/`. Build-time: set **`VITE_AURA_BFF_URL`** on the web image to the browser-visible BFF base (same-origin path such as `/aura-bff` if you reverse-proxy, or `https://bff.example.com`). **Do not** bake `VITE_AURA_API_TOKEN` into production bundles when using this path. Operators proxy `/aura-bff` (or their chosen prefix) to the BFF service and keep **Google OAuth** client IDs aligned (`VITE_GOOGLE_CLIENT_ID` = `AURA_BFF_GOOGLE_CLIENT_ID`). For **load balancer readiness** (secrets present so the BFF can mint sessions/JWTs), probe **`GET /ready`** on the BFF (e.g. same-origin **`/aura-bff/ready`** when using [`nginx-docker-bff.conf`](../nginx-docker-bff.conf)); keep **liveness** on **`GET /health`** — see [`server/bff/README.md`](../../server/bff/README.md).
- **Web container (static + nginx):** build from [`web/Dockerfile`](../Dockerfile) — multi-stage `npm ci` / `npm run build`, then `nginx:alpine` with `try_files` SPA fallback. Pass **`VITE_*` as build-args** (they are not available at nginx runtime). For a **single Compose stack** (web + API, same Docker network), use the repo root [`docker-compose.yml`](../../docker-compose.yml): nginx proxies `/v1/`, `/health`, and `/ready` to the `aura-api` service so the browser can keep **`VITE_AURA_API_URL` unset** (same-origin `/v1`, matching local Vite proxy behavior). **Static-token stack:** set `AURA_API_BEARER_TOKEN` in `.env`; the compose file can pass the same value into the web image as `VITE_AURA_API_TOKEN` at build time — **rebuild the web image** when you rotate that token. **JWT + BFF stack (no static token in the web image):** run `docker compose -f docker-compose.yml -f docker-compose.bff.yml up --build` with `.env` containing `AURA_API_BFF_JWT_SECRET`, `AURA_BFF_SESSION_SECRET`, and `VITE_GOOGLE_CLIENT_ID` (shared with the BFF). Copy-safe placeholders for root Compose variables (BFF rate limits, optional API deploy metadata, etc.): [`.env.example`](../../.env.example). The override adds `aura-bff`, clears API static bearer in favor of JWT verification, builds the web app with `VITE_AURA_BFF_URL=/aura-bff` and **empty** `VITE_AURA_API_TOKEN`, and sets **`AURA_NGINX_STACK=bff`** on `aura-web` so the container uses [`nginx-docker-bff.conf`](../nginx-docker-bff.conf) (same image as the static-token path) — nginx proxies `/aura-bff/` to the BFF (prefix strip matches the Vite dev proxy). Optional: `WEB_PORT`, `API_PORT`, `AURA_BFF_CORS_ORIGIN`, `VITE_AURA_TELEMETRY_*`, **`AURA_TELEMETRY_PROXY_TARGET`** (see telemetry bullet below).
- **Telemetry / CSP:** Relative `VITE_AURA_TELEMETRY_ENDPOINT=/ingest/aura` works in dev because Vite stubs or proxies that path. **Docker (Compose):** set **`AURA_TELEMETRY_PROXY_TARGET`** on the `aura-web` service (runtime env) to the **full collector URL** nginx should forward to (for example `https://your-collector.example/ingest/aura`), and build the web image with **`VITE_AURA_TELEMETRY_ENDPOINT=/ingest/aura`** so the SPA posts same-origin and nginx reverse-proxies to the collector — no collector URL in the static bundle. If **`AURA_TELEMETRY_PROXY_TARGET` is unset**, nginx does not define `/ingest/aura` (same as before this path existed). Alternatively, bake a **full absolute** `VITE_AURA_TELEMETRY_ENDPOINT=https://collector/...` at build time and omit the proxy env. Staging vs production: use different `.env` / compose overrides for the proxy target and build args; see [Environment separation](#environment-separation). CSP: relative telemetry stays on `'self'` in `connect-src` (see [Content-Security-Policy](#content-security-policy-production-build)).

## Environment separation

| Environment | Purpose | Typical vars |
| ----------- | ------- | ------------ |
| Local       | Developer machines | `VITE_GOOGLE_CLIENT_ID` optional in `.env.local` |
| Staging     | Internal QA, telemetry on | `VITE_GOOGLE_CLIENT_ID`, `VITE_AURA_TELEMETRY_ENDPOINT` (full collector URL **or** `/ingest/aura` with **`AURA_TELEMETRY_PROXY_TARGET`** on the web container in Compose — see [OBSERVABILITY.md](./OBSERVABILITY.md)), optional `VITE_AURA_TELEMETRY_DEBUG` (`true` or `1`) |
| Production  | Users | Restricted origins for OAuth; telemetry endpoint or log shipping per policy |

Vite exposes only `VITE_*` variables to the client — **never** put secrets in `VITE_` keys.

### BFF-first env matrix (staging / production)

Use this when the browser authenticates via **Google → BFF session → short-lived JWT** (no static API secret in the SPA). Same end-to-end path as [Staging smoke: BFF JWT path](#staging-smoke-bff-jwt-path-no-static-web-token) below.

| Layer | Variable / setting | Staging | Production |
| ----- | ------------------- | ------- | ----------- |
| **Web (build-time)** | `VITE_AURA_BFF_URL` | Same-origin path such as `/aura-bff`, or absolute BFF URL if cross-origin | Same; must match how users reach the BFF |
| **Web (build-time)** | `VITE_AURA_API_TOKEN` | **Empty** — do not bake a static bearer | **Empty** |
| **Web (build-time)** | `VITE_GOOGLE_CLIENT_ID` | Staging OAuth client | Production OAuth client |
| **Web (build-time)** | `VITE_AURA_API_URL` | Omit when API is same-origin behind the same host as the SPA (Compose / nginx `/v1` proxy); set public API origin if split | Same |
| **Reverse proxy** | BFF path | Forward `/aura-bff/` (or your chosen prefix) to the BFF service; align strip rules with [`nginx-docker-bff.conf`](../nginx-docker-bff.conf) | Same + TLS at edge |
| **BFF (runtime)** | `AURA_API_BFF_JWT_SECRET` | Strong random secret | Rotate with API together |
| **BFF (runtime)** | `AURA_BFF_SESSION_SECRET` | Strong random (≥16 chars) | Same |
| **BFF (runtime)** | `AURA_BFF_GOOGLE_CLIENT_ID` | **Same string** as `VITE_GOOGLE_CLIENT_ID` for that build | Same |
| **BFF (runtime)** | `AURA_BFF_CORS_ORIGIN` | Comma-separated **browser origins** that load the SPA (required when SPA origin ≠ BFF origin) | Tight allowlist only |
| **BFF (runtime)** | Rate limit envs | Optional; defaults are permissive — tighten (`server/bff/README.md`); variable names in [`.env.example`](../../.env.example) | Prefer stricter windows (e.g. 15‑minute throttle on `POST /auth/google`) |
| **API (runtime)** | `AURA_API_BFF_JWT_SECRET` | **Identical** to BFF | Identical |
| **API (runtime)** | `AURA_API_BEARER_TOKEN` | Omit for JWT-only stacks | Omit for JWT-only stacks |

**Build guardrail:** `npm run build` (production mode) **fails** if both `VITE_AURA_BFF_URL` and `VITE_AURA_API_TOKEN` are non-empty, so CI cannot accidentally ship a static bearer alongside the BFF path. Clear the token build-arg / env when using BFF.

## Secrets handling

- **Google OAuth client ID** is public; keep **client secret** (if any server component) only on backend — not in this repo’s client env.
- **API keys** for future backends: inject at build time via CI secrets into staging/prod env files, or load from a secure runtime config endpoint (preferred for rotation).
- CI: store tokens in GitHub Actions / GitLab CI masked variables; avoid echoing in logs.

## Content-Security-Policy (production build)

Production `npm run build` injects a CSP **meta tag** into `dist/index.html` via `vite-plugin-production-csp.ts` (dev server is unchanged).

- **API / BFF / telemetry:** Origins parsed from `VITE_AURA_API_URL`, **`VITE_AURA_BFF_URL`**, and `VITE_AURA_TELEMETRY_ENDPOINT` are added to `connect-src` when those vars are absolute URLs at **build** time. A **relative** `VITE_AURA_BFF_URL` or `VITE_AURA_TELEMETRY_ENDPOINT` (same-origin path) is allowed via existing `'self'` in `connect-src` — no extra origin entry. If you add another cross-origin client endpoint later, rebuild with the var set or adjust the plugin.
- **Google OAuth:** Extra `script-src` / `connect-src` / `frame-src` entries for Google are included only when `VITE_GOOGLE_CLIENT_ID` is non-empty at build time.
- **Edge headers:** `frame-ancestors` is not set in meta CSP (browsers ignore it there). Prefer an HTTP header such as `Content-Security-Policy: frame-ancestors 'none'` or `X-Frame-Options: DENY` from your CDN / reverse proxy if you need clickjacking controls at the edge.

To verify locally after build:

```bash
grep -F 'Content-Security-Policy' dist/index.html
```

## Build and release

```bash
cd web
npm ci
npm run build
```

Upload `dist/` to the CDN origin. Invalidate CDN cache after deploy.

### API image: build / revision metadata (optional)

For the Node API container, you can set **`AURA_API_DEPLOY_VERSION`** (e.g. release tag or image digest short form) and/or **`AURA_API_GIT_SHA`** (commit SHA) at **runtime** so **`GET /health`** and **`GET /ready`** echo which build is live — useful for dashboards and deploy smoke scripts. Root **`docker-compose.yml`** (and **`docker-compose.bff.yml`** when merged) pass both through from `.env` when set, same as any other `aura-api` env. Example in CI (GitHub Actions): pass `-e AURA_API_GIT_SHA="${{ github.sha }}"` or a shortened form. See [`server/README.md`](../../server/README.md) for exact variable names and response field mapping; do not put secrets in these values.

**Audit log (API operators):** `AUDIT_LOG_PATH` defaults to `./data/audit.log`; root Compose sets **`/app/data/audit.log`** with a named volume (see [`docker-compose.yml`](../../docker-compose.yml) comments). After deploy, confirm **`GET /ready`** returns **200** (writable audit dir). For **rotation**, use **logrotate** + **`SIGUSR2`** so the process reopens the file — full procedure: [`server/docs/RUNBOOK_AUDIT.md`](../../server/docs/RUNBOOK_AUDIT.md), example stanza: [`server/docs/examples/audit-logrotate.example.conf`](../../server/docs/examples/audit-logrotate.example.conf). Web-facing summary: [OBSERVABILITY.md](./OBSERVABILITY.md).

**CI mirror — Compose stack smoke:** Staging operators can replay the same full-stack checks GitHub runs manually: open **[`.github/workflows/compose-smoke.yml`](../../.github/workflows/compose-smoke.yml)** (`workflow_dispatch` only — not on every PR). Jobs include **`compose-smoke`** (static bearer + nginx → API), **`compose-bff-smoke`** (`docker-compose.yml` + `docker-compose.bff.yml`, no static token in the web image), and merged **telemetry-proxy** variants — see the workflow steps for exact `docker compose` file lists and assertions (`/health`, `/ready`, BFF health, SPA shell, `POST /v1/journeys`, etc.). Security / contract context: [SECURITY.md](./SECURITY.md), [API_CONTRACT.md](./API_CONTRACT.md).

## Smoke checks after deploy

- **API (when you operate `server/`):** **`GET /health`** → **200** JSON with `ok` / `service`; **`GET /ready`** → **200** when auth env and persistence dirs are configured (else **503** `not_ready` — see [`API_CONTRACT.md`](./API_CONTRACT.md)). When **`AURA_API_DEPLOY_VERSION`** / **`AURA_API_GIT_SHA`** are set, both endpoints may include **`deployVersion`** / **`gitSha`** for release verification (same as [`.github/workflows/compose-smoke.yml`](../../.github/workflows/compose-smoke.yml) patterns).
- **BFF (when you operate `server/bff`):** **`GET /health`** → **200** (liveness); **`GET /ready`** → **200** when **`AURA_API_BFF_JWT_SECRET`** and **`AURA_BFF_SESSION_SECRET`** satisfy the BFF minimum config (else **503** `not_ready`). Behind nginx BFF routing, use **`/aura-bff/ready`**; details: [`server/bff/README.md`](../../server/bff/README.md).
- `/` loads; navigation between Home, Journey, Map, Trusted, Settings works.
- `/emergency` reachable from shipped SOS entry points: **bottom-nav SOS**, Home feature tile, and journey surfaces that surface emergency (see [`design/AURA_SCREEN_SPECS.md`](../../design/AURA_SCREEN_SPECS.md)). `AuraSOSButton` (floating FAB) exists in the repo but is **not** mounted in the production shell — smoke the nav/tile/journey paths, not a standalone FAB.
- Map tiles load; if blocked, confirm telemetry `map.tile_error` appears in logs.
- OAuth: sign-in flow completes against staging Google client.
- **Telemetry (staging):** With `VITE_AURA_TELEMETRY_ENDPOINT` set, confirm the browser issues successful `POST` requests to the configured URL (Network tab) or temporarily enable `VITE_AURA_TELEMETRY_DEBUG` and run `window.__auraTelemetryMetrics()` — expect `telemetry.ship_ok` to increment after you trigger a journey or auth event. Details: [OBSERVABILITY.md](./OBSERVABILITY.md).
- **Telemetry proxy (Docker):** With `AURA_TELEMETRY_PROXY_TARGET` and `VITE_AURA_TELEMETRY_ENDPOINT=/ingest/aura`, `POST http://<web-host>:<port>/ingest/aura` from the host should reach the collector (via nginx). Quick check:

```bash
curl -sS -o /dev/null -w "%{http_code}" -X POST "http://127.0.0.1:${WEB_PORT:-8080}/ingest/aura" \
  -H "Content-Type: application/json" -d "{}"
```

Expect a non-`405` response from nginx (exact code depends on the collector). CI uses [`docker-compose.telemetry-smoke.yml`](../../docker-compose.telemetry-smoke.yml) with an echo stub.

**BFF + telemetry proxy together:** merge `docker-compose.yml`, then [`docker-compose.bff.yml`](../../docker-compose.bff.yml), then [`docker-compose.telemetry-smoke.yml`](../../docker-compose.telemetry-smoke.yml) (that order). Set `.env` with BFF secrets, `VITE_GOOGLE_CLIENT_ID`, `VITE_AURA_TELEMETRY_ENDPOINT=/ingest/aura`, and point `AURA_TELEMETRY_PROXY_TARGET` at your collector (the telemetry override sets the stub URL on `aura-web` when using the echo image). Current Compose merges `depends_on` so `aura-web` waits on `aura-api`, `aura-bff`, and `aura-telemetry-stub`. Manual CI job: `compose-bff-telemetry-proxy-smoke` in [`.github/workflows/compose-smoke.yml`](../../.github/workflows/compose-smoke.yml).

### Staging smoke: BFF JWT path (no static web token)

Use this checklist on **staging** (or a local stack that mirrors staging) to prove **BFF-issued JWT** auth works end-to-end **without** `VITE_AURA_API_TOKEN` in the web bundle. Contract and dev notes: [BETA_BACKEND.md](./BETA_BACKEND.md); BFF env and routes: [`server/bff/README.md`](../../server/bff/README.md).

1. Run the **Aura API** (`server/`) and the **BFF** (`server/bff`) with the **same** `AURA_API_BFF_JWT_SECRET` on both services (and `AURA_BFF_SESSION_SECRET` on the BFF). For a full local/stack parity smoke, you can use root **`docker compose -f docker-compose.yml -f docker-compose.bff.yml up --build`** as described in [Hosting target](#hosting-target) above.
2. Set **`AURA_BFF_GOOGLE_CLIENT_ID`** on the BFF to the **same** Google OAuth client you use for the web build (staging client is fine).
3. Configure the web app **without** a static API token: in **`web/.env.local`** (Vite dev) or **staging build args / env**, set **`VITE_AURA_BFF_URL`** to the browser-visible BFF base (e.g. `/aura-bff` behind your reverse proxy, or an absolute BFF URL) and **`VITE_GOOGLE_CLIENT_ID`** to that same client id. **Do not** set **`VITE_AURA_API_TOKEN`**.
4. Open the app → **Settings** → **Beta API session** → use the Google control (**Continue with Google**) to complete sign-in so the BFF binds an httpOnly session (see flow in [BETA_BACKEND.md](./BETA_BACKEND.md)).
5. In DevTools **Network**, confirm credentialed **`GET /session`** (or the app’s equivalent session fetch under your BFF prefix) returns **`200`** with an access token, then confirm at least one authenticated **`/v1/*`** request (e.g. **`POST /v1/journeys`** when starting a journey) returns **`200`** / expected success — not **`401`** from missing or invalid auth.

## Rollback

Re-point CDN / host to previous `dist` artifact or revert release tag and rebuild.
