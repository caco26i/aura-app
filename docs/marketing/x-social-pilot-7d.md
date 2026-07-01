# X / dev community — 7-day social hero variant pilot

**Status:** Schedule committed — ready for kickoff.  
**Tracking:** [AURA-325](/AURA/issues/AURA-325) · **Parent:** [AURA-319](/AURA/issues/AURA-319) · **Experiment:** 1 from [`two-week-growth-experiments.md`](../two-week-growth-experiments.md)  
**CEO decision:** Option C from [`content-cadence-pilot-2wk.md`](./content-cadence-pilot-2wk.md) retro — **X / dev community** (LinkedIn out of scope; no board publisher dependency).

**Product truth source:** [`launch-narrative.md`](../launch-narrative.md), [`public-beta-announcement-kit.md`](../public-beta-announcement-kit.md), [`PUBLIC_BETA.md`](../PUBLIC_BETA.md) — **no new product claims** without CEO/CTO review.

**Pilot window:** **2026-07-02 → 2026-07-08** (7 calendar days from first simultaneous variant posts).  
**Kickoff date:** **2026-07-02** (Wed) — first A + B posts go live same day, staggered ≥4h apart.

---

## Hypothesis & decision rules

**Hypothesis:** A **pillar-led** hook (clarity under pressure + consent) earns higher **qualified click-through** than a **single-line hero** hook, among the same X / dev audience.

**Primary metric:** CTR = unique clicks ÷ impressions **per variant**, measured on **variant-specific tracked links** (see below).

| Outcome | Rule |
| ------- | ---- |
| **Ship** winning variant | Beats the other by **≥25% relative CTR** *and* pair has **≥100 combined clicks** |
| **Extend once** | Combined clicks **<100** after day 7 → extend up to **3 days** with a comment on the decision log in [`two-week-growth-experiments.md`](../two-week-growth-experiments.md) |
| **Kill / inconclusive** | No meaningful lift, or traffic too thin after one extension → keep default hero emphasis from [`launch-narrative.md`](../launch-narrative.md) / kit Variant A |

**Privacy / claims:** Measure **distribution and product friction** only — not safety outcomes. Align reporting with [`beta-analytics-outcomes-narrative.md`](../beta-analytics-outcomes-narrative.md).

---

## Tracked links (one per variant)

**Destination (canonical beta entry):** `https://github.com/caco26i/aura-app` → testers follow [`docs/PUBLIC_BETA.md`](../PUBLIC_BETA.md).

Configure **two distinct short links** (Bitly, Dub, or self-hosted redirect) so clicks are countable without app changes:

| Variant | Ref param (on redirect target) | Short link slug (fill at publish) | Notes |
| ------- | ----------------------------- | --------------------------------- | ----- |
| **A — Pillar-led** | `?ref=x-e1-pillar` | `aura.link/x-pillar` *(placeholder)* | Redirect → `https://github.com/caco26i/aura-app?ref=x-e1-pillar` |
| **B — Single-line hero** | `?ref=x-e1-hero` | `aura.link/x-hero` *(placeholder)* | Redirect → `https://github.com/caco26i/aura-app?ref=x-e1-hero` |

**Instrumentation:** Short-link dashboard = primary data source for the ship/kill decision. Optional sanity check: GitHub traffic / clone spikes (too coarse for fast decisions per experiment spec). **Do not** block on product telemetry.

**Pre-kickoff checklist:**

- [ ] Create both short links and paste final URLs in the table above.
- [ ] Pin the winning variant's link in bio / profile for the pilot window (optional boost).
- [ ] Record baseline follower count and typical impression band for context.

---

## Variant copy bank

Tone: calm, plain, trustworthy — sourced from [`launch-narrative.md`](../launch-narrative.md) pillars and [`public-beta-announcement-kit.md`](../public-beta-announcement-kit.md) social posts. Trim to fit X character limits; keep the **hook type** distinct.

### Variant A — Pillar-led (clarity + consent)

**Hook pattern:** Lead with **two pillars**, then product + CTA.

**Primary post (day 1):**

> Stress shrinks attention — safety UX should not.
>
> **Aura public beta** on the web: built for **clarity under pressure** and **consent-first** defaults (primers before prompts, local-first until you connect).
>
> Journeys, trusted contacts, SOS with confirm-before-send. Try it → [LINK-A]
>
> Runbook: `docs/PUBLIC_BETA.md`

**Alt / repost (days 3, 5):**

> Two things we optimize for in Aura's public beta:
>
> 1. **Clarity under pressure** — one- or two-tap paths when bandwidth is low
> 2. **Trust & control** — you choose when location and alerts leave the device
>
> Calm companion for the web. [LINK-A]

### Variant B — Single-line hero

**Hook pattern:** One hero line from launch narrative, minimal pillar exposition.

**Primary post (day 1):**

> **Aura** is a calm, real-time safety companion for the web — share journey progress with people you trust, signal when you need help, and reach emergency paths in one or two taps.
>
> Public beta is open. [LINK-B]

**Alt / repost (days 4, 6) — kit Variant C punch:**

> Aura public beta: **calm safety on the web.**
>
> Journeys, trusted contacts, SOS — designed for real stress, real privacy, real clarity. [LINK-B]

---

## 7-day schedule

**Cadence:** 1 post per variant on kickoff day; then **alternating single posts** so each variant gets ~3–4 impressions over 7 days. Post **Wed / Thu / Fri / Sat / Sun / Mon / Tue** rhythm; prefer **14:00–18:00 UTC** for dev overlap (Americas + EU).

| Day | Date (UTC) | Slot | Variant | Post | Tracked link |
| --- | ---------- | ---- | ------- | ---- | ------------ |
| 1 | **2026-07-02** (Wed) | AM | **A** | Primary pillar-led (above) | LINK-A |
| 1 | **2026-07-02** (Wed) | PM (+4h) | **B** | Primary single-line hero (above) | LINK-B |
| 2 | 2026-07-03 (Thu) | PM | **A** | Alt pillar repost | LINK-A |
| 3 | 2026-07-04 (Fri) | PM | **B** | Alt hero punch (kit C) | LINK-B |
| 4 | 2026-07-05 (Sat) | PM | **A** | Primary pillar-led (refresh) | LINK-A |
| 5 | 2026-07-06 (Sun) | PM | **B** | Primary single-line hero (refresh) | LINK-B |
| 6 | 2026-07-07 (Mon) | PM | **A** | Alt pillar repost | LINK-A |
| 7 | 2026-07-08 (Tue) | PM | **B** | Alt hero punch | LINK-B |

**Dev-community optional (same variant links, only if moderation capacity):**

- Day 4 or 5: cross-post **Variant A** primary to a relevant subreddit / HN **Show** thread — label clearly as team post; use LINK-A only.
- Do **not** mix variants in the same thread.

---

## Measurement sheet (fill during run)

| Variant | Impressions (X analytics) | Unique clicks (short link) | CTR | Notes |
| ------- | ------------------------- | -------------------------- | --- | ----- |
| A — Pillar | | | | |
| B — Hero | | | | |
| **Combined clicks** | — | | — | Ship threshold: ≥100 |

**Decision log:** Update the Experiment 1 row in [`two-week-growth-experiments.md`](../two-week-growth-experiments.md) when the window closes.

---

## Publication log (paste X permalinks after each post)

| Day | Date | Variant | Post URL |
| --- | ---- | ------- | -------- |
| 1 AM | 2026-07-02 | A | |
| 1 PM | 2026-07-02 | B | |
| 2 | 2026-07-03 | A | |
| 3 | 2026-07-04 | B | |
| 4 | 2026-07-05 | A | |
| 5 | 2026-07-06 | B | |
| 6 | 2026-07-07 | A | |
| 7 | 2026-07-08 | B | |

---

## Completion checklist

- [x] Schedule published in-repo (this file) **before** first post.
- [x] Variants A/B copy + tracked link scheme defined.
- [x] Ship/kill thresholds documented (≥25% relative CTR, ≥100 combined clicks).
- [ ] Short links created and slugs filled in table above.
- [ ] Day-1 simultaneous posts published (2026-07-02).
- [ ] 7-day window complete; decision logged in [`two-week-growth-experiments.md`](../two-week-growth-experiments.md).

---

## Related docs

| Doc | Role |
| --- | ---- |
| [`two-week-growth-experiments.md`](../two-week-growth-experiments.md) | Experiment 1 spec + decision log |
| [`content-cadence-pilot-2wk.md`](./content-cadence-pilot-2wk.md) | LinkedIn pilot retro; Option C rationale |
| [`launch-narrative.md`](../launch-narrative.md) | Hero + pillars (copy source) |
| [`public-beta-announcement-kit.md`](../public-beta-announcement-kit.md) | Hero variants + social snippets |
