# Beta backend boundary

Aura Beta keeps **client-side persistence** (`localStorage` via `AuraContext`) while routing network calls through `src/api/auraBackend.ts`.

## Swap path

1. Implement real HTTP or SDK calls inside `auraBackend.ts` (or split per domain).
2. Keep return shapes stable (`BackendResult<T>`) so UI error handling stays consistent.
3. Move durable state from `localStorage` to your BaaS as you add auth — start with trusted contacts and active journey.

## Suggested stacks

- **Supabase:** Row-level security for contacts + journey events; realtime optional for live share.
- **Firebase:** Firestore collections per user; Cloud Functions for alert fan-out.
- **Custom API:** Issue JWT from your auth service; POST `/v1/journeys/:id/im-safe` etc.

## Gaps documented for launch

- No server-side validation of SOS or share payloads yet (P0 tracked in Paperclip as child of AURA-9).
- Map tiles are public OSM; add attribution review for production branding.

## Observability

Client structured logs and staging HTTP mirror: [OBSERVABILITY.md](./OBSERVABILITY.md).
