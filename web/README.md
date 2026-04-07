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

All operational and handoff docs for the web app are in **[`web/docs/`](./docs/)** (`AUTH`, `DEPLOY`, `SECURITY`, `OBSERVABILITY`, `BETA_BACKEND`). The repo overview and screenshot checklist are in **[`../README.md`](../README.md)**.

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Vite dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run lint` | ESLint |
