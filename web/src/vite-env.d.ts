/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GOOGLE_CLIENT_ID?: string;
  /** Same-origin path (e.g. `/aura-bff`) or full BFF base URL — no trailing slash. */
  readonly VITE_AURA_BFF_URL?: string;
  readonly VITE_AURA_TELEMETRY_ENDPOINT?: string;
  readonly VITE_AURA_TELEMETRY_DEBUG?: string;
  /** API origin (e.g. https://api.example.com). Omit or leave empty for same-origin (dev proxy). */
  readonly VITE_AURA_API_URL?: string;
  /**
   * Bearer token for beta only; exposed in the client bundle. Replace with OAuth-backed tokens / BFF before prod.
   */
  readonly VITE_AURA_API_TOKEN?: string;
  /** Firebase Web SDK (email/password auth → BFF `/auth/firebase`). */
  readonly VITE_FIREBASE_API_KEY?: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN?: string;
  readonly VITE_FIREBASE_PROJECT_ID?: string;
  readonly VITE_FIREBASE_APP_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
