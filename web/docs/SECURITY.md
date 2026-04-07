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
- **No server validation yet:** SOS and share payloads are not verified by a backend in this repo — **P0** tracked in Paperclip (see launch milestone children).

## Data at rest (client)

- `localStorage` is readable by same-origin scripts and XSS. Sanitize all rendered user content; use strict CSP and dependency updates to reduce XSS risk.

## Related docs

- [AUTH.md](./AUTH.md)
- [BETA_BACKEND.md](./BETA_BACKEND.md)
- [OBSERVABILITY.md](./OBSERVABILITY.md)
