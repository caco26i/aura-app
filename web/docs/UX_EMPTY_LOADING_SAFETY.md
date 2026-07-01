# Aura web — empty states, loading, safety microcopy (UX spec)

**Ticket:** AURA-28 (Paperclip / Aura App) · **Scope:** UX audit + implementation-ready notes · **Out of scope:** backend, map provider swap, new APIs.

**Tone baseline:** Calm, direct, non-alarmist; safety paths always pair *what happened* with *what to do next* (including emergency services where relevant). Align with existing `auraApiMessages.ts`.

---

## 1. Current inventory (screens)

| Surface | Empty / edge | Loading / busy | Errors / alerts |
|--------|----------------|----------------|-----------------|
| **Home** | N/A (cards always shown) | N/A | Global hub headline *Safe.* / *Alert active.* via `role="status"` + `aria-live="polite"` + `aria-atomic="true"`; `monitorLine` for device vs connected contacts posture; SOS tile `data-aura-sos-entry="home-tile"` |
| **JourneyNew** | N/A | Button `Starting…` | `role="alert"` via `startError` |
| **JourneyActive** | No journey: title + device clarifier (`role="status"`) + next-step line + link | `Sending…` / `Sharing…` on actions | `role="alert"` shared for API failures |
| **Emergency** | N/A | Both buttons `Sending…` | `role="alert"` + optional `role="status"` notice |
| **MapPage** | All layers off → `role="status"` hint | Via `AuraMap`: `aria-busy`, overlay, `role="status"` *Loading map…* until tiles `load` (timeout fallback) | **None** (tile errors → telemetry only) |
| **Trusted** | Zero contacts → dashed card (*stored on this device until the live backend…*) + form | N/A | N/A |
| **Settings** | N/A | N/A | N/A |
| **App / routing** | `*` → redirect home | N/A | **`AuraErrorBoundary`** wraps routes in `App.tsx` (fallback UI + reload) |
| **Modo Cita** (`/cita`) | Encuentro draft local (`#cita-contact-name`, `#cita-place`, `#cita-safety-keyword`); sin hora → copy guía en región viva (`checkInShellCopy`); foto `#cita-photo-label` deshabilitada + hint marcador diseño | N/A | Banner `data-testid="cita-checkin-nudge"` `role="status"` + `aria-live="polite"` + CTA *Listo, seguir*; región temporizador `role="region"` + `aria-labelledby="cita-checkin-live-label"` + `aria-live="polite"`; bloque notificaciones navegador opcional (sin `role="alert"`); tab title pulso `• Check-in ·` cuando nudge + pestaña visible (base `Modo Cita · Aura` via `RouteDocumentTitle`) |
| **Modo transporte** (`/transport`) | Sin viaje: copy calmado + CTA demo; con demo: tarjeta verificación wireframe | N/A | Botones desvío / «no soy yo» solo actualizan UI local (sin `role="alert"`); guía dinámica en `#transport-live-status` `role="status"` + `aria-labelledby` + `aria-live="polite"` |
| **Check-in IA** (`/checkin`) | Historial vacío: `role="status"` en cuerpo de sección | N/A | Bloque de estado `#checkin-ia-status` `role="status"` + `aria-labelledby` + `aria-live="polite"` al cambiar disparador o registrar respuesta rápida (demo local) |
| **AuraMap** | N/A | **Shipped:** overlay + `aria-busy` + status line while tiles load | Tiles fail silently to user |

---

## 2. Gaps & recommendations

### 2.1 Loading & perceived performance

1. **Map (Leaflet)** — **Shipped** in `AuraMap.tsx`: overlay, `aria-busy`, 15s timeout fallback, *Loading map…* `role="status"`. **`tileerror`** emits telemetry only (`map.tile_error`); no user-visible retry at launch ([AURA-289](/AURA/issues/AURA-289) product call). **Post-launch nice-to-have:** optional *Retry map* control if tile failure rates warrant it.

2. **JourneyNew `postCreateJourney`** — **Shipped:** form wrapper + primary button `aria-busy`, inputs disabled while `starting`.

3. **JourneyActive primary actions** — **Shipped:** `aria-busy` on I’m safe / Share when the matching `busy` state is active.

### 2.2 Empty & edge states

1. **JourneyActive (no journey)** — **Shipped:** Dedicated first line *“You don’t have an active journey on this device.”* plus a separate next-step line (`JourneyActive.tsx`).

2. **MapPage (all layers off)** — Good. **Optional:** If `visible.length === 0`, set focus or scroll not required; keep as-is.

3. **Home — no active journey** — **Closed ([AURA-289](/AURA/issues/AURA-289)):** Primary CTA *Start safe journey* (`Home.tsx`) plus Journey feature tile are sufficient; separate *Plan a route and start tracking* line not required. Deep link to `/journey/active` without a journey still lands on JourneyActive empty state — OK.

4. **Trusted empty** — **Shipped:** *“Contacts are stored on this device until the live backend is connected.”* plus add-contact prompt (`Trusted.tsx`).

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

- Shipped chrome uses bottom-nav **SOS** (`data-aura-sos-entry="nav"` + `sosReturnFocus.ts`); Home SOS tile uses `data-aura-sos-entry="home-tile"`. FAB component exists but is **not** mounted in shell — see [`PDR_SCOPE_TRACE.md`](./PDR_SCOPE_TRACE.md) and [`AURA_SCREEN_SPECS.md`](../../design/AURA_SCREEN_SPECS.md).
- When FAB is used: `aria-label` escalates to *Emergency SOS — alert active* when `globalStatus === 'alert'` — Good.
- **Global alert + SR:** **Shipped on Home** — hub headline uses `role="status"`, `aria-live="polite"`, `aria-atomic="true"` with *Alert active.* when `globalStatus === 'alert'` (`Home.tsx`). Optional later: tooltip on SOS entry points or a separate polite string *“Alert status active”* if product wants exact wording outside the hub (avoid duplicate nagging).

**End journey**

- Destructive-ish but not irreversible. **Shipped:** Confirm modal *“End journey on this device?”* with cancel vs destructive primary; body notes journeys can be restarted.

### 2.4 API copy (`auraApiMessages.ts`)

- Already strong for rate limit, offline, journey/SOS surfaces.  
- **Minor:** `userMessageForMisconfiguration()` — **Shipped:** participant line *“If you’re a participant, contact your organizer.”* appended after the technical hint in `auraApiMessages.ts` (covers production when the backend is unset).

### 2.5 Global resilience

- **Error boundary:** **Shipped** — `AuraErrorBoundary` wraps routes in `App.tsx` with calm copy + reload (see §1 inventory).

---

## 3. A11y checklist (for eng)

- [x] Map container: `aria-busy` during tile load (see §2.1).  
- [x] Async primary buttons: `aria-busy` + `disabled` where appropriate.  
- [x] `role="alert"` only for errors; success paths use `role="status"` / `aria-live="polite"`.  
- [x] Emergency: confirmation sheets/dialogs — focus management shipped (`Emergency.tsx`, `sosReturnFocus.ts`).

---

## 4. Implementation order (suggested)

1. Map loading affordance + `aria-busy` (high visibility, low copy risk).  
2. `aria-busy` on journey CTAs + input disable on JourneyNew submit.  
3. Error boundary + optional misconfiguration copy tweak.  
4. Product decision: emergency confirmation / end-journey confirm — then copy + flow.

---

## 5. Files referenced

- `web/src/pages/*.tsx` — screen copy and structure  
- `web/src/pages/Home.tsx` — hub safe / alert headline + polite live region  
- `web/src/api/auraApiMessages.ts` — API-facing user strings  
- `web/src/a11y/sosReturnFocus.ts` — Emergency “Go back” focus restore  
- `web/src/components/AuraMap.tsx` — map loading behavior  

— UX Designer · AURA-28 handoff · [AURA-238](/AURA/issues/AURA-238) verification (2026-04-08): shipped vs optional rows re-checked against `web/`; doc nits above only. · [AURA-289](/AURA/issues/AURA-289) (2026-06-29): Home journey CTA + map tile-error product call recorded; no eng delta.
