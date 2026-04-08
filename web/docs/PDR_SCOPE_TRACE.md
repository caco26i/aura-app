# PDR §3–4 traceability & gap register

**Purpose:** Keep [`design/AURA_PDR.md`](../../design/AURA_PDR.md) **§3 (scope)** and **§4 (functional requirements)** traceable to `web/` UX docs and the shipped shell. Complements the design index in PDR §7.

**Related work:** [AURA-41](/AURA/issues/AURA-41), [AURA-44](/AURA/issues/AURA-44), [AURA-47](/AURA/issues/AURA-47).

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
| §4.2 Journey API before share / I’m safe | [`BETA_BACKEND.md`](./BETA_BACKEND.md), `auraBackend.ts` |
| §4.3 SOS confirm; anomaly notice styling | [`design/AURA_LAUNCH_UX.md`](../../design/AURA_LAUNCH_UX.md), `Emergency.tsx` |
| §4.4 Voice; no raw HTTP in UI | [`design/AURA_LAUNCH_UX.md`](../../design/AURA_LAUNCH_UX.md), `auraApiMessages.ts` |

---

## Gaps: blocking vs nice-to-have

### Blocking (product/engineering should resolve for full PDR parity)

1. **SOS FAB vs bottom nav** — UX specs describe a global **`AuraSOSButton`** FAB; the shell currently exposes SOS via **bottom navigation** and Home tiles only (`AuraSOSButton` is not mounted). Either mount the FAB per spec **or** revise UX specs to declare bottom-nav SOS as the canonical pattern for this product iteration.
2. **IA vs PDR MVP table** — PDR §3.1 lists Home, Journey, Map, Trusted, Settings as the hub areas. The **primary bottom nav** foregrounds Cita / Transport / Check-in; Map, Trusted, Settings, and Journey are **secondary** (Home links). Confirm with product whether this IA is intentional for launch or whether nav should be realigned to the MVP table.

### Nice-to-have (polish)

1. **Global error boundary** — [`UX_EMPTY_LOADING_SAFETY.md`](./UX_EMPTY_LOADING_SAFETY.md) notes none today; `*` route redirects home only.
2. **Map loading affordance** — Optional skeleton / `aria-busy` per empty/loading spec.
3. **Wildcard / deep links** — Document any future routes in [`design/AURA_SCREEN_SPECS.md`](../../design/AURA_SCREEN_SPECS.md) when added.

---

## Revision

| Date | Change |
|------|--------|
| 2026-04-08 | Initial trace + gap register for [AURA-47](/AURA/issues/AURA-47). |
