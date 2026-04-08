# Map tile loading — engineering handoff

**Specs:** [`AURA_SCREEN_SPECS.md`](./AURA_SCREEN_SPECS.md) (Map surfaces §) · **UX inventory:** [`web/docs/UX_EMPTY_LOADING_SAFETY.md`](../web/docs/UX_EMPTY_LOADING_SAFETY.md) §1–§2.1.

**Code:** `web/src/components/AuraMap.tsx` — `aria-busy`, loading overlay, `role="status"` *Loading map…*, 15s timeout fallback, `TileLayer` `loading` / `load` / `tileerror` handlers.

**Call sites:** `MapPage.tsx` (`/map`), `JourneyActive.tsx` (`/journey/active`). Home does not mount the map today.

**When to open a CTO child:** New tile provider, user-visible retry/error UI for tiles, or any second map implementation that would diverge from the `AuraMap` contract. Use `inheritExecutionWorkspaceFromIssueId` pointing at the design parent issue (e.g. [AURA-257](/AURA/issues/AURA-257)).
