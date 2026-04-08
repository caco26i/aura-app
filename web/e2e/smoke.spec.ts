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

test.describe('shell smoke', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript((payload) => {
      // Do not clobber on reload — tests assert `aura:v1` survives full navigation.
      if (window.localStorage.getItem('aura:v1')) return;
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

  test('settings privacy hash: title, announcer, and focus on Privacy h2', async ({ page }) => {
    const pageErrors: string[] = [];
    const consoleErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto('/settings#settings-privacy-and-visibility');

    await expect(page).toHaveURL(/\/settings#settings-privacy-and-visibility$/);
    await expect.poll(async () => page.title()).toMatch(/^Privacy & visibility · /);
    await expect(page.locator('#route-announcer-status')).toHaveText('Settings. Privacy and visibility.');
    const privacyHeading = page.locator('#settings-privacy-and-visibility');
    await expect(privacyHeading).toBeVisible();
    await expect(privacyHeading).toBeFocused();

    expect(pageErrors, `pageerror: ${pageErrors.join('; ')}`).toEqual([]);
    expect(consoleErrors, `console.error: ${consoleErrors.join('; ')}`).toEqual([]);
  });

  test('home hub navigates to Safety map', async ({ page }) => {
    const pageErrors: string[] = [];
    const consoleErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto('/');
    await page.getByRole('link', { name: 'Safety map', exact: true }).click();
    await expect(page).toHaveURL(/\/map$/);

    expect(pageErrors, `pageerror: ${pageErrors.join('; ')}`).toEqual([]);
    expect(consoleErrors, `console.error: ${consoleErrors.join('; ')}`).toEqual([]);
  });

  test('journey: /journey/new → Start live tracking → /journey/active (API off, local UUID)', async ({
    page,
  }) => {
    const pageErrors: string[] = [];
    const consoleErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto('/journey/new');
    await expect(page.getByRole('heading', { name: 'New journey', level: 1 })).toBeVisible();

    await page.getByRole('button', { name: 'Start live tracking' }).click();
    await expect(page).toHaveURL(/\/journey\/active$/);
    await expect(page.getByRole('heading', { name: 'Live tracking', level: 1 })).toBeVisible();

    expect(pageErrors, `pageerror: ${pageErrors.join('; ')}`).toEqual([]);
    expect(consoleErrors, `console.error: ${consoleErrors.join('; ')}`).toEqual([]);
  });

  test('journey active: Live tracking, I’m safe + share primer (API off)', async ({ page }) => {
    const journeyId = 'c0ffee00-1111-4222-8333-444455556666';
    const pageErrors: string[] = [];
    const consoleErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.addInitScript((id) => {
      window.localStorage.setItem(
        'aura:v1',
        JSON.stringify({
          contacts: [],
          activeJourney: {
            id,
            label: 'Home',
            destinationLabel: 'Work',
            etaMinutes: 12,
            trackState: 'on_track',
            startedAt: new Date().toISOString(),
          },
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
    }, journeyId);

    await page.goto('/journey/active');
    await expect(page.getByRole('heading', { name: 'Live tracking', level: 1 })).toBeVisible();

    await expect(page.getByRole('button', { name: "I'm safe" })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Share live location' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'End journey' })).toBeVisible();

    await page.getByRole('button', { name: "I'm safe" }).click();
    await expect(page.getByRole('button', { name: 'Sending…' })).toBeVisible();
    await expect(page.getByRole('button', { name: "I'm safe" })).toBeVisible({ timeout: 5_000 });
    await expect(page.getByRole('alert')).toHaveCount(0);

    await page.getByRole('button', { name: 'Share live location' }).click();
    const sharePrimer = page.getByRole('dialog', { name: /Share live location/i });
    await expect(sharePrimer.getByRole('heading', { name: 'Share live location', level: 2 })).toBeVisible();
    await sharePrimer.getByRole('button', { name: 'Share location' }).click();
    await expect(page.getByRole('button', { name: 'Sharing…' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Share live location' })).toBeVisible({ timeout: 5_000 });
    await expect(page.getByRole('alert')).toHaveCount(0);

    expect(pageErrors, `pageerror: ${pageErrors.join('; ')}`).toEqual([]);
    expect(consoleErrors, `console.error: ${consoleErrors.join('; ')}`).toEqual([]);
  });

  test('Map intel: layer toggle exposes switch role and aria-checked, no page/console errors', async ({ page }) => {
    const pageErrors: string[] = [];
    const consoleErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto('/map');
    await expect(page.getByRole('heading', { name: 'Map intel', level: 1 })).toBeVisible();

    const riskSwitch = page.getByRole('switch', { name: /Risk signals/i });
    await expect(riskSwitch).toBeVisible();
    await expect(riskSwitch).toHaveAttribute('aria-checked', 'true');

    await riskSwitch.click();
    await expect(riskSwitch).toHaveAttribute('aria-checked', 'false');

    await riskSwitch.click();
    await expect(riskSwitch).toHaveAttribute('aria-checked', 'true');

    expect(pageErrors, `pageerror: ${pageErrors.join('; ')}`).toEqual([]);
    expect(consoleErrors, `console.error: ${consoleErrors.join('; ')}`).toEqual([]);
  });

  test('Map intel: demo route shows polite status region with Demo only copy, no page/console errors', async ({
    page,
  }) => {
    const pageErrors: string[] = [];
    const consoleErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto('/map');
    await expect(page.getByRole('heading', { name: 'Map intel', level: 1 })).toBeVisible();

    // Accessible name is `aria-label` on MapPage (visible text is "Find safest route (demo)").
    await page
      .getByRole('button', { name: /Find safest route — demo only; shows a placeholder message/i })
      .click();
    const demoStatus = page.locator('#map-demo-route-status');
    await expect(demoStatus).toBeVisible();
    await expect(demoStatus).toHaveAttribute('role', 'status');
    await expect(demoStatus).toHaveAttribute('aria-live', 'polite');
    await expect(demoStatus).toContainText(/Demo only/i);

    expect(pageErrors, `pageerror: ${pageErrors.join('; ')}`).toEqual([]);
    expect(consoleErrors, `console.error: ${consoleErrors.join('; ')}`).toEqual([]);
  });

  test('Modo Cita shell from home grid: h1 and no page/console errors', async ({ page }) => {
    const pageErrors: string[] = [];
    const consoleErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto('/');
    await page.getByRole('link', { name: /Modo Cita/i }).click();
    await expect(page).toHaveURL(/\/cita$/);
    await expect(page.getByRole('heading', { name: 'Modo Cita', level: 1 })).toBeVisible();

    expect(pageErrors, `pageerror: ${pageErrors.join('; ')}`).toEqual([]);
    expect(consoleErrors, `console.error: ${consoleErrors.join('; ')}`).toEqual([]);
  });

  test('Modo Cita: check-in nudge appears when interval passed; dismiss hides it', async ({ page }) => {
    const pageErrors: string[] = [];
    const consoleErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.addInitScript(() => {
      const meeting = new Date(Date.now() + 86_400_000);
      const pad = (n: number) => String(n).padStart(2, '0');
      const meetingVal = `${meeting.getFullYear()}-${pad(meeting.getMonth() + 1)}-${pad(meeting.getDate())}T${pad(meeting.getHours())}:${pad(meeting.getMinutes())}`;
      window.localStorage.setItem(
        'aura:v1',
        JSON.stringify({
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
          encuentroDraft: {
            contactName: '',
            place: '',
            safetyKeyword: '',
            meetingLocalValue: meetingVal,
            checkInIntervalMinutes: 1,
            encuentroLastLocalCheckInAckMs: Date.now() - 120_000,
            encuentroBrowserNotifyWanted: false,
          },
        }),
      );
    });

    await page.goto('/cita');
    await expect(page.getByTestId('cita-checkin-nudge')).toBeVisible();
    await page.getByRole('button', { name: /Listo, seguir/i }).click();
    await expect(page.getByTestId('cita-checkin-nudge')).toBeHidden();

    expect(pageErrors, `pageerror: ${pageErrors.join('; ')}`).toEqual([]);
    expect(consoleErrors, `console.error: ${consoleErrors.join('; ')}`).toEqual([]);
  });

  test('Modo Cita: encuentro draft survives reload (aura:v1)', async ({ page }) => {
    const pageErrors: string[] = [];
    const consoleErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto('/cita');

    await page.getByLabel(/Nombre o apodo del contacto/i).fill('María prueba');
    await page.getByLabel(/^Lugar$/i).fill('Café Central');
    await page.getByLabel(/Palabra de seguridad/i).fill('cactus');

    await page.reload();

    await expect(page.getByLabel(/Nombre o apodo del contacto/i)).toHaveValue('María prueba');
    await expect(page.getByLabel(/^Lugar$/i)).toHaveValue('Café Central');
    await expect(page.getByLabel(/Palabra de seguridad/i)).toHaveValue('cactus');

    expect(pageErrors, `pageerror: ${pageErrors.join('; ')}`).toEqual([]);
    expect(consoleErrors, `console.error: ${consoleErrors.join('; ')}`).toEqual([]);
  });

  test('Modo transporte shell from home grid: h1 and no page/console errors', async ({ page }) => {
    const pageErrors: string[] = [];
    const consoleErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto('/');
    await page.getByRole('link', { name: /Transporte/i }).click();
    await expect(page).toHaveURL(/\/transport$/);
    await expect(page.getByRole('heading', { name: 'Modo transporte', level: 1 })).toBeVisible();

    expect(pageErrors, `pageerror: ${pageErrors.join('; ')}`).toEqual([]);
    expect(consoleErrors, `console.error: ${consoleErrors.join('; ')}`).toEqual([]);
  });

  test('Check-in IA shell from home grid: h1 and no page/console errors', async ({ page }) => {
    const pageErrors: string[] = [];
    const consoleErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto('/');
    await page.getByRole('link', { name: /Check-in IA/i }).click();
    await expect(page).toHaveURL(/\/checkin$/);
    await expect(page.getByRole('heading', { name: 'Check-in IA', level: 1 })).toBeVisible();

    expect(pageErrors, `pageerror: ${pageErrors.join('; ')}`).toEqual([]);
    expect(consoleErrors, `console.error: ${consoleErrors.join('; ')}`).toEqual([]);
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

  test('Emergency: Go back restores keyboard focus to bottom-nav SOS', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await page.goto('/');
    const sosLink = page.getByRole('navigation', { name: /navegación principal/i }).getByRole('link', { name: 'SOS' });
    await sosLink.click();
    await expect(page).toHaveURL(/\/emergency$/);
    await page.getByRole('button', { name: 'Go back' }).click();
    await expect(page).toHaveURL(/\//);
    await expect(sosLink).toBeFocused();

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
