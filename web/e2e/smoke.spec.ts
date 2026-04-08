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
});
