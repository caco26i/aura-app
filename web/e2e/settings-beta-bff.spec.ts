/**
 * BFF session e2e (`PLAYWRIGHT_BFF_STUB=1` only — excluded from default `npm run test:e2e`; runs in web-ci via `npm run test:e2e:bff-stub`).
 *
 * Partial coverage of [DEPLOY.md](../docs/DEPLOY.md) *Staging smoke: BFF JWT path*:
 * - Checklist item 5 (mocked): credentialed `GET /session` → **200** with access token; Settings shows calm copy, no error status.
 * - Checklist item 5 (mocked): `/journey/new` → **Start live tracking** issues authenticated `POST /v1/journeys` with the
 *   session token and lands on `/journey/active` without auth failure copy.
 * - Checklist item 5 (mocked): on `/journey/active`, **I'm safe** issues authenticated `POST /v1/journeys/:id/im-safe`
 *   with the session token and completes without auth/ownership failure copy.
 * - Checklist item 4 (gap): Google **Continue with Google** OAuth is **not** exercised in CI — requires a real
 *   `VITE_GOOGLE_CLIENT_ID` and Google; use staging manual smoke or local dev with BFF + OAuth client.
 */
import { expect, test } from '@playwright/test';

/** Same bootstrap as smoke so `RequireOnboarding` allows `/settings`. */
const AURA_STORAGE_BOOTSTRAP = JSON.stringify({
  contacts: [],
  activeJourney: null,
  mapLayers: { risk: true, safePoints: true, activity: false },
  settings: {
    displayName: 'BFF stub',
    voiceKeyword: 'Aura help',
    silentTriggerMs: 800,
    timerDefaultMinutes: 15,
    locationPrecision: 'approximate',
  },
  globalStatus: 'calm',
  onboardingCompleted: true,
  shareLocationPrimerAcknowledged: false,
  encuentroDraft: {
    contactName: '',
    place: '',
    safetyKeyword: '',
    meetingLocalValue: '',
    checkInIntervalMinutes: 15,
    encuentroLastLocalCheckInAckMs: null,
    encuentroBrowserNotifyWanted: false,
  },
});

test.describe('settings beta BFF (stub path, unreachable proxy)', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript((payload) => {
      if (window.localStorage.getItem('aura:v1')) return;
      window.localStorage.setItem('aura:v1', payload);
    }, AURA_STORAGE_BOOTSTRAP);
  });

  test('Beta API session section, status copy, no page errors when BFF session fetch fails', async ({
    page,
  }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await page.goto('/settings');
    await expect(page.getByRole('heading', { name: 'Settings', level: 1 })).toBeVisible();

    const betaApiSection = page.locator('section[aria-labelledby="bff-api-heading"]');
    await expect(betaApiSection.getByRole('heading', { name: 'Beta API session', level: 2 })).toBeVisible();
    await expect(
      betaApiSection.getByText(/This build talks to the live Aura API through a short-lived token/i),
    ).toBeVisible();

    await expect(betaApiSection.getByRole('status')).toContainText(
      'Could not reach the sign-in service. Check that the BFF is running and CORS allows this origin.',
    );

    await expect(
      betaApiSection.getByText(/for the button flow, or complete Google OAuth via your BFF redirect URL/i),
    ).toBeVisible();

    expect(pageErrors, `pageerror: ${pageErrors.join('; ')}`).toEqual([]);
  });
});

test.describe('settings beta BFF (stub path, mocked session success)', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript((payload) => {
      if (window.localStorage.getItem('aura:v1')) return;
      window.localStorage.setItem('aura:v1', payload);
    }, AURA_STORAGE_BOOTSTRAP);
  });

  test('Beta API session calm copy when GET /session returns a token (no OAuth)', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    const expiresAt = new Date(Date.now() + 3_600_000).toISOString();
    const expSec = Math.floor(Date.now() / 1000) + 3600;
    const payload = Buffer.from(JSON.stringify({ sub: 'e2e-bff-session', exp: expSec })).toString(
      'base64url',
    );
    const accessToken = `e2e.${payload}.stub`;

    await page.route('**/aura-bff/session', async (route) => {
      if (route.request().method() !== 'GET') {
        await route.continue();
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, accessToken, expiresAt }),
      });
    });

    await page.goto('/settings');
    await expect(page.getByRole('heading', { name: 'Settings', level: 1 })).toBeVisible();

    const betaApiSection = page.locator('section[aria-labelledby="bff-api-heading"]');
    await expect(betaApiSection.getByRole('heading', { name: 'Beta API session', level: 2 })).toBeVisible();
    await expect(
      betaApiSection.getByText(/This build talks to the live Aura API through a short-lived token/i),
    ).toBeVisible();

    await expect(betaApiSection.getByRole('status')).toHaveCount(0);
    await expect(
      betaApiSection.getByText(/Could not reach the sign-in service/i),
    ).toHaveCount(0);

    expect(pageErrors, `pageerror: ${pageErrors.join('; ')}`).toEqual([]);
  });
});

test.describe('journey BFF (stub path, mocked session + POST /v1/journeys)', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript((payload) => {
      if (window.localStorage.getItem('aura:v1')) return;
      window.localStorage.setItem('aura:v1', payload);
    }, AURA_STORAGE_BOOTSTRAP);
  });

  test('Start live tracking + I\'m safe issue authenticated POST /v1/journeys and POST im-safe', async ({
    page,
  }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    const expiresAt = new Date(Date.now() + 3_600_000).toISOString();
    const expSec = Math.floor(Date.now() / 1000) + 3600;
    const payload = Buffer.from(JSON.stringify({ sub: 'e2e-bff-journey', exp: expSec })).toString(
      'base64url',
    );
    const accessToken = `e2e.${payload}.stub`;
    const journeyId = 'a1b2c3d4-e5f6-4789-a012-3456789abcde';

    let postJourneysAuth: string | null = null;
    let postImSafeAuth: string | null = null;

    await page.route('**/aura-bff/session', async (route) => {
      if (route.request().method() !== 'GET') {
        await route.continue();
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, accessToken, expiresAt }),
      });
    });

    await page.route('**/v1/journeys', async (route) => {
      const url = new URL(route.request().url());
      if (route.request().method() !== 'POST' || !url.pathname.endsWith('/v1/journeys')) {
        await route.continue();
        return;
      }
      postJourneysAuth = route.request().headers()['authorization'] ?? null;
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, data: { journeyId } }),
      });
    });

    await page.route(`**/v1/journeys/${journeyId}/im-safe`, async (route) => {
      if (route.request().method() !== 'POST') {
        await route.continue();
        return;
      }
      postImSafeAuth = route.request().headers()['authorization'] ?? null;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, data: { receivedAt: new Date().toISOString() } }),
      });
    });

    await page.goto('/journey/new');
    await expect(page.getByRole('heading', { name: 'New journey', level: 1 })).toBeVisible();

    await page.getByRole('button', { name: 'Start live tracking' }).click();
    await expect(page).toHaveURL(/\/journey\/active$/);
    await expect(page.getByRole('heading', { name: 'Live tracking', level: 1 })).toBeVisible();

    expect(postJourneysAuth).toBe(`Bearer ${accessToken}`);
    await expect(page.getByRole('alert')).toHaveCount(0);
    await expect(page.getByText(/Sign in with Google/i)).toHaveCount(0);
    await expect(page.getByText(/session may have expired/i)).toHaveCount(0);

    await page.getByRole('button', { name: "I'm safe" }).click();
    await expect(page.getByRole('button', { name: "I'm safe" })).toBeVisible({ timeout: 5_000 });

    expect(postImSafeAuth).toBe(`Bearer ${accessToken}`);
    await expect(page.getByRole('alert')).toHaveCount(0);
    await expect(page.getByText(/session may have expired/i)).toHaveCount(0);
    await expect(page.getByText(/doesn't match your current session/i)).toHaveCount(0);

    expect(pageErrors, `pageerror: ${pageErrors.join('; ')}`).toEqual([]);
  });
});
