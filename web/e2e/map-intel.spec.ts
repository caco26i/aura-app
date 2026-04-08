import { expect, test, type Page } from '@playwright/test';

/** Minimal `aura:v1` payload so `RequireOnboarding` sends users into AppShell routes (no /welcome). */
const AURA_STORAGE_BOOTSTRAP = JSON.stringify({
  contacts: [],
  activeJourney: null,
  mapLayers: { risk: true, safePoints: true, activity: false },
  settings: {
    displayName: 'Map intel e2e',
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

function attachStrictErrorGuards(page: Page) {
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];
  page.on('pageerror', (err) => pageErrors.push(err.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  return { pageErrors, consoleErrors };
}

function assertNoPageOrConsoleErrors(
  pageErrors: string[],
  consoleErrors: string[],
): void {
  expect(pageErrors, `pageerror: ${pageErrors.join('; ')}`).toEqual([]);
  expect(consoleErrors, `console.error: ${consoleErrors.join('; ')}`).toEqual([]);
}

test.describe('map intel baseline', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript((payload) => {
      if (window.localStorage.getItem('aura:v1')) return;
      window.localStorage.setItem('aura:v1', payload);
    }, AURA_STORAGE_BOOTSTRAP);
  });

  test('/map: heading, map region, demo route status, layer toggle a11y — no page/console errors', async ({
    page,
  }) => {
    const { pageErrors, consoleErrors } = attachStrictErrorGuards(page);

    await page.goto('/map');

    await expect(page.getByRole('heading', { name: 'Map intel', level: 1 })).toBeVisible();
    await expect(page.getByRole('application', { name: 'Map' })).toBeVisible();

    await page.getByRole('button', { name: /Find safest route/i }).click();
    await expect(page.locator('#map-demo-route-status')).toContainText(/Demo only/i);

    const riskSwitch = page.getByRole('switch', { name: /Risk signals/i });
    await expect(riskSwitch).toBeVisible();
    await expect(riskSwitch).toHaveAttribute('aria-checked', 'true');
    await expect(riskSwitch).toHaveAttribute('aria-pressed', 'true');

    await riskSwitch.click();
    await expect(riskSwitch).toHaveAttribute('aria-checked', 'false');
    await expect(riskSwitch).toHaveAttribute('aria-pressed', 'false');

    await riskSwitch.click();
    await expect(riskSwitch).toHaveAttribute('aria-checked', 'true');
    await expect(riskSwitch).toHaveAttribute('aria-pressed', 'true');

    assertNoPageOrConsoleErrors(pageErrors, consoleErrors);
  });
});
