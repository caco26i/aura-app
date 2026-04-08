# Aura — web client

React (Vite + TypeScript) SPA for the Aura safety companion: journey tracking, maps, trusted contacts, settings, and emergency flows. The UI aims for a **calm, mobile-first** experience; tokens, components, and copy tone are documented under [`../design/`](../design/).

**Repo visitors:** start at the root [`README.md`](../README.md) for stack overview, screenshot checklist, and maintainer publish notes. This file focuses on **running and shipping** the `web/` package.

**Package manager:** use **npm** with the committed [`package-lock.json`](./package-lock.json). GitHub Actions (`.github/workflows/web-ci.yml`) runs `npm ci` in `web/`. Do not commit `pnpm-lock.yaml` or `yarn.lock` here — they are gitignored to avoid accidental drift from the npm lockfile.

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

- **Google sign-in:** set `VITE_GOOGLE_CLIENT_ID` in `.env.local` when you have a client ID ([`docs/AUTH.md`](./docs/AUTH.md)).
- **Real beta API:** run [`../server/`](../server/), set `VITE_AURA_API_TOKEN` to match `AURA_API_BEARER_TOKEN`, and leave `VITE_AURA_API_URL` unset so Vite proxies `/v1` — see [`docs/BETA_BACKEND.md`](./docs/BETA_BACKEND.md).

## Docs (this package)

**Setup and operations:** all handoff docs for the web app live under **[`./docs/`](./docs/)** (repo path **`web/docs/`**): [`AUTH.md`](./docs/AUTH.md), [`BETA_BACKEND.md`](./docs/BETA_BACKEND.md), [`DEPLOY.md`](./docs/DEPLOY.md), [`SECURITY.md`](./docs/SECURITY.md), [`OBSERVABILITY.md`](./docs/OBSERVABILITY.md), [`UX_EMPTY_LOADING_SAFETY.md`](./docs/UX_EMPTY_LOADING_SAFETY.md) (empty states, loading, safety microcopy), [`UX_ONBOARDING_TRUST_SETTINGS.md`](./docs/UX_ONBOARDING_TRUST_SETTINGS.md) (onboarding, trust surfaces, settings clarity). The repo overview and screenshot checklist are in **[`../README.md`](../README.md)**; API env and routes are in **[`../server/README.md`](../server/README.md)**.

**React performance (agents):** the root repo includes Vercel’s **`vercel-react-best-practices`** skill under **[`../.agents/skills/vercel-react-best-practices/`](../.agents/skills/vercel-react-best-practices/)**. Use it when implementing or reviewing UI in `web/` (rendering, fetching, bundle size). Install/sync from the repo root with `npx skills add vercel-labs/agent-skills --skill vercel-react-best-practices -y` — see **[`../README.md`](../README.md)** *Agent skills*.

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Vite dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run lint` | ESLint |
| `npm run test` | Vitest (unit tests) |
| `npm run capture:readme-screens` | Opt-in Playwright pass for root README screenshots (`e2e/readme-screenshots.spec.ts`) |
| `npm run test:e2e` | Playwright (default dev server; skips BFF-stub-only spec) |
| `npm run test:e2e:bff-stub` | Playwright with `VITE_AURA_BFF_URL=/aura-bff` and a dead BFF proxy port — asserts **Settings → Beta API session** shows calm copy when `GET /session` cannot reach a BFF (see `e2e/settings-beta-bff.spec.ts`). |

On GitHub, the **Web lint & build** workflow runs `npm ci`, `npm run lint`, and `npm run build` in `web/` when `web/**` or that workflow file changes.

## Docker (static SPA)

Production image: [`Dockerfile`](./Dockerfile) (Vite `dist/` + nginx, SPA fallback). For **web + API** together, use the repo root [`docker-compose.yml`](../docker-compose.yml) and [`docs/DEPLOY.md`](./docs/DEPLOY.md) (build-time `VITE_*`, token rotation, telemetry caveats).

```bash
# from repo root
cp .env.example .env
# Edit .env — set AURA_API_BEARER_TOKEN for the default static-bearer stack (see .env.example)
docker compose build aura-web
docker compose up
```
