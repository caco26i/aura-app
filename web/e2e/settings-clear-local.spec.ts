import { expect, test, type Page } from '@playwright/test';

/** Same `aura:v1` bootstrap as `smoke.spec.ts` so `RequireOnboarding` allows `/settings`. */
const AURA_STORAGE_BOOTSTRAP = JSON.stringify({
  contacts: [],
  activeJourney: null,
  mapLayers: { risk: true, safePoints: true, activity: false },
  settings: {
    displayName: 'Clear local e2e',
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

function attachErrorCollectors(page: Page) {
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];
  page.on('pageerror', (err) => pageErrors.push(err.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  return { pageErrors, consoleErrors };
}

test.describe('settings clear-local modal (AURA-218 §4.3)', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript((payload) => {
      const onceKey = '__aura_e2e_clear_local_boot';
      // After Scenario B reload, do not re-seed `aura:v1` (same as smoke intent: no clobber on reload).
      if (window.sessionStorage.getItem(onceKey)) return;
      if (!window.localStorage.getItem('aura:v1')) {
        window.localStorage.setItem('aura:v1', payload);
      }
      window.sessionStorage.setItem(onceKey, '1');
    }, AURA_STORAGE_BOOTSTRAP);
  });

  test('Scenario A: open dialog, assert copy & Cancel focus, cancel — storage unchanged', async ({
    page,
  }) => {
    const { pageErrors, consoleErrors } = attachErrorCollectors(page);

    await page.goto('/settings');

    await expect(page.getByRole('heading', { name: 'Settings', level: 1 })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Reset Aura on this device', level: 2 })).toBeVisible();

    const trigger = page
      .locator('section[aria-labelledby="reset-heading"]')
      .getByRole('button', { name: 'Clear local Aura data' });
    await trigger.click();

    const dialog = page.getByRole('dialog', { name: 'Clear local Aura data?' });
    await expect(dialog).toBeVisible();

    await expect(dialog.getByRole('heading', { name: 'Clear local Aura data?', level: 2 })).toBeVisible();
    await expect(dialog.getByRole('paragraph')).toHaveText(
      'This removes contacts, active journey, settings, and onboarding status from this browser. It does not delete server history if you used a live account.',
    );

    await expect(dialog.getByRole('button', { name: 'Cancel' })).toBeFocused();

    await dialog.getByRole('button', { name: 'Cancel' }).click();
    await expect(dialog).toBeHidden();

    expect(await page.evaluate(() => window.localStorage.getItem('aura:v1'))).toBeTruthy();

    expect(pageErrors, `pageerror: ${pageErrors.join('; ')}`).toEqual([]);
    expect(consoleErrors, `console.error: ${consoleErrors.join('; ')}`).toEqual([]);
  });

  test('Scenario B: confirm clear → reload → /welcome, onboarding reset (cold-start payload)', async ({
    page,
  }) => {
    const { pageErrors, consoleErrors } = attachErrorCollectors(page);

    await page.goto('/settings');
    await expect(page.getByRole('heading', { name: 'Settings', level: 1 })).toBeVisible();

    const trigger = page
      .locator('section[aria-labelledby="reset-heading"]')
      .getByRole('button', { name: 'Clear local Aura data' });
    await trigger.click();

    const dialog = page.getByRole('dialog', { name: 'Clear local Aura data?' });
    await expect(dialog).toBeVisible();

    await Promise.all([
      page.waitForURL(/\/welcome$/),
      dialog.getByRole('button', { name: 'Clear data' }).click(),
    ]);

    await expect(page.getByRole('heading', { name: 'Welcome to Aura', level: 1 })).toBeVisible();

    // Clear removes storage then reloads; `AuraContext` immediately re-persists defaults (onboarding still false).
    const raw = await page.evaluate(() => window.localStorage.getItem('aura:v1'));
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!) as { onboardingCompleted?: boolean; contacts?: unknown[] };
    expect(parsed.onboardingCompleted).toBe(false);
    expect(parsed.contacts).toEqual([]);

    expect(pageErrors, `pageerror: ${pageErrors.join('; ')}`).toEqual([]);
    expect(consoleErrors, `console.error: ${consoleErrors.join('; ')}`).toEqual([]);
  });
});
