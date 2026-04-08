# Post-launch retention narrative — week 1

**Status:** Paste-ready copy for **return visits** and **activation** after public-beta launch; complements net-new hype in [`public-beta-announcement-kit.md`](./public-beta-announcement-kit.md) ([AURA-71](/AURA/issues/AURA-71)). Voice and claims stay aligned with [`launch-narrative.md`](./launch-narrative.md) ([AURA-64](/AURA/issues/AURA-64)) — calm, consent-forward, non-alarmist.

**Ticket:** [AURA-77](/AURA/issues/AURA-77)

**Use when:** Someone has already seen the beta announcement or landed once and returns within the first week. Optimize for **resume setup**, **first real journey**, and **trust in SOS** — not for cold audiences.

---

## 1. Repeat-visitor strip (on-page)

*Short module for landing or in-app shell: **headline** + **two bullets** + **primary CTA**. Tone: “welcome back,” not “breaking news.”*

**Headline:** Welcome back — pick up where you left off

- **Bullet 1:** Finish the short welcome flow if you skipped it; it explains journeys, trusted contacts, and how **SOS only sends after you confirm**.
- **Bullet 2:** Start a **journey** when you are ready to share progress with people you trust — location stays a choice, with clear prompts when the browser asks.

**Primary CTA:** Continue in Aura

**Optional micro-line (muted style under CTA):** *Public beta — we are learning in the open; your feedback shapes what ships next.*

---

## 2. Lifecycle hooks — email

*Two **subject line + preheader** pairs. Preheaders support inbox clarity; keep both scannable on mobile.*

### Pair A — Resume / activation

| Field | Copy |
| --- | --- |
| **Subject** | Aura: your safety hub is ready when you are |
| **Preheader** | Finish setup, start a journey, or review SOS — calm paths, your control. |

### Pair B — Gentle nudge (no fear hooks)

| Field | Copy |
| --- | --- |
| **Subject** | Still exploring Aura? Two minutes to get oriented |
| **Preheader** | Short welcome, clear consent, confirm-before-send SOS — built for stressful days. |

---

## 3. Lifecycle hooks — SMS (≤160 characters)

**SMS (template is ~90 characters before your link; replace `[URL]` so total stays ≤160):**

```text
Aura: You're back—finish welcome or start a journey. SOS confirms before send. Open: [URL]
```

*Character count note:* With a typical short URL (~20–30 characters), total stays under 160; trim “Open: ” or shorten the lead if your URL is longer.

---

## 4. Where this ships

| Surface | Suggested owner | Notes |
| --- | --- | --- |
| Marketing / CMS landing | Comms or web marketing | Paste §1 strip; match design system of main beta page. |
| Aura web app (SPA) | Engineering | Optional in-product strip or banner — see CTO handoff on [AURA-77](/AURA/issues/AURA-77) for implementation tracking. |
| Email / SMS | Lifecycle tooling | Paste §2–3; ensure opt-in compliance and unsubscribe parity with your ESP defaults. |

---

## 5. Claims and QA guardrails

- Do **not** imply emergency services dispatch, medical outcomes, or “always-on” monitoring unless product/legal explicitly approves.
- Prefer **session/sync** framing for errors (consistent with [`PUBLIC_BETA.md`](./PUBLIC_BETA.md) §3).
- If linking to docs, prefer `docs/PUBLIC_BETA.md` and [`launch-narrative.md`](./launch-narrative.md) for tone checks before external send.
