# Aura — external launch narrative (one-pager)

**Purpose:** Single source of truth for **public-beta positioning** ahead of broader marketing surfaces. Grounded in [`design/AURA_PDR.md`](../design/AURA_PDR.md) §§1–2 (vision, problem, users) and consistent with repo [`README.md`](../README.md).

**Related work:** In-app string refinements remain owned by [AURA-63](/AURA/issues/AURA-63); this document uses the same voice as current onboarding (`Welcome to Aura`, calm SOS explanation, journeys/location primer) without rewriting those strings here.

---

## Hero statement

**Aura is a calm, real-time safety companion for the web** — so people can share journey progress with people they trust, signal when they need help, and reach emergency paths in one or two taps when stress is high. *You are never alone:* supportive defaults, clear consent, and plain language instead of alarmism.

---

## Three pillars

### 1. Clarity under pressure

People in stressful moments have less bandwidth. Aura is built for **predictable, low-friction** check-ins and emergency flows — minimal steps, consistent SOS access, and errors that read as **session or sync issues**, not personal danger (see PDR §§1–2, §4.2–4.3).

### 2. Trust, consent, and control

Aura serves **privacy-minded users** who need to know what leaves the device. We lead with **transparent settings** and **local-first defaults** until a live account is connected; location and alerts are framed as **choices**, with primers before the browser asks (PDR §2, onboarding trust spec).

### 3. One companion from home to emergency

From the **safety hub** through **journeys** (map, share, “I’m safe”) to **SOS** (confirm before anything is sent; visible vs silent-style paths), Aura keeps trusted contacts and emergency options **in one cohesive experience** — mobile-first, accessible critical paths (PDR §3.1, §4).

---

## Primary CTA (public beta)

**Try Aura on the web** — complete the short welcome flow, explore journeys and settings, and use the documented optional beta API when you are ready to exercise backend-backed events. **Developers:** start from the repo README and [`web/docs/BETA_BACKEND.md`](../web/docs/BETA_BACKEND.md) for environment and contract notes.

*(Adjust the exact landing URL or waitlist copy on the marketing site when it ships; keep this CTA aligned with “public beta” and the calm voice above.)*

---

## Alignment notes

| Source | How this narrative maps |
|--------|-------------------------|
| PDR §1 Vision & problem | Hero + pillar 1 |
| PDR §2 Users & contexts | Pillars 1–2 (stress, privacy) |
| PDR §3.1 Scope highlights | Pillar 3 + CTA scope |
| README opening | Hero wording kept consistent |
| [AURA-63](/AURA/issues/AURA-63) | No conflict flagged: external lines echo onboarding themes without changing in-product strings |

**Revision:** Update this file when PDR §1–2 or launch positioning materially changes; link the PR to the tracking issue.
