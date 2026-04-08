# Launch UX: API errors, rate limits, and calm failure copy

**Parent:** [AURA-9](/AURA/issues/AURA-9)  
**Implements spec for:** [AURA-16](/AURA/issues/AURA-16) — supports [AURA-13](/AURA/issues/AURA-13) (`web` client wiring) and authoritative `server/`.

## Principles

1. **Calm first:** No blame, no catastrophizing. Prefer “we couldn’t complete that” over “failed” or “error.”
2. **Action next:** Every message implies what to do (retry, check connection, sign in again, wait, contact support).
3. **No technical leakage:** Do not show raw HTTP status codes, JSON `error` codes, or stack traces in user-visible copy — map to the string table below.
4. **SOS-sensitive & anomalies:** On emergency flows, keep copy short; avoid technical jargon; do not imply the alert was received when it was not. **`X-Aura-Anomaly`** is an ops signal — after a **successful** POST, show only **calm, non-blocking** notice copy (never the red `role="alert"` region for the anomaly alone).

## Where copy lands (current UI)

| Surface | Location | Pattern |
|--------|----------|---------|
| Live journey actions | `web/src/pages/JourneyActive.tsx` | Inline `role="alert"` under map/actions for I’m safe / share failures |
| Silent SOS sheet | Same file (sheet is confirm-only today) | Errors from this path still route through `/emergency` after continue |
| Emergency / SOS | `web/src/pages/Emergency.tsx` | Full-width `role="alert"` above actions **for failures only** |
| Anomaly notice (success + header) | `web/src/pages/Emergency.tsx` | **`role="status"`** calm panel — not `role="alert"`; throttling / burst must not read like imminent personal danger |
| Backend boundary | `web/src/api/auraBackend.ts` + `web/src/api/auraApiMessages.ts` | `remotePost` in `auraBackend.ts`; **user-visible mapping** centralized in `auraApiMessages.ts` (no raw HTTP codes in UI) |

**Not in app yet:** global toast/banner. When added, use it for transient network blips; keep **inline `role="alert"`** for journey and SOS so assistive tech and high-stress contexts stay aligned.

## Implementation status (`0411ed3`+)

| Concern | Location | Behavior |
|--------|----------|----------|
| Centralized copy | `web/src/api/auraApiMessages.ts` | `userMessageForHttpFailure`, `userMessageForNetworkFailure`, `noticeForAnomalyHeader`, `userMessageForUnknownError` |
| Unknown / unlisted HTTP | `userMessageForUnknownError` | Final fallback after status branches; **no** `(${status})` or raw codes in UI |
| **404** | `userMessageForHttpFailure` | Explicit branch; prefers JSON `not_found` mapping, else calm refresh copy |
| Wire-up | `web/src/api/auraBackend.ts` | `remotePost` passes `userMessage` / `notice` to pages |
| Journey ownership | `messageForJsonError` in `auraApiMessages.ts` | `journey_not_found` / `journey_forbidden` → **session / sync** tone (not safety alarm); see JSON table below |

## JSON `error` codes — journey ownership

Server: `server/src/index.js` (404 `journey_not_found`, 403 `journey_forbidden` on `im-safe` / `location-shares` when `journeyId` is unknown or not owned by the bearer). **Design intent:** read as **stale client state / wrong session**, same calm bar as offline and generic 404 — never imply immediate personal danger.

| `error` | Typical HTTP | User-visible copy (journey actions) | Telemetry (raw code in payload) |
|---------|--------------|-------------------------------------|----------------------------------|
| `journey_not_found` | 404 | We couldn't find this journey for your current session. Start a new journey from home, then try again. | `category: backend`, `event: error`, `operation: im_safe \| share_location`, `error` · `category: journey`, `im_safe_failed` / `share_location_failed`, `error` |
| `journey_forbidden` | 403 | This journey doesn't match your current session or token. Start your own journey, then try I'm safe or share again. | same |

**Product context:** how `journeyId` is bound to the token — [BETA_BACKEND.md](../web/docs/BETA_BACKEND.md) (“Journey ownership”; baseline `ea3c12a` in managed history).

## User-visible strings (map `error` / HTTP to copy)

**Canonical strings** live in `web/src/api/auraApiMessages.ts` (`userMessageForHttpFailure`, `userMessageForNetworkFailure`, `userMessageForUnknownError`, `noticeForAnomalyHeader`, etc.) and are consumed via `remotePost` in `auraBackend.ts`. Keep this table aligned when that file changes — it is the post-launch **spec mirror**, not a second source of copy.

| Condition | Shipped user string | Notes |
|-----------|---------------------|--------|
| **Offline / network** (`fetch` throws, `TypeError`, “Failed to fetch”, navigator offline) | **Journey / map:** “We couldn't reach Aura. Check your connection and try again.” **SOS:** “We couldn't confirm your alert reached Aura. If you're in immediate danger, contact local emergency services. You can also check your connection and try again.” | `userMessageForNetworkFailure` — SOS uses stronger safety framing than journey. |
| **401** — missing/invalid bearer | “Your session may have expired. When sign-in is available, sign in again and retry.” | From `messageForJsonError('unauthorized')` / 401 branch. |
| **403** — wrong token / scope | JSON `forbidden`: “This action isn't available with your current access. If it keeps happening, contact your organizer.” Fallback (no mapped code): “This action isn't available right now. If it keeps happening, contact your organizer.” | |
| **429** — rate limited | **Journey / map:** “Aura is handling a lot of requests right now. Please wait a moment and try again.” **SOS:** “We couldn't send your alert just yet because Aura is limiting requests. If you're in immediate danger, contact local emergency services. Wait a moment, then try again.” | Also used when JSON `error` is `rate_limited` (surface-aware). |
| **`server_misconfigured`** (any HTTP where mapped) | “Aura's live service isn't fully configured yet. Try again later or use demo mode without API keys.” | |
| **5xx** / unknown HTTP | “Something went wrong on our side. Please try again in a few minutes.” | After status branches; then `userMessageForUnknownError` if still unmapped. |
| **404** + `not_found` | “We couldn't find that resource. Refresh the page or start again.” | Rare for current POST routes. |
| **404** without a usable JSON `error` | Same as above (fallback path). | |
| Other non-mapped HTTP | **Journey:** “We couldn't complete that request. Please try again.” **SOS:** “We couldn't complete that request. If you're in immediate danger, contact local emergency services, then try again.” | `userMessageForUnknownError` — **no** numeric status in the string (principle 3). |
| **400** + `invalid_journey_id` (journey surface) | “We couldn't use this journey on your current session. Start a new journey from home, then try again.” | Non-journey surfaces get generic validation copy. |
| **400** + `validation_failed` | “Something in the request did not look right. Check your details and try again.” | |
| **413** + `payload_too_large` | “The request was too large for the server to accept. Try again with less data or refresh and start over.” | |
| Missing client API config (`userMessageForMisconfiguration`) | “Live backend is not connected (missing API URL or token in this build). If you're a participant, contact your organizer.” | Distinct from `server_misconfigured` (server-declared). |
| BFF: no session (`userMessageForBffSignIn`) | “Sign in with Google under Settings to connect this device to the live Aura API, then try again.” | |
| BFF: session fetch failed (`userMessageForBffSessionFetchFailure`) | “Could not reach the sign-in service. Check that the BFF is running and CORS allows this origin.” | |

### SOS success with `X-Aura-Anomaly`

When `POST /v1/emergency-alerts` returns **201** but response headers include **`X-Aura-Anomaly`** (e.g. `burst_sos`):

- **Do not** change the primary success message if the alert was accepted.
- Show mapped anomaly copy in a **`role="status"`** region (current: muted panel on `Emergency` before navigate home) — **never** reuse the red **`role="alert"`** styling used for hard failures.
- Example calm strings: see `noticeForAnomalyHeader` in `auraApiMessages.ts` (e.g. burst SOS reassurance).

Telemetry should record the header value for ops; see below.

## CTO implementation checklist

1. **Centralize mapping** in `web/src/api/auraApiMessages.ts` (used by `auraBackend.ts`) using status + optional `json.error` / `json.detail`.
2. **Read `X-Aura-Anomaly`** on success responses for emergency POST only; pass through to UI as a flag, not as `error`.
3. **Preserve** `role="alert"` on `Emergency` and `JourneyActive` for mapped failure strings only.
4. **429:** distinguish SOS route from others if middleware bodies differ; user copy for SOS is more safety-aware.
5. **QA (board / staging):** **401** wrong or expired token; **offline** / airplane; **burst** paths (`429` and/or `X-Aura-Anomaly` on SOS or location share); invalid journey UUID; **journey ownership** — start journey → tamper or clear stored `journeyId` → I'm safe / share shows calm mapped copy (no raw codes).

## Telemetry (shipped client patterns)

`emitTelemetry` today (`web/src/api/auraBackend.ts`, `web/src/pages/JourneyActive.tsx`, `web/src/pages/Emergency.tsx`):

| Pattern | When | Fields (representative) |
|---------|------|-------------------------|
| `backend` · `event: error` | Remote POST failed after response | `operation` (`im_safe`, `share_location`, `emergency_alert`), `error` (raw technical string / code for ops) |
| `journey` · `im_safe_failed` | I'm safe UI path failed | `journeyId`, `error` |
| `journey` · `share_location_failed` | Share location UI path failed | `journeyId`, `error` |
| `sos` · `alert_failed` | Emergency POST failed in UI | `mode`, `error` |
| `sos` · `alert_sent` | Emergency POST succeeded | `mode`, `alertId` |
| SOS success + `X-Aura-Anomaly` | Anomaly notice path | Log header value for ops; UI uses mapped **notice** string only |

**Future:** richer `backend.error_mapped` (HTTP + `errorCode`) may be added — keep **user copy** in `auraApiMessages.ts` regardless.

---

*Canonical **aura-app** git. Implementation baselines: `0411ed3` (no raw HTTP in generic failure path), `cc847fa` (journey ownership JSON table + session/sync copy), `60146f1` (telemetry table + principle 4 / anomaly doc parity); **latest doc:** anomaly notice **`role="status"`** row + SOS subsection (see `Emergency.tsx`). Aligns with `server/src/index.js` error shapes; journey binding — [BETA_BACKEND.md](../web/docs/BETA_BACKEND.md).*
