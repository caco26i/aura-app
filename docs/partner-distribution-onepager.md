# Aura — partner & distribution one-pager

**Status:** CMO draft for employer-led distribution. Tracking: [AURA-73](/AURA/issues/AURA-73). Parent queue: [AURA-70](/AURA/issues/AURA-70).

**Primary audience (this version):** **HR, people leaders, and workplace wellness / EAP partners** who want a calm, mobile-first safety layer employees can adopt without heavy IT lift — complementary to existing mental-health and duty-of-care programs.

**Purpose:** Single page for **pipeline conversations** (employers, benefits brokers, wellness vendors, affiliates). Aligns with CEO-approved positioning in [`launch-narrative.md`](./launch-narrative.md) and product scope in [`design/AURA_PDR.md`](../design/AURA_PDR.md).

---

## 1. The problem

- Employees under stress need **low-friction ways to check in, share journey context with people they trust, and reach help in one or two taps** — especially away from the desk.
- Organizations struggle to offer **modern, privacy-respecting tools** that feel supportive rather than surveillant, and that work as a **web companion** without forcing a heavy app rollout.
- Partners (HR, wellness, EAP) need **clear stories and a simple onboarding path** they can relay to members or employees without overpromising clinical or emergency outcomes.

---

## 2. Why Aura fits

- **Calm, real-time safety companion for the web** — route-aware journeys, trusted contacts, SOS with confirm-before-send semantics, and language that avoids alarmism (see [`README.md`](../README.md) hero).
- **Trust and consent first** — transparent settings, local-first defaults until an account is live, and primers before sensitive permissions (consistent with onboarding trust spec in `web/docs/UX_ONBOARDING_TRUST_SETTINGS.md`).
- **Implementation-ready scope** — documented beta flows, optional authenticated API for structured events, and observability notes for pilots (`docs/PUBLIC_BETA.md`, `web/docs/BETA_BACKEND.md`, `web/docs/OBSERVABILITY.md`).

*Positioning line for partners:* Aura helps your people stay connected to their trusted circle and emergency options in stressful moments — **clarity under pressure**, not fear-based messaging.

---

## 3. Onboarding path (what we ask partners to relay)

1. **Discover** — Share the public-beta entry: [`docs/PUBLIC_BETA.md`](./PUBLIC_BETA.md) (or your org’s branded landing when available).
2. **Try** — Open the web app, complete the short welcome flow, explore **Home → Journey → SOS → Settings** so leaders see the full calm-critical path.
3. **Pilot (optional)** — For teams ready to exercise backend-backed events, use [`web/docs/BETA_BACKEND.md`](../web/docs/BETA_BACKEND.md) and env guidance in `web/.env.example`; keep API keys and tester lists scoped per your security review.
4. **Feedback loop** — Capture **usability, trust, and duty-of-care fit** questions; route product gaps to the Aura team via the contact below (not a substitute for professional crisis services — set expectations accordingly in rollouts).

---

## 4. Contact & next step

- **Next step for partners:** Confirm **pilot size**, **whether API-backed testing is in scope**, and **internal comms owner** (HR, wellness, or IT). We’ll align on a **one-page rollout FAQ** and any **co-branded** copy once those are set.
- **Internal owners:** CMO for narrative and partner kits; engineering for API / env questions (see repo docs above).

*This document is intentionally one page; deeper analytics narrative lives in [`beta-analytics-outcomes-narrative.md`](./beta-analytics-outcomes-narrative.md) if stakeholders need outcomes framing.*
