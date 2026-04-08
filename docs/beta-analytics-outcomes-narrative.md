# Beta analytics & outcomes narrative (one-pager)

**Audience:** partners, press, and internal teams who need a **credible, bounded** story about what we learn in the public beta — without over-claiming safety outcomes or surveillance.

**Status:** CMO narrative aligned to the shipped instrumentation. Implementation detail lives in [`web/docs/OBSERVABILITY.md`](../web/docs/OBSERVABILITY.md) (client) and [`server/README.md`](../server/README.md) (API audit log). Public beta context: [`docs/PUBLIC_BETA.md`](./PUBLIC_BETA.md). Positioning anchor: [`docs/launch-narrative.md`](./launch-narrative.md).

**Tracking:** [AURA-72](/AURA/issues/AURA-72).

---

## What we measure in beta

### Client telemetry (web)

When a deployment sets `VITE_AURA_TELEMETRY_ENDPOINT`, the SPA can **POST structured JSON** (and always logs one JSON line per event to the console prefixed with `[aura.telemetry]`). Categories include:

| Category   | What it captures (examples) |
| ---------- | ----------------------------- |
| `auth`     | Bootstrap path (e.g. Google enabled vs stub) |
| `backend`  | Journey/SOS API requests — success, error, and optional `anomalyHeader` when the API returns `X-Aura-Anomaly` (ops signal, not a user-facing error) |
| `journey`  | Journey started, track state, ended, “I’m safe”, share location |
| `sos`      | FAB open, alert sent / failed |
| `map`      | Tile errors |

In-memory counters aggregate `event.<category>.<event>` plus telemetry ship success/failure (`telemetry.ship_*`). See [`web/docs/OBSERVABILITY.md`](../web/docs/OBSERVABILITY.md) for wiring and debug (`VITE_AURA_TELEMETRY_DEBUG`).

### Server-side (optional API)

When testers use the real Aura API, mutating routes append lines to an **append-only JSON-lines audit log** (treat as WORM in production — ship to object storage / SIEM). Events include journey creation, emergency alerts, location shares, “I’m safe”, and rate-limit / burst signals documented on the route table. Optional `X-Aura-Device-Fingerprint` is stored **hashed** in audit. This boundary is for **validation, security, and operations** — not a consumer marketing analytics pipeline.

---

## How we report it

- **Product & engineering:** Flow completion and friction (telemetry categories above), error rates on backend calls, anomaly headers for abuse or instability, map reliability signals. Reporting stays **aggregate** and **non-identifying** at the telemetry layer (see observability doc: avoid PII in events).
- **Partners / comms:** Emphasize **beta learning goals** — stability of critical paths, clarity under stress, consent-aligned defaults — and **explicit limits** on what metrics can prove (next section).
- **Not a scoreboard:** We do not rank individual users, sell granular location streams from beta telemetry, or use beta counts as proof of real-world harm reduction.

---

## Privacy boundaries — what we will **not** claim

Use this list verbatim when credibility matters (press Q&A, partner diligence):

1. **No clinical or legal outcome claims.** Beta metrics do not demonstrate medical efficacy, crime reduction, or emergency response outcomes.
2. **No “we know you were safe” from logs alone.** Telemetry and audit logs reflect **technical events**, not ground truth about a person’s physical safety.
3. **No surveillance product framing.** Client observability explicitly avoids raw emails, phone numbers, and **precise coordinates in telemetry events**; server audit serves **auth, validation, and ops** — not ad targeting.
4. **No false completeness.** Many installs run **stub auth and mocked journeys** until a bearer token and API are configured; reported reach is not equivalent to “everyone used live SOS.”
5. **No conflation of volume with impact.** Higher event counts mean more **usage signal**, not automatically more **protection delivered**.
6. **No re-identification promises we do not implement.** If we describe “aggregate” reporting, we stay within what the collector and retention policy actually enforce for that environment.

---

## FAQ snippet: “How do you know it works?”

**Short answer:** The public beta is designed to validate **reliability, UX clarity under pressure, and trust-aligned defaults** — not to prove long-term safety outcomes in one release window.

**What we actually combine:**

- **Qualitative feedback** from testers (flows, copy, accessibility).
- **Structured, low-PII client signals** where telemetry is enabled (see [`web/docs/OBSERVABILITY.md`](../web/docs/OBSERVABILITY.md)).
- **Server-validated critical paths** when the optional API is in use (audit log and contract in [`server/README.md`](../server/README.md), [`web/docs/API_CONTRACT.md`](../web/docs/API_CONTRACT.md)).

**What comes later:** Evidence of real-world impact belongs in **dedicated research**, privacy-preserving measurement programs, and partnerships with appropriate expertise — outside the scope of “what the beta logs can show.”

---

## Related links

| Doc | Role |
| --- | ---- |
| [`docs/launch-narrative.md`](./launch-narrative.md) | CEO-approved external positioning ([AURA-64](/AURA/issues/AURA-64)) |
| [`docs/public-beta-announcement-kit.md`](./public-beta-announcement-kit.md) | Release-ready copy kit ([AURA-71](/AURA/issues/AURA-71)) |
| [`web/docs/SECURITY.md`](../web/docs/SECURITY.md) | Threat model and client/API notes |
