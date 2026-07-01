# Partner outreach — wave 1 post-send runbook (W2-1)

**Use when:** Board or CEO confirms W2-1 T1 sent (early `approve cold: W2-1` or Option B EOD default).  
**Tracking:** [AURA-327](/AURA/issues/AURA-327) · [AURA-394](/AURA/issues/AURA-394) · **Log:** [`partner-outreach-wave1-log.md`](./partner-outreach-wave1-log.md)

---

## Trigger

Send confirmation pasted on [AURA-338](/AURA/issues/AURA-338):

```text
W2-1 sent [DATE] to info@c4sw.org — cold, [board-approved | Option B default].
```

---

## CMO checklist (within 1 business day)

1. **Log T1** — update [`partner-outreach-wave1-log.md`](./partner-outreach-wave1-log.md) summary + W2-1 row:
   - Send status: **Sent [DATE]**
   - Channel: cold → `info@c4sw.org`
   - Next: T2 nudge **+3 business days** — [`partner-outreach-wave1-t2-drafts.md`](./partner-outreach-wave1-t2-drafts.md) W2-1 section (sender locked: Aura Partnerships)

2. **Issue updates**
   - [AURA-327](/AURA/issues/AURA-327) → `in_progress`; comment with fit/send/next-step rollup
   - [AURA-394](/AURA/issues/AURA-394) → `done`
   - [AURA-338](/AURA/issues/AURA-338) → `done` if partner + X minimum complete, or comment partial

3. **Schedule T2** — record target date in log (e.g. T1 Wed → T2 Mon if no reply)

4. **Wave 1 AC progress** — need **2–3 targets with T1 logged**; after W2-1, evaluate W2-2/W2-3 or S1–S3 if board provides paths

---

## Comment template ([AURA-327](/AURA/issues/AURA-327))

```markdown
## W2-1 T1 logged

**Target:** C4SW (W2-1) — campus safety coalition  
**T0 fit:** Yes (proactive seed)  
**T1 sent:** [DATE] via cold → info@c4sw.org (Option B / board-approved)  
**Materials:** one-pager + PUBLIC_BETA links per handoff  
**Next:** T2 nudge [DATE+3bd] if silent — draft in partner-outreach-wave1-t2-drafts.md
```

---

## If no send confirmation by EOD Wed

CMO stays **blocked** on [AURA-394](/AURA/issues/AURA-394). CEO executes [AURA-397](/AURA/issues/AURA-397) (post `approve cold: W2-1` + coordinate send).

---

## CMO heartbeat scan (each run until unblocked)

Check [AURA-338](/AURA/issues/AURA-338) comments for **any** of:

| Trigger | Action |
| ------- | ------ |
| `approve cold: W2-1` + send confirmation (`W2-1 sent [DATE]` + `info@c4sw.org`) | Run checklist above immediately — **ignore** instructional mentions of `W2-1 sent` in agent comments |
| Board warm intro for S1/S2/S3 | Follow board direction; update log |
| `approve cold: W2-2` / `W2-3` | Log alternate target; stage send from W2 cold drafts |

If none match and before EOD Wed → stay **blocked**, comment scan result on [AURA-394](/AURA/issues/AURA-394).

---

## Log promotion (if T1 = 2026-07-02 EOD)

Update summary row in [`partner-outreach-wave1-log.md`](./partner-outreach-wave1-log.md):

```markdown
| **W2-1 — C4SW** *(Option B default)* | **Yes** | Staged (cold) | **Sent 2026-07-02** — cold → info@c4sw.org | T2 nudge **Mon 2026-07-07** if silent |
```

Update status line: `**1 T1 sent** (W2-1)` · promote W2-1 send log table dates from `[DATE]` → `2026-07-02`.

---

## Instant execution (replace `[SEND_DATE]` if not 2026-07-02)

**Status line** — find/replace in log:

```text
**0 T1 sent.** → **1 T1 sent** (W2-1).
```

**Summary row** — replace W2-1 pending row:

```markdown
| **W2-1 — C4SW** *(Option B default)* | **Yes** | Staged (cold) | **Sent [SEND_DATE]** — cold → info@c4sw.org | T2 nudge **Mon 2026-07-07** if silent |
```

**W2-1 send log table:**

```markdown
| **T1 sent** | [SEND_DATE] via cold → `info@c4sw.org` (Option B default / board-approved) |
| **T2 nudge due** | Mon 2026-07-07 — draft: W2-1 section in partner-outreach-wave1-t2-drafts.md |
| **T3 due (if silent)** | Wed 2026-07-09 — draft: S1/W2-1 in partner-outreach-wave1-t3-drafts.md |
```

**Git commit message:**

```text
docs(marketing): log W2-1 T1 sent to C4SW (Option B)
```

**Issue comments:** Use templates in checklist §2 above; AURA-394 → `done`, AURA-327 → `in_progress`.
