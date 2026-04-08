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
- **Tab titles** — `RouteDocumentTitle` maps each shell route and `/welcome` / `/emergency` to a dedicated `document.title`. **`/auth` currently falls back to the bare app name (`Aura`)** until a titled branch is added; announcer copy for `/auth` is unchanged (only `/settings` hash paths are announced today).
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

## 7. Data visibility & local storage (cross-surface)

Authoritative UX copy and structure: [`web/docs/UX_ONBOARDING_TRUST_SETTINGS.md`](../web/docs/UX_ONBOARDING_TRUST_SETTINGS.md) §3–§4 (trust surfaces, settings clarity). PDR §7 lists that doc in the [detail index](./AURA_PDR.md#7-traceability--child-work); this section ties **shipped shell** behavior to those requirements.

| Surface | User-visible data posture (summary) | Primary implementation |
|--------|-------------------------------------|-------------------------|
| **Home** | Hub line clarifies contacts live on device and backend when connected | `web/src/pages/Home.tsx` (`monitorLine`) |
| **Journey (active)** | First-time share primer; inline hints for I’m safe / share; map double-tap label + demo hint per §3.4 | `web/src/pages/JourneyActive.tsx` |
| **Trusted** | Empty state: contacts on device until backend; permission legend for alerts when connected | `web/src/pages/Trusted.tsx` |
| **Settings** | “Your data on this device” block; privacy & sharing under location precision; clear-local confirm | `web/src/pages/Settings.tsx` |

When this matrix or the UX doc changes, update [`web/docs/PDR_SCOPE_TRACE.md`](../web/docs/PDR_SCOPE_TRACE.md) if §5 / gap register is affected.
