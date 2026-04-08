# Aura web — onboarding, trust surfaces, and settings clarity (UX spec)

**Ticket:** [AURA-34](/AURA/issues/AURA-34) (Paperclip / Aura App) · **Scope:** implementation-ready UX for CTO · **Out of scope:** new backend contracts, OAuth redesign, map provider swap.

**Depends on context:** [AURA-28](/AURA/issues/AURA-28) handoff in [`UX_EMPTY_LOADING_SAFETY.md`](./UX_EMPTY_LOADING_SAFETY.md); safety copy baseline in [`../../design/AURA_LAUNCH_UX.md`](../../design/AURA_LAUNCH_UX.md); SOS confirmation behavior aligned with [AURA-31](/AURA/issues/AURA-31) thread (explicit confirm before send). PDR §3–4 traceability: [`PDR_SCOPE_TRACE.md`](./PDR_SCOPE_TRACE.md).

**Tone:** Calm, plain language, no alarmism. Pair every sensitive action with *what happens*, *who may see data*, and *how to undo or pause* where applicable.

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

---

## 5. Consistency pass (with [AURA-28](/AURA/issues/AURA-28))

Track remaining items from [`UX_EMPTY_LOADING_SAFETY.md`](./UX_EMPTY_LOADING_SAFETY.md) that are still open:

| Item | Action |
|------|--------|
| Map tile loading | Overlay / `aria-busy` until tiles ready |
| JourneyNew submit | `aria-busy` + disable inputs while starting |
| Error boundary | Calm fallback + reload |
| Misconfiguration copy | Participant-safe line if string surfaces in prod |

Do not duplicate full tables here; implement alongside onboarding/trust work where touching the same files.

---

## 6. Engineering checklist (summary)

- [ ] Onboarding route + `onboardingCompleted` + migration for existing `aura:v1` users  
- [ ] Copy and layout per §2–§4  
- [ ] First-time sheet for *Share live location* (local flag)  
- [ ] Map double-tap copy split (§3.4)  
- [ ] Settings: data explainer + clear-local flow  
- [ ] Update [`design/AURA_SCREEN_SPECS.md`](../../design/AURA_SCREEN_SPECS.md) with new route(s)  
- [ ] Telemetry: `onboarding_completed`, `share_location_primer_shown`, `local_data_cleared` (names illustrative)

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
