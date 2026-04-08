# PDR §3–4 traceability & gap register

**Purpose:** Keep [`design/AURA_PDR.md`](../../design/AURA_PDR.md) **§3 (scope)** and **§4 (functional requirements)** traceable to `web/` UX docs and the shipped shell. Complements the design index in PDR §7.

**Related work:** [AURA-41](/AURA/issues/AURA-41), [AURA-44](/AURA/issues/AURA-44), [AURA-47](/AURA/issues/AURA-47), [AURA-49](/AURA/issues/AURA-49), [AURA-50](/AURA/issues/AURA-50), [AURA-59](/AURA/issues/AURA-59) (frontend delivery bucket), [AURA-61](/AURA/issues/AURA-61) (UX specs / PDR §7 track).

---

## PDR §7 — authoritative detail index (validation)

Cross-check of [`design/AURA_PDR.md`](../../design/AURA_PDR.md) §7 table: each entry resolves to a present doc (or code path where noted). Re-run when §7 changes.

| §7 topic | Path | Status |
|----------|------|--------|
| Routes | [`design/AURA_SCREEN_SPECS.md`](../../design/AURA_SCREEN_SPECS.md) | Present |
| Copy / errors / SOS | [`design/AURA_LAUNCH_UX.md`](../../design/AURA_LAUNCH_UX.md) | Present |
| Onboarding & settings UX | [`UX_ONBOARDING_TRUST_SETTINGS.md`](./UX_ONBOARDING_TRUST_SETTINGS.md) | Present |
| PDR §3–4 trace & gap register | This file | Present |
| Design tokens | [`design/AURA_DESIGN_SYSTEM.md`](../../design/AURA_DESIGN_SYSTEM.md) + `web/src/theme.css` | Present |
| API contract (beta) | [`server/README.md`](../../server/README.md), [`BETA_BACKEND.md`](./BETA_BACKEND.md) | Present |

---

## §3.1 In scope — doc map

| PDR area | Spec / doc |
|----------|------------|
| Onboarding | [`UX_ONBOARDING_TRUST_SETTINGS.md`](./UX_ONBOARDING_TRUST_SETTINGS.md) |
| Home, journey, map, trusted, settings | [`design/AURA_SCREEN_SPECS.md`](../../design/AURA_SCREEN_SPECS.md) |
| Emergency (SOS) | [`design/AURA_LAUNCH_UX.md`](../../design/AURA_LAUNCH_UX.md) |
| Backend boundary (journey id, ownership) | [`BETA_BACKEND.md`](./BETA_BACKEND.md) |

---

## §4 Functional requirements — doc map

| Clause | Verified in |
|--------|-------------|
| §4.1 Routes & shell | [`design/AURA_SCREEN_SPECS.md`](../../design/AURA_SCREEN_SPECS.md) + `web/src/App.tsx`, `AppShell.tsx` |
| §4.2 Journey API before share / I’m safe | [`BETA_BACKEND.md`](./BETA_BACKEND.md), `auraBackend.ts` (`postCreateJourney`), `JourneyNew.tsx`, `JourneyActive.tsx`, `auraApiMessages.ts` |
| §4.3 SOS confirm; anomaly notice styling | [`design/AURA_LAUNCH_UX.md`](../../design/AURA_LAUNCH_UX.md), `Emergency.tsx` |
| §4.4 Voice; no raw HTTP in UI | [`design/AURA_LAUNCH_UX.md`](../../design/AURA_LAUNCH_UX.md), `auraApiMessages.ts` |

---

## §5 Non-functional requirements — doc map

| Clause | Verified in |
|--------|-------------|
| §5 Accessibility (SOS, journey paths) | `SkipToContent` + `#main-content` (`AppShell.tsx`, `Welcome.tsx`, `Emergency.tsx`); `Emergency.tsx` (dialogs, `role` / `aria-*`), `JourneyActive.tsx`, `AuraMap.tsx` (`aria-busy`), `Home.tsx` (hub safe/alert `role="status"` + `aria-live="polite"`), `Settings.tsx`, `Trusted.tsx` |
| §5 Privacy & security | [`SECURITY.md`](./SECURITY.md) |
| §5 Observability | [`OBSERVABILITY.md`](./OBSERVABILITY.md), `auraTelemetry.ts`, server audit log in `server/README.md` |
| §5 Visual consistency | [`design/AURA_DESIGN_SYSTEM.md`](../../design/AURA_DESIGN_SYSTEM.md), `theme.css` |

---

## Gaps: blocking vs nice-to-have

### Open product questions (not engineering blockers)

1. **IA vs PDR MVP table** — PDR §3.1 lists Home, Journey, Map, Trusted, Settings as hub areas. The **primary bottom nav** foregrounds Cita / Transport / Check-in; Map, Trusted, Settings, and Journey are **secondary** (Home links). Confirm with product whether this IA is intentional for launch or whether nav should be realigned to the MVP table.

### Resolved / aligned

1. **SOS FAB vs bottom nav** — [`design/AURA_SCREEN_SPECS.md`](../../design/AURA_SCREEN_SPECS.md) now records **bottom-nav SOS** + Home / journey entry points as current chrome; **`AuraSOSButton`** remains in repo as an optional future FAB (not mounted). No further code change required for PDR §4.1 parity on this point.

### Nice-to-have (polish)

1. **Wildcard / deep links** — `*` still redirects home only; document any future routes in [`design/AURA_SCREEN_SPECS.md`](../../design/AURA_SCREEN_SPECS.md) when added.

### Resolved vs earlier gap register

1. **Global error boundary** — `AuraErrorBoundary` in [`web/src/App.tsx`](../src/App.tsx); inventory updated in [`UX_EMPTY_LOADING_SAFETY.md`](./UX_EMPTY_LOADING_SAFETY.md).
2. **Map loading affordance** — Shipped in [`web/src/components/AuraMap.tsx`](../src/components/AuraMap.tsx) (`aria-busy`, overlay, status copy).

---

## Revision

| Date | Change |
|------|--------|
| 2026-04-08 | Initial trace + gap register for [AURA-47](/AURA/issues/AURA-47). |
| 2026-04-08 | §4.2 verification row expanded + `invalid_journey_id` journey copy; trace link for [AURA-49](/AURA/issues/AURA-49). |
| 2026-04-08 | §5 trace rows; SOS FAB gap closed vs screen specs; [AURA-50](/AURA/issues/AURA-50) telemetry for `X-Aura-Anomaly` on successful API calls. |
| 2026-04-08 | [AURA-61](/AURA/issues/AURA-61): added PDR §7 authoritative index validation table (detail index cross-check). |
| 2026-04-08 | [AURA-59](/AURA/issues/AURA-59): UX trace inventory synced to shipped map loading + app error boundary. |
| 2026-04-08 | [AURA-59](/AURA/issues/AURA-59): PDR §3.1 Home SOS chrome wording aligned with screen specs; Home hub `role="status"` + `aria-live` for safe/alert headline. |
| 2026-04-08 | [AURA-60](/AURA/issues/AURA-60) / [AURA-59](/AURA/issues/AURA-59): integration tests for `invalid_journey_id`; screen specs wildcard note synced with shipped error boundary; server CI also on `API_CONTRACT.md` edits. |
| 2026-04-08 | [AURA-59](/AURA/issues/AURA-59): GitHub Actions **Web lint & build** for `web/` (ESLint + `tsc` + Vite production build). |
| 2026-04-08 | [AURA-60](/AURA/issues/AURA-60): server integration tests for unknown-path `not_found` (404); API_CONTRACT regression line updated. |
| 2026-04-08 | [AURA-59](/AURA/issues/AURA-59): skip-to-main link + `#main-content` landmark on shell, welcome, and emergency (PDR §5 / WCAG 2.4.1). |
| 2026-04-08 | [AURA-60](/AURA/issues/AURA-60): integration tests for GET-on-POST-only `not_found` + OPTIONS CORS preflight headers. |
