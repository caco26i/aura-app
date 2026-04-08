# Localized launch wave kit (PR + social)

**Purpose:** Paste-ready materials for a **follow-on or region/community launch wave** after the primary public-beta announcement. Same facts as the shipped beta; no new product claims.

**Voice & claims:** Align with CEO-approved external narrative in [`docs/launch-narrative.md`](../launch-narrative.md) ([AURA-64](/AURA/issues/AURA-64)): calm companion, clarity under pressure, trust/consent/control, one companion from home to emergency. For shipped scope detail, see [`docs/public-beta-announcement-kit.md`](../public-beta-announcement-kit.md) and [`docs/PUBLIC_BETA.md`](../PUBLIC_BETA.md).

**Placeholders:** Replace `[LOCALE_OR_COMMUNITY]`, `[PRIMARY_URL]`, and `[FEEDBACK_CHANNEL]` before publish.

---

## 1. Press blurb (~150 words)

**Suggested headline:** *Aura public beta expands reach for [LOCALE_OR_COMMUNITY] communities seeking calmer safety tools*

**Body (~150 words):**

Aura is a calm, real-time safety companion for the web, now in **public beta** for people who want to share journey progress with those they trust, signal when they need help, and keep emergency paths within one or two taps—without alarmist UX. The product emphasizes **clarity under pressure**, **transparent consent and control**, and **local-first exploration** until users connect optional account-backed features; SOS uses **confirm-before-send** messaging and supportive, plain language. **Mobile-first** paths carry through the core flows documented for the beta.

Teams and community leaders can point members to the open beta **via the project’s documented runbook** (install, environment variables, and core flows). Developers may optionally wire the **documented beta API** for validated journey and SOS events when they are ready.

Aura’s external positioning is maintained in the repository’s **launch narrative**; this wave reiterates the same pillars for **[LOCALE_OR_COMMUNITY]** audiences. **Primary call to action:** try the public beta at **[PRIMARY_URL]** and share structured feedback via **[FEEDBACK_CHANNEL]**.

---

## 2. Social thread outline — X (Twitter)

*Tone: factual, calm, one idea per post. Trim for character limits.*

1. **Hook:** We’re highlighting Aura’s **public beta** for **[LOCALE_OR_COMMUNITY]**—a calm web companion for journeys, trusted contacts, and SOS with confirm-before-send. No fear-based hooks; built for real stress and real privacy.
2. **What it is:** Share journey progress with people you trust, reach help in **one or two taps**, plain language instead of catastrophizing. Mobile-first.
3. **Trust:** Clear consent, supportive defaults, errors framed as **session/sync** where possible—aligned with our published narrative ([`launch-narrative.md`](../launch-narrative.md))).
4. **Try it:** Start at **[PRIMARY_URL]** · Technical path: GitHub → `docs/PUBLIC_BETA.md`.
5. **Builders (optional):** Optional **beta API** for validated events when you want it—`web/docs/BETA_BACKEND.md`.
6. **Close:** Feedback welcome via **[FEEDBACK_CHANNEL]** · #PublicBeta (optional, sparingly).

---

## 3. Social thread outline — Instagram

*Format: carousel-first or short Reels caption stack; visual notes for design.*

**Slide / beat 1 — Cover:** Title: *Aura · public beta* · Sub: *Calm safety on the web for [LOCALE_OR_COMMUNITY]* · CTA sticker: *Link in bio*.

**Slide 2 — Problem/solution (soft):** *When stress is high, tools should be predictable.* Journeys, trusted contacts, SOS—**minimal steps**, supportive copy.

**Slide 3 — Pillar collage:** Three labels matching narrative: **Clarity under pressure** · **Trust & consent** · **One companion** (home → journey → SOS). No medical or emergency-service guarantees.

**Slide 4 — What to do:** *Try the beta* → **[PRIMARY_URL]** · *Read the runbook* → link to `docs/PUBLIC_BETA.md` in bio or pinned comment.

**Slide 5 — Developers:** *Optional API* for real events—point to `web/docs/BETA_BACKEND.md` (same scope as shipped beta).

**Caption (long-form, below post):**  
Short paragraph echoing hero + pillars; end with **Link in bio** and **[FEEDBACK_CHANNEL]**. Hashtags: optional, minimal (e.g. `#safety` `#webapp`)—avoid sensational tags.

**Stories sequence (3 frames):** (1) Announce beta for [LOCALE_OR_COMMUNITY]. (2) “Confirm-before-send SOS” + calm voice. (3) Swipe-up / sticker → **[PRIMARY_URL]**.

---

## 4. Social thread outline — LinkedIn

*Tone: professional, privacy- and design-conscious; good for community orgs and tech leads.*

1. **Post opener:** We’re supporting a **localized rollout wave** for Aura’s **public beta**—a web safety companion focused on **low-friction check-ins**, **transparent controls**, and **cohesive** journey → SOS flows ([`launch-narrative.md`](../launch-narrative.md)).
2. **Why it matters:** Safety UX often adds anxiety; Aura prioritizes **plain language**, **consent-forward settings**, and **accessible** critical paths—scoped to what’s **shipped** in beta.
3. **For organizations:** If you steward **[LOCALE_OR_COMMUNITY]** networks, the **tester runbook** (`docs/PUBLIC_BETA.md`) is the authoritative install/flow reference; share **[PRIMARY_URL]** as the entry point you’ve validated.
4. **For engineering partners:** The client runs **without** a self-hosted backend for UI exploration; **optional** API integration is documented in `web/docs/BETA_BACKEND.md` with observability notes in `web/docs/OBSERVABILITY.md`.
5. **CTA + integrity:** Try **[PRIMARY_URL]** · Feedback **[FEEDBACK_CHANNEL]** · Comms stay aligned with CEO-approved narrative—**no claims beyond shipped beta scope**.

**Comment prompt (optional):** *What would make a safety product feel trustworthy in your community?* (keeps thread substantive without fear-mongering.)

---

## 5. Community leader email

**Subject options:**

- Aura public beta — resources for **[LOCALE_OR_COMMUNITY]** members  
- Sharing Aura’s public beta (calm safety companion, documented runbook)

**Body:**

Hi [NAME],

Thank you for the work you do with **[LOCALE_OR_COMMUNITY]**. I’m writing to share **Aura**, a **public beta** web companion focused on **calm** journey check-ins, **trusted contacts**, and **SOS** flows that use **confirm-before-send** and supportive language—aligned with our **CEO-approved external narrative** ([`docs/launch-narrative.md`](../launch-narrative.md)).

**What we’re asking:** If a beta safety tool is useful for your group, you can point people to **[PRIMARY_URL]** and the **step-by-step runbook** at `docs/PUBLIC_BETA.md` in the open repository (install, env vars, and the main user flows). **No new features are promised** in this note—only what’s already documented for the beta.

**For technical members:** Optional API integration is documented in `web/docs/BETA_BACKEND.md`.

**Feedback:** **[FEEDBACK_CHANNEL]**

With appreciation,  
[SIGNATURE]

---

## Rollout note (internal)

Ship this kit with placeholders filled; run any screenshot or UI-heavy claims past **QA** per [`public-beta-announcement-kit.md`](../public-beta-announcement-kit.md) board checklist.
