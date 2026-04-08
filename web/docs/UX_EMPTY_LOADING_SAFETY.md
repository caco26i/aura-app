# Aura web — empty states, loading, safety microcopy (UX spec)

**Ticket:** AURA-28 (Paperclip / Aura App) · **Scope:** UX audit + implementation-ready notes · **Out of scope:** backend, map provider swap, new APIs.

**Tone baseline:** Calm, direct, non-alarmist; safety paths always pair *what happened* with *what to do next* (including emergency services where relevant). Align with existing `auraApiMessages.ts`.

---

## 1. Current inventory (screens)

| Surface | Empty / edge | Loading / busy | Errors / alerts |
|--------|----------------|----------------|-----------------|
| **Home** | N/A (cards always shown) | N/A | N/A |
| **JourneyNew** | N/A | Button `Starting…` | `role="alert"` via `startError` |
| **JourneyActive** | No journey: title + status + link | `Sending…` / `Sharing…` on actions | `role="alert"` shared for API failures |
| **Emergency** | N/A | Both buttons `Sending…` | `role="alert"` + optional `role="status"` notice |
| **MapPage** | All layers off → `role="status"` hint | Via `AuraMap`: `aria-busy`, overlay, `role="status"` *Loading map…* until tiles `load` (timeout fallback) | **None** (tile errors → telemetry only) |
| **Trusted** | Zero contacts → dashed card + form | N/A | N/A |
| **Settings** | N/A | N/A | N/A |
| **App / routing** | `*` → redirect home | N/A | **`AuraErrorBoundary`** wraps routes in `App.tsx` (fallback UI + reload) |
| **AuraMap** | N/A | **Shipped:** overlay + `aria-busy` + status line while tiles load | Tiles fail silently to user |

---

## 2. Gaps & recommendations

### 2.1 Loading & perceived performance

1. **Map (Leaflet)** — **Shipped** in `AuraMap.tsx`: overlay, `aria-busy`, timeout fallback, *Loading map…* `role="status"`. Optional later: explicit “retry tiles” if tile errors should be user-visible.

2. **JourneyNew `postCreateJourney`** — **Shipped:** form wrapper + primary button `aria-busy`, inputs disabled while `starting`.

3. **JourneyActive primary actions** — **Shipped:** `aria-busy` on I’m safe / Share when the matching `busy` state is active.

### 2.2 Empty & edge states

1. **JourneyActive (no journey)** — Strong baseline. **Optional polish:** Add one line clarifying *why* (e.g. *“You don’t have an active journey on this device.”*) to reduce confusion after storage clear or new device.

2. **MapPage (all layers off)** — Good. **Optional:** If `visible.length === 0`, set focus or scroll not required; keep as-is.

3. **Home — deep link to `/journey/active` with no journey** — User lands on Journey empty state via nav; OK. **Optional:** On Home card, if `!activeJourney`, microcopy could say *“Plan a route and start tracking”* (already close).

4. **Trusted empty** — Clear. **Optional:** Add *“Contacts are stored on this device until the live backend is connected.”* (shortens the long sentence).

### 2.3 Safety-critical microcopy & flow

**Emergency (`Emergency.tsx`)**

| Element | Current | Recommendation |
|--------|---------|----------------|
| Page title | `Emergency` | Keep — scannable. |
| Silent path explainer | Mentions future build + demo | Keep honesty; when silent UX ships, replace with concrete behavior (what is hidden / haptics). |
| Primary actions | Visible first, then silent | **Shipped:** Visible alert uses a confirmation sheet before any SOS network call. Silent alert uses **two confirmation steps** before send so it is strictly harder to trigger than visible (no one-tap silent send). |
| `Go back` | OK | **Shipped:** Focus returns via `web/src/a11y/sosReturnFocus.ts`: bottom-nav SOS and Home tile use stable `data-aura-sos-entry`; optional FAB same; journey silent path focuses `#main-content` because the sheet CTA unmounts when the sheet closes. |
| Error + emergency services | Covered in `auraApiMessages.ts` for SOS | **Do not** soften SOS offline copy; keep emergency services line. |

**Silent sheet (JourneyActive)**

- Title *“Silent alert”* + body OK.  
- **Shipped:** Primary button label *“Open emergency options”* (avoids implying an immediate network send from the sheet).

**SOS entry (bottom nav / Home / optional `AuraSOSButton`)**

- Shipped chrome uses bottom-nav **SOS**; FAB component exists but may be unmounted — see [`PDR_SCOPE_TRACE.md`](./PDR_SCOPE_TRACE.md).
- When FAB is used: `aria-label="Emergency SOS"` — Good.  
- **Spec:** When `globalStatus === 'alert'`, consider tooltip or `aria-live` polite announcement *“Alert status active”* (optional, avoid duplicate nagging).

**End journey**

- Destructive-ish but not irreversible. **Shipped:** Confirm modal *“End journey on this device?”* with cancel vs destructive primary; body notes journeys can be restarted.

### 2.4 API copy (`auraApiMessages.ts`)

- Already strong for rate limit, offline, journey/SOS surfaces.  
- **Minor:** `userMessageForMisconfiguration()` — **Shipped:** participant line *“If you’re a participant, contact your organizer.”* appended after the technical hint in `auraApiMessages.ts` (covers production when the backend is unset).

### 2.5 Global resilience

- **Error boundary:** Recommend a top-level React error boundary (outside router or around `AppShell`) with calm copy + *“Reload the page”* and optional telemetry — avoids white screen on chunk/load failures.

---

## 3. A11y checklist (for eng)

- [ ] Map container: `aria-busy` during tile load (see §2.1).  
- [ ] Async primary buttons: `aria-busy` + `disabled` where appropriate.  
- [ ] `role="alert"` only for errors; success paths use `role="status"` / `aria-live="polite"`.  
- [ ] Emergency: if confirmation step added, trap focus in dialog and restore on close.

---

## 4. Implementation order (suggested)

1. Map loading affordance + `aria-busy` (high visibility, low copy risk).  
2. `aria-busy` on journey CTAs + input disable on JourneyNew submit.  
3. Error boundary + optional misconfiguration copy tweak.  
4. Product decision: emergency confirmation / end-journey confirm — then copy + flow.

---

## 5. Files referenced

- `web/src/pages/*.tsx` — screen copy and structure  
- `web/src/api/auraApiMessages.ts` — API-facing user strings  
- `web/src/a11y/sosReturnFocus.ts` — Emergency “Go back” focus restore  
- `web/src/components/AuraMap.tsx` — map loading behavior  

— UX Designer · AURA-28 handoff
