# Aura — positioning & messaging one-pager (internal)

**Status:** CMO working source for repeatable story. Tracking: [AURA-87](/AURA/issues/AURA-87). Parent: [AURA-84](/AURA/issues/AURA-84).

**Purpose:** One page the team can **repeat verbatim** in sales, partnerships, and social — without replacing CEO-approved external copy in [`docs/launch-narrative.md`](../launch-narrative.md) ([AURA-64](/AURA/issues/AURA-64)). Grounded in [`design/AURA_PDR.md`](../../design/AURA_PDR.md) §§1–2 and [`README.md`](../../README.md).

---

## Ideal customer profile (ICP)

| Dimension | Who / what |
| --- | --- |
| **Primary user** | Adults who sometimes feel uneasy alone (commute, travel, late night) and want **low-friction** check-ins with people they trust — **stress-aware**, not necessarily “power users.” |
| **Buyer / champion (B2B2C)** | HR, people leaders, wellness / EAP partners who need a **web-first**, low-IT companion that complements existing programs (see [`partner-distribution-onepager.md`](../partner-distribution-onepager.md)). |
| **Geography / platform** | **Mobile web** first; English-first copy in repo; public beta posture per [`PUBLIC_BETA.md`](../PUBLIC_BETA.md). |

---

## Core promise (one sentence)

**Aura is a calm, real-time safety companion for the web** — journey check-ins, trusted contacts, and emergency-style paths in **one or two taps** when stress is high, with **confirm-before-send** and **non-alarmist** language.

*Tagline already in use:* *You are never alone.*

---

## Three proof points (evidence we can point to today)

1. **Documented flows** — Welcome → home hub → journey (map, share, “I’m safe”) → SOS → settings, with specs and beta runbook ([`README.md`](../../README.md), [`AURA_SCREEN_SPECS.md`](../../design/AURA_SCREEN_SPECS.md), [`PUBLIC_BETA.md`](../PUBLIC_BETA.md)).
2. **Trust posture** — Local-first defaults until a live account is connected; primers before sensitive permissions; errors framed as **session/sync**, not danger (PDR §2, [`UX_ONBOARDING_TRUST_SETTINGS.md`](../../web/docs/UX_ONBOARDING_TRUST_SETTINGS.md)).
3. **Optional API + observability** — Structured beta backend contract and ops notes for pilots ([`BETA_BACKEND.md`](../../web/docs/BETA_BACKEND.md), [`OBSERVABILITY.md`](../../web/docs/OBSERVABILITY.md)).

---

## Category framing

| We say | We avoid |
| --- | --- |
| **Calm safety companion (web)** | “Always-on surveillance,” “guaranteed rescue,” clinical or legal outcome claims |
| **Journey + trusted circle + SOS** | Anonymous mass-tracking products |
| **Public beta / implementation-ready scope** | “Production-grade emergency service” without CTO/CEO sign-off |

*Category neighbors:* personal safety apps, employer wellness layers, location-sharing utilities — Aura differentiates on **calm copy**, **consent-forward UX**, and **web-first** delivery for the documented MVP scope.

---

## Contrast vs alternatives

| Alternative | How Aura contrasts |
| --- | --- |
| **Status quo (group text + maps)** | **Purpose-built** flows: journey mode, “I’m safe,” SOS confirmation, consistent nav — less hunting under stress. |
| **Native OS / carrier safety features** | **Cross-device web** companion; user-chosen **trusted network** and **documented** beta API for org pilots. |
| **Heavy EAP-only portals** | **Lightweight web** entry; partners relay a simple story (see partner one-pager) without replacing professional care. |

*Names optional;* positioning holds even if we only say “status quo texting.”

---

## Objections (1–2) and responses

| Objection | Response |
| --- | --- |
| **“Is this tracking me?”** | **You choose** who is in your circle and when sharing is on; location is tied to **features you use**, with primers before prompts — not always-on surveillance ([trust pack](../trust-safety-messaging-pack-v2.md)). |
| **“Will this replace 911 / my therapist?”** | **No.** Aura helps coordinate with **people you trust** and surfaces help paths you already have; emergencies → **local emergency services**; not medical/legal advice (align with [AURA-78](/AURA/issues/AURA-78) FAQ tone). |

---

## Claims that need product / engineering validation before public use

Flag these in external comms until explicitly cleared:

- **Live latency / reliability** of SOS or location delivery when backend is connected (depends on deployment and integrator).
- **Exact permission strings** and OS/browser behavior — always cite **in-app** copy after changes ([AURA-63](/AURA/issues/AURA-63) ownership).
- **Any metrics** (activation, time-to-help, pilot N) — route through [`beta-analytics-outcomes-narrative.md`](../beta-analytics-outcomes-narrative.md) and CEO/CTO for numbers.

---

## Change control

- Keep **hero + pillars** aligned with [`launch-narrative.md`](../launch-narrative.md) unless CEO updates that file.
- Revise this one-pager when PDR §§1–2 or primary ICP shifts; link PRs to [AURA-87](/AURA/issues/AURA-87) or successor.
