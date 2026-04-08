import type { Plugin } from 'vite'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { productionCspMeta } from './vite-plugin-production-csp'

const apiTarget = process.env.VITE_AURA_DEV_API_PROXY ?? 'http://127.0.0.1:8787'
const telemetryProxyTarget = process.env.VITE_AURA_DEV_TELEMETRY_PROXY?.trim()

/**
 * Dev server: accept POST /ingest/aura (204) so same-origin
 * `VITE_AURA_TELEMETRY_ENDPOINT=/ingest/aura` works without a real collector.
 * When VITE_AURA_DEV_TELEMETRY_PROXY is set, the proxy table handles /ingest/aura instead.
 */
function auraTelemetryDevIngestStub(): Plugin {
  return {
    name: 'aura-telemetry-dev-ingest-stub',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (telemetryProxyTarget) {
          next()
          return
        }
        const pathOnly = req.url?.split('?')[0] ?? ''
        if (pathOnly !== '/ingest/aura' || req.method !== 'POST') {
          next()
          return
        }
        req.on('data', () => {})
        req.on('end', () => {
          res.statusCode = 204
          res.end()
        })
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), productionCspMeta(), auraTelemetryDevIngestStub()],
  server: {
    proxy: {
      '/v1': { target: apiTarget, changeOrigin: true },
      '/health': { target: apiTarget, changeOrigin: true },
      '/ready': { target: apiTarget, changeOrigin: true },
      ...(telemetryProxyTarget
        ? {
            '/ingest/aura': { target: telemetryProxyTarget, changeOrigin: true },
          }
        : {}),
    },
  },
})
