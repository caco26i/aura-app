import { expect, test } from '@playwright/test';

/** Minimal `aura:v1` payload so `RequireOnboarding` sends users into AppShell routes (no /welcome). */
const AURA_STORAGE_BOOTSTRAP = JSON.stringify({
  contacts: [],
  activeJourney: null,
  mapLayers: { risk: true, safePoints: true, activity: false },
  settings: {
    displayName: 'Smoke',
    voiceKeyword: 'Aura help',
    silentTriggerMs: 800,
    timerDefaultMinutes: 15,
    locationPrecision: 'approximate',
  },
  globalStatus: 'calm',
  onboardingCompleted: true,
  shareLocationPrimerAcknowledged: false,
});

test.describe('shell smoke', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript((payload) => {
      window.localStorage.setItem('aura:v1', payload);
    }, AURA_STORAGE_BOOTSTRAP);
  });

  test('home loads, skip link and main landmark, navigate to Settings without page errors', async ({
    page,
  }) => {
    const pageErrors: string[] = [];
    const consoleErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto('/');

    await expect(page.locator('#main-content')).toBeVisible();
    await expect(page.getByRole('link', { name: /skip to main content/i })).toBeAttached();

    await page.getByRole('link', { name: 'Settings', exact: true }).click();
    await expect(page).toHaveURL(/\/settings$/);
    await expect(page.getByRole('heading', { name: 'Settings', level: 1 })).toBeVisible();

    expect(pageErrors, `pageerror: ${pageErrors.join('; ')}`).toEqual([]);
    expect(consoleErrors, `console.error: ${consoleErrors.join('; ')}`).toEqual([]);
  });

  test('home hub navigates to Safety map', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await page.goto('/');
    await page.getByRole('link', { name: 'Safety map', exact: true }).click();
    await expect(page).toHaveURL(/\/map$/);

    expect(pageErrors, `pageerror: ${pageErrors.join('; ')}`).toEqual([]);
  });

  test('Trusted: open from bootstrapped shell, h1 and no page/console errors', async ({ page }) => {
    const pageErrors: string[] = [];
    const consoleErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto('/');
    await page.getByRole('link', { name: 'Network', exact: true }).click();
    await expect(page).toHaveURL(/\/trusted$/);
    await expect(page.getByRole('heading', { name: 'Trusted network', level: 1 })).toBeVisible();

    expect(pageErrors, `pageerror: ${pageErrors.join('; ')}`).toEqual([]);
    expect(consoleErrors, `console.error: ${consoleErrors.join('; ')}`).toEqual([]);
  });

  test('Emergency: SOS nav opens shell, visible confirm cancel — no SOS POST', async ({ page }) => {
    const pageErrors: string[] = [];
    let emergencyAlertPosts = 0;
    page.on('pageerror', (err) => pageErrors.push(err.message));
    page.on('request', (req) => {
      if (req.method() === 'POST' && req.url().includes('emergency-alert')) emergencyAlertPosts += 1;
    });

    await page.goto('/');
    await page.getByRole('navigation', { name: /navegación principal/i }).getByRole('link', { name: 'SOS' }).click();
    await expect(page).toHaveURL(/\/emergency$/);
    await expect(page.getByRole('heading', { name: 'Emergency', level: 1 })).toBeVisible();

    await page.getByRole('button', { name: 'Send visible alert' }).click();
    const dialog = page.getByRole('dialog', { name: 'Send alert to trusted contacts?' });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Cancel' }).click();
    await expect(dialog).toBeHidden();

    expect(emergencyAlertPosts, 'cancel must not call POST /v1/emergency-alerts').toBe(0);
    expect(pageErrors, `pageerror: ${pageErrors.join('; ')}`).toEqual([]);
  });

  test('unknown path replace-navigates to home without redirect loop', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await page.goto('/aura-smoke-no-such-route-7c4e');
    await expect(page).toHaveURL(/\/$/);
    await expect.poll(() => new URL(page.url()).pathname).toBe('/');

    await page.waitForTimeout(400);
    await expect.poll(() => new URL(page.url()).pathname).toBe('/');

    expect(pageErrors, `pageerror: ${pageErrors.join('; ')}`).toEqual([]);
  });
});
