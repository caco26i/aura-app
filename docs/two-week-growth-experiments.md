# Two-week growth experiment backlog

**Owner:** CMO · **Tracking:** [AURA-79](/AURA/issues/AURA-79) · **Parent context:** [AURA-76](/AURA/issues/AURA-76)

**Purpose:** Turn narrative and launch assets ([AURA-71](/AURA/issues/AURA-71)–[AURA-73](/AURA/issues/AURA-73), [`launch-narrative.md`](./launch-narrative.md), [`beta-analytics-outcomes-narrative.md`](./beta-analytics-outcomes-narrative.md)) into **numbered, time-boxed bets** with clear metrics and decisions. Instrumentation references the shipped client categories in [`web/docs/OBSERVABILITY.md`](../web/docs/OBSERVABILITY.md) where applicable.

**Privacy / claims:** Experiments measure **distribution and product friction**, not safety outcomes. Keep reporting aligned with the boundaries in [`beta-analytics-outcomes-narrative.md`](./beta-analytics-outcomes-narrative.md).

---

## Channel map (by experiment)

| Experiment | Primary surfaces | Secondary / notes |
| ---------- | ---------------- | ----------------- |
| **1** — Social hero variant | X (Twitter), LinkedIn | Reddit or community posts only if moderation capacity exists; reuse [`public-beta-announcement-kit.md`](./public-beta-announcement-kit.md) hero variants |
| **2** — Email activation framing | Transactional / newsletter to **beta list** (not cold purchased lists) | Pair with [`post-launch-retention-narrative-week1.md`](./post-launch-retention-narrative-week1.md) strips where relevant |
| **3** — Acquisition → activation quality | Partner / org distribution ([`partner-distribution-onepager.md`](./partner-distribution-onepager.md)), newsletter deep links | Organic social as **control** arm; requires **first-touch attribution** in product (see CTO child issue linked from [AURA-79](/AURA/issues/AURA-79) comments) |

---

## Experiment 1 — Social hero variant (7 days)

**Hypothesis:** A **pillar-led** social hook (“clarity under pressure + consent”) earns a higher **qualified click-through** than a **single-line hero** hook, among the same audience and placement.

**Primary metric:** Click-through rate (CTR) = unique clicks ÷ impressions **per variant**, measured on **variant-specific tracked links** (short links or redirect logs you control).

**Instrumentation / data source:** One tracked URL per variant (e.g. redirect service or landing host analytics). **Not** app telemetry for the primary decision (no product change). Optional sanity check: compare total sessions on the public beta entry page if you host one; GitHub “traffic” alone is too coarse for fast decisions.

**Runtime:** **7 days** from first simultaneous post of both variants (same budget / similar time-of-day where possible).

**Ship / kill:**

- **Ship** the winning variant if it beats the other by **≥25% relative CTR** *and* the pair has **≥100 combined clicks** (if combined clicks stay under 100, extend up to **3 days** once with a comment on the decision log, or **kill** as inconclusive).
- **Kill** and keep the default hero emphasis from [`launch-narrative.md`](./launch-narrative.md) / kit variant A if there is no meaningful lift or traffic is too thin.

---

## Experiment 2 — Email subject + preheader framing (14 days)

**Hypothesis:** A subject/preheader pair that stresses **low-friction critical paths** (“two taps to SOS”) drives more **unique clicks** on the beta CTA than a pair that stresses **calm companion** positioning.

**Primary metric:** Unique **CTA clicks** per cell (A vs B) from the ESP (email service provider).

**Instrumentation / data source:** ESP campaign stats (opens optional, **clicks primary**). Use **distinct CTA URLs** per cell (`?ref=email-e2-a` / `?ref=email-e2-b` on the same destination) so web server or link analytics can reconcile duplicates. App does not need to parse these for the **email** decision.

**Runtime:** **14 days** (includes send-time spread and weekend effects).

**Ship / kill:**

- **Ship** the winning cell if CTA click rate improves by **≥15% relative** vs the other *and* each cell has **≥200 delivered** (else treat as directional only).
- **Kill** and standardize on the stronger of the two [`post-launch-retention-narrative-week1.md`](./post-launch-retention-narrative-week1.md) baselines if no lift.

---

## Experiment 3 — Acquisition source → day-1 return (14 days post-instrumentation)

**Hypothesis:** Users acquired via **partner / newsletter** deep links show higher **day-1 return** (second meaningful session) than users from **organic social**, when holding onboarding copy constant.

**Primary metric:** **D1 return rate** = share of new users with a **second** `auth` bootstrap or measurable “session 2” within **36 hours** of first touch (define “session 2” consistently in the analysis sheet — e.g. second calendar day with any telemetry ship).

**Instrumentation / data source:**

- **Requires product work:** persist **first-touch** `ref` / UTM parameters (non-PII) at first load and attach to `auth.bootstrap` (and optionally first `journey.started`) in client telemetry per [`web/docs/OBSERVABILITY.md`](../web/docs/OBSERVABILITY.md). **Do not** block this marketing doc on engineering; **CTO** picks up the scoped handoff posted on [AURA-79](/AURA/issues/AURA-79) (or a child issue once split by CEO/CTO).
- Until shipped, run **no** formal kill/ship on this hypothesis; use qualitative partner feedback only.

**Runtime:** **14 days** of data collection **after** instrumentation is live in the environment where you spend acquisition.

**Ship / kill:**

- **Ship** (adopt partner/newsletter as prioritized channel for the next sprint) if D1 return is **≥10 percentage points** higher for the partner cohort than social **and** each cohort has **≥50** new users in the window.
- **Kill** the hypothesis (treat channels as equivalent for now) if no significant gap or sample is too small — document and revisit next beta milestone.

---

## Decision log (fill in during runs)

| Experiment | Date range | Winner | Notes / link |
| ---------- | ---------- | ------ | ------------ |
| 1 | | | |
| 2 | | | |
| 3 | | | |

---

## Related docs

| Doc | Role |
| --- | ---- |
| [`docs/public-beta-announcement-kit.md`](./public-beta-announcement-kit.md) | Creative variants ([AURA-71](/AURA/issues/AURA-71)) |
| [`docs/beta-analytics-outcomes-narrative.md`](./beta-analytics-outcomes-narrative.md) | What we can claim from telemetry ([AURA-72](/AURA/issues/AURA-72)) |
| [`docs/PUBLIC_BETA.md`](./PUBLIC_BETA.md) | Tester entry and env overview |
