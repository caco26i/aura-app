# Beta backend boundary

**API contract (envelopes, error codes, headers):** [API_CONTRACT.md](./API_CONTRACT.md) — coordinate with backend before changing response shapes or `error` strings.

Aura Beta keeps **client-side persistence** (`localStorage` via `AuraContext`) while routing network calls through `src/api/auraBackend.ts`.

**PDR §4.2 (journey + API):** The client **must** call `POST /v1/journeys` and use the returned `journeyId` before any `location-shares` or `im-safe` for that id. Flow: [`JourneyNew.tsx`](../src/pages/JourneyNew.tsx) → `postCreateJourney()` in [`auraBackend.ts`](../src/api/auraBackend.ts) → active journey state, then [`JourneyActive.tsx`](../src/pages/JourneyActive.tsx) for share / I’m safe. User-facing API copy is centralized in [`auraApiMessages.ts`](../src/api/auraApiMessages.ts) (session/sync framing for ownership errors, not danger).

**Local dev with real API (static bearer):** run `server/` on `:8787`, set `VITE_AURA_API_TOKEN` in `web/.env.local` (see `web/.env.example`). Leave `VITE_AURA_API_URL` unset so requests hit the Vite dev server, which **proxies** `/v1`, `/health`, and `/ready` to the Node API (`VITE_AURA_DEV_API_PROXY` overrides the target, default `http://127.0.0.1:8787`).

**Local dev with BFF + JWT (no static token in bundle):** run [`server/bff`](../../server/bff) on `:8790` (see `server/bff/README.md`), share **`AURA_API_BFF_JWT_SECRET`** with `server/`. In `web/.env.local`: **`VITE_AURA_BFF_URL=/aura-bff`** (Vite proxies `/aura-bff` → `VITE_AURA_DEV_BFF_PROXY`, default `http://127.0.0.1:8790`), **`VITE_GOOGLE_CLIENT_ID`** same as BFF `AURA_BFF_GOOGLE_CLIENT_ID`, and **omit** `VITE_AURA_API_TOKEN`. Use **Settings → Beta API session → Continue with Google** to bind the httpOnly BFF session; the app then calls **`GET /session`** (credentialed) for a short-lived access JWT and sends **`Authorization: Bearer …`** to `/v1/*`.

**Staging / production (BFF-first):** Follow the operator matrix in [DEPLOY.md — BFF-first env matrix](./DEPLOY.md#bff-first-env-matrix-staging--production): reverse-proxy the BFF under the same browser-visible base you set as `VITE_AURA_BFF_URL`, keep **`AURA_API_BFF_JWT_SECRET`** in lockstep on API + BFF, and set **`AURA_BFF_CORS_ORIGIN`** to your SPA origin(s). Production `vite build` rejects non-empty **`VITE_AURA_API_TOKEN`** when **`VITE_AURA_BFF_URL`** is set.

## Swap path

1. Implement real HTTP or SDK calls inside `auraBackend.ts` (or split per domain).
2. Keep return shapes stable (`BackendResult<T>`) so UI error handling stays consistent.
3. Move durable state from `localStorage` to your BaaS as you add auth — start with trusted contacts and active journey.

## Suggested stacks

- **Supabase:** Row-level security for contacts + journey events; realtime optional for live share.
- **Firebase:** Firestore collections per user; Cloud Functions for alert fan-out.
- **Custom API:** Issue JWT from your auth service; POST `/v1/journeys/:id/im-safe` etc.

## Gaps documented for launch

- **SOS / share validation:** Implemented in repo root `server/` when deployed; wire env vars per `server/README.md`. **Production / staging:** run the in-repo **[`server/bff`](../../server/bff)** (or equivalent) so the SPA never embeds `VITE_AURA_API_TOKEN`. Set **`VITE_AURA_BFF_URL`** to a same-origin path (reverse-proxy to the BFF) or a dedicated BFF origin; align **`AURA_BFF_CORS_ORIGIN`** with your SPA. API auth uses **HS256 JWTs** from the BFF (`AURA_API_BFF_JWT_SECRET`, claim **`sub`** = stable user id). **Local dev** may keep **`VITE_AURA_API_TOKEN`** + Vite proxy as today.
- **Journey ownership:** When the beta API is enabled, the web app calls `POST /v1/journeys` before starting a journey so `journeyId` is bound to the current actor (static bearer hash or **JWT `sub`**); `location-shares` and `im-safe` reject ids the caller did not create (`journey_not_found` / `journey_forbidden`). Refreshed access tokens with the same `sub` keep ownership. **User-facing copy** for those codes lives in `design/AURA_LAUNCH_UX.md` (JSON table) and `web/src/api/auraApiMessages.ts`.
- **Map tiles (OSM):** Standard **OpenStreetMap** raster tiles via Leaflet `TileLayer`, with **© OpenStreetMap contributors** linked to [OSM copyright](https://www.openstreetmap.org/copyright) (ODbL). Implemented in [`AuraMap.tsx`](../src/components/AuraMap.tsx); Leaflet’s default attribution control remains enabled so the **Leaflet** credit stays visible. Revisit if you swap tile providers or add overlays with different license terms.

## Observability

Client structured logs and staging HTTP mirror: [OBSERVABILITY.md](./OBSERVABILITY.md).

**Server:** `GET /health` (liveness) and `GET /ready` (readiness: auth env + writable audit log dir) — see [`API_CONTRACT.md`](./API_CONTRACT.md) and [`server/README.md`](../../server/README.md). JSON POST bodies default to **32kb** on both the authoritative API (`AURA_API_JSON_BODY_LIMIT`) and the in-repo BFF (`AURA_BFF_JSON_BODY_LIMIT` in [`server/bff/README.md`](../../server/bff/README.md)).
