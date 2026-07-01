# Aura screen specs (routing & shell)

Authoritative for [`AURA_PDR.md`](./AURA_PDR.md) **§4.1** (routing & shell). Cross-check **§4.2–4.4** with [`web/docs/BETA_BACKEND.md`](../web/docs/BETA_BACKEND.md) and [`AURA_LAUNCH_UX.md`](./AURA_LAUNCH_UX.md).

---

## Routes

| Route | Purpose |
|-------|---------|
| `/welcome` | First-run onboarding (see [`web/docs/UX_ONBOARDING_TRUST_SETTINGS.md`](../web/docs/UX_ONBOARDING_TRUST_SETTINGS.md) §2); **outside** shell |
| `/auth` | Google / BFF sign-in (`Auth.tsx`); **outside** shell and **outside** `RequireOnboarding` (deep link works before onboarding completes); see [`web/docs/AUTH.md`](../web/docs/AUTH.md) |
| `/emergency` | Full-screen SOS (outside shell); **always reachable**, including before onboarding completes |
| `/` | Home hub (journey CTAs, links to map / trusted / settings, feature tiles) |
| `/journey/new` | Configure journey |
| `/journey/active` | Live tracking, map, backend actions; first **Share live location** uses a one-time primer sheet (`shareLocationPrimerAcknowledged` in `aura:v1`); map hint copy splits primary vs demo note (see UX spec §3.4) |
| `/map` | Intel layers + map |
| `/trusted` | Trusted network CRUD |
| `/settings` | Safety settings |
| `/cita` | Modo Cita (inside shell; not listed in PDR §3.1 MVP table — product extension) |
| `/transport` | Modo transporte (inside shell; same note) |
| `/checkin` | Check-in IA (inside shell; same note) |

### Home hub (wireframe)

- **`/` (`Home.tsx`)** — Primary hub inside shell; tab title **`Home · Aura`** via `RouteDocumentTitle`. **Shipped surfaces:**
  1. **Header** — Time-based greeting (*Good morning* / *Good afternoon* / *Good evening*); `displayName` from settings (fallback *You*); notifications control `aria-label="Notifications (coming soon)"` (non-functional placeholder); profile avatar (`aria-hidden` when showing initial letter).
  2. **Global posture** — Decorative *Protected · Home area* line with status dot; hub headline `role="status"`, `aria-live="polite"`, `aria-atomic="true"`: *Safe.* vs *Alert active.* when `globalStatus === 'alert'`.
  3. **Monitor line** — `monitorLine` clarifies device vs connected posture: zero contacts → *Trusted contacts stay on this device until Aura is connected…*; otherwise contact count + *tracking and alerts when connected* (aligns with §7 matrix below).
  4. **Primary journey CTA** — Full-width button *Start safe journey* or *Continue safe journey* → `/journey/new` or `/journey/active` depending on `activeJourney`.
  5. **Security feature grid** — Tiles: Journey (`/journey/new`), Tracking (`/journey/active`), **SOS** (`/emergency`, `data-aura-sos-entry="home-tile"`, `registerSosOpenerReturnFocusFromEntry` for return focus).
  6. **New feature grid** — Modo Cita, Transporte, Check-in IA tiles with *NUEVO* badge → `/cita`, `/transport`, `/checkin`.
  7. **Footer text links** — Safety map, Network, Settings → `/map`, `/trusted`, `/settings`.
  8. **Accessibility** — Visually hidden `h1` *Home* for SR heading navigation (PDR §5); hub alert uses polite live region (not `role="alert"`).

### Journey flow (wireframe)

- **`/journey/new` (`JourneyNew.tsx`)** — Configure journey before live tracking; tab title **`New journey · Aura`** via `RouteDocumentTitle`. **Shipped surfaces:**
  1. **Heading + lede** — `h1` *New journey* (`#journey-new-heading`); lede *Details persist once you start — refresh mid-journey is safe.* (`#journey-new-lede`).
  2. **Form fields** — Journey name (`#j-label`, default *Walk home*), destination (`#j-dest`, default *Home*), ETA minutes (`#j-eta`, defaults from `settings.timerDefaultMinutes`).
  3. **Submit** — Primary *Start live tracking* → `postCreateJourney` then `startJourney` + navigate `/journey/active`; button `aria-busy` + *Starting…* while pending; form wrapper `aria-busy={starting}`; inputs disabled during submit.
  4. **Errors** — `startError` in `role="alert"` (API failures via `auraApiMessages.ts`).
  5. **Visual** — Primary button uses intentional gradient (documented in [`AURA_DESIGN_SYSTEM.md`](./AURA_DESIGN_SYSTEM.md) exception table).

- **`/journey/active` (`JourneyActive.tsx`)** — Live tracking + backend actions; tab title **`Live tracking · Aura`** via `RouteDocumentTitle`. **Shipped surfaces:**
  1. **Empty state** (no `activeJourney`) — `h1` *No active journey*; `role="status"` block with device clarifier + next-step line; link to `/trusted` (zero contacts) or `/journey/new`.
  2. **Active header** — `h1` *Live tracking*; `StatusPill` + ETA line; journey `label` + *To {destination}*.
  3. **Map + silent SOS path** — Double-tap hint (primary line + demo note per UX §3.4); `AuraMap` `onDoubleTapHint` opens **silent alert sheet** (`role="dialog"`, *Open emergency options* → `/emergency` with `{ mode: 'silent' }`, return focus via `registerSosOpenerReturnFocus` → `#main-content`).
  4. **Track state toggles** — *On track* / *Delay* / *Deviation* with `aria-pressed`.
  5. **Backend actions** — *I'm safe* (`postImSafe`, `aria-busy`, hint *Sends a check-in to Aura when connected.*); *Share live location* (`postShareLocation`, first use shows **share primer sheet** until `shareLocationPrimerAcknowledged` in `aura:v1`, then direct share; hint *Notifies trusted contacts when Aura is connected…*).
  6. **End journey** — Confirm dialog (`role="dialog"`, *End journey on this device?*) before `endJourney()`.
  7. **Errors** — Shared `role="alert"` for API failures on I'm safe / share.
  8. **Overlays** — Escape dismisses primer / silent / end-journey sheets; focus moves to first button on open.

### Modo Cita, Transporte & Check-in IA (wireframe)

- **`/cita` (`ModoCita.tsx`)** — Local-only wireframe (primary bottom nav); borrador en `aura:v1`; sin SMS/API hasta contrato futuro. **Superficies expedidas (mirror transport/checkin):**
  1. **Encuentro draft** — `#cita-contact-name` (nombre o apodo), `#cita-place` (lugar), `#cita-safety-keyword` (palabra de seguridad), `#cita-meeting-time` (`datetime-local`), `#cita-checkin-interval` (minutos); foto `#cita-photo-label` **deshabilitada** con hint *marcador de diseño* (`#cita-photo-hint`).
  2. **Banner check-in sugerido** — `data-testid="cita-checkin-nudge"`, `role="status"`, `aria-live="polite"` cuando toca el intervalo local; copy calmado (*Check-in sugerido* + siguiente paso); CTA *Listo, seguir* persiste `encuentroLastLocalCheckInAckMs`.
  3. **Región temporizador en vivo** — `role="region"`, `aria-labelledby="cita-checkin-live-label"`, `aria-live="polite"`; copy dinámico vía `checkInShellCopy` (sin hora → guía; cuenta regresiva; hora alcanzada → revisar entorno / palabra de seguridad).
  4. **Bloque notificaciones navegador (opcional)** — permiso vía botón *Permitir avisos del navegador*; `Notification` (`tag: aura-cita-checkin`, body calmado) solo cuando nudge activo + pestaña oculta + permiso concedido + usuario opt-in (`encuentroBrowserNotifyWanted`).
  5. **Pulso tab title** — base **`Modo Cita · Aura`** via `RouteDocumentTitle` (`/cita` → `titleForPath`); prefijo alternante **`• Check-in ·`** en `document.title` cada 2s mientras nudge activo **y** pestaña visible (lógica en `ModoCita.tsx`, independiente de `RouteDocumentTitle`).
  `header` `aria-labelledby="modo-cita-title"`. Tono calmado + siguiente paso alineado a [`AURA_LAUNCH_UX.md`](./AURA_LAUNCH_UX.md) / [`web/docs/UX_EMPTY_LOADING_SAFETY.md`](../web/docs/UX_EMPTY_LOADING_SAFETY.md).
- **`/transport` (`ModoTransporte.tsx`)** — Local-only wireframe: estado vacío vs. viaje de demostración; tarjeta de verificación (placa de ejemplo, placeholders de foto); casillas de confirmación; acciones **Posible desvío de ruta** y **No soy yo / no es mi viaje** que solo actualizan copy en pantalla (sin POST). Región **`#transport-live-status`** con `role="status"`, `aria-labelledby`, `aria-live="polite"`, `aria-atomic="true"` para mensajes dinámicos. Tab title **`Modo transporte · Aura`** via `RouteDocumentTitle`. Tono alineado a [`AURA_LAUNCH_UX.md`](./AURA_LAUNCH_UX.md) / [`web/docs/UX_EMPTY_LOADING_SAFETY.md`](../web/docs/UX_EMPTY_LOADING_SAFETY.md) (calma + siguiente paso).
- **`/checkin` (`CheckinInteligente.tsx`)** — Seis disparadores tipo plantilla, respuestas rápidas tappeables e **historial de demostración** en memoria (máx. 12 entradas). **`#checkin-ia-status`** con `role="status"`, `aria-labelledby`, `aria-live="polite"`, `aria-atomic="true"` para el estado del disparador y última acción. Tab title **`Check-in IA · Aura`**. Sin SMS/push hasta contrato de API.

### Deep links & unknown paths

- **Canonical route list** — Only the paths in the table above are first-class Aura routes; the source of truth for the SPA is `web/src/App.tsx` (plus `RouteDocumentTitle` for tab titles). When adding a route, update this table and the trace row for §4.1 in [`web/docs/PDR_SCOPE_TRACE.md`](../web/docs/PDR_SCOPE_TRACE.md).
- **Tab titles** — `RouteDocumentTitle` maps each shell route, `/welcome`, `/emergency`, and **`/auth`** (`Sign in · Aura`) to a dedicated `document.title` (including **`/cita`** → **Modo Cita · Aura**, **`/transport`** → **Modo transporte · Aura**, and **`/checkin`** → **Check-in IA · Aura**). **`/cita`** may additionally pulse **`• Check-in ·`** in `document.title` during an active local check-in nudge (`ModoCita.tsx`). Announcer copy for `/auth` is unchanged (only `/settings` hash paths are announced today).
- **Unknown paths (`*`)** — Any pathname that does not match a declared `<Route>` is handled with `<Navigate to="/" replace />` (home). This is an intentional MVP choice: users land on the hub instead of a standalone 404 screen. It is **not** silent failure — the URL updates to `/` so bookmarks to typos recover predictably.
- **Deep links vs onboarding** — `/welcome`, `/auth`, and `/emergency` are outside `RequireOnboarding`. All other routes in the table require `onboardingCompleted` in `aura:v1`; if false, the user is redirected to `/welcome` with `replace`, then returns to the shell after completion. Deep links to e.g. `/map` therefore work after onboarding, and cold-start deep links funnel through welcome first.
- **Global render errors** — Uncaught React errors in the tree are handled by `AuraErrorBoundary` (see [`web/docs/PDR_SCOPE_TRACE.md`](../web/docs/PDR_SCOPE_TRACE.md) §“Resolved vs earlier gap register”); this is separate from unknown URL handling.

---

## App shell (`AppShell`)

- **Bottom navigation** (primary): Home (`/`), Cita (`/cita`), Transp. (`/transport`), Check-in (`/checkin`), SOS (`/emergency`). Product IA for launch is **confirmed** (see **G-IA-01** in [`web/docs/PDR_SCOPE_TRACE.md`](../web/docs/PDR_SCOPE_TRACE.md) / [AURA-74](/AURA/issues/AURA-74)).
- **Not in the bottom bar today:** `/journey/*`, `/map`, `/trusted`, `/settings` — reached from Home (primary journey button, feature grid, footer text links).
- **SOS entry points:** bottom nav **SOS**, Home feature tile, and journey surfaces as documented in UX specs. A floating **`AuraSOSButton`** component exists in repo but is **not** mounted in the shell; treat FAB as optional future pattern, not current chrome (see [`web/docs/PDR_SCOPE_TRACE.md`](../web/docs/PDR_SCOPE_TRACE.md)).

**Onboarding:** Cold start redirects to `/welcome` when `onboardingCompleted` is false in `aura:v1`. Existing payloads without that field are treated as already completed (migration). `/emergency` and `/auth` stay reachable without finishing onboarding.

---

## PDR §3–4 alignment (checklist)

| PDR | Spec / doc |
|-----|------------|
| §3.1 areas (onboarding, home, journey, SOS, map, trusted, settings) | Routes + UX docs above |
| §4.1 Routing & shell | This file; shell inventory matches `web/src/App.tsx` + `AppShell.tsx` |
| §4.2 Journey before share / I’m safe | [`web/docs/BETA_BACKEND.md`](../web/docs/BETA_BACKEND.md) (“Journey ownership”) |
| §4.3 SOS confirm; `X-Aura-Anomaly` as `role="status"` | [`AURA_LAUNCH_UX.md`](./AURA_LAUNCH_UX.md) |
| §4.4 Voice + centralized errors | [`AURA_LAUNCH_UX.md`](./AURA_LAUNCH_UX.md), `web/src/api/auraApiMessages.ts` |

---

## Design tokens & a11y

Visual intent: [`AURA_DESIGN_SYSTEM.md`](./AURA_DESIGN_SYSTEM.md). Loading / empty / alert patterns: [`web/docs/UX_EMPTY_LOADING_SAFETY.md`](../web/docs/UX_EMPTY_LOADING_SAFETY.md).

---

## 7. Data visibility & local storage (cross-surface)

Authoritative UX copy and structure: [`web/docs/UX_ONBOARDING_TRUST_SETTINGS.md`](../web/docs/UX_ONBOARDING_TRUST_SETTINGS.md) §3–§4 (trust surfaces, settings clarity). PDR §7 lists that doc in the [detail index](./AURA_PDR.md#7-traceability--child-work); this section ties **shipped shell** behavior to those requirements.

| Surface | User-visible data posture (summary) | Primary implementation |
|--------|-------------------------------------|-------------------------|
| **Home** | Hub line clarifies contacts live on device and backend when connected | `web/src/pages/Home.tsx` (`monitorLine`) |
| **Journey (active)** | First-time share primer; inline hints for I’m safe / share; map double-tap label + demo hint per §3.4 | `web/src/pages/JourneyActive.tsx` |
| **Trusted** | Empty state: contacts on device until backend; permission legend for alerts when connected | `web/src/pages/Trusted.tsx` |
| **Settings** | “Your data on this device” block; privacy & sharing under location precision; clear-local confirm | `web/src/pages/Settings.tsx` |

When this matrix or the UX doc changes, update [`web/docs/PDR_SCOPE_TRACE.md`](../web/docs/PDR_SCOPE_TRACE.md) if §5 / gap register is affected.
