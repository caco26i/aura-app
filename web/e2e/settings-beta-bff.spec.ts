/**
 * BFF session e2e (`PLAYWRIGHT_BFF_STUB=1` only — excluded from default `npm run test:e2e`; runs in web-ci via `npm run test:e2e:bff-stub`).
 *
 * Partial coverage of [DEPLOY.md](../docs/DEPLOY.md) *Staging smoke: BFF JWT path*:
 * - Checklist item 5 (mocked): credentialed `GET /session` → **200** with access token; Settings shows calm copy, no error status.
 * - Checklist item 5 (mocked): `/journey/new` → **Start live tracking** issues authenticated `POST /v1/journeys` with the
 *   session token and lands on `/journey/active` without auth failure copy.
 * - Checklist item 5 (mocked): on `/journey/active`, **I'm safe** issues authenticated `POST /v1/journeys/:id/im-safe`
 *   with the session token and completes without auth/ownership failure copy.
 * - Checklist item 5 (mocked): on `/journey/active`, **Share live location** (primer → **Share location**) issues
 *   authenticated `POST /v1/journeys/:id/location-shares` with the session token and completes without auth/ownership
 *   failure copy.
 * - Checklist item 5 (mocked): near-expiry cached session triggers a fresh credentialed `GET /session` before the next
 *   authenticated API call; the refreshed token is used on `POST /v1/journeys`.
 * - Checklist item 5 (mocked): `401` on a protected route surfaces calm recovery copy (`role="alert"`) — no silent failure.
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

function stubAccessToken(sub: string, expSecFromNow: number): string {
  const expSec = Math.floor(Date.now() / 1000) + expSecFromNow;
  const payload = Buffer.from(JSON.stringify({ sub, exp: expSec })).toString('base64url');
  return `e2e.${payload}.stub`;
}

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

  test('Start live tracking + share location + I\'m safe issue authenticated POST /v1/journeys, location-shares, im-safe', async ({
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
    let postLocationShareAuth: string | null = null;
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

    await page.route(`**/v1/journeys/${journeyId}/location-shares`, async (route) => {
      if (route.request().method() !== 'POST') {
        await route.continue();
        return;
      }
      postLocationShareAuth = route.request().headers()['authorization'] ?? null;
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          data: { shareId: 'b2c3d4e5-f6a7-4890-b123-456789abcdef' },
        }),
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

    await page.getByRole('button', { name: 'Share live location' }).click();
    const sharePrimer = page.getByRole('dialog', { name: /Share live location/i });
    await expect(sharePrimer.getByRole('heading', { name: 'Share live location', level: 2 })).toBeVisible();
    await sharePrimer.getByRole('button', { name: 'Share location' }).click();
    await expect(page.getByRole('button', { name: 'Share live location' })).toBeVisible({ timeout: 5_000 });

    expect(postLocationShareAuth).toBe(`Bearer ${accessToken}`);
    await expect(page.getByRole('alert')).toHaveCount(0);
    await expect(page.getByText(/session may have expired/i)).toHaveCount(0);
    await expect(page.getByText(/doesn't match your current session/i)).toHaveCount(0);

    await page.getByRole('button', { name: "I'm safe" }).click();
    await expect(page.getByRole('button', { name: "I'm safe" })).toBeVisible({ timeout: 5_000 });

    expect(postImSafeAuth).toBe(`Bearer ${accessToken}`);
    await expect(page.getByRole('alert')).toHaveCount(0);
    await expect(page.getByText(/session may have expired/i)).toHaveCount(0);
    await expect(page.getByText(/doesn't match your current session/i)).toHaveCount(0);

    expect(pageErrors, `pageerror: ${pageErrors.join('; ')}`).toEqual([]);
  });
});

test.describe('settings beta BFF (stub path, session refresh)', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript((payload) => {
      if (window.localStorage.getItem('aura:v1')) return;
      window.localStorage.setItem('aura:v1', payload);
    }, AURA_STORAGE_BOOTSTRAP);
  });

  test('near-expiry session cache refreshes before authenticated POST /v1/journeys', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    const tokenNearExpiry = stubAccessToken('e2e-bff-near-expiry', 30);
    const tokenRefreshed = stubAccessToken('e2e-bff-refreshed', 3600);
    const nearExpiresAt = new Date(Date.now() + 30_000).toISOString();
    const refreshedExpiresAt = new Date(Date.now() + 3_600_000).toISOString();
    const journeyId = 'c3d4e5f6-a7b8-4901-c234-567890abcdef';

    let sessionGetCount = 0;
    let postJourneysAuth: string | null = null;

    await page.route('**/aura-bff/session', async (route) => {
      if (route.request().method() !== 'GET') {
        await route.continue();
        return;
      }
      sessionGetCount += 1;
      const isRefresh = sessionGetCount > 1;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          accessToken: isRefresh ? tokenRefreshed : tokenNearExpiry,
          expiresAt: isRefresh ? refreshedExpiresAt : nearExpiresAt,
        }),
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

    await page.goto('/settings');
    await expect(page.getByRole('heading', { name: 'Settings', level: 1 })).toBeVisible();
    expect(sessionGetCount).toBe(1);

    await page.goto('/journey/new');
    await expect(page.getByRole('heading', { name: 'New journey', level: 1 })).toBeVisible();
    await page.getByRole('button', { name: 'Start live tracking' }).click();

    await expect(page).toHaveURL(/\/journey\/active$/);
    expect(sessionGetCount).toBeGreaterThanOrEqual(2);
    expect(postJourneysAuth).toBe(`Bearer ${tokenRefreshed}`);
    await expect(page.getByRole('alert')).toHaveCount(0);
    await expect(page.getByText(/session may have expired/i)).toHaveCount(0);

    expect(pageErrors, `pageerror: ${pageErrors.join('; ')}`).toEqual([]);
  });
});

test.describe('settings beta BFF (stub path, protected-route error)', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript((payload) => {
      if (window.localStorage.getItem('aura:v1')) return;
      window.localStorage.setItem('aura:v1', payload);
    }, AURA_STORAGE_BOOTSTRAP);
  });

  test('401 on POST /v1/journeys shows calm recovery copy (no silent failure)', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    const accessToken = stubAccessToken('e2e-bff-401', 3600);
    const expiresAt = new Date(Date.now() + 3_600_000).toISOString();

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
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ ok: false, error: 'unauthorized' }),
      });
    });

    await page.goto('/journey/new');
    await expect(page.getByRole('heading', { name: 'New journey', level: 1 })).toBeVisible();
    await page.getByRole('button', { name: 'Start live tracking' }).click();

    await expect(page).toHaveURL(/\/journey\/new$/);
    await expect(page.getByRole('alert')).toContainText(/Your session may have expired/i);
    await expect(page.getByRole('button', { name: 'Start live tracking' })).toBeEnabled();

    expect(pageErrors, `pageerror: ${pageErrors.join('; ')}`).toEqual([]);
  });
});
