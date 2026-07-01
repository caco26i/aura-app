# Aura design tokens (summary)

Canonical tokens live in `web/src/theme.css` (CSS variables). **M3 shell / Home hub** tokens live in `web/src/styles/aura-m3.css` (imported by the app shell). This file tracks **intent** for collaborators and aligns with [`AURA_PDR.md`](./AURA_PDR.md) **§5** (visual consistency & accessibility expectations).

---

## Base token inventory (`theme.css`)

| Variable | Role |
|----------|------|
| `--aura-canvas` | Default page background (lavender family) |
| `--aura-lavender-wash` | Radial wash / secondary background |
| `--aura-blush` | Primary accent; SOS idle emphasis |
| `--aura-text` | Primary text |
| `--aura-muted` | Secondary text |
| `--aura-card` | Glass / card surface |
| `--aura-surface-soft` | Semi-transparent live-region / status panels (modo shells) |
| `--aura-surface-muted` | Lighter placeholder surfaces (wireframe thumbs) |
| `--aura-surface-faint` | Subtle inset panels (notify blocks) |
| `--aura-on-primary` | Text/icons on `--Pbg` / primary gradient |
| `--aura-border` | Hairline borders |
| `--aura-shadow` | Elevated cards |
| `--aura-radius-lg` | Large card radius (~20px) |
| `--aura-radius-md` | Medium radius |
| `--aura-status-ok` | Success / safe |
| `--aura-status-warn` | Caution |
| `--aura-status-alert` | Alert / danger emphasis |
| `--aura-safe-area-bottom` | `env(safe-area-inset-bottom)` for mobile |

**Motion:** `prefers-reduced-motion: reduce` collapses animations/transitions (accessibility).

**Typography:** `system-ui` stack on `body` in `theme.css`; display accents on marketing/home may use app-specific font variables (e.g. `var(--fd)` in components).

---

## M3 shell tokens (`aura-m3.css`)

Used by **Home**, **Modo Cita / Transporte / Check-in IA**, and shared M3 components (`.m3-tbar`, `.btn-p`, `.feat-grid`, etc.). Prefer these over ad hoc hex in shell surfaces.

| Variable | Role |
|----------|------|
| `--fd` / `--fb` | Display (Cormorant Garamond) / body (DM Sans) stacks |
| `--k1` / `--k2` / `--k3` | Primary / secondary / tertiary ink on hub & modo pages |
| `--P`, `--Pc`, `--Pk`, `--Pbg` | Primary brand gradient family (profile orb, primary buttons) |
| `--S`, `--Sc`, `--Sk` / `--T`, `--Tc`, `--Tk` | Secondary / tertiary mode accent families (badges, tiles) |
| `--safe`, `--safe-c`, `--safe-br` | Safe-state chips (hub) |
| `--warn`, `--warn-c`, `--warn-br` | Caution chips |
| `--danger`, `--dgr-c`, `--dgr-br` | Danger / SOS tile emphasis |
| `--bg`, `--s1`–`--s3` | Layered lavender backgrounds |
| `--bd`, `--bd2` | M3 hairlines (parallel to `--aura-border`) |
| `--r1`–`--r5` | Radius scale (6px → pill) |

**Relationship:** Journey / Map / Trusted / Settings lean on **`--aura-*`** from `theme.css`. Primary bottom-nav modo routes + Home hub compose **`--aura-*`** (global body gradient) with **`--k*`** / **`--Pbg`** (local M3 chrome). New modo surfaces should reuse M3 tokens before introducing new hex.

---

## Intentional exceptions (shipped)

| Surface | Exception | Rationale |
|---------|-----------|-----------|
| **`Emergency.tsx`** | Dark violet gradient shell (`#2a1530` → `#1a0d22`), light-on-dark buttons | Full-screen SOS distinct from calm hub; not mapped to `--aura-canvas` |
| **Action sheets / secondary buttons** | Inline `#fff` card backgrounds on journey flows | Local elevation contrast; acceptable until tokenized `--aura-card`-on-gradient pattern exists |
| **`Settings.tsx` destructive control** | `#b42318` fill | Matches `--aura-status-alert` family; inline for button specificity |
| **`JourneyNew.tsx` primary CTA** | Gradient `#c9b8ff` → `#f4b8c5` | Uses blush/lavender family aligned to `--aura-blush` / `--Pbg` intent |

No eng change required for launch; document-only unless consolidating to CSS variables later.

---

## PDR §3–5 alignment

| PDR | Design-system note |
|-----|---------------------|
| §3.1 “calm default state” | Canvas + lavender wash + blush accent |
| §5 Accessibility | Critical paths use `role="alert"` / `role="status"` per [`AURA_LAUNCH_UX.md`](./AURA_LAUNCH_UX.md) and [`web/docs/UX_EMPTY_LOADING_SAFETY.md`](../web/docs/UX_EMPTY_LOADING_SAFETY.md) |
| §5 Visual consistency | New surfaces should pull from this token set before introducing ad hoc hex values |

Route-level layout: [`AURA_SCREEN_SPECS.md`](./AURA_SCREEN_SPECS.md).
