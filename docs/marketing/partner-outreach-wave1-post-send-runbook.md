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

CMO stays **blocked** on [AURA-394](/AURA/issues/AURA-394). CEO executes [AURA-397](/AURA/issues/AURA-397):

1. Post `approve cold: W2-1` on [AURA-338](/AURA/issues/AURA-338)
2. **Board sends** if available; else **CEO sends** (`confirm CEO send` locked 2026-07-01)
3. Paste `(board send)` or `(CEO send)` confirmation line on AURA-338

---

## CMO heartbeat scan (each run until unblocked)

Check [AURA-338](/AURA/issues/AURA-338) comments for **any** of:

| Trigger | Action |
| ------- | ------ |
| `W2-1 sent [DATE]` + `info@c4sw.org` from **board user or CEO** (not CMO instructional examples) | Run checklist above immediately |
| Board warm intro for S1/S2/S3 | Follow board direction; update log |
| `approve cold: W2-2` / `W2-3` | Log alternate target; stage send from W2 cold drafts |

If none match and before EOD Wed → stay **blocked**, comment scan result on [AURA-394](/AURA/issues/AURA-394).

---

## Log promotion (if T1 = 2026-07-02 EOD)

Update summary row in [`partner-outreach-wave1-log.md`](./partner-outreach-wave1-log.md):

```markdown
| **W2-1 — C4SW** *(Option B default)* | **Yes** | Staged (cold) | **Sent 2026-07-02** — cold → info@c4sw.org | T2 nudge **Tue 2026-07-07** if silent |
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
| **W2-1 — C4SW** *(Option B default)* | **Yes** | Staged (cold) | **Sent [SEND_DATE]** — cold → info@c4sw.org | T2 nudge **Tue 2026-07-07** if silent |
```

**W2-1 send log table:**

```markdown
| **T1 sent** | [SEND_DATE] via cold → `info@c4sw.org` (Option B default / board-approved) |
| **T2 nudge due** | Tue 2026-07-07 — draft: W2-1 section in partner-outreach-wave1-t2-drafts.md |
| **T3 due (if silent)** | Tue 2026-07-14 — draft: S1/W2-1 in partner-outreach-wave1-t3-drafts.md |
```

**Git commit message:**

```text
docs(marketing): log W2-1 T1 sent to C4SW (Option B)
```

**Issue comments:** Use templates in checklist §2 above; AURA-394 → `done`, AURA-327 → `in_progress`.

---

## After W2-1 logged — promote W2-2 (AC gap 2/3)

Within same heartbeat as W2-1 log, comment on [AURA-338](/AURA/issues/AURA-338):

```markdown
## CMO — W2-1 logged; need target 2/3

W2-1 T1 logged. Wave 1 AC needs **one more** T1.

**Fastest path:** `approve cold: W2-2` → send from [`partner-outreach-wave1-w2-2-handoff.md`](https://github.com/caco26i/aura-app/blob/main/docs/marketing/partner-outreach-wave1-w2-2-handoff.md) → `clients@mantra.care`

**Post-send (paste):**
```
W2-2 sent [DATE] to clients@mantra.care — cold, board-approved.
```

Warm intro for S1/S2/S3 still welcome as alternate path.
```

Do **not** mark AURA-338 done until partner minimum + X pilot complete per board scope.

---

## W2-2 instant execution (after W2-1 logged — target 2/3)

**Trigger:** `W2-2 sent [DATE] to clients@mantra.care` on [AURA-338](/AURA/issues/AURA-338).

**Add summary row** (or update if staged):

```markdown
| **W2-2 — MantraCare** | **Yes** | Staged (cold) | **Sent [SEND_DATE]** — cold → clients@mantra.care | T2 nudge **[SEND_DATE+3bd]** if silent |
```

**Status line:** `**1 T1 sent** (W2-1)` → `**2 T1 sent** (W2-1, W2-2)`.

**Git commit message:**

```text
docs(marketing): log W2-2 T1 sent to MantraCare
```

**AURA-327 comment template:**

```markdown
## W2-2 T1 logged

**Target:** MantraCare (W2-2) — EAP/broker channel  
**T1 sent:** [SEND_DATE] via cold → clients@mantra.care  
**Next:** T2 nudge [SEND_DATE+3bd] if silent — handoff: partner-outreach-wave1-w2-2-handoff.md
```

**Handoff:** [`partner-outreach-wave1-w2-2-handoff.md`](./partner-outreach-wave1-w2-2-handoff.md) (paste-send-ready).

---

## W2-3 instant execution (target 3/3 — distribution)

**Trigger:** `W2-3 sent [DATE] to [EDITOR_EMAIL]` on [AURA-338](/AURA/issues/AURA-338).

**Add summary row:**

```markdown
| **W2-3 — PFunc Pulse** | **Yes** | Staged (cold) | **Sent [SEND_DATE]** — cold → [EDITOR_EMAIL] | T2 nudge **[SEND_DATE+3bd]** if silent |
```

**Status line:** update to `**3 T1 sent**` (or `**2 T1 sent**` + W2-3 if mixed with S-path).

**Git commit message:**

```text
docs(marketing): log W2-3 T1 sent to PFunc Pulse
```

**Handoff:** [`partner-outreach-wave1-w2-3-handoff.md`](./partner-outreach-wave1-w2-3-handoff.md) (board supplies editor email + name).
