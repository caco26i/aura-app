# Aura — Product Design & Requirements (PDR)

**Ticket:** [AURA-41](/AURA/issues/AURA-41) · **Status:** living document — revise when scope or compliance needs change.

This document consolidates **what Aura is for**, **who it serves**, **what must ship**, and **how we measure quality**. Detailed routing, copy tables, and visual tokens remain in linked specs so this file stays the single entry point for product and engineering.

---

## 1. Vision & problem

**Vision:** A calm, real-time safety companion for the web that keeps check-ins, trusted contacts, and emergency paths within one or two taps when stress is high.

**Problem:** People under pressure need predictable, low-friction ways to signal status, share location with consent, and reach help without hunting through complex UI or alarming copy.

**Principle:** *You are never alone* — reflected in supportive defaults, clear consent, and non-alarmist language.

---

## 2. Target users & contexts

| Segment | Needs | Implications |
|--------|--------|--------------|
| **Primary** | Adults using Aura during travel, late commutes, or uneasy situations | Mobile-first; large touch targets; works offline-aware |
| **Stress context** | Reduced cognitive bandwidth | Minimal steps; consistent SOS placement; no blame-oriented errors |
| **Privacy-minded users** | Control over what leaves the device | Transparent settings; local-first defaults until backend connected |

---

## 3. Product scope (MVP vs documented future)

### 3.1 In scope (implementation-ready today)

Aligned with repository areas and [`AURA_SCREEN_SPECS.md`](./AURA_SCREEN_SPECS.md):

| Area | User-facing capability | Spec depth |
|------|------------------------|------------|
| **Onboarding** | First-run explanation of Aura, data posture, SOS confirmation behavior | [`web/docs/UX_ONBOARDING_TRUST_SETTINGS.md`](../web/docs/UX_ONBOARDING_TRUST_SETTINGS.md) |
| **Home** | Safety hub, journey entry, quick actions, global SOS FAB | Screen specs |
| **Journey** | Configure trip, live map, share location (with primer), “I’m safe” | Screen specs + backend ownership rules |
| **Emergency (SOS)** | Visible vs silent-style paths, confirm-before-send, calm errors | [`AURA_LAUNCH_UX.md`](./AURA_LAUNCH_UX.md) |
| **Map** | Safety intel layers and safer-route thinking (UI + documented placeholders) | Screen specs |
| **Trusted network** | Contacts and grouping | Screen specs |
| **Settings** | Safety defaults, privacy-oriented controls, backend connection | UX onboarding/settings doc |

### 3.2 Out of scope for this PDR revision

- Replacing map provider or OAuth architecture (track as separate initiatives).
- Production contact/SMS dispatch integrations (depends on legal + carrier strategy).
- Native app store packaging (web-first PDR).

---

## 4. Functional requirements

### 4.1 Routing & shell

- Routes and shell behavior (bottom nav, SOS FAB visibility) **must** match [`AURA_SCREEN_SPECS.md`](./AURA_SCREEN_SPECS.md).
- Cold start: redirect to `/welcome` when onboarding is incomplete; **`/emergency` remains reachable** without completing onboarding (safety override).

### 4.2 Journey & backend

- Client **must** create a journey via API before location share or I’m-safe for that journey id (see [`web/docs/BETA_BACKEND.md`](../web/docs/BETA_BACKEND.md)).
- Errors for unknown or foreign journeys **must** read as session/sync issues, not personal danger ([`AURA_LAUNCH_UX.md`](./AURA_LAUNCH_UX.md)).

### 4.3 SOS & anomalies

- No alert is sent until the user confirms on the emergency surface (per UX spec).
- Successful SOS with rate/burst signals (`X-Aura-Anomaly`) **must** use calm `role="status"` copy, not failure styling.

### 4.4 Trust & copy

- Voice: calm, plain language, no alarmism ([`AURA_LAUNCH_UX.md`](./AURA_LAUNCH_UX.md)).
- Error mapping **must** be centralized (e.g. `auraApiMessages.ts`); no raw HTTP codes in UI.

---

## 5. Non-functional requirements

| Category | Requirement |
|----------|-------------|
| **Accessibility** | Critical paths (SOS, journey actions) expose appropriate ARIA roles; prefer inline alerts for high-stress flows over toast-only until a global pattern is spec’d |
| **Privacy & security** | Follow [`web/docs/SECURITY.md`](../web/docs/SECURITY.md) for client storage and first-backend assumptions |
| **Reliability** | Optional API: rate limits, audit log, health check — see [`server/README.md`](../server/README.md) |
| **Observability** | Client/server notes in [`web/docs/OBSERVABILITY.md`](../web/docs/OBSERVABILITY.md) |
| **Visual consistency** | Tokens and intent in [`AURA_DESIGN_SYSTEM.md`](./AURA_DESIGN_SYSTEM.md) (`web/src/theme.css` canonical) |

---

## 6. Architecture snapshot

- **`web/`** — Vite + React + TypeScript SPA.
- **`server/`** — Node API: validated POST routes, bearer auth, append-only audit trail.

Integration and deploy expectations: [`web/docs/BETA_BACKEND.md`](../web/docs/BETA_BACKEND.md), [`web/docs/DEPLOY.md`](../web/docs/DEPLOY.md).

---

## 7. Traceability & child work

Use this PDR as the parent narrative; break execution into Paperclip issues per surface (onboarding, journey hardening, map, etc.). If parallel execution is needed, the board may spin up **up to five additional IC agents** and delegate slices of §4–§5 ([AURA-41](/AURA/issues/AURA-41) description).

**Authoritative detail index:**

| Topic | Document |
|--------|----------|
| Routes | [`AURA_SCREEN_SPECS.md`](./AURA_SCREEN_SPECS.md) |
| Copy / errors / SOS | [`AURA_LAUNCH_UX.md`](./AURA_LAUNCH_UX.md) |
| Onboarding & settings UX | [`web/docs/UX_ONBOARDING_TRUST_SETTINGS.md`](../web/docs/UX_ONBOARDING_TRUST_SETTINGS.md) |
| PDR §3–4 web trace & gap register | [`web/docs/PDR_SCOPE_TRACE.md`](../web/docs/PDR_SCOPE_TRACE.md) |
| Design tokens | [`AURA_DESIGN_SYSTEM.md`](./AURA_DESIGN_SYSTEM.md) |
| API contract (beta) | [`server/README.md`](../server/README.md), [`web/docs/BETA_BACKEND.md`](../web/docs/BETA_BACKEND.md) |

---

## 8. Revision history

| Date | Change |
|------|--------|
| 2026-04-08 | Initial PDR authored for [AURA-41](/AURA/issues/AURA-41); consolidates existing design package into one entry document. |
| 2026-04-08 | Added [`web/docs/PDR_SCOPE_TRACE.md`](../web/docs/PDR_SCOPE_TRACE.md) to detail index ([AURA-47](/AURA/issues/AURA-47)). |
