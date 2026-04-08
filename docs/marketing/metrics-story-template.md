# Monthly metrics story — board template

**Purpose:** One place each month to capture a **credible, board-ready** read on product and go-to-market signal — aligned with the **privacy boundaries and outcome limits** in [`docs/beta-analytics-outcomes-narrative.md`](../beta-analytics-outcomes-narrative.md) ([AURA-72](/AURA/issues/AURA-72)). This is a narrative shell; plug in **aggregate** numbers and qualitative notes only where they match what instrumentation actually measures.

**How to use:** Copy this file to a dated working doc or fill inline each month. Replace all `[PLACEHOLDER]` values. If a section does not apply, write *N/A — reason* rather than inventing metrics.

---

## Reporting period

| Field | Value |
| ----- | ----- |
| **Month** | `[YYYY-MM]` |
| **Data window** | `[e.g. calendar month / rolling 28d / custom]` |
| **Environments included** | `[e.g. prod telemetry on / stub-heavy sandboxes excluded]` |
| **Prepared by** | `[name / role]` |
| **Reviewed with** | `[e.g. eng lead, trust & safety]` |

---

## Executive snapshot (3–5 sentences)

`[One tight paragraph: what moved, what stayed flat, and what we are watching next. Frame as *beta learning and operational health*, not proof of real-world safety outcomes.]`

---

## North star

**Metric name:** `[e.g. weekly active journeys with live API, or other agreed north star]`

| | This period | Prior period | Notes |
| --- | ---: | ---: | --- |
| **Value** | `[#]` | `[#]` | `[definition: how counted, cohort]` |

**Interpretation (bounded):** `[Tie to product intent — reliability, clarity under stress, consent-aligned defaults. Avoid implying clinical, legal, or “lives saved” outcomes.]`

---

## Funnel / journey (aggregate only)

Use **coarse stages** your telemetry and ops data actually support (see [`web/docs/OBSERVABILITY.md`](../../web/docs/OBSERVABILITY.md)). Do not infer individual user journeys from marketing analytics unless that pipeline is explicitly approved.

| Stage | Signal | This period | Notes |
| ----- | ------ | ----------- | ----- |
| **Reach / starts** | `[e.g. sessions, journey starts]` | `[# or range]` | `[stub vs live if relevant]` |
| **Activation** | `[e.g. first completed path]` | `[#]` | `[definition]` |
| **Engagement** | `[e.g. return within 7d]` | `[# or %]` | `[cohort definition]` |
| **Critical paths** | `[e.g. SOS attempts, share location]` | `[aggregate counts / error rates]` | `[no individual stories]` |

**Caveats:** `[e.g. partial data, rollout changes, incident windows]`

---

## Trust & safety highlights

**Product & policy**

- `[e.g. copy or settings changes that improve consent clarity]`
- `[e.g. abuse signals, rate limits, anomaly headers — aggregate]`

**Incidents / near-misses (internal)**

- `[None / summary — no PII in board-facing text]`

**Comms / partner questions**

- `[Themes from support, pilots, or press — factual only]`

---

## Risks & open questions

| Risk or question | Severity | Owner | Next step |
| ---------------- | -------- | ----- | --------- |
| `[e.g. telemetry coverage gap]` | `[H/M/L]` | `[role]` | `[action + date]` |
| `[e.g. dependency on stub auth in reported “reach”]` | | | |

---

## What not to claim (guardrails)

When this packet is reused externally (investors, partners, press), **do not** stretch the numbers beyond the boundaries in [AURA-72](/AURA/issues/AURA-72) and the full checklist under **Privacy boundaries** in [`docs/beta-analytics-outcomes-narrative.md`](../beta-analytics-outcomes-narrative.md). In short:

- **No** clinical, legal, or “we proved safety outcomes” language from beta logs alone.
- **No** surveillance or granular tracking narrative; stay with **aggregate, low-PII** reporting.
- **No** conflating **volume** with **protection delivered**; **no** “we know you were safe” from telemetry.
- **No** implied completeness when many sessions use **stub auth or mocked journeys**.
- **No** promises about re-identification or retention unless they match the **actual** collector and policy for that environment.

If a stakeholder asks for a claim not supported above, default answer: **more learning in beta / roadmap for dedicated research** — same framing as the outcomes FAQ in the analytics narrative doc.

---

## Related docs

| Doc | Role |
| --- | ---- |
| [`docs/beta-analytics-outcomes-narrative.md`](../beta-analytics-outcomes-narrative.md) | Bounded metrics story, privacy list, FAQ ([AURA-72](/AURA/issues/AURA-72)) |
| [`docs/PUBLIC_BETA.md`](../PUBLIC_BETA.md) | Beta scope and runbook pointers |
| [`docs/launch-narrative.md`](../launch-narrative.md) | External positioning anchor ([AURA-64](/AURA/issues/AURA-64)) |
| [`web/docs/OBSERVABILITY.md`](../../web/docs/OBSERVABILITY.md) | What client telemetry can and cannot capture |
