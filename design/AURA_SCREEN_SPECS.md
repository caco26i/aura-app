# Aura screen specs (routing & shell)

Authoritative for [`AURA_PDR.md`](./AURA_PDR.md) **§4.1** (routing & shell). Cross-check **§4.2–4.4** with [`web/docs/BETA_BACKEND.md`](../web/docs/BETA_BACKEND.md) and [`AURA_LAUNCH_UX.md`](./AURA_LAUNCH_UX.md).

---

## Routes

| Route | Purpose |
|-------|---------|
| `/welcome` | First-run onboarding (see [`web/docs/UX_ONBOARDING_TRUST_SETTINGS.md`](../web/docs/UX_ONBOARDING_TRUST_SETTINGS.md) §2); **outside** shell |
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

**Wildcard:** `*` → redirect to `/`. Global render errors are handled by `AuraErrorBoundary` (inventory in [`web/docs/PDR_SCOPE_TRACE.md`](../web/docs/PDR_SCOPE_TRACE.md) §“Resolved vs earlier gap register”).

---

## App shell (`AppShell`)

- **Bottom navigation** (primary): Home (`/`), Cita (`/cita`), Transp. (`/transport`), Check-in (`/checkin`), SOS (`/emergency`). Product IA for launch is **confirmed** (see **G-IA-01** in [`web/docs/PDR_SCOPE_TRACE.md`](../web/docs/PDR_SCOPE_TRACE.md) / [AURA-74](/AURA/issues/AURA-74)).
- **Not in the bottom bar today:** `/journey/*`, `/map`, `/trusted`, `/settings` — reached from Home (primary journey button, feature grid, footer text links).
- **SOS entry points:** bottom nav **SOS**, Home feature tile, and journey surfaces as documented in UX specs. A floating **`AuraSOSButton`** component exists in repo but is **not** mounted in the shell; treat FAB as optional future pattern, not current chrome (see [`web/docs/PDR_SCOPE_TRACE.md`](../web/docs/PDR_SCOPE_TRACE.md)).

**Onboarding:** Cold start redirects to `/welcome` when `onboardingCompleted` is false in `aura:v1`. Existing payloads without that field are treated as already completed (migration). `/emergency` stays reachable without finishing onboarding.

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
