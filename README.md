# Aura

**A calm, real-time safety companion for the web** — route-aware check-ins, trusted contacts, and emergency paths designed to stay reachable in one or two taps when stress is high.

> *You are never alone.*

Aura pairs a mobile-first React client with an optional Node API that validates SOS, location share, and “I’m safe” events behind bearer auth, rate limits, and an append-only audit trail. The experience follows the product and UX spec in [`design/`](./design/) (lavender gradient, soft neutrals, non-alarmist copy).

---

## What you can explore today

These flows match the implementation-ready scope from the Aura design package (home through settings):

| Area | What it covers |
|------|----------------|
| **Home** | Safety status hub, journey entry, quick actions, global SOS access |
| **Journey** | Configure a trip, live map tracking, share location, “I’m safe” |
| **Emergency (SOS)** | Visible and silent-style alert paths with calm, accessible messaging |
| **Map & safety intel** | Map layers and safer-route thinking (UI + placeholders as documented) |
| **Trusted network** | Contacts, permissions, grouping |
| **Settings** | Safety defaults, privacy-oriented controls |

Routing reference: [`design/AURA_SCREEN_SPECS.md`](./design/AURA_SCREEN_SPECS.md).

---

## Screenshots (placeholders for the public repo)

Replace these with real captures before or right after open-sourcing:

1. **Home / safety dashboard** — `<!-- TODO: docs/assets/screenshot-home.png -->`
2. **Live journey** — `<!-- TODO: docs/assets/screenshot-journey.png -->`
3. **Emergency** — `<!-- TODO: docs/assets/screenshot-sos.png -->`

Suggested layout: add a `docs/assets/` folder and reference images from this section with standard Markdown `![…](docs/assets/…)` once files exist.

---

## Repository layout

| Path | Role |
|------|------|
| [`web/`](./web/) | Vite + React + TypeScript SPA (maps, OAuth hook, app shell) |
| [`server/`](./server/) | Aura API — validated POST routes, audit log, rate limits |
| [`web/docs/`](./web/docs/) | Auth, deploy, security, observability, beta backend notes |
| [`design/`](./design/) | Design system, screen specs, launch UX copy guidance |

---

## Quick start (local)

### 1. API (optional, for real SOS / journey wiring)

```bash
cd server
npm install
export AURA_API_BEARER_TOKEN="$(openssl rand -hex 24)"
npm run dev
```

Default listen: port **8787**. See [`server/README.md`](./server/README.md) for routes and environment variables.

### 2. Web app

```bash
cd web
npm install
cp .env.example .env.local
# Edit .env.local — set VITE_AURA_API_TOKEN to match AURA_API_BEARER_TOKEN when using the local API
npm run dev
```

With a token set and **without** `VITE_AURA_API_URL`, the Vite dev server proxies `/v1` and `/health` to the local API. Details: [`web/docs/BETA_BACKEND.md`](./web/docs/BETA_BACKEND.md).

### Setup pointers (`web/docs/`)

After the commands above, use the **web package’s** [`web/docs/`](./web/docs/) folder as the canonical place for deeper setup and operations:

| Doc | Use when |
|-----|----------|
| [`web/docs/AUTH.md`](./web/docs/AUTH.md) | Google sign-in and stub auth |
| [`web/docs/BETA_BACKEND.md`](./web/docs/BETA_BACKEND.md) | Client ↔ API wiring, proxies, tokens |
| [`web/docs/DEPLOY.md`](./web/docs/DEPLOY.md) | Staging / production deploy |
| [`web/docs/SECURITY.md`](./web/docs/SECURITY.md) | Threat model and safety notes |
| [`web/docs/OBSERVABILITY.md`](./web/docs/OBSERVABILITY.md) | Logs and telemetry |

The **server** package documents API env vars and routes in [`server/README.md`](./server/README.md) (pair it with `BETA_BACKEND` when wiring the web app to a real backend).

---

## Documentation index

| Document | Topic |
|----------|--------|
| [`web/docs/AUTH.md`](./web/docs/AUTH.md) | Google sign-in and stub mode |
| [`web/docs/BETA_BACKEND.md`](./web/docs/BETA_BACKEND.md) | Client ↔ API wiring, journey ownership, swap path |
| [`web/docs/DEPLOY.md`](./web/docs/DEPLOY.md) | Staging / production deployment notes |
| [`web/docs/SECURITY.md`](./web/docs/SECURITY.md) | Threat model and client/API safety notes |
| [`web/docs/OBSERVABILITY.md`](./web/docs/OBSERVABILITY.md) | Telemetry and structured logs |
| [`server/README.md`](./server/README.md) | API routes, env table, local run |
| [`design/AURA_DESIGN_SYSTEM.md`](./design/AURA_DESIGN_SYSTEM.md) | Tokens, type, components |
| [`design/AURA_SCREEN_SPECS.md`](./design/AURA_SCREEN_SPECS.md) | Routes and shell behavior |
| [`design/AURA_LAUNCH_UX.md`](./design/AURA_LAUNCH_UX.md) | Error and SOS-adjacent copy rules |

---

## Publishing to GitHub (maintainers)

Use this checklist when the canonical remote is empty or you are wiring **write** access for the first time. It mirrors the board-facing thread for **AURA-20** (*publish Aura to the project GitHub*).

### Before you push

1. **Repo access** — confirm you can push to `https://github.com/Chrisdugamo/aura-app` (org/repo permissions or fork + PR if that is the agreed model).
2. **Local tree** — on `main`, clean working tree, `npm ci` + `npm run build` under `web/` (and any release checks you use) passing.
3. **Tip alignment** — if your checkout predates recent README/docs-only commits, merge or cherry-pick so this file includes this section before advertising the repo.

### First push (empty remote)

From the repo root, on `main`:

```bash
git remote -v
git push -u origin main
```

If the remote has no `main` yet, that command creates it. If you use SSH, ensure `origin` uses the SSH URL and your key is loaded.

### Credentials (pick one)

| Approach | When to use |
|----------|-------------|
| **HTTPS + PAT** | Quick setup on a laptop; use a fine-scoped token with `contents:write` (and `workflow` if you add Actions later). Prefer a credential helper so the token is not pasted into shell history. |
| **SSH deploy key** | Servers and managed workspaces (e.g. Paperclip); add a **write** deploy key on the GitHub repo settings. |
| **SSH user key** | Day-to-day dev machines already using `git@github.com:...`. |

Managed automation without interactive login must use **non-interactive** auth (deploy key, machine user PAT in a secret store, or provider-specific integration)—not a one-off browser login on the agent host.

### After push

1. Confirm **GitHub** shows `main` and the expected commit (README + `web/` + `server/` as intended).
2. Close or hand off **AURA-20** on the board per CTO agreement (verify remote tip vs local release criteria).

---

## Resumen (ES)

**Aura** es una aplicación web centrada en la seguridad personal: seguimiento de rutas, red de confianza y SOS accesible en pocos toques, con un tono calmado y una interfaz alineada al sistema de diseño del proyecto. El repositorio incluye el cliente en `web/`, la API opcional en `server/` y la documentación operativa en `web/docs/`. Para arrancar en local, sigue la sección *Quick start* arriba.

---

*English is the primary language for v1 repo copy; extend with full Spanish docs when product leadership confirms bilingual priorities.*
