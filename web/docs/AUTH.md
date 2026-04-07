# Authentication (dev)

Optional Google sign-in uses `@react-oauth/google`.

1. Create an OAuth client in Google Cloud Console (Web application).
2. Set `VITE_GOOGLE_CLIENT_ID` in `web/.env.local`.
3. `npm run dev` — `main.tsx` wraps the app in `GoogleOAuthProvider` when the variable is present.

Without `VITE_GOOGLE_CLIENT_ID`, the app runs in **dev stub** mode (no provider). Wire your login UI where product requires it; Beta persistence does not depend on Google.
