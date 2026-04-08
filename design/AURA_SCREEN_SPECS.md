# Aura screen specs (routing)

| Route | Purpose |
|-------|---------|
| `/welcome` | First-run onboarding (see [`web/docs/UX_ONBOARDING_TRUST_SETTINGS.md`](../web/docs/UX_ONBOARDING_TRUST_SETTINGS.md) §2); outside shell |
| `/` | Home hub |
| `/journey/new` | Configure journey |
| `/journey/active` | Live tracking, map, backend actions; first **Share live location** uses a one-time primer sheet (`shareLocationPrimerAcknowledged` in `aura:v1`); map hint copy splits primary vs demo note (see UX spec §3.4) |
| `/emergency` | Full-screen SOS (outside shell) |
| `/map` | Intel layers + map |
| `/trusted` | Trusted network CRUD |
| `/settings` | Safety settings |

Global SOS FAB: fixed; hidden on `/emergency`. Bottom navigation in `AppShell`.

**Onboarding:** Cold start redirects to `/welcome` when `onboardingCompleted` is false in `aura:v1`. Existing payloads without that field are treated as already completed (migration). `/emergency` stays reachable without finishing onboarding.
