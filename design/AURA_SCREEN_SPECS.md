# Aura screen specs (routing)

| Route | Purpose |
|-------|---------|
| `/welcome` | First-run onboarding (planned — see [`web/docs/UX_ONBOARDING_TRUST_SETTINGS.md`](../web/docs/UX_ONBOARDING_TRUST_SETTINGS.md)); outside shell |
| `/` | Home hub |
| `/journey/new` | Configure journey |
| `/journey/active` | Live tracking, map, backend actions |
| `/emergency` | Full-screen SOS (outside shell) |
| `/map` | Intel layers + map |
| `/trusted` | Trusted network CRUD |
| `/settings` | Safety settings |

Global SOS FAB: fixed; hidden on `/emergency`. Bottom navigation in `AppShell`.

**Onboarding:** Until `/welcome` ships, cold start goes straight to Home. Spec sets `onboardingCompleted` in persisted state and recommends skipping the flow for existing `aura:v1` users on migration.
