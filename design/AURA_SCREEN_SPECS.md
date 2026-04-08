# Aura screen specs (routing & shell)

Authoritative for [`AURA_PDR.md`](./AURA_PDR.md) **§4.1** (routing & shell). Cross-check **§4.2–4.4** with [`web/docs/BETA_BACKEND.md`](../web/docs/BETA_BACKEND.md) and [`AURA_LAUNCH_UX.md`](./AURA_LAUNCH_UX.md).

---

## Routes

| Route | Purpose |
|-------|---------|
| `/welcome` | First-run onboarding (see [`web/docs/UX_ONBOARDING_TRUST_SETTINGS.md`](../web/docs/UX_ONBOARDING_TRUST_SETTINGS.md) §2); **outside** shell |
| `/auth` | Google / BFF sign-in (`Auth.tsx`); **outside** shell and **outside** `RequireOnboarding` (deep link works before onboarding completes); see [`web/docs/AUTH.md`](../web/docs/AUTH.md) |
| `/emergency` | Full-screen SOS (outside shell); **always reachable**, including before onboarding completes |
| `/` | Home hub (journey CTAs, links to map / trusted / settings, feature tiles) |
| `/journey/new` | Configure journey |
| `/journey/active` | Live tracking, map, backend actions; first **Share live location** uses a one-time primer sheet (`shareLocationPrimerAcknowledged` in `aura:v1`); map hint copy splits primary vs demo note (see UX spec §3.4) |
| `/map` | Intel layers + map |
| `/trusted` | Trusted network CRUD |
| `/settings` | Safety settings |
| `/cita` | Modo Cita (inside shell; not listed in PDR §3.1 MVP table — product extension) |
| `/transport` | Modo transporte (inside shell; same note) |
| `/checkin` | Check-in IA (inside shell; same note) |

### Deep links & unknown paths

- **Canonical route list** — Only the paths in the table above are first-class Aura routes; the source of truth for the SPA is `web/src/App.tsx` (plus `RouteDocumentTitle` for tab titles). When adding a route, update this table and the trace row for §4.1 in [`web/docs/PDR_SCOPE_TRACE.md`](../web/docs/PDR_SCOPE_TRACE.md).
- **Tab titles** — `RouteDocumentTitle` maps each shell route, `/welcome`, `/emergency`, and **`/auth`** (`Sign in · Aura`) to a dedicated `document.title`. Announcer copy for `/auth` is unchanged (only `/settings` hash paths are announced today).
- **Unknown paths (`*`)** — Any pathname that does not match a declared `<Route>` is handled with `<Navigate to="/" replace />` (home). This is an intentional MVP choice: users land on the hub instead of a standalone 404 screen. It is **not** silent failure — the URL updates to `/` so bookmarks to typos recover predictably.
- **Deep links vs onboarding** — `/welcome`, `/auth`, and `/emergency` are outside `RequireOnboarding`. All other routes in the table require `onboardingCompleted` in `aura:v1`; if false, the user is redirected to `/welcome` with `replace`, then returns to the shell after completion. Deep links to e.g. `/map` therefore work after onboarding, and cold-start deep links funnel through welcome first.
- **Global render errors** — Uncaught React errors in the tree are handled by `AuraErrorBoundary` (see [`web/docs/PDR_SCOPE_TRACE.md`](../web/docs/PDR_SCOPE_TRACE.md) §“Resolved vs earlier gap register”); this is separate from unknown URL handling.

---

## App shell (`AppShell`)

- **Bottom navigation** (primary): Home (`/`), Cita (`/cita`), Transp. (`/transport`), Check-in (`/checkin`), SOS (`/emergency`). Product IA for launch is **confirmed** (see **G-IA-01** in [`web/docs/PDR_SCOPE_TRACE.md`](../web/docs/PDR_SCOPE_TRACE.md) / [AURA-74](/AURA/issues/AURA-74)).
- **Not in the bottom bar today:** `/journey/*`, `/map`, `/trusted`, `/settings` — reached from Home (primary journey button, feature grid, footer text links).
- **SOS entry points:** bottom nav **SOS**, Home feature tile, and journey surfaces as documented in UX specs. A floating **`AuraSOSButton`** component exists in repo but is **not** mounted in the shell; treat FAB as optional future pattern, not current chrome (see [`web/docs/PDR_SCOPE_TRACE.md`](../web/docs/PDR_SCOPE_TRACE.md)).

**Onboarding:** Cold start redirects to `/welcome` when `onboardingCompleted` is false in `aura:v1`. Existing payloads without that field are treated as already completed (migration). `/emergency` and `/auth` stay reachable without finishing onboarding.

---

## PDR §3–4 alignment (checklist)

| PDR | Spec / doc |
|-----|------------|
| §3.1 areas (onboarding, home, journey, SOS, map, trusted, settings) | Routes + UX docs above |
| §4.1 Routing & shell | This file; shell inventory matches `web/src/App.tsx` + `AppShell.tsx` |
| §4.2 Journey before share / I’m safe | [`web/docs/BETA_BACKEND.md`](../web/docs/BETA_BACKEND.md) (“Journey ownership”) |
| §4.3 SOS confirm; `X-Aura-Anomaly` as `role="status"` | [`AURA_LAUNCH_UX.md`](./AURA_LAUNCH_UX.md) |
| §4.4 Voice + centralized errors | [`AURA_LAUNCH_UX.md`](./AURA_LAUNCH_UX.md), `web/src/api/auraApiMessages.ts` |

---

## Design tokens & a11y

Visual intent: [`AURA_DESIGN_SYSTEM.md`](./AURA_DESIGN_SYSTEM.md). Loading / empty / alert patterns: [`web/docs/UX_EMPTY_LOADING_SAFETY.md`](../web/docs/UX_EMPTY_LOADING_SAFETY.md).

---

## Map surfaces: tile loading, busy states, and composition (AURA-28 / AURA-257)

**Normative UX inventory:** [`web/docs/UX_EMPTY_LOADING_SAFETY.md`](../web/docs/UX_EMPTY_LOADING_SAFETY.md) §1 (**MapPage**, **AuraMap** rows) and §2.1 — map tile loading is **shipped**; this section is the **screen-spec** contract for product and eng so routing/shell docs stay aligned with that inventory.

### Shared implementation: `AuraMap`

Leaflet embeds use **`web/src/components/AuraMap.tsx`** only. Today it is mounted from:

| Surface | Route / context | Typical height | Notes |
|--------|------------------|----------------|-------|
| **Map & Intel** | `/map` (`MapPage.tsx`) | 340px | Full intel UI: layer toggles, demo route control, POI list; map block is one section inside the page. |
| **Journey (live tracking)** | `/journey/active` (`JourneyActive.tsx`) | 320px | In-flow map with double-tap → silent emergency sheet; uses `visibleIntel` features from context. |

### Expected presentation while tiles are not ready

1. **Container** — Outer map shell uses `role="application"` and `aria-label="Map"`. **`aria-busy={true}`** while tiles are loading; cleared on successful tile `load` or after a **15s** fallback timeout so assistive tech and scripts do not stay stuck in a busy state.
2. **Visual overlay** — While busy, a **semi-opaque layer** (`aria-hidden`) covers the map viewport so users are not interacting with a half-painted map. It is decorative only; the status line carries the accessible name of the loading state.
3. **Status copy** — A **sibling** line below the map frame uses **`role="status"`** and the string *Loading map…* while `aria-busy` is true. Treat this as the **primary polite announcement** for tile readiness (implicit `aria-live="polite"` where supported). **Do not** duplicate the same message in a separate live region.

### `aria-busy` and live regions (guidance)

- **Map** — Busy flag lives on the **map application** wrapper (not on the whole page). Page-level `role="status"` / `aria-live` for other concerns (e.g. Home safe/alert headline, MapPage layer hints) **must remain separate** identifiers so screen readers can distinguish *map tiles loading* from *hub alert state* or *all map layers off*.
- **Errors** — Tile failures are **telemetry-only** in the current build (`tileerror` → observability). They **do not** surface as `role="alert"` on the map path; reserve alerts for actionable API / journey failures (see UX spec). A future **user-visible tile retry** would be a product change and likely a **CTO-owned** follow-up, not a tweak inside this spec alone.

### Composition with empty and offline-related patterns

| Scenario | How it composes with map loading |
|----------|----------------------------------|
| **MapPage — all layers off** | The “layers off” hint is a **`role="status"`** pattern about **POI visibility**, independent of whether tiles are still loading. If both apply, loading overlay + *Loading map…* take precedence visually until tiles are ready; the empty-layer hint remains valid for **zero visible features** once the map is interactive. |
| **JourneyActive — no active journey** | The **empty journey** state is a **full-screen** message (no `AuraMap` mounted). There is no map loading state until a journey exists. |
| **JourneyActive — API / share errors** | Errors below the map use **`role="alert"`**. Map loading must **not** use alert for parity with UX §3 / §2.3. |
| **Offline / network** | There is **no** dedicated offline string on the map surface in MVP; offline journey/SOS copy lives in **`auraApiMessages.ts`** and journey CTAs. Map tiles may fail silently from the user’s perspective; do not imply a separate “offline map” empty state unless product adds one. |
| **Home hub** | **Shipped:** **Home does not embed `AuraMap`.** The hub’s **`role="status"`** + **`aria-live="polite"`** headline (*Safe.* / *Alert active.*) is **global status only**, not map loading. Users hit map loading behavior by navigating to **Map intel** or **Live tracking**. If product adds a **Home map preview** later, it **must** reuse **`AuraMap`** (or the same **aria-busy + overlay + status line** contract) so behavior matches [`UX_EMPTY_LOADING_SAFETY.md`](../web/docs/UX_EMPTY_LOADING_SAFETY.md). |

### Engineering handoff pointer

Short implementation checklist and CTO spawn note: [`AURA_MAP_TILE_LOADING_HANDOFF.md`](./AURA_MAP_TILE_LOADING_HANDOFF.md).

---

## 7. Data visibility & local storage (cross-surface)

Authoritative UX copy and structure: [`web/docs/UX_ONBOARDING_TRUST_SETTINGS.md`](../web/docs/UX_ONBOARDING_TRUST_SETTINGS.md) §3–§4 (trust surfaces, settings clarity). PDR §7 lists that doc in the [detail index](./AURA_PDR.md#7-traceability--child-work); this section ties **shipped shell** behavior to those requirements.

| Surface | User-visible data posture (summary) | Primary implementation |
|--------|-------------------------------------|-------------------------|
| **Home** | Hub line clarifies contacts live on device and backend when connected | `web/src/pages/Home.tsx` (`monitorLine`) |
| **Journey (active)** | First-time share primer; inline hints for I’m safe / share; map double-tap label + demo hint per §3.4 | `web/src/pages/JourneyActive.tsx` |
| **Trusted** | Empty state: contacts on device until backend; permission legend for alerts when connected | `web/src/pages/Trusted.tsx` |
| **Settings** | “Your data on this device” block; privacy & sharing under location precision; clear-local confirm | `web/src/pages/Settings.tsx` |

When this matrix or the UX doc changes, update [`web/docs/PDR_SCOPE_TRACE.md`](../web/docs/PDR_SCOPE_TRACE.md) if §5 / gap register is affected.
