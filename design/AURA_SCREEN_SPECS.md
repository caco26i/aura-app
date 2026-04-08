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

### Deep links & unknown paths

- **Canonical route list** — Only the paths in the table above are first-class Aura routes; the source of truth for the SPA is `web/src/App.tsx` (plus `RouteDocumentTitle` for tab titles). When adding a route, update this table and the trace row for §4.1 in [`web/docs/PDR_SCOPE_TRACE.md`](../web/docs/PDR_SCOPE_TRACE.md).
- **Tab titles** — `RouteDocumentTitle` maps each shell route, `/welcome`, `/emergency`, and **`/auth`** (`Sign in · Aura`) to a dedicated `document.title`. Announcer copy for `/auth` is unchanged (only `/settings` hash paths are announced today).
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

## Primary nav: `/cita`, `/transport`, `/checkin` ([AURA-258](/AURA/issues/AURA-258), [AURA-269](/AURA/issues/AURA-269))

**Entry:** Bottom nav in [`web/src/components/AppShell.tsx`](../web/src/components/AppShell.tsx) (**Cita**, **Transp.**, **Check-in**) and matching **Nuevo** feature tiles on Home ([`web/src/pages/Home.tsx`](../web/src/pages/Home.tsx)). Each screen’s top bar **back** control returns to **`/`** (hub).

**Voice:** Spanish UI on these routes follows prototype intent: supportive, non-alarmist reminders and safety-adjacent copy — aligned with [`AURA_LAUNCH_UX.md`](./AURA_LAUNCH_UX.md) (calm first, no catastrophizing) and status patterns in [`web/docs/UX_EMPTY_LOADING_SAFETY.md`](../web/docs/UX_EMPTY_LOADING_SAFETY.md) (`role="status"` / polite live regions where noted).

### `/cita` — Modo Cita (`ModoCita.tsx`)

**Purpose:** Local-first **encuentro** prep: capture who / where / safety keyword, set meeting time, and receive **on-device** check-in nudges before the meeting. **No** SMS or backend in the current build (see muted explainer on screen).

**Layout (top → bottom)**

1. **Top bar** — Back to Home, title **Modo Cita**, **Nuevo** badge.
2. **Mode banner** — **Modo Cita / Encuentro** · subtitle *Citas · Reuniones · Transacciones · Desconocidos*.
3. **Explainer** — Data stays in this browser; future work for alerts/API.
4. **Conditional — Check-in sugerido** — When interval logic says a nudge is due (`modoCitaCheckIn.ts`): soft panel with **`role="status"`** + **`aria-live="polite"`**, heading **Check-in sugerido**, short body asking the user to confirm they are still OK and the plan still feels safe, primary **Listo, seguir** to acknowledge (updates `encuentroLastLocalCheckInAckMs` in `aura:v1`).
5. **Datos del encuentro** — Text fields: nombre o apodo del contacto, lugar, palabra de seguridad. **Foto de contexto:** file control **disabled**; hint explains upload is a design placeholder (not wired).
6. **Check-in antes del encuentro** — Subcopy: visual reminders only. **`datetime-local`** for meeting time; interval **1–120** minutes (default **15**). **Notificaciones del navegador (opcional):** permission-aware copy (unsupported / denied / granted); button to request permission when allowed. **Estado del temporizador local:** **`role="region"`** + **`aria-live="polite"`** with dynamic strings (no meeting time → prompt to set time; past meeting → calm guidance to check surroundings and keep safety keyword ready; future meeting → countdown + next suggested local reminder). Optional **desktop Notification** when tab is hidden, permission granted, and user opted in (`Aura — Modo Cita`).

**Happy path:** User fills encounter fields → sets meeting time and interval → optionally enables notifications → reads live status → at each due interval before the meeting, sees nudge (and optional notification) → taps **Listo, seguir**.

**Edge / safety-adjacent copy:** Past or reached meeting time uses grounded language (entorno, palabra de seguridad), not panic framing. Notification denial is informational, not shaming.

**Attention without alert:** While nudge is due and the tab is visible, `document.title` pulses with a **• Check-in ·** prefix on a timer — attention cue, **not** `role="alert"`.

### `/transport` — Modo Transporte (`ModoTransporte.tsx`)

**Shipped (wireframe, local-only):** Top bar, mode banner, muted explainer (no backend). **Estado del modo transporte** — single **`role="status"`** + **`aria-live="polite"`** (`data-testid="transport-status"`) summarizes empty vs active vs verified; copy stays grounded (no alarmism).

**Layout (top → bottom)**

1. **Empty — Aún sin viaje** — Calm lede; primary **Empezar verificación (demo)** moves to active state (session-only `useState`; refresh resets).
2. **Active — Verificar vehículo y conductor** — Text fields for placa and conductor notes (local only); **Coincide, es mi viaje** → verified; **No soy yo / no es mi viaje** opens a **`role="dialog"`** `aria-modal` sheet with safety guidance + **Ir a SOS** (`Link` to `/emergency`).
3. **Verified — Durante el trayecto** — **Reportar desvío de ruta (demo)** toggles a second **`role="status"`** + polite live region (`data-testid="transport-deviation"`) for deviation copy (local annotation only).
4. **Reset** — **Volver a estado sin viaje** returns to empty.

**Product target (with backend):** Same mental model — verify vehicle/driver → optional deviation signal → escalate via trusted/SOS when contracts exist. Photo capture and server validation remain **out of scope** for this wireframe.

### `/checkin` — Check-in IA (`CheckinInteligente.tsx`)

**Shipped (wireframe, local-only):** Top bar, mode banner, explainer. **Live feedback** — one **`role="status"`** + **`aria-live="polite"`** + **`aria-atomic="true"`** region (`data-testid="checkin-ia-announce"`) announces quick-reply taps; placeholder italic copy when idle.

**Layout (top → bottom)**

1. **Disparadores (wireframe)** — Six static list rows (labels + short hints) matching prototype breadth; no toggles wired.
2. **Respuestas rápidas** — Chips **Todo bien**, **Llegué bien**, **Demoro 10 min**, **Necesito ayuda** append to local historial and refresh the status region (pattern aligned with map/Cita polite announcements).
3. **Historial en este dispositivo** — `ul` (`data-testid="checkin-history"`) prepended on each reply; seed example row for first paint.

**Product target (backlog):** Prioritized triggers, server-backed history, push/SMS — **TBD** with eng; copy remains calm per [`AURA_LAUNCH_UX.md`](./AURA_LAUNCH_UX.md).

---

## PDR §3–4 alignment (checklist)

| PDR | Spec / doc |
|-----|------------|
| §3.1 areas (onboarding, home, journey, SOS, map, trusted, settings) | Routes + UX docs above |
| §4.1 Routing & shell | This file; shell inventory matches `web/src/App.tsx` + `AppShell.tsx` + primary-nav modo pages (§Primary nav) |
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
