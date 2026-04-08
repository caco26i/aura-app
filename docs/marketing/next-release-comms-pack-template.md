# Next-release comms pack — template + example (Aura)

**Status:** Reusable template. Tracking: [AURA-88](/AURA/issues/AURA-88). Parent: [AURA-84](/AURA/issues/AURA-84).

**Purpose:** Cut friction on every ship: **in-app / changelog**, **short email**, **two social variants** — with a **worked example** for a plausible next release. Technical claims require **CTO** validation; external stance requires **CEO** sign-off (same rule as [`launch-narrative.md`](../launch-narrative.md)).

---

## Owner + approval path

| Asset | Default owner | Approver for claims / tone |
| --- | --- | --- |
| Changelog / in-app bullets | **PM or CMO** (copy), **engineering** (accuracy) | **CTO** for behavior/API/security statements |
| Email | **CMO** | **CEO** for positioning; **CTO** for technical bullets |
| Social | **CMO** | **CEO** for campaign lines; **CTO** if mentioning reliability, data, or security |

*Process:* Draft → CTO factual pass (async) → CEO voice/strategy pass → publish. For hotfixes, CTO-only may suffice **if** no positioning change.

---

## 1) Template — in-app / changelog

**Release name / version:** `[VERSION]`  
**Ship date:** `[DATE]`  
**Audience:** end users + optional “developers” subsection

**Headline (≤80 chars):**  
`[Calm, specific benefit — no fear hooks]`

**Bullets (3–5):**

- `[User-visible change — plain language]`
- `[Trust/privacy note if relevant]`
- `[Fix or reliability — avoid blaming the user]`

**Developer / integrator note (optional):**

- `[API/env flag/doc link — only if shipped]`

**Known limitations (optional, honest):**

- `[What we did not ship or what is beta]`

---

## 2) Template — short email (≤180 words)

**Subject options:**

- `[Benefit-first — e.g. “Smoother journeys in Aura”]`
- `[“Update:” + concrete outcome]`

**Body**

Hi `[Name / “there”]`,

`[1–2 sentences: what shipped and why it matters — calm voice.]`

**What’s new**

- `[Bullet mirror of changelog — max 3]`

**Try it:** `[URL]`  
**Questions:** `[support or feedback channel]`

— `[Sender]`  
Aura team

---

## 3) Template — social variants

**Variant A (user-benefit, ≤280 chars)**  
`[Hook] + [one proof] + [CTA URL]`

**Variant B (trust / craft, ≤280 chars)**  
`[Why we built it this way] + [no surveillance / consent line] + [CTA]`

*Guardrails:* match [`trust-safety-messaging-pack-v2.md`](../trust-safety-messaging-pack-v2.md); no medical/legal guarantees.

---

## 4) Worked example — hypothetical “Journey recap + SOS polish” release

*Illustrative only; replace with real notes when shipping.*

**Version:** `web v0.12.0 (hypothetical)`  
**Headline:** Clearer journey recap and calmer SOS confirmations

**Changelog bullets**

- Journey screen shows a **short recap** of what you shared and **who** can see it before you start tracking.
- SOS path uses **shorter confirm copy** so the intent is obvious without alarming language.
- Fixes a bug where **“I’m safe”** sometimes failed to sync on slow networks (retry + clearer status).

**Developer note:** None — no API contract change in this example.

**Email subject:** Smoother journeys and clearer SOS confirmations in Aura

**Email body (short)**  
We shipped updates that make **journeys easier to understand at a glance** and **SOS confirmations** quicker to read — same calm voice as before. Open the beta, start a journey, and try SOS in a safe test environment. Reply if you want the pilot deck for employers.

**Social A**  
Journeys should be understandable in seconds. Aura now surfaces a **quick recap** of what you’re sharing before you go — calm safety UX on the web. `[URL]`

**Social B**  
We tightened **SOS confirmation** copy so the step is obvious without sounding like an alarm. Safety tools should respect **stress and attention**. `[URL]`

---

## File hygiene

- Store filled packs next to release PRs or link from the tracking issue.
- If copy ships in-product, sync with [AURA-63](/AURA/issues/AURA-63) owners for string changes.
