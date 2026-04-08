# Beta backend boundary

**API contract (envelopes, error codes, headers):** [API_CONTRACT.md](./API_CONTRACT.md) — coordinate with backend before changing response shapes or `error` strings.

Aura Beta keeps **client-side persistence** (`localStorage` via `AuraContext`) while routing network calls through `src/api/auraBackend.ts`.

**PDR §4.2 (journey + API):** The client **must** call `POST /v1/journeys` and use the returned `journeyId` before any `location-shares` or `im-safe` for that id. Flow: [`JourneyNew.tsx`](../src/pages/JourneyNew.tsx) → `postCreateJourney()` in [`auraBackend.ts`](../src/api/auraBackend.ts) → active journey state, then [`JourneyActive.tsx`](../src/pages/JourneyActive.tsx) for share / I’m safe. User-facing API copy is centralized in [`auraApiMessages.ts`](../src/api/auraApiMessages.ts) (session/sync framing for ownership errors, not danger).

**Local dev with real API:** run `server/` on `:8787`, set `VITE_AURA_API_TOKEN` in `web/.env.local` (see `web/.env.example`). Leave `VITE_AURA_API_URL` unset so requests hit the Vite dev server, which **proxies** `/v1`, `/health`, and `/ready` to the Node API (`VITE_AURA_DEV_API_PROXY` overrides the target, default `http://127.0.0.1:8787`).

## Swap path

1. Implement real HTTP or SDK calls inside `auraBackend.ts` (or split per domain).
2. Keep return shapes stable (`BackendResult<T>`) so UI error handling stays consistent.
3. Move durable state from `localStorage` to your BaaS as you add auth — start with trusted contacts and active journey.

## Suggested stacks

- **Supabase:** Row-level security for contacts + journey events; realtime optional for live share.
- **Firebase:** Firestore collections per user; Cloud Functions for alert fan-out.
- **Custom API:** Issue JWT from your auth service; POST `/v1/journeys/:id/im-safe` etc.

## Gaps documented for launch

- **SOS / share validation:** Implemented in repo root `server/` when deployed; wire env vars per `server/README.md`. Production: exchange OAuth in a **BFF** and call the API with **HS256 JWTs** signed using `AURA_API_BFF_JWT_SECRET` (claim **`sub`** = stable user id); do not ship long-lived static secrets in `VITE_AURA_API_TOKEN`.
- **Journey ownership:** When the beta API is enabled, the web app calls `POST /v1/journeys` before starting a journey so `journeyId` is bound to the current actor (static bearer hash or **JWT `sub`**); `location-shares` and `im-safe` reject ids the caller did not create (`journey_not_found` / `journey_forbidden`). Refreshed access tokens with the same `sub` keep ownership. **User-facing copy** for those codes lives in `design/AURA_LAUNCH_UX.md` (JSON table) and `web/src/api/auraApiMessages.ts`.
- Map tiles are public OSM; add attribution review for production branding.

## Observability

Client structured logs and staging HTTP mirror: [OBSERVABILITY.md](./OBSERVABILITY.md).

**Server:** `GET /health` (liveness) and `GET /ready` (readiness: auth env + writable audit log dir) — see [`API_CONTRACT.md`](./API_CONTRACT.md) and [`server/README.md`](../../server/README.md).
