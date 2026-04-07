# Launch UX: API errors, rate limits, and calm failure copy

**Parent:** [AURA-9](/AURA/issues/AURA-9)  
**Implements spec for:** [AURA-16](/AURA/issues/AURA-16) — supports [AURA-13](/AURA/issues/AURA-13) (`web` client wiring) and authoritative `server/`.

## Principles

- **Calm first:** No blame, no catastrophizing. Prefer “we couldn’t complete that” over “failed” or “error.”
- **Action next:** Every message implies what to do (retry, check connection, sign in again, wait, contact support).
- **SOS-sensitive:** On emergency flows, keep copy short; avoid technical jargon; do not imply the alert was received when it was not.

## Where copy lands (current UI)

| Surface | Location | Pattern |
|--------|----------|---------|
| Live journey actions | `web/src/pages/JourneyActive.tsx` | Inline `role="alert"` under map/actions for I’m safe / share failures |
| Silent SOS sheet | Same file (sheet is confirm-only today) | Errors from this path still route through `/emergency` after continue |
| Emergency / SOS | `web/src/pages/Emergency.tsx` | Full-width `role="alert"` above actions |
| Backend boundary | `web/src/api/auraBackend.ts` | Maps HTTP + JSON `error` to a single string today — **replace raw codes here** with rows below |

**Not in app yet:** global toast/banner. When added, use it for transient network blips; keep **inline `role="alert"`** for journey and SOS so assistive tech and high-stress contexts stay aligned.

## User-visible strings (map `error` / HTTP to copy)

Implement in one helper (e.g. `mapBackendError(res, json)` used by `remotePost`) so all routes stay consistent.

| Condition | Suggested user string | Notes |
|-----------|----------------------|--------|
| **Offline / network** (`fetch` throws, `TypeError`, “Failed to fetch”, navigator offline) | **We can’t reach Aura right now. Check your connection and try again.** | Same copy for journey + SOS. |
| **401** — missing/invalid bearer | **Your session expired. Sign in again, then retry.** | If the app has no sign-in yet, use: **This app needs a valid connection token. Update your settings and try again.** |
| **403** — wrong token | **We couldn’t authorize this device. Check your access token in settings.** | |
| **429** — rate limited (global/journey/SOS) | **You’re doing that a little too often. Wait a moment and try again.** | For **SOS-only** limiter, soften further: **We couldn’t send another alert just yet. If you’re in danger, call local emergency services. You can try again in a minute.** |
| **503** + `server_misconfigured` | **Aura isn’t fully set up yet. Try again later or contact support.** | |
| **5xx** / unknown HTTP | **Something went wrong on our side. Try again in a few minutes.** | |
| **404** + `not_found` | **That action isn’t available. Go back and try again.** | Rare for current POST routes. |
| **400** + `invalid_journey_id` | **This journey isn’t valid anymore. Start or resume a journey and try again.** | |
| **400** + `validation_failed` | **We couldn’t send that request. Go back and try again.** | Optional: one short second line *only in dev builds*: show sanitized detail. |
| JSON parse / shape issues (`Invalid response`) | **We got an unexpected response. Try again.** | |
| Missing `VITE_AURA_API_*` (`Backend not configured`) | **Live features need Aura to be connected in settings.** | Dev-friendly; tighten for production when OAuth/BFF exists. |

### SOS success with `X-Aura-Anomaly`

When `POST /v1/emergency-alerts` returns **201** but response headers include **`X-Aura-Anomaly`** (e.g. `burst_sos`):

- **Do not** change the primary success message if the alert was accepted.
- Optionally show a **non-blocking** calm notice (secondary text or dismissible banner, not the red alert region): **Your alert was sent. If you still feel unsafe, contact local emergency services.**

Telemetry should record the header value for ops; see below.

## CTO implementation checklist

1. **Centralize mapping** in `auraBackend.ts` (or `web/src/api/backendErrors.ts`) using status + optional `json.error` / `json.detail`.
2. **Read `X-Aura-Anomaly`** on success responses for emergency POST only; pass through to UI as a flag, not as `error`.
3. **Preserve** `role="alert"` on `Emergency` and `JourneyActive` for mapped failure strings only.
4. **429:** distinguish SOS route from others if middleware bodies differ; user copy for SOS is more safety-aware.
5. **QA:** airplane mode, wrong token, throttle SOS past limit, invalid journey UUID.

## Optional analytics / telemetry keys

Emit on mapped failures (existing `emitTelemetry` patterns):

| Key idea | When |
|----------|------|
| `backend.error_mapped` | After mapping, include `httpStatus`, `errorCode` (from JSON if any), `operation` |
| `backend.anomaly_header` | On emergency success with `X-Aura-Anomaly` present |

---

*Last updated: aligns with `server/src/index.js` error shapes as of launch-readiness milestone.*
