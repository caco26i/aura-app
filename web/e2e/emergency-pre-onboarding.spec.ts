import { expect, test } from '@playwright/test';

/**
 * PDR / screen spec: `/emergency` must stay reachable before onboarding completes
 * (outside `RequireOnboarding`). Fresh profile = no `aura:v1` → `onboardingCompleted` false in app state.
 */
test.describe('emergency before onboarding', () => {
  test('direct /emergency shows Emergency surface; no redirect to /welcome', async ({ page }) => {
    const pageErrors: string[] = [];
    const consoleErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.addInitScript(() => {
      window.localStorage.removeItem('aura:v1');
    });

    await page.goto('/emergency');

    await expect(page).toHaveURL(/\/emergency$/);
    await expect(page.getByRole('heading', { name: 'Emergency', level: 1 })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Send visible alert' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Send silent alert' })).toBeVisible();

    expect(pageErrors, `pageerror: ${pageErrors.join('; ')}`).toEqual([]);
    expect(consoleErrors, `console.error: ${consoleErrors.join('; ')}`).toEqual([]);
  });

  test('explicit aura:v1 with onboardingCompleted false still keeps /emergency', async ({ page }) => {
    const pageErrors: string[] = [];
    const consoleErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.addInitScript(() => {
      window.localStorage.setItem(
        'aura:v1',
        JSON.stringify({
          contacts: [],
          activeJourney: null,
          mapLayers: { risk: true, safePoints: true, activity: false },
          settings: {
            displayName: '',
            voiceKeyword: 'Aura help',
            silentTriggerMs: 800,
            timerDefaultMinutes: 15,
            locationPrecision: 'approximate',
          },
          globalStatus: 'calm',
          onboardingCompleted: false,
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
        }),
      );
    });

    await page.goto('/emergency');

    await expect(page).toHaveURL(/\/emergency$/);
    await expect(page.getByRole('heading', { name: 'Emergency', level: 1 })).toBeVisible();

    expect(pageErrors, `pageerror: ${pageErrors.join('; ')}`).toEqual([]);
    expect(consoleErrors, `console.error: ${consoleErrors.join('; ')}`).toEqual([]);
  });
});
