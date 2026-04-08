# Deployment runbook (Aura web)

## Hosting target

- **Static SPA:** Build output is `web/dist` after `npm run build` in the `web` directory. Host on any static object store + CDN (S3 + CloudFront, Cloudflare Pages, Netlify, Vercel, etc.).
- **Router:** Configure the host to **fallback all non-file routes to `index.html`** for React Router (`BrowserRouter`).
- **Aura API:** Run the Node service in `../server` behind your edge (Fly.io, Cloud Run, ECS, etc.). Set `AURA_API_BEARER_TOKEN`, `AUDIT_LOG_PATH` (durable volume or shipped logs), and `CORS_ORIGIN` to your SPA origin. Point `VITE_AURA_API_URL` at the public API base URL for staging/prod builds (see `server/README.md`). **Container:** build from [`server/Dockerfile`](../../server/Dockerfile); example Compose with SQLite + audit volumes is [`server/docker-compose.yml`](../../server/docker-compose.yml).
- **Web container (static + nginx):** build from [`web/Dockerfile`](../Dockerfile) — multi-stage `npm ci` / `npm run build`, then `nginx:alpine` with `try_files` SPA fallback. Pass **`VITE_*` as build-args** (they are not available at nginx runtime). For a **single Compose stack** (web + API, same Docker network), use the repo root [`docker-compose.yml`](../../docker-compose.yml): nginx proxies `/v1/`, `/health`, and `/ready` to the `aura-api` service so the browser can keep **`VITE_AURA_API_URL` unset** (same-origin `/v1`, matching local Vite proxy behavior). Set `AURA_API_BEARER_TOKEN` in `.env`; the compose file passes the same value into the web image as `VITE_AURA_API_TOKEN` at build time — **rebuild the web image** when you rotate that token. Optional: `WEB_PORT`, `API_PORT`, `VITE_GOOGLE_CLIENT_ID`, `VITE_AURA_TELEMETRY_*` in `.env` for the web build args.
- **Telemetry / CSP:** Relative `VITE_AURA_TELEMETRY_ENDPOINT=/ingest/aura` works in dev because Vite stubs or proxies that path. The bundled **root `docker-compose.yml` does not** proxy `/ingest/aura` to the Aura API (the API has no ingest route). For Docker, either set a **full URL** at build time (`VITE_AURA_TELEMETRY_ENDPOINT=https://collector/...`) or add your own reverse-proxy location / sidecar and rebuild so production CSP `connect-src` matches (see [Content-Security-Policy](#content-security-policy-production-build) above).

## Environment separation

| Environment | Purpose | Typical vars |
| ----------- | ------- | ------------ |
| Local       | Developer machines | `VITE_GOOGLE_CLIENT_ID` optional in `.env.local` |
| Staging     | Internal QA, telemetry on | `VITE_GOOGLE_CLIENT_ID`, `VITE_AURA_TELEMETRY_ENDPOINT` (full collector URL **or** same-origin path such as `/ingest/aura` behind your proxy — see [OBSERVABILITY.md](./OBSERVABILITY.md)), optional `VITE_AURA_TELEMETRY_DEBUG` (`true` or `1`) |
| Production  | Users | Restricted origins for OAuth; telemetry endpoint or log shipping per policy |

Vite exposes only `VITE_*` variables to the client — **never** put secrets in `VITE_` keys.

## Secrets handling

- **Google OAuth client ID** is public; keep **client secret** (if any server component) only on backend — not in this repo’s client env.
- **API keys** for future backends: inject at build time via CI secrets into staging/prod env files, or load from a secure runtime config endpoint (preferred for rotation).
- CI: store tokens in GitHub Actions / GitLab CI masked variables; avoid echoing in logs.

## Content-Security-Policy (production build)

Production `npm run build` injects a CSP **meta tag** into `dist/index.html` via `vite-plugin-production-csp.ts` (dev server is unchanged).

- **API / telemetry:** Origins parsed from `VITE_AURA_API_URL` and `VITE_AURA_TELEMETRY_ENDPOINT` are added to `connect-src` when those vars are absolute URLs at **build** time. A **relative** `VITE_AURA_TELEMETRY_ENDPOINT` (same-origin ingest) is allowed via existing `'self'` in `connect-src` — no extra origin entry. If you add another cross-origin client endpoint later, rebuild with the var set or adjust the plugin.
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

## Smoke checks after deploy

- `/` loads; navigation between Home, Journey, Map, Trusted, Settings works.
- `/emergency` reachable from SOS FAB.
- Map tiles load; if blocked, confirm telemetry `map.tile_error` appears in logs.
- OAuth: sign-in flow completes against staging Google client.
- **Telemetry (staging):** With `VITE_AURA_TELEMETRY_ENDPOINT` set, confirm the browser issues successful `POST` requests to the configured URL (Network tab) or temporarily enable `VITE_AURA_TELEMETRY_DEBUG` and run `window.__auraTelemetryMetrics()` — expect `telemetry.ship_ok` to increment after you trigger a journey or auth event. Details: [OBSERVABILITY.md](./OBSERVABILITY.md).

## Rollback

Re-point CDN / host to previous `dist` artifact or revert release tag and rebuild.
