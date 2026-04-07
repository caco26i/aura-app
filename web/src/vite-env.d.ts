/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GOOGLE_CLIENT_ID?: string;
  readonly VITE_AURA_TELEMETRY_ENDPOINT?: string;
  readonly VITE_AURA_TELEMETRY_DEBUG?: string;
  /** API origin (e.g. https://api.example.com). Omit or leave empty for same-origin (dev proxy). */
  readonly VITE_AURA_API_URL?: string;
  /**
   * Bearer token for beta only; exposed in the client bundle. Replace with OAuth-backed tokens / BFF before prod.
   */
  readonly VITE_AURA_API_TOKEN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
