# Aura web — onboarding, trust surfaces, and settings clarity (UX spec)

**Ticket:** [AURA-34](/AURA/issues/AURA-34) (Paperclip / Aura App) · **Scope:** implementation-ready UX for CTO · **Out of scope:** new backend contracts, OAuth redesign, map provider swap.

**Depends on context:** [AURA-28](/AURA/issues/AURA-28) handoff in [`UX_EMPTY_LOADING_SAFETY.md`](./UX_EMPTY_LOADING_SAFETY.md); safety copy baseline in [`../../design/AURA_LAUNCH_UX.md`](../../design/AURA_LAUNCH_UX.md); SOS confirmation behavior aligned with [AURA-31](/AURA/issues/AURA-31) thread (explicit confirm before send). PDR §3–4 traceability: [`PDR_SCOPE_TRACE.md`](./PDR_SCOPE_TRACE.md).

**Tone:** Calm, plain language, no alarmism. Pair every sensitive action with *what happens*, *who may see data*, and *how to undo or pause* where applicable.

**Verification:** [AURA-205](/AURA/issues/AURA-205) (Apr 2026) — current `web/` implements §2–§4 and §6 telemetry; residual nits are optional copy tightening only. **Regression:** [AURA-209](/AURA/issues/AURA-209) (Apr 2026) — Playwright **PASS** (`welcome-onboarding`, `emergency-pre-onboarding`, `smoke`). **Clear-local modal:** [AURA-220](/AURA/issues/AURA-220) — `settings-clear-local.spec.ts` covers §4.3 **A/B**; §4.3 documents **`AuraContext`** re-persist after clear (e2e asserts cold-start JSON, not `localStorage` null). **Post–AURA-220 doc sync:** [AURA-232](/AURA/issues/AURA-232) (Apr 2026) — §5 AURA-28 consistency inventory reconciled to shipped `web/` + [`UX_EMPTY_LOADING_SAFETY.md`](./UX_EMPTY_LOADING_SAFETY.md); no eng copy/layout changes required for launch.

---

## 1. Problem statement (current gaps)

| Area | Today | Risk |
|------|--------|------|
| **First run** | User lands on Home with no explanation of Aura, permissions, or SOS behavior | Wrong mental model; accidental SOS anxiety; unclear what is local vs server |
| **Trust at decision points** | Share location and SOS paths have strong confirm for SOS; share is one tap after sheet | Users may not understand that share can notify backend/contacts when connected |
| **Settings** | Controls are listed; subtitle says “persist locally” but no map of *what* is stored, *what* leaves the device, or how to clear | Privacy expectations unclear; no explicit “pause” or “start over” story |
| **Consistency** | Home / journey / trusted copy partially overlaps; demo gestures called out without “practice vs production” framing | Drift from [AURA-28](/AURA/issues/AURA-28) empty/loading patterns on map and journey CTAs |

---

## 2. First-run / onboarding

### 2.1 Product goals

- Explain **what Aura is** in one screen (journey check-ins, trusted contacts, optional SOS).
- State **where data lives** by default (this device until backend connected) — one sentence, no legalese.
- Preview **permissions** users will meet later (location for journey/map; notifications if added later) — “you’ll be asked when you use the feature,” not a fake system prompt.
- **SOS in plain language:** tapping SOS opens emergency options; **nothing is sent until you confirm** on the emergency screen (visible vs silent paths as today).

### 2.2 Flow (recommended)

1. **Entry:** On cold start, if `onboardingCompleted !== true` in persisted client state (new key in `aura:v1` payload or adjacent key — engineering choice), redirect to onboarding before shell routes.
2. **Step A — Welcome**  
   - Title: *Welcome to Aura*  
   - Body (example, tune in implementation): *Aura helps you share journey progress with people you trust and reach them quickly if you need help. Your contacts and settings stay on this device until you connect a live Aura account.*  
   - Primary: *Continue*  
   - Secondary link: *Skip for now* (sets completed flag; same as finish — do not block power users).
3. **Step B — How SOS works**  
   - Title: *Emergency (SOS)*  
   - Bullets: *The SOS button always opens a confirmation screen.* · *You choose visible or silent alert.* · *Silent alerts need extra steps so they are harder to trigger by accident.*  
   - Primary: *Continue*  
4. **Step C — Journeys & location (short)**  
   - Title: *Journeys and location*  
   - Body: *When you start a journey or use the map, your browser may ask for location. You can choose approximate or precise sharing in Safety settings.*  
   - Primary: *Get started* → set `onboardingCompleted: true`, navigate to `/`.

### 2.3 Routing

- Add route `/welcome` (or `/onboarding`) **outside** `AppShell` (full-width, similar to `/emergency`), or a lightweight modal wizard — **prefer dedicated route** for deep-linking and analytics.  
- Update [`design/AURA_SCREEN_SPECS.md`](../../design/AURA_SCREEN_SPECS.md) when implemented.

### 2.4 Persistence

- Extend `Persisted` in `AuraContext` (or separate `localStorage` key) with `onboardingCompleted: boolean`.  
- Default `false` for new installs; migration: existing users with `aura:v1` already present → treat as `true` on first read so **current users are not forced through onboarding** (optional one-time “What’s new” later).

### 2.5 Accessibility

- Focus first heading on each step; primary button is default focus target after transition.  
- `aria-live="polite"` on step change if using a single-route stepper.

---

## 3. Trust & safety surfaces

### 3.1 Information hierarchy (principle)

1. **Irreversible or high-impact** (SOS send after final confirm): strongest visual weight, explicit “send” language only on final step (already largely true in `Emergency.tsx`).  
2. **Reversible on device** (end journey): keep confirm; body already clarifies restart — maintain.  
3. **Network-visible when connected** (share live location, I’m safe): add **short priming** before first use per session *or* first use ever (engineering picks one; prefer **first use ever** with local flag).

### 3.2 Share live location (`JourneyActive`)

- **Before first `Share live location`:** Optional one-step sheet (same pattern as silent SOS sheet):  
  - Title: *Share live location*  
  - Body: *When Aura is connected, this notifies your trusted contacts with your journey’s live location. You can stop sharing by ending the journey.*  
  - Actions: *Cancel* · *Share location*  
- After acknowledgment, do not show again unless user resets tips in settings (future) or `localStorage` flag cleared.

### 3.3 “I’m safe”

- Lighter touch: inline `aria-describedby` or one line under button: *Sends a check-in to Aura when connected.* (No extra sheet unless product wants parity with share.)

### 3.4 Map double-tap → silent path

- Current copy: *Double-tap the map for a silent SOS shortcut (demo gesture).*  
- **Spec:** Split into **label** + **hint**:  
  - Primary line: *Double-tap the map to open emergency options (silent path).*  
  - Secondary muted: *Demo: gesture may vary by device.*  
- Ensures users understand it opens **options**, not instant send.

### 3.5 SOS entry: bottom nav + optional FAB (`AuraSOSButton`)

**Shipped shell:** SOS is a **bottom-nav item** to `/emergency` (and Home tiles), not a floating FAB. [`design/AURA_SCREEN_SPECS.md`](../../design/AURA_SCREEN_SPECS.md) documents current chrome.

**Component:** `AuraSOSButton` remains the spec’d FAB implementation if product mounts it (e.g. fixed above content). When used:

- Keep `aria-label="Emergency SOS"`.  
- When `globalStatus === 'alert'`, optional visually distinct state + `aria-label` *Emergency SOS — alert active* for clarity.

**Product call:** Either adopt the FAB globally **or** treat bottom-nav SOS as canonical and drop FAB-only assumptions from QA checklists — see [`PDR_SCOPE_TRACE.md`](./PDR_SCOPE_TRACE.md).

### 3.6 Trusted network

- Empty state: shorten to *Contacts stay on this device until a live backend is connected.* (aligns with [AURA-28](/AURA/issues/AURA-28) optional polish.)  
- Permission presets: add one line under legend: *Alerts can include SOS and journey notifications when connected.*

---

## 4. Settings / account clarity

### 4.1 Page structure (recommended sections)

1. **Your data on this device** (new block at top)  
   - Bullets: *Journeys, contacts, map layer choices, and safety defaults are saved in this browser.* · *Clearing site data removes them.*  
   - If signed-in flow exists later, add *Account email …* here; until then omit.

2. **Safety defaults** (existing controls — group under this `h2`)  
   - Voice keyword, silent trigger, default timer, location precision — keep current controls.

3. **Privacy & sharing** (new subsection under location precision or new fieldset)  
   - One paragraph tying **approximate vs precise** to *journey and map* use cases (reuse concepts from onboarding).  
   - Link: *Learn more* → anchor to onboarding SOS/location doc section or in-app modal (v1: link to `/welcome` step C if kept addressable, or static `role="note"`).

4. **Reset Aura on this device** (destructive, but reversible by re-adding data)  
   - Button: *Clear local Aura data*  
   - Confirm dialog: *This removes contacts, active journey, settings, and onboarding status from this browser. It does not delete server history if you used a live account.*  
   - On confirm: clear `localStorage` key(s) and reload or reset context to defaults.

### 4.2 Microcopy tweaks

- Replace vague *Values persist locally; sync strategy in docs.* with *Saved in this browser. Connect Aura for sync when available.* (or link to `BETA_BACKEND.md` for internal beta only — avoid raw doc paths in production UI; use short sentence.)

### 4.3 Clear-local confirmation modal — e2e acceptance criteria & Playwright handoff ([AURA-218](/AURA/issues/AURA-218))

**Source of truth in code:** [`web/src/pages/Settings.tsx`](https://github.com/caco26i/aura-app/blob/main/web/src/pages/Settings.tsx) (`<dialog>` + `clearLocalAuraData` from [`AuraContext.tsx`](https://github.com/caco26i/aura-app/blob/main/web/src/context/AuraContext.tsx)). If product copy changes, update the implementation first, then this section.

#### Canonical strings (exact)

| Surface | String |
|--------|--------|
| Reset section `h2` | `Reset Aura on this device` |
| Reset section body | `Remove all Aura data stored in this browser. You can set everything up again afterward.` |
| Open-dialog control | `Clear local Aura data` (page `button`, not dialog) |
| Dialog accessible name (`h2#clear-dialog-title`) | `Clear local Aura data?` |
| Dialog body | `This removes contacts, active journey, settings, and onboarding status from this browser. It does not delete server history if you used a live account.` |
| Safe action | `Cancel` |
| Confirm destructive action | `Clear data` (must **not** be generic *OK* / *Yes*) |

#### Destructive confirm pattern (UX contract)

- **Two-step:** tapping the page control only opens the modal; data is cleared only after **Clear data**.
- **Safe default in tab order:** first focusable control inside the dialog is **Cancel**; **Clear data** follows (DOM order in `Settings.tsx`).
- **Dismiss without clearing:** **Cancel** or **Escape** closes the native `<dialog>` without calling `clearLocalAuraData`.
- **Telemetry:** successful clear emits `local_data_cleared` before storage removal + reload (see `AuraContext`).

#### Focus & accessibility

- Dialog uses `aria-labelledby="clear-dialog-title"`; the title is an `h2` inside the dialog (matches other Aura modal tests that key `getByRole('dialog', { name: … })` off the heading).
- After `showModal()`, expect focus to move into the dialog on a focusable control (Chromium: typically the first focusable — **Cancel**). E2e should assert **Cancel** is focused when the dialog opens unless engineering intentionally changes order.

#### Post-confirm behavior (assertable)

- `clearLocalAuraData` removes `localStorage` key `aura:v1`, then `window.location.reload()` runs.
- After reload, **`AuraContext`** immediately re-persists a **default** `aura:v1` payload (so the key is often **non-null** right after load). User-visible outcome matches first visit: **`RequireOnboarding` → `/welcome`** with `onboardingCompleted: false`.
- **E2e:** assert URL + welcome heading + parsed `aura:v1` **cold-start shape** (`onboardingCompleted === false`, empty `contacts`, etc.) — not `localStorage === null` ([AURA-220](/AURA/issues/AURA-220), `web/e2e/settings-clear-local.spec.ts`).

#### Playwright scenario outline (for `web/e2e/` — mirror [AURA-209](/AURA/issues/AURA-209) style)

Reuse the **`aura:v1` bootstrap** pattern from [`smoke.spec.ts`](https://github.com/caco26i/aura-app/blob/main/web/e2e/smoke.spec.ts) (`onboardingCompleted: true`) so `/settings` is reachable.

**Scenario A — open, copy, focus, cancel (no side effects)**

1. `page.goto('/settings')`; assert `h1` **Settings** and `h2` **Reset Aura on this device**.
2. Optional scope for the trigger: `page.locator('section[aria-labelledby="reset-heading"]').getByRole('button', { name: 'Clear local Aura data' })` (avoids coupling to unrelated copy).
3. Click trigger → `const dialog = page.getByRole('dialog', { name: 'Clear local Aura data?' });` `await expect(dialog).toBeVisible()`.
4. Assert dialog `h2` and body text match the table above (`toHaveText` / substring matchers as in `settings-beta-bff.spec.ts`).
5. `await expect(dialog.getByRole('button', { name: 'Cancel' })).toBeFocused()`.
6. Click **Cancel** → `await expect(dialog).toBeHidden()`; `expect(await page.evaluate(() => localStorage.getItem('aura:v1'))).toBeTruthy()` (or match your bootstrap payload).

**Scenario B — confirm clear (reload + onboarding)**

1. Same bootstrap + `/settings`.
2. Open dialog → click **Clear data** inside `dialog`.
3. Wait for navigation after reload (e.g. `await page.waitForURL(/\/welcome/)` or `Promise.all([page.waitForURL(...), dialog.getByRole('button', { name: 'Clear data' }).click()])` — pick a pattern consistent with other specs).
4. After reload settles, assert `localStorage.getItem('aura:v1')` parses to **cold-start** data (e.g. `onboardingCompleted === false`, `contacts` empty) — see **Post-confirm behavior** above if the key is re-populated by `AuraContext`.
5. Assert welcome entry visible (e.g. **Welcome to Aura** `h1` per [`welcome-onboarding.spec.ts`](https://github.com/caco26i/aura-app/blob/main/web/e2e/welcome-onboarding.spec.ts)).

**Selectors:** prefer **`getByRole`** (matches `smoke.spec.ts` / emergency dialog). No `data-testid` is required today; add stable test ids only if role queries become ambiguous.

**Shipped:** [`web/e2e/settings-clear-local.spec.ts`](https://github.com/caco26i/aura-app/blob/main/web/e2e/settings-clear-local.spec.ts) — [AURA-220](/AURA/issues/AURA-220).

---

## 5. Consistency pass (with [AURA-28](/AURA/issues/AURA-28))

Cross-checked [`UX_EMPTY_LOADING_SAFETY.md`](./UX_EMPTY_LOADING_SAFETY.md) and `web/src` ([AURA-232](/AURA/issues/AURA-232), Apr 2026). Prior “still open” rows below are **shipped**; this table replaces the stale backlog framing.

| Item | Status |
|------|--------|
| Map tile loading | **Shipped** — `AuraMap` overlay, `aria-busy`, status line until tiles ready |
| JourneyNew submit | **Shipped** — form `aria-busy`, inputs disabled while starting |
| Error boundary | **Shipped** — `AuraErrorBoundary` in `App.tsx` |
| Misconfiguration copy | **Shipped** — participant line in `userMessageForMisconfiguration()` |

**Deferred (optional polish, non-blocking):** Trusted empty lede vs §3.6 example wording (*stay* vs *are stored* — current copy is clear); user-visible “retry map tiles” if tile errors should surface; Home journey card microcopy noted in [`UX_EMPTY_LOADING_SAFETY.md`](./UX_EMPTY_LOADING_SAFETY.md) §2.2.

Detail inventory: [`UX_EMPTY_LOADING_SAFETY.md`](./UX_EMPTY_LOADING_SAFETY.md) — do not duplicate full tables here.

---

## 6. Engineering checklist (summary)

- [x] Onboarding route + `onboardingCompleted` + migration for existing `aura:v1` users — verified [AURA-205](/AURA/issues/AURA-205)  
- [x] Copy and layout per §2–§4  
- [x] First-time sheet for *Share live location* (local flag)  
- [x] Map double-tap copy split (§3.4)  
- [x] Settings: data explainer + clear-local flow  
- [x] Update [`design/AURA_SCREEN_SPECS.md`](../../design/AURA_SCREEN_SPECS.md) with new route(s)  
- [x] Telemetry: `onboarding_completed`, `share_location_primer_shown`, `local_data_cleared` (names illustrative)

### Automated regression ([AURA-209](/AURA/issues/AURA-209))

Playwright (Chromium, `web/` dev server): **19 passed** — `/welcome` flow, `/emergency` before onboarding, share primer + SOS + settings privacy deep link in `smoke`.

### Clear-local modal ([AURA-220](/AURA/issues/AURA-220))

Dedicated **`settings-clear-local.spec.ts`**: **2 passed** — §4.3 **Scenario A** + **B** (cancel focus, confirm clear → `/welcome`, cold-start `aura:v1` assertions).

---

## 7. Files likely touched

- `web/src/App.tsx` — route + redirect guard  
- `web/src/context/AuraContext.tsx` — persisted shape, reset helper  
- `web/src/pages/Welcome.tsx` (new) or stepped component  
- `web/src/pages/JourneyActive.tsx` — share primer, map copy  
- `web/src/pages/Settings.tsx` — sections, reset  
- `web/src/pages/Trusted.tsx` — empty state, permission hint  
- `web/src/components/AuraSOSButton.tsx` — optional alert `aria-label`  
- `design/AURA_SCREEN_SPECS.md` — routing table  

— UX Designer · [AURA-34](/AURA/issues/AURA-34) handoff
