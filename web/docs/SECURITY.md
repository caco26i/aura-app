# Security notes (launch readiness)

Scope: **Vite + React** client (`web/`) with optional Google OAuth, Firebase email/password (when env is configured), `localStorage` persistence, and **`src/api/auraBackend.ts`**. When **`VITE_AURA_API_TOKEN`** (static bearer, dev-style) and/or **`VITE_AURA_BFF_URL`** (BFF session → short-lived JWT) is set, the SPA talks to the **beta Aura API** in **`server/`**; otherwise journey/SOS calls use **local mocks** that never leave the browser. The **`server/`** Node service is the **authoritative HTTP boundary** for beta (validated routes, auth, rate limits, audit log) — not “no API yet.” Read **[`API_CONTRACT.md`](./API_CONTRACT.md)** for the public JSON contract and **[`../../server/README.md`](../../server/README.md)** for operators (env matrix, BFF JWT vs static bearer, SQLite/JSONL journey store, headers, body limits). The sections below are **launch-facing security expectations** for that stack; keep them aligned when `server/` behavior changes.

## Authentication

- **Google OAuth:** Client ID is public by design; restrict authorized JavaScript origins and redirect URIs in Google Cloud Console. Tokens must be validated **server-side** before trusting identity.
- **Stub mode:** Without `VITE_GOOGLE_CLIENT_ID`, the app runs without `GoogleOAuthProvider`. Do not ship production builds that rely on stub auth for protected data.
- **Session:** When a backend exists, use short-lived credentials, refresh rotation, and revoke on logout.
- **BFF + JWT (no static web token):** To smoke-test staging (or staging-like local) without `VITE_AURA_API_TOKEN`, follow the numbered checklist in [DEPLOY.md — Staging smoke: BFF JWT path](./DEPLOY.md#staging-smoke-bff-jwt-path-no-static-web-token). Operator matrix: [DEPLOY.md — BFF-first env matrix](./DEPLOY.md#bff-first-env-matrix-staging--production). **Production builds** fail fast if both `VITE_AURA_BFF_URL` and `VITE_AURA_API_TOKEN` are non-empty (`web/vite.config.ts`).
- **BFF rate limits:** The in-repo BFF (`server/bff`) applies per-IP `express-rate-limit` on `POST /auth/google`, `POST /auth/firebase`, `GET /session`, and `POST /logout`, tunable via `AURA_BFF_RATE_LIMIT_*` env vars (`server/bff/README.md`). Responses use the same **`rate_limited`** JSON envelope as the Aura API where applicable. The BFF also mirrors the API’s **`X-Request-Id`** correlation and baseline security headers (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`) on every response, including **429** and JSON parse/body errors. Edge WAF/CDN rules remain the first line of defense; BFF limits complement those at origin.

## Location and map data

- **Precision:** User-facing control (`approximate` vs `precise`) is UI-only until a server enforces redaction and retention policies.
- **Tiles:** Default OSM tiles are third-party; review attribution, CSP for tile hosts, and fallback when tiles fail (telemetry: `map.tile_error`).
- **Intel layers:** Seed data is static; production curated content needs sourcing, moderation, and abuse review.

## SOS and emergency flows

- **Abuse / false alarms:** Visible and silent alerts must be rate-limited and anomaly-scored server-side; log actor, device fingerprint (hashed), and cooldown state.
- **Trusted contacts:** Contact list is local-only today; server-side fan-out must validate consent, opt-out, and regional messaging rules (SMS/email/push).
- **Authoritative API (beta):** The `server/` package exposes validated routes (`POST /v1/journeys` to register a journey for the current actor, then `POST /v1/emergency-alerts`, journey share, I’m safe) with **static bearer** and/or **BFF HS256 JWT** auth (`sub`-scoped ownership), layered rate limits (including hourly caps on SOS, location-shares, and im-safe), burst anomaly header (`X-Aura-Anomaly`), baseline response headers (`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`), and an append-only JSON-lines audit log (ops: `server/docs/RUNBOOK_AUDIT.md`). JSON POST bodies are capped by **`AURA_API_JSON_BODY_LIMIT`** (default 32kb); per-**minute** abuse windows use **`AURA_API_RATE_LIMIT_GLOBAL_*`** and **`AURA_API_RATE_LIMIT_JOURNEY_*`** — see [`API_CONTRACT.md`](./API_CONTRACT.md) and [`../../server/README.md`](../../server/README.md). Share and I’m-safe reject unknown journey ids or ids owned by another actor; journey ownership is persisted in **SQLite (WAL)** with an append-only **JSONL** fallback when SQLite cannot open (`server/README.md`). The web client calls the API when **`VITE_AURA_API_TOKEN`** is set (static bearer, dev-style), or when **`VITE_AURA_BFF_URL`** is set without a static token (session cookie → `GET /session` → in-memory JWT per `src/api/auraBackend.ts`); if neither path is configured, SOS/journey calls use local mocks. **Do not treat `VITE_AURA_API_TOKEN` as a long-lived production secret** — it is visible in the bundle; production should use a **BFF** that mints short-lived JWTs per `server/README.md` and [BETA_BACKEND.md](./BETA_BACKEND.md).

## Data at rest (client)

- `localStorage` is readable by same-origin scripts and XSS. Sanitize all rendered user content; use strict CSP and dependency updates to reduce XSS risk.

## Content-Security-Policy (production)

- **Where:** Production bundles only — a CSP meta tag is emitted at build time (`web/vite-plugin-production-csp.ts`); the Vite dev server does not add it.
- **`style-src 'unsafe-inline'`:** Required today because Leaflet injects inline styles for map positioning. Prefer removing this later (e.g. nonced styles) if the map stack allows.
- **Third-party loads:** `img-src` allows OSM tile hosts (`*.tile.openstreetmap.org`), default Leaflet marker assets on `unpkg.com`, and Google Fonts as referenced from `index.html`. Revisit if you change tile or icon hosting.
- **OAuth:** Google-related directives are compiled in only when `VITE_GOOGLE_CLIENT_ID` is set for that build; see [DEPLOY.md](./DEPLOY.md) for build-time `connect-src` notes.

## Related docs

- [AUTH.md](./AUTH.md)
- [API_CONTRACT.md](./API_CONTRACT.md)
- [BETA_BACKEND.md](./BETA_BACKEND.md)
- [DEPLOY.md](./DEPLOY.md) (incl. **Compose stack smoke** / CI pointer)
- [OBSERVABILITY.md](./OBSERVABILITY.md)
- [`../../server/README.md`](../../server/README.md)
