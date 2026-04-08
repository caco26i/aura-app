# PDR §3–4 traceability & gap register

**Purpose:** Keep [`design/AURA_PDR.md`](../../design/AURA_PDR.md) **§3 (scope)** and **§4 (functional requirements)** traceable to `web/` UX docs and the shipped shell. Complements the design index in PDR §7.

**Related work:** [AURA-41](/AURA/issues/AURA-41), [AURA-44](/AURA/issues/AURA-44), [AURA-47](/AURA/issues/AURA-47), [AURA-49](/AURA/issues/AURA-49), [AURA-50](/AURA/issues/AURA-50), [AURA-59](/AURA/issues/AURA-59) (frontend delivery bucket), [AURA-74](/AURA/issues/AURA-74) (IA sign-off), [AURA-75](/AURA/issues/AURA-75) (G-IA-01 trace closure), [AURA-61](/AURA/issues/AURA-61) (UX specs / PDR §7 track).

---

## PDR §7 — authoritative detail index (validation)

Cross-check of [`design/AURA_PDR.md`](../../design/AURA_PDR.md) §7 table: each entry resolves to a present doc (or code path where noted). Re-run when §7 changes.

| §7 topic | Path | Status |
|----------|------|--------|
| Routes | [`design/AURA_SCREEN_SPECS.md`](../../design/AURA_SCREEN_SPECS.md) | Present |
| Data visibility / local storage (shell ↔ UX) | [`design/AURA_SCREEN_SPECS.md`](../../design/AURA_SCREEN_SPECS.md) §7 + [`UX_ONBOARDING_TRUST_SETTINGS.md`](./UX_ONBOARDING_TRUST_SETTINGS.md) §3–§4 | Present |
| Copy / errors / SOS | [`design/AURA_LAUNCH_UX.md`](../../design/AURA_LAUNCH_UX.md) | Present |
| Onboarding & settings UX | [`UX_ONBOARDING_TRUST_SETTINGS.md`](./UX_ONBOARDING_TRUST_SETTINGS.md) | Present |
| PDR §3–4 trace & gap register | This file | Present |
| Design tokens | [`design/AURA_DESIGN_SYSTEM.md`](../../design/AURA_DESIGN_SYSTEM.md) + `web/src/theme.css` | Present |
| API contract (beta) | [`server/README.md`](../../server/README.md), [`BETA_BACKEND.md`](./BETA_BACKEND.md) | Present |

---

## §2.1 Map & page chrome (shipped shell)

Cross-check for map intel and global HTML shell called out in [AURA-61](/AURA/issues/AURA-61) IC batches.

**Implementation note:** Map intel UI is **`MapPage.tsx`** at **`/map`** only — there is **no** separate `MapIntel.tsx` page file; seed data/types live in `mapIntelSeed.ts` and render through `AuraMap`. Reconciles with [CTO spot-check](/AURA/issues/AURA-61#comment-4cc626c1-5e05-411d-a456-ce3fd5b16d51) / [link fix](/AURA/issues/AURA-61#comment-52b19e31-76cf-457a-8570-5cbab2bc1eed).

| Topic | Verified in |
|-------|-------------|
| Map intel layers + demo route affordance | [`MapPage.tsx`](../src/pages/MapPage.tsx) (`/map`) |
| OSM map tile attribution | [`AuraMap.tsx`](../src/components/AuraMap.tsx) (`TileLayer` + Leaflet attribution control); policy in [`BETA_BACKEND.md`](./BETA_BACKEND.md) |
| Page title for map route | `RouteDocumentTitle` — **`Map intel · Aura`** for `/map` |
| Mobile browser chrome color | [`index.html`](../index.html) `<meta name="theme-color" content="#fafaff" />` |
| Settings privacy deep link | `/settings#settings-privacy-and-visibility` — `settingsPrivacyAnchor.ts`, `ScrollToTop.tsx`, hash branches in `RouteDocumentTitle` + `RouteAnnouncer`, Privacy `h2` focus in `Settings.tsx`; entry links in `Home.tsx` / `JourneyNew.tsx` / `Trusted.tsx` ([`AURA_SCREEN_SPECS.md`](../../design/AURA_SCREEN_SPECS.md) §7) |

---

## §3.1 In scope — doc map

| PDR area | Spec / doc |
|----------|------------|
| Onboarding | [`UX_ONBOARDING_TRUST_SETTINGS.md`](./UX_ONBOARDING_TRUST_SETTINGS.md) |
| Home, journey, map, trusted, settings | [`design/AURA_SCREEN_SPECS.md`](../../design/AURA_SCREEN_SPECS.md) |
| Emergency (SOS) | [`design/AURA_LAUNCH_UX.md`](../../design/AURA_LAUNCH_UX.md) |
| Backend boundary (journey id, ownership) | [`BETA_BACKEND.md`](./BETA_BACKEND.md) |

---

## §4 Functional requirements — doc map

| Clause | Verified in |
|--------|-------------|
| §4.1 Routes & shell | [`design/AURA_SCREEN_SPECS.md`](../../design/AURA_SCREEN_SPECS.md) (incl. deep links / `*` policy, **Modo Transporte & Check-in IA** wireframe subsection) + `web/src/App.tsx`, `AppShell.tsx`; wireframes en [`ModoTransporte.tsx`](../src/pages/ModoTransporte.tsx), [`CheckinInteligente.tsx`](../src/pages/CheckinInteligente.tsx) |
| §4.2 Journey API before share / I’m safe | [`BETA_BACKEND.md`](./BETA_BACKEND.md), `auraBackend.ts` (`postCreateJourney`), `JourneyNew.tsx`, `JourneyActive.tsx`, `auraApiMessages.ts` |
| §4.3 SOS confirm; anomaly notice styling | [`design/AURA_LAUNCH_UX.md`](../../design/AURA_LAUNCH_UX.md) (incl. [AURA-247](/AURA/issues/AURA-247) reconciliation), `Emergency.tsx`, `auraBackend.ts` (`postEmergencyAlert` / `X-Aura-Anomaly` → notice) |
| §4.4 Voice; no raw HTTP in UI | [`design/AURA_LAUNCH_UX.md`](../../design/AURA_LAUNCH_UX.md), `auraApiMessages.ts`, `auraBackend.ts` (`remotePost`) |

---

## §5 Non-functional requirements — doc map

| Clause | Verified in |
|--------|-------------|
| §5 Accessibility (SOS, journey paths) | `RouteDocumentTitle` + `RouteAnnouncer` (`App.tsx`) — route-aware `document.title` (**Sign in · Aura** on `/auth`; including **Privacy & visibility** on `/settings#settings-privacy-and-visibility`) + polite `#route-announcer-status` on Settings navigations; `ScrollToTop` hash scroll + Privacy `h2` programmatic focus (`Settings.tsx`); `SkipToContent` + `#main-content` (`AppShell.tsx`, `Welcome.tsx`, `Emergency.tsx`); `Emergency.tsx` (dialogs, `role` / `aria-*`), `JourneyActive.tsx`, `AuraMap.tsx` (`aria-busy`), `MapPage.tsx` (layer `role="switch"` `aria-checked` / `aria-pressed` + dynamic `aria-label` (on/off) + `aria-describedby` on toggles; **Find safest route (demo)** primary control with demo `aria-label` + `role="status"` feedback; `section` `aria-labelledby` / `aria-describedby` for map block), `Home.tsx` (visually hidden page `h1`; hub safe/alert `role="status"` + `aria-live="polite"`), `Settings.tsx` (`htmlFor`/`id` on safety inputs; location `fieldset` `aria-describedby` privacy note), `Trusted.tsx` (add form + saved rows `htmlFor`/`id`; permission `fieldset` `aria-describedby`; remove `aria-label`), `JourneyNew.tsx` (heading id + form `aria-describedby` lede), modo shells (`ModoCita` — check-in nudge + región en vivo; **`ModoTransporte`** — `#transport-live-status` `role="status"` `aria-live="polite"` `aria-atomic="true"` + secciones `aria-labelledby`; **`CheckinInteligente`** — `#checkin-ia-status` igual + disparadores `aria-pressed` + historial vacío `role="status"`; `header` `aria-labelledby` + `h1` id en los tres) |
| §5 Privacy & security | [`SECURITY.md`](./SECURITY.md) |
| §5 Observability | [`OBSERVABILITY.md`](./OBSERVABILITY.md), `auraTelemetry.ts`, server audit log in `server/README.md` |
| §5 Visual consistency | [`design/AURA_DESIGN_SYSTEM.md`](../../design/AURA_DESIGN_SYSTEM.md), `theme.css`, `index.html` `theme-color` (mobile browser chrome) |

---

## Gaps: blocking vs nice-to-have

### Open product questions (not engineering blockers)

_None at present._

### Resolved / aligned

1. **API production auth path** — **Aligned.** `server/` accepts **BFF-issued HS256 JWTs** (`sub` + `exp`; optional `iss`/`aud`) alongside legacy static bearer; journey ownership follows `sub` so token refresh does not strand active journeys. Documented in [`server/README.md`](../../server/README.md), [`API_CONTRACT.md`](./API_CONTRACT.md), [`BETA_BACKEND.md`](./BETA_BACKEND.md), [`SECURITY.md`](./SECURITY.md).

2. **G-IA-01 — IA vs PDR MVP table** — **Resolved / confirmed.** CEO decision [AURA-74](/AURA/issues/AURA-74): **Journey stays off** the primary bottom nav for launch. Primary chrome remains **Home, Cita, Transport, Check-in, SOS**; **Journey**, Map, Trusted, and Settings stay **secondary** (Home hero / feature grid / deep links / stack). PDR §3.1 hub areas are **capability buckets** traced in this file and [`design/AURA_SCREEN_SPECS.md`](../../design/AURA_SCREEN_SPECS.md); they are not required to mirror every bottom-bar slot.

3. **SOS FAB vs bottom nav** — [`design/AURA_SCREEN_SPECS.md`](../../design/AURA_SCREEN_SPECS.md) now records **bottom-nav SOS** + Home / journey entry points as current chrome; **`AuraSOSButton`** remains in repo as an optional future FAB (not mounted). No further code change required for PDR §4.1 parity on this point.

4. **Wildcard / deep links** — **Resolved.** [`design/AURA_SCREEN_SPECS.md`](../../design/AURA_SCREEN_SPECS.md) now has an explicit **Deep links & unknown paths** subsection: unknown `*` → home (`replace`), onboarding gate for shell routes, and change process (update `App.tsx` + route table + §4.1 trace). Shipped behavior unchanged by design.

5. **Map tile attribution (production readiness)** — **Resolved.** OSM **© OpenStreetMap contributors** attribution on `TileLayer` in [`AuraMap.tsx`](../src/components/AuraMap.tsx); [`BETA_BACKEND.md`](./BETA_BACKEND.md) documents the review outcome and Leaflet credit.

### Nice-to-have (polish)

_None at present._

### Resolved vs earlier gap register

1. **Global error boundary** — `AuraErrorBoundary` in [`web/src/App.tsx`](../src/App.tsx); inventory updated in [`UX_EMPTY_LOADING_SAFETY.md`](./UX_EMPTY_LOADING_SAFETY.md).
2. **Map loading affordance** — Shipped in [`web/src/components/AuraMap.tsx`](../src/components/AuraMap.tsx) (`aria-busy`, overlay, status copy).

---

## Revision

| Date | Change |
|------|--------|
| 2026-04-08 | Initial trace + gap register for [AURA-47](/AURA/issues/AURA-47). |
| 2026-04-08 | §4.2 verification row expanded + `invalid_journey_id` journey copy; trace link for [AURA-49](/AURA/issues/AURA-49). |
| 2026-04-08 | §5 trace rows; SOS FAB gap closed vs screen specs; [AURA-50](/AURA/issues/AURA-50) telemetry for `X-Aura-Anomaly` on successful API calls. |
| 2026-04-08 | [AURA-61](/AURA/issues/AURA-61): added PDR §7 authoritative index validation table (detail index cross-check). |
| 2026-04-08 | [AURA-59](/AURA/issues/AURA-59): UX trace inventory synced to shipped map loading + app error boundary. |
| 2026-04-08 | [AURA-59](/AURA/issues/AURA-59): PDR §3.1 Home SOS chrome wording aligned with screen specs; Home hub `role="status"` + `aria-live` for safe/alert headline. |
| 2026-04-08 | [AURA-60](/AURA/issues/AURA-60) / [AURA-59](/AURA/issues/AURA-59): integration tests for `invalid_journey_id`; screen specs wildcard note synced with shipped error boundary; server CI also on `API_CONTRACT.md` edits. |
| 2026-04-08 | [AURA-59](/AURA/issues/AURA-59): GitHub Actions **Web lint & build** for `web/` (ESLint + `tsc` + Vite production build). |
| 2026-04-08 | [AURA-60](/AURA/issues/AURA-60): server integration tests for unknown-path `not_found` (404); API_CONTRACT regression line updated. |
| 2026-04-08 | [AURA-59](/AURA/issues/AURA-59): skip-to-main link + `#main-content` landmark on shell, welcome, and emergency (PDR §5 / WCAG 2.4.1). |
| 2026-04-08 | [AURA-60](/AURA/issues/AURA-60): integration tests for GET-on-POST-only `not_found` + OPTIONS CORS preflight headers. |
| 2026-04-08 | [AURA-59](/AURA/issues/AURA-59): centralized `RouteDocumentTitle` for all primary routes; removed per-page title effects from modo shells. |
| 2026-04-08 | [AURA-60](/AURA/issues/AURA-60): integration test for SOS `rate_limited` (429) + `audit.rate_limited` line after hourly cap. |
| 2026-04-08 | [AURA-59](/AURA/issues/AURA-59) / [AURA-60](/AURA/issues/AURA-60): live journey share control `aria-describedby` + hint copy; SOS tests grouped at end of suite (no mid-file `emergency-alerts` traffic before rate limit case). |
| 2026-04-08 | [AURA-60](/AURA/issues/AURA-60): integration test for `im-safe` with non-empty JSON → `validation_failed`; API_CONTRACT request-body row clarified. |
| 2026-04-08 | [AURA-59](/AURA/issues/AURA-59): Settings safety controls use explicit `label htmlFor` + input `id`; location fieldset `aria-describedby` → privacy copy. |
| 2026-04-08 | [AURA-60](/AURA/issues/AURA-60): integration test for non-`Bearer` `Authorization` → **401** `unauthorized`; API_CONTRACT auth row clarified. |
| 2026-04-08 | [AURA-59](/AURA/issues/AURA-59): `Trusted.tsx` — explicit labels/ids on add form and saved contacts; permission fieldset described by hint; named radio group `trusted-new-perm`. |
| 2026-04-08 | [AURA-59](/AURA/issues/AURA-59): `MapPage` layer switches use visible label + description via `aria-labelledby` / `aria-describedby`; modo/check-in toolbars `header aria-labelledby`; `JourneyNew` form tied to intro copy. |
| 2026-04-08 | [AURA-59](/AURA/issues/AURA-59): `Home` screen-reader-only `h1`; `MapPage` `section` landmarks (`aria-labelledby` / `aria-describedby`) around layers + map + POI list. |
| 2026-04-08 | [AURA-60](/AURA/issues/AURA-60): malformed JSON on mutating routes → **400** `invalid_json` (express `entity.parse.failed` handler); integration test + [API_CONTRACT.md](./API_CONTRACT.md). |
| 2026-04-08 | [AURA-60](/AURA/issues/AURA-60): optional `AURA_API_BEARER_TOKEN_ALT` + integration test for **`403` `journey_forbidden`** on location-shares when a second valid bearer targets another actor’s journey. |
| 2026-04-08 | Post–[AURA-60](/AURA/issues/AURA-60): integration test parity — **`im-safe`** also returns **`403` `journey_forbidden`** for alt bearer on another actor’s journey; [API_CONTRACT.md](./API_CONTRACT.md) regression line. |
| 2026-04-08 | [AURA-91](/AURA/issues/AURA-91): API baseline **security headers** (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`) on all `server/` responses + integration assertion; [API_CONTRACT.md](./API_CONTRACT.md) + [SECURITY.md](./SECURITY.md). |
| 2026-04-08 | [AURA-91](/AURA/issues/AURA-91): integration test — security headers present on **404** / **401** JSON errors (not only `/health`). |
| 2026-04-08 | [AURA-75](/AURA/issues/AURA-75): **G-IA-01** closed — IA vs PDR §3.1 confirmed per [AURA-74](/AURA/issues/AURA-74); open-questions section cleared. |
| 2026-04-08 | [AURA-61](/AURA/issues/AURA-61): related-work index linked [AURA-74](/AURA/issues/AURA-74) / [AURA-75](/AURA/issues/AURA-75) after CEO clarification ([comment 510069eb](/AURA/issues/AURA-61#comment-510069eb-fced-48c6-866c-9ad6993a4ee6)). |
| 2026-04-08 | [AURA-59](/AURA/issues/AURA-59): **PDR §5 a11y gate** — UX Designer static/code review **PASS** on `8014df0` ([comment cbe4678c](/AURA/issues/AURA-59#comment-cbe4678c-4a66-43f3-8481-6f1ca0504d30)); optional human SR smoke on device still recommended. |
| 2026-04-08 | [AURA-61](/AURA/issues/AURA-61): §2.1 map + page chrome table; §5 rows for `MapPage` toggle `aria-label` / `aria-pressed`, demo route control + status, and `index.html` `theme-color`. |
| 2026-04-08 | [AURA-61](/AURA/issues/AURA-61): `RouteDocumentTitle` `/map` → **Map intel · Aura** (aligns with on-page `h1`). |
| 2026-04-08 | [AURA-61](/AURA/issues/AURA-61): §2.1 **MapIntel.tsx** naming clarified — canonical surface is `MapPage.tsx` (`/map`); CTO wake [52b19e31](/AURA/issues/AURA-61#comment-52b19e31-76cf-457a-8570-5cbab2bc1eed). |
| 2026-04-08 | [AURA-91](/AURA/issues/AURA-91): BFF **HS256 JWT** auth (`sub` ownership) + **im-safe** hourly rate limit + `AURA_API_JSON_BODY_LIMIT`; audit **RUNBOOK_AUDIT.md**; Resolved/aligned row for API production auth path. |
| 2026-04-08 | [AURA-61](/AURA/issues/AURA-61): Eng verified `Emergency.tsx` — `npm run lint` + targeted ESLint **clean** on `20be0fb` ([comment ca9f8b1d](/AURA/issues/AURA-61#comment-ca9f8b1d-6a36-4a32-a32a-0340ad77b8b6)); prior `react-hooks/set-state-in-effect` note closed as stale / config drift. |
| 2026-04-08 | Parent [AURA-61](/AURA/issues/AURA-61) **done** — all direct children terminal: [AURA-74](/AURA/issues/AURA-74) (IA sign-off), [AURA-75](/AURA/issues/AURA-75) (G-IA-01 trace), [AURA-189](/AURA/issues/AURA-189) (optional QA SR privacy hash). Ongoing PDR §7 work: open new subtasks under program as needed. |
| 2026-04-08 | [AURA-189](/AURA/issues/AURA-189): engineering **PASS** on `1247849` — `RouteAnnouncer`, hash-aware `RouteDocumentTitle`, `h2#settings-privacy-and-visibility` focus, Playwright smoke ([AURA-61](/AURA/issues/AURA-61#comment-00a8827c-ab50-4b21-a759-9bd6f39a186d)); manual AT spot-check optional / non-blocking. |
| 2026-04-08 | [AURA-92](/AURA/issues/AURA-92): **Deep links / wildcard** — screen specs subsection for unknown paths, onboarding vs deep link, and route change process; **OSM map attribution** — `AuraMap` TileLayer + `BETA_BACKEND.md`; nice-to-have gap cleared. |
| 2026-04-08 | [AURA-95](/AURA/issues/AURA-95): mutating-route **minute-window** limiters — `429` + `audit.rate_limited` parity with hourly caps; **`AURA_API_RATE_LIMIT_*`** env tunables in `server/README.md`; integration test for journey minute cap; [API_CONTRACT.md](./API_CONTRACT.md) regression line. |
| 2026-04-08 | [AURA-96](/AURA/issues/AURA-96): durable **journey registry** — SQLite **WAL** + JSONL fallback + `memory` for default integration tests; subprocess **HTTP restart** test; env `AURA_API_JOURNEY_STORE*` in `server/README.md`; [SECURITY.md](./SECURITY.md) beta API row. |
| 2026-04-08 | [AURA-175](/AURA/issues/AURA-175): **§7 data visibility** — added [`AURA_SCREEN_SPECS.md`](../../design/AURA_SCREEN_SPECS.md) §7 matrix (Home / Journey / Trusted / Settings); PDR §7 index row; ESLint **`no-control-regex`** fix in `firstTouchAcquisition.ts`; Journey map hint aligned to UX §3.4 demo line. |
| 2026-04-08 | [AURA-175](/AURA/issues/AURA-175): `Home.tsx` — empty-contact hub `monitorLine` now states **device vs connected** posture (aligns with screen specs §7 / UX trust copy). |
| 2026-04-08 | [AURA-178](/AURA/issues/AURA-178): [SECURITY.md](./SECURITY.md) — launch opener + related-doc links state **beta `server/`** as authoritative API boundary (pointers to [API_CONTRACT.md](./API_CONTRACT.md) / `server/README.md`); [DEPLOY.md](./DEPLOY.md) — **Compose stack smoke** (`workflow_dispatch`) operator cross-link. |
| 2026-04-08 | [AURA-180](/AURA/issues/AURA-180): BFF (`server/bff`) **`X-Request-Id`** + security header parity with `aura-api`; CORS exposed/allowed correlation headers; integration tests for `/health`, **400**/**413**/**429**; `server/bff/README.md` + [SECURITY.md](./SECURITY.md) BFF row. |
| 2026-04-08 | [AURA-191](/AURA/issues/AURA-191): **PASS** — reconciled [AURA-61](/AURA/issues/AURA-61) closeout vs trace: §2.1 row for Settings privacy deep link; §5 row now names `RouteAnnouncer`, hash `document.title`, `ScrollToTop` + Privacy `h2` focus; shipped behavior cross-checked vs `RouteDocumentTitle.tsx` / `RouteAnnouncer.tsx` / `ScrollToTop.tsx` / `Settings.tsx`; prior eng evidence [AURA-189](/AURA/issues/AURA-189) on `1247849`. Gap register unchanged (empty). |
| 2026-04-08 | [AURA-197](/AURA/issues/AURA-197): post-launch spec drift audit — [`AURA_SCREEN_SPECS.md`](../../design/AURA_SCREEN_SPECS.md) route table + deep-link gate now include **`/auth`**; tab-title note for `/auth`; [`PUBLIC_BETA.md`](../../docs/PUBLIC_BETA.md) §3 flows aligned with shipped shell (nav + map + auth); [`AURA_LAUNCH_UX.md`](../../design/AURA_LAUNCH_UX.md) user-visible string table mirrored to shipped `auraApiMessages.ts` (401/403/429, misconfiguration, BFF, unknown-error paths — not only offline journey vs SOS). |
| 2026-04-08 | [AURA-213](/AURA/issues/AURA-213): `/auth` **`document.title`** — **Sign in · Aura** in [`RouteDocumentTitle.tsx`](../src/components/RouteDocumentTitle.tsx); screen specs tab-title bullet + §5 accessibility trace row updated ([`AURA_SCREEN_SPECS.md`](../../design/AURA_SCREEN_SPECS.md)). |
| 2026-04-08 | [AURA-221](/AURA/issues/AURA-221): post–[AURA-61](/AURA/issues/AURA-61) UX / PDR trace closure — **PASS** (`web/` `npm run lint` + production `vite build`); shipped `web/src` cross-checked vs this file + [`AURA_SCREEN_SPECS.md`](../../design/AURA_SCREEN_SPECS.md) (wildcard home replace, `/auth` titles, map OSM attribution, settings privacy deep link); no drift found. |
| 2026-04-08 | [AURA-232](/AURA/issues/AURA-232): Post–[AURA-220](/AURA/issues/AURA-220) UX polish — [`UX_ONBOARDING_TRUST_SETTINGS.md`](./UX_ONBOARDING_TRUST_SETTINGS.md) §5 reconciled to shipped AURA-28 empty/loading inventory; [`UX_EMPTY_LOADING_SAFETY.md`](./UX_EMPTY_LOADING_SAFETY.md) §2.5 / §3 checklist synced. Gap register unchanged (**Open product questions** / **Nice-to-have** still empty). |
| 2026-04-08 | [AURA-238](/AURA/issues/AURA-238): Post–[AURA-232](/AURA/issues/AURA-232) empty/loading/safety spec pass — static cross-check of `web/src` vs [`UX_EMPTY_LOADING_SAFETY.md`](./UX_EMPTY_LOADING_SAFETY.md) + SOS placement vs [`AURA_SCREEN_SPECS.md`](../../design/AURA_SCREEN_SPECS.md); Home hub global alert `aria-live` + SOS `data-aura-sos-entry` notes recorded in UX doc §1 / §2.3. No engineering delta; gap register unchanged. |
| 2026-04-08 | [AURA-247](/AURA/issues/AURA-247): Launch / SOS spec vs shipped (`Emergency.tsx`, `auraApiMessages.ts`, `auraBackend.ts`, PDR §4.3–§4.4) — drift closed in [`AURA_LAUNCH_UX.md`](../../design/AURA_LAUNCH_UX.md) reconciliation + string-table sync; §4 trace rows tightened. No CTO child (no eng gap). |
| 2026-04-08 | [AURA-275](/AURA/issues/AURA-275): Post–[AURA-274](/AURA/issues/AURA-274) PD remediation — wireframes `/transport` + `/checkin` (`ModoTransporte.tsx`, `CheckinInteligente.tsx`) con regiones vivas `role="status"`; [`AURA_SCREEN_SPECS.md`](../../design/AURA_SCREEN_SPECS.md) subsección wireframe; §4.1/§5 y [`UX_EMPTY_LOADING_SAFETY.md`](./UX_EMPTY_LOADING_SAFETY.md) §1 inventario actualizados. |
| 2026-04-08 | [AURA-278](/AURA/issues/AURA-278): Screen spec parity — `/transport` page + tab title **`Modo transporte`** (ruta §4.1); `#transport-live-status` / `#checkin-ia-status` con `aria-labelledby`; placeholders de foto con `aria-label`; check-in banner + **Historial de demostración** alineados a copy wireframe; `pickReply` mueve `Date.now`/`Math.random` al updater de estado (eslint `react-hooks/purity`); smoke Playwright actualizado. |
