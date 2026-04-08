# Security notes (launch readiness)

Scope: current **Vite + React** client with optional Google OAuth stub, `localStorage` persistence, and mocked backend calls in `src/api/auraBackend.ts`. No production API exists yet; treat below as requirements for the first real backend.

## Authentication

- **Google OAuth:** Client ID is public by design; restrict authorized JavaScript origins and redirect URIs in Google Cloud Console. Tokens must be validated **server-side** before trusting identity.
- **Stub mode:** Without `VITE_GOOGLE_CLIENT_ID`, the app runs without `GoogleOAuthProvider`. Do not ship production builds that rely on stub auth for protected data.
- **Session:** When a backend exists, use short-lived credentials, refresh rotation, and revoke on logout.

## Location and map data

- **Precision:** User-facing control (`approximate` vs `precise`) is UI-only until a server enforces redaction and retention policies.
- **Tiles:** Default OSM tiles are third-party; review attribution, CSP for tile hosts, and fallback when tiles fail (telemetry: `map.tile_error`).
- **Intel layers:** Seed data is static; production curated content needs sourcing, moderation, and abuse review.

## SOS and emergency flows

- **Abuse / false alarms:** Visible and silent alerts must be rate-limited and anomaly-scored server-side; log actor, device fingerprint (hashed), and cooldown state.
- **Trusted contacts:** Contact list is local-only today; server-side fan-out must validate consent, opt-out, and regional messaging rules (SMS/email/push).
- **Authoritative API (beta):** The `server/` package exposes validated routes (`POST /v1/journeys` to register a journey for the current actor, then `POST /v1/emergency-alerts`, journey share, I’m safe) with **static bearer** and/or **BFF HS256 JWT** auth (`sub`-scoped ownership), layered rate limits (including hourly caps on SOS, location-shares, and im-safe), burst anomaly header (`X-Aura-Anomaly`), baseline response headers (`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`), and an append-only JSON-lines audit log (ops: `server/docs/RUNBOOK_AUDIT.md`). Share and I’m-safe reject unknown journey ids or ids owned by another actor (in-memory registry today; swap for durable store). The web client uses the API when `VITE_AURA_API_URL` and `VITE_AURA_API_TOKEN` are set; otherwise it falls back to local mocks in `src/api/auraBackend.ts`. **Do not treat `VITE_AURA_API_TOKEN` as a long-lived production secret** — it is visible in the bundle; production should use a **BFF** that mints short-lived JWTs per `server/README.md`.

## Data at rest (client)

- `localStorage` is readable by same-origin scripts and XSS. Sanitize all rendered user content; use strict CSP and dependency updates to reduce XSS risk.

## Content-Security-Policy (production)

- **Where:** Production bundles only — a CSP meta tag is emitted at build time (`web/vite-plugin-production-csp.ts`); the Vite dev server does not add it.
- **`style-src 'unsafe-inline'`:** Required today because Leaflet injects inline styles for map positioning. Prefer removing this later (e.g. nonced styles) if the map stack allows.
- **Third-party loads:** `img-src` allows OSM tile hosts (`*.tile.openstreetmap.org`), default Leaflet marker assets on `unpkg.com`, and Google Fonts as referenced from `index.html`. Revisit if you change tile or icon hosting.
- **OAuth:** Google-related directives are compiled in only when `VITE_GOOGLE_CLIENT_ID` is set for that build; see [DEPLOY.md](./DEPLOY.md) for build-time `connect-src` notes.

## Related docs

- [AUTH.md](./AUTH.md)
- [BETA_BACKEND.md](./BETA_BACKEND.md)
- [OBSERVABILITY.md](./OBSERVABILITY.md)
