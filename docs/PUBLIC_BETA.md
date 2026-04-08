# Public beta — runbook for testers and integrators

This page is the **short path** for anyone joining the Aura **public beta** from GitHub: install, environment variables, and the main product flows. Deeper operations (deploy, threat model, telemetry wiring) stay in [`web/docs/`](../web/docs/).

**Prerequisites:** [Node.js 20+](https://nodejs.org/) (required for `server/`; use the same for `web/` to avoid surprises). Git and npm.

---

## 1. Run the web app (typical beta path)

The SPA works **without** the Node API: journey and SOS paths use **local mocks** until you set a bearer token (see below).

```bash
git clone https://github.com/caco26i/aura-app.git
cd aura-app/web
npm install
cp .env.example .env.local
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

### Environment variables (web)

Copy [`web/.env.example`](../web/.env.example) to `web/.env.local`. Common keys:

| Variable | Required for beta? | Purpose |
| -------- | ------------------ | ------- |
| `VITE_GOOGLE_CLIENT_ID` | No | Google sign-in; omit for **stub** auth (fine for local exploration). |
| `VITE_AURA_API_TOKEN` | No | Enables **real** HTTP to the Aura API instead of mocks. |
| `VITE_AURA_API_URL` | No | **Unset locally** so Vite proxies `/v1` and `/health` to the dev API. Set in staging/prod to your public API origin (see [`web/docs/DEPLOY.md`](../web/docs/DEPLOY.md)). |
| `VITE_AURA_DEV_API_PROXY` | No | Overrides proxy target (default `http://127.0.0.1:8787`). Not exposed to the client bundle. |
| `VITE_AURA_TELEMETRY_ENDPOINT` | No | POST target for structured client telemetry (staging/production). |
| `VITE_AURA_TELEMETRY_DEBUG` | No | Set to `1` or `true` for console metrics helper (see observability below). |

There is **no** single env var named `BETA_BACKEND`. **“Beta backend”** in issues and PRDs refers to the **optional** API integration documented in [`web/docs/BETA_BACKEND.md`](../web/docs/BETA_BACKEND.md) (journey ownership, proxy, token alignment).

---

## 2. Optional: run the API locally

Use this when you want **validated** SOS, location share, and “I’m safe” events against the real contract.

```bash
cd aura-app/server
npm install
export AURA_API_BEARER_TOKEN="$(openssl rand -hex 24)"
npm run dev
```

Default port **8787**. In `web/.env.local`, set `VITE_AURA_API_TOKEN` to the **same** value as `AURA_API_BEARER_TOKEN`, and leave `VITE_AURA_API_URL` empty so the Vite dev server proxies API routes.

Route and env reference: [`server/README.md`](../server/README.md).

---

## 3. Common flows (what to click through)

Aligned with [`design/AURA_SCREEN_SPECS.md`](../design/AURA_SCREEN_SPECS.md) and the root [`README.md`](../README.md):

1. **Welcome** — short onboarding; stub or Google auth.
2. **Home** — safety hub, quick actions, global SOS entry.
3. **Journey** — create a journey (**with the beta API**, the client must `POST /v1/journeys` before share / I’m safe for that id — see BETA_BACKEND doc), live map, share location, **I’m safe**.
4. **Emergency (SOS)** — calm confirmation; visible vs silent-style paths as implemented.
5. **Trusted network & settings** — contacts and safety defaults.

If API calls fail, user-facing copy is framed as **session/sync** issues where possible; technical codes are for logs and telemetry.

---

## 4. Observability (hooks you should know about)

The web client emits **structured JSON** lines prefixed with `[aura.telemetry]` (categories include `auth`, `backend`, `journey`, `sos`, `map`). Successful API responses may carry an `X-Aura-Anomaly` header surfaced in telemetry for ops (not shown as user-facing errors).

**Full detail:** [`web/docs/OBSERVABILITY.md`](../web/docs/OBSERVABILITY.md) (staging `VITE_AURA_TELEMETRY_ENDPOINT`, `VITE_AURA_TELEMETRY_DEBUG`, PII cautions).

---

## 5. External narrative (marketing copy)

**CEO-approved** public positioning, hero, pillars, and primary CTA are in [`docs/launch-narrative.md`](./launch-narrative.md). Use that file as the source of truth for external sites and announcements; the approval thread is [AURA-64](/AURA/issues/AURA-64). If the one-pager is revised later, keep public-facing copy aligned with the updated file.

**Release-ready drafts** (changelog bullets, three landing hero variants, three social posts) live in [`docs/public-beta-announcement-kit.md`](./public-beta-announcement-kit.md) ([AURA-71](/AURA/issues/AURA-71)); paste from there for timing-specific launches while keeping narrative alignment with `launch-narrative.md`.

---

## 6. More reading

| Doc | Use when |
| --- | -------- |
| [`web/docs/BETA_BACKEND.md`](../web/docs/BETA_BACKEND.md) | Client ↔ API contract, journey-before-share rules, swap path |
| [`web/docs/AUTH.md`](../web/docs/AUTH.md) | Google vs stub auth |
| [`web/docs/DEPLOY.md`](../web/docs/DEPLOY.md) | Hosting the SPA and API |
| [`web/docs/SECURITY.md`](../web/docs/SECURITY.md) | Threat model and client/API notes |
| [`web/README.md`](../web/README.md) | Web package overview |
