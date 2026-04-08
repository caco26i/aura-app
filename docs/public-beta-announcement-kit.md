# Public beta — announcement kit (board handoff)

**Status:** Draft copy for release timing; aligns with CEO-approved narrative ([`launch-narrative.md`](./launch-narrative.md), [AURA-64](/AURA/issues/AURA-64)) and tester runbook ([`PUBLIC_BETA.md`](./PUBLIC_BETA.md)).  
**Ticket:** [AURA-71](/AURA/issues/AURA-71)

Use this file as a **paste-ready bundle**: changelog bullets for release notes, hero blocks for the marketing landing page, and social snippets. Replace placeholder URLs when the public beta URL is final.

---

## 1. Short changelog (user-facing)

*What shipped for the public beta — plain language, no alarmism.*

- **Welcome flow** — Short onboarding so new visitors understand journeys, trusted contacts, and how SOS confirmation works before they need it.
- **Home safety hub** — One place to start a journey, use quick actions, and reach SOS without hunting through menus.
- **Journeys** — Plan a trip, see a live map, share location when you choose to, and tap **I’m safe** when you arrive — built for stressful moments with minimal steps.
- **Emergency (SOS)** — Calm, accessible paths with **confirm before send**; messaging stays supportive, not catastrophizing.
- **Trusted network & settings** — Contacts and safety defaults with privacy-oriented controls; data posture is explained in-product where it matters.
- **Works without installing a backend** — Explore the full UI locally; connect the **optional** beta API when you want validated events (see [BETA_BACKEND.md](../web/docs/BETA_BACKEND.md)).
- **Developers & integrators** — Clone from GitHub, follow [`PUBLIC_BETA.md`](./PUBLIC_BETA.md) for env vars, flows, and observability hooks ([`OBSERVABILITY.md`](../web/docs/OBSERVABILITY.md)).

**Deep links (same style as [AURA-68](/AURA/issues/AURA-68)-class docs):**

| Topic | Doc |
|--------|-----|
| Install, env, click-through flows | [`PUBLIC_BETA.md`](./PUBLIC_BETA.md) |
| External positioning (hero, pillars, CTA) | [`launch-narrative.md`](./launch-narrative.md) |
| Client ↔ API contract | [`BETA_BACKEND.md`](../web/docs/BETA_BACKEND.md) |
| Product scope & voice | [`AURA_PDR.md`](../design/AURA_PDR.md), [`AURA_LAUNCH_UX.md`](../design/AURA_LAUNCH_UX.md) |

---

## 2. Landing hero — three variants

*Each block: **headline** · **subhead** · **primary CTA** (button or link label). Tone: calm, plain, trustworthy.*

### Variant A — Safe default (recommended for broad audiences)

- **Headline:** Aura is now in public beta on the web  
- **Subhead:** A calm safety companion for check-ins, journeys, and help when you need it — with clear consent and a confirm-before-send SOS. Built mobile-first; explore locally or connect the optional API when you’re ready.  
- **Primary CTA:** Try the public beta  

### Variant B — Bolder (still non-alarmist)

- **Headline:** Your safety companion, open for public beta  
- **Subhead:** Share journey progress with people you trust, signal when you need help, and keep emergency paths within one or two taps — without scary UX. Local-first until you connect your account; developers get a documented beta API.  
- **Primary CTA:** Open Aura  

### Variant C — Short & punchy (hero + room for art)

- **Headline:** Aura public beta: calm safety on the web  
- **Subhead:** Journeys, trusted contacts, and SOS — designed for real stress, real privacy, and real clarity.  
- **Primary CTA:** Get started  

**Footnote for legal/comms (optional under hero):** *Public beta means we’re learning in the open; share feedback via [your channel].*

---

## 3. Three social posts (platform-agnostic)

*Character counts vary by network — trim subheads if needed. Hashtags optional; avoid fear-based hooks.*

### Post 1 — Announcement

**Copy:**  
We’re opening **Aura** for **public beta** on the web — a calm companion for journey check-ins, trusted contacts, and emergency paths that stay reachable in one or two taps. Clear consent, confirm-before-send SOS, and privacy-minded defaults. Try it: [URL] · Runbook for testers: GitHub → `docs/PUBLIC_BETA.md`

### Post 2 — Who it’s for

**Copy:**  
If you’ve ever wished safety tools felt **less alarming** and **more respectful** of your bandwidth, Aura’s public beta is for you. Mobile-first UX, plain language, and optional backend for real events when you want them. [URL]

### Post 3 — Builders

**Copy:**  
Shipping Aura in public beta includes a **documented path for developers**: optional Node API, journey/share/“I’m safe” contract, observability notes. Clone `aura-app`, start with `docs/PUBLIC_BETA.md` and `web/docs/BETA_BACKEND.md`. [URL]

---

## 4. Board checklist before publish

- [ ] Replace `[URL]` with the live public beta / repo link strategy.  
- [ ] Match hero CTA to the real primary action (deployed app vs GitHub-first).  
- [ ] Run comms past **QA** if screenshots or claims reference unreleased UI.  
- [ ] Keep copy aligned with [`launch-narrative.md`](./launch-narrative.md); revise this kit when that file changes.
