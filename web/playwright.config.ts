import { defineConfig, devices } from '@playwright/test';

const bffStubMode = process.env.PLAYWRIGHT_BFF_STUB === '1';

export default defineConfig({
  testDir: './e2e',
  ...(bffStubMode
    ? { testMatch: '**/settings-beta-bff.spec.ts' }
    : { testIgnore: '**/settings-beta-bff.spec.ts' }),
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:5173',
    trace: 'on-first-retry',
  },
  webServer: bffStubMode
    ? {
        command: 'npm run dev -- --host 127.0.0.1 --port 5173',
        url: 'http://127.0.0.1:5173',
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        env: {
          ...process.env,
          VITE_AURA_BFF_URL: '/aura-bff',
          /** Closed port: Vite proxies `/aura-bff` here so `GET /session` fails predictably (no BFF process). */
          VITE_AURA_DEV_BFF_PROXY: 'http://127.0.0.1:9',
          /** Deterministic UI: show setup copy instead of inheriting a real client id from the runner environment. */
          VITE_GOOGLE_CLIENT_ID: '',
        },
      }
    : {
        command: 'npm run dev -- --host 127.0.0.1 --port 5173',
        url: 'http://127.0.0.1:5173',
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
