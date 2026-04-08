# Aura design tokens (summary)

Canonical tokens live in `web/src/theme.css` (CSS variables). This file tracks **intent** for collaborators and aligns with [`AURA_PDR.md`](./AURA_PDR.md) **§5** (visual consistency & accessibility expectations).

---

## Token inventory (`theme.css`)

| Variable | Role |
|----------|------|
| `--aura-canvas` | Default page background (lavender family) |
| `--aura-lavender-wash` | Radial wash / secondary background |
| `--aura-blush` | Primary accent; SOS idle emphasis |
| `--aura-text` | Primary text |
| `--aura-muted` | Secondary text |
| `--aura-card` | Glass / card surface |
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

## PDR §3–5 alignment

| PDR | Design-system note |
|-----|---------------------|
| §3.1 “calm default state” | Canvas + lavender wash + blush accent |
| §5 Accessibility | Critical paths use `role="alert"` / `role="status"` per [`AURA_LAUNCH_UX.md`](./AURA_LAUNCH_UX.md) and [`web/docs/UX_EMPTY_LOADING_SAFETY.md`](../web/docs/UX_EMPTY_LOADING_SAFETY.md) |
| §5 Visual consistency | New surfaces should pull from this token set before introducing ad hoc hex values |

Route-level layout: [`AURA_SCREEN_SPECS.md`](./AURA_SCREEN_SPECS.md).
