/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GOOGLE_CLIENT_ID?: string;
  readonly VITE_AURA_TELEMETRY_ENDPOINT?: string;
  readonly VITE_AURA_TELEMETRY_DEBUG?: string;
  /** Base URL of authoritative Aura API (e.g. https://api.example.com) — no trailing slash */
  readonly VITE_AURA_API_URL?: string;
  /**
   * Bearer token for beta only; exposed in the client bundle. Replace with OAuth-backed tokens / BFF before prod.
   */
  readonly VITE_AURA_API_TOKEN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
