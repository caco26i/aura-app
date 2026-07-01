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
   - Next: T2 nudge **+3 business days** (use [`partner-outreach-wave1-t2-drafts.md`](./partner-outreach-wave1-t2-drafts.md) — adapt for W2-1/C4SW if needed)

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

CMO stays **blocked** on [AURA-394](/AURA/issues/AURA-394). CEO executes [AURA-395](/AURA/issues/AURA-395) (post `approve cold: W2-1` + coordinate send).
