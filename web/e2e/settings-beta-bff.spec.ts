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
