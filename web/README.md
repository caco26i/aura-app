# Aura — web client

React (Vite + TypeScript) SPA for the Aura safety companion: journey tracking, maps, trusted contacts, settings, and emergency flows. Visual and UX rules live under [`../design/`](../design/).

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

- **Google sign-in:** set `VITE_GOOGLE_CLIENT_ID` in `.env.local` when you have a client ID ([`docs/AUTH.md`](./docs/AUTH.md)).
- **Real beta API:** run [`../server/`](../server/), set `VITE_AURA_API_TOKEN` to match `AURA_API_BEARER_TOKEN`, and leave `VITE_AURA_API_URL` unset so Vite proxies `/v1` — see [`docs/BETA_BACKEND.md`](./docs/BETA_BACKEND.md).

## Docs (this package)

**Setup and operations:** all handoff docs for the web app live under **[`./docs/`](./docs/)** (repo path **`web/docs/`**): [`AUTH.md`](./docs/AUTH.md), [`BETA_BACKEND.md`](./docs/BETA_BACKEND.md), [`DEPLOY.md`](./docs/DEPLOY.md), [`SECURITY.md`](./docs/SECURITY.md), [`OBSERVABILITY.md`](./docs/OBSERVABILITY.md). The repo overview and screenshot checklist are in **[`../README.md`](../README.md)**; API env and routes are in **[`../server/README.md`](../server/README.md)**.

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Vite dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run lint` | ESLint |
