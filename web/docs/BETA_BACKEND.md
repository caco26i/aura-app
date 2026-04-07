# Beta backend boundary

Aura Beta keeps **client-side persistence** (`localStorage` via `AuraContext`) while routing network calls through `src/api/auraBackend.ts`.

**Local dev with real API:** run `server/` on `:8787`, set `VITE_AURA_API_TOKEN` in `web/.env.local` (see `web/.env.example`). Leave `VITE_AURA_API_URL` unset so requests hit the Vite dev server, which **proxies** `/v1` and `/health` to the Node API (`VITE_AURA_DEV_API_PROXY` overrides the target, default `http://127.0.0.1:8787`).

## Swap path

1. Implement real HTTP or SDK calls inside `auraBackend.ts` (or split per domain).
2. Keep return shapes stable (`BackendResult<T>`) so UI error handling stays consistent.
3. Move durable state from `localStorage` to your BaaS as you add auth — start with trusted contacts and active journey.

## Suggested stacks

- **Supabase:** Row-level security for contacts + journey events; realtime optional for live share.
- **Firebase:** Firestore collections per user; Cloud Functions for alert fan-out.
- **Custom API:** Issue JWT from your auth service; POST `/v1/journeys/:id/im-safe` etc.

## Gaps documented for launch

- **SOS / share validation:** Implemented in repo root `server/` when deployed; wire env vars per `server/README.md`. Production still needs OAuth/BFF instead of `VITE_AURA_API_TOKEN`.
- **Journey ownership:** When the beta API is enabled, the web app calls `POST /v1/journeys` before starting a journey so `journeyId` is bound to the current bearer actor; `location-shares` and `im-safe` reject ids the caller did not create (`journey_not_found` / `journey_forbidden`). Same pattern extends to per-user OAuth tokens once auth ships. **User-facing copy** for those codes lives in `design/AURA_LAUNCH_UX.md` (JSON table) and `web/src/api/auraApiMessages.ts`.
- Map tiles are public OSM; add attribution review for production branding.

## Observability

Client structured logs and staging HTTP mirror: [OBSERVABILITY.md](./OBSERVABILITY.md).
