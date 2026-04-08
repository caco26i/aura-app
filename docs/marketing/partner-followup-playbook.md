# Partner follow-up playbook (outreach + email)

**Purpose:** Operational checklist and **paste-ready email variants** for moving partner conversations forward **after** the first share of [`docs/partner-distribution-onepager.md`](../partner-distribution-onepager.md) ([AURA-73](/AURA/issues/AURA-73)).

**Voice & claims:** Same guardrails as the one-pager — calm, consent-forward, **no** clinical or guaranteed emergency outcomes. Align hero language with [`docs/launch-narrative.md`](../launch-narrative.md) ([AURA-64](/AURA/issues/AURA-64)). For metrics diligence, point to [`docs/beta-analytics-outcomes-narrative.md`](../beta-analytics-outcomes-narrative.md) ([AURA-72](/AURA/issues/AURA-72)).

**Placeholders:** Replace `[CONTACT_NAME]`, `[YOUR_NAME]`, `[YOUR_TITLE]`, `[ORG]`, `[PRIMARY_URL]`, `[FEEDBACK_OR_PILOT_CONTACT]`, and optional broker/vendor names before send.

---

## How this pairs with the one-pager

| Asset | Role |
| --- | --- |
| **One-pager** | **First touch** — problem, fit, onboarding path, and “what we ask partners to relay” in one screen. |
| **This playbook** | **Pipeline motion** — who does what after the one-pager lands, how fast to nudge, and **two** email tones (relationship vs. procurement). |

Send the one-pager (or link) **before** or **with** email variant A or B; these emails assume the recipient has seen or will open that doc.

---

## 1. Stage checklist (owners + SLA hints)

Use as a lightweight CRM checklist. SLAs are **targets** for beta-stage motion — adjust for enterprise procurement reality.

| Stage | Goal | Owner (default) | SLA hint | Exit criteria |
| --- | --- | --- | --- | --- |
| **T0 — Qualified interest** | Confirm ICP fit (HR / wellness / EAP / employer-led distribution). | CMO or delegate | Same day as inbound | Fit yes/no; note comms + technical stakeholders. |
| **T1 — Materials sent** | Share one-pager + beta entry (`docs/PUBLIC_BETA.md` or branded landing). | CMO | Within **1 business day** of T0 | Sent log + which variant (warm vs formal) used. |
| **T2 — Acknowledgment** | They opened / replied / agreed to a next step. | Same as sender | First nudge **3 business days** after T1 if silent | Reply or calendar hold; else move to T3. |
| **T3 — Second nudge** | Polite bump with single CTA (pilot size, API scope, or intro to IT). | Same as sender | **5 business days** after T2 nudge | Scheduled call, pilot “maybe,” or explicit pass (close file). |
| **T4 — Discovery / pilot scoping** | Align pilot size, API in/out, internal comms owner (per one-pager §4). | CMO + engineering (API) as needed | Prep **1-pager FAQ** within **2 business days** of verbal yes | Written recap to partner; owners named on both sides. |
| **T5 — Pilot live or deferred** | Testers have URL + runbook; or dated follow-up if procurement delays. | CMO + partner comms owner | Kickoff within **5 business days** of signed-off scope (internal sign-off counts for beta) | Pilot roster size agreed; feedback channel set. |

**Internal handoffs**

- **Narrative / kits / co-branded copy:** CMO (per one-pager).
- **API, env, observability:** Engineering — `web/docs/BETA_BACKEND.md`, `web/docs/OBSERVABILITY.md`.
- **Trust & safety wording:** [`docs/trust-safety-messaging-pack-v2.md`](../trust-safety-messaging-pack-v2.md) ([AURA-78](/AURA/issues/AURA-78)) before external campaigns.

---

## 2. Email variant A — Warm intro (peer / relationship)

*Use when:* mutual connection, event follow-up, or ongoing thread with a first name and informal tone.

**Subject options**

- Following up — Aura pilot fit for [ORG]
- Quick next step on the Aura one-pager I shared

**Body**

Hi [CONTACT_NAME],

Thanks again for taking a look. I wanted to follow up on the **short partner overview** I shared — it lays out how Aura works as a calm, **web-first** companion for journey check-ins and SOS-style flows, with **confirm-before-send** and language that stays supportive rather than alarmist.

If it’s useful, the next lightweight step on our side is to align on **rough pilot size**, whether **API-backed testing** is in scope for you, and who owns **internal comms** (HR, wellness, or IT) — same three bullets we close with on the one-pager.

Happy to do a 25-minute call or answer async — whatever’s easier. If you’re not the right owner, feel free to point me to whoever runs wellness or employee comms and I’ll adapt.

Best,  
[YOUR_NAME]  
[YOUR_TITLE], [ORG]

**Try the beta:** [PRIMARY_URL]  
**Questions / pilot interest:** [FEEDBACK_OR_PILOT_CONTACT]

---

## 3. Email variant B — Formal org (HR / wellness / procurement)

*Use when:* outbound to titled roles, RFP-adjacent threads, brokers, or when a more neutral, policy-aware tone is expected.

**Subject options**

- Aura public beta — follow-up materials and pilot scoping
- Next steps: employer pilot discussion (Aura)

**Body**

Dear [CONTACT_NAME],

I am writing to follow up on the **Aura partner and distribution summary** provided for [ORG]. That document describes our **public beta** positioning: a **mobile-friendly web companion** for trusted-contact journeys and low-friction paths to help, with **transparent consent and control** and **no** claims regarding clinical diagnosis or guaranteed emergency outcomes.

We would welcome a brief alignment on the following, consistent with the summary’s recommended next steps:

1. **Intended pilot or rollout size** (approximate headcount or cohort).  
2. **Whether authenticated API integration** is required for your evaluation, or UI exploration via the documented beta is sufficient.  
3. **Designated internal owner** for employee or member communications (e.g., HR, workplace wellness, EAP partner, or IT).

We can provide **technical references** (beta runbook, optional API and observability documentation) and **outcomes framing** appropriate for diligence, bounded to what the beta can credibly show.

Please reply with availability for a short discovery call, or indicate the appropriate contact if another stakeholder should lead.

Sincerely,  
[YOUR_NAME]  
[YOUR_TITLE], [ORG]

**Beta runbook:** `docs/PUBLIC_BETA.md` (repository) · **Primary entry:** [PRIMARY_URL]  
**Pilot / technical inquiries:** [FEEDBACK_OR_PILOT_CONTACT]

---

## 4. After send — internal note (optional)

Paste into your tracker:

- **Variant used:** A (warm) / B (formal)  
- **One-pager version:** link or commit ref  
- **Blockers:** legal, security review, budget, competing pilot  
- **Next action + owner + date**
