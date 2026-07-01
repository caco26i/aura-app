import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import type { Result } from 'axe-core';

/** Same bootstrap as smoke so routes render inside AppShell (no /welcome). */
const AURA_STORAGE_BOOTSTRAP = JSON.stringify({
  contacts: [],
  activeJourney: null,
  mapLayers: { risk: true, safePoints: true, activity: false },
  settings: {
    displayName: 'A11y',
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

function formatViolations(violations: Result[]): string {
  return violations
    .map((v) => `${v.id}: ${v.help} (${v.nodes.length} node(s))`)
    .join('\n');
}

const ACTIVE_JOURNEY_ID = 'c0ffee00-1111-4222-8333-444455556666';

test.describe('a11y axe — home hub, transport, check-in IA, Modo Cita, map, trusted, journey, emergency, settings (AURA-278, AURA-312, AURA-322, AURA-337, AURA-349)', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript((payload) => {
      if (window.localStorage.getItem('aura:v1')) return;
      window.localStorage.setItem('aura:v1', payload);
    }, AURA_STORAGE_BOOTSTRAP);
  });

  test('/: axe clean + global status aria-live region', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Home', level: 1 })).toBeAttached();

    const status = page.locator('#main-content [role="status"][aria-live="polite"][aria-atomic="true"]');
    await expect(status).toBeVisible();
    await expect(status).toHaveText('Safe.');

    const axe = await new AxeBuilder({ page }).include('#main-content').analyze();
    expect(axe.violations, formatViolations(axe.violations)).toEqual([]);

    expect(pageErrors, pageErrors.join('; ')).toEqual([]);
  });

  test('/transport: axe clean + live status region', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await page.goto('/transport');
    await expect(page.getByRole('heading', { name: 'Modo transporte', level: 1 })).toBeVisible();

    const status = page.locator('#transport-live-status');
    await expect(status).toBeVisible();
    await expect(status).toHaveAttribute('role', 'status');

    // Scope to route body: shared bottom-nav labels fail color-contrast globally (outside AURA-278).
    const axe = await new AxeBuilder({ page }).include('#main-content').analyze();
    expect(axe.violations, formatViolations(axe.violations)).toEqual([]);

    expect(pageErrors, pageErrors.join('; ')).toEqual([]);
  });

  test('/checkin: axe clean + IA status region', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await page.goto('/checkin');
    await expect(page.getByRole('heading', { name: 'Check-in IA', level: 1 })).toBeVisible();

    const status = page.locator('#checkin-ia-status');
    await expect(status).toBeVisible();
    await expect(status).toHaveAttribute('role', 'status');

    const axe = await new AxeBuilder({ page }).include('#main-content').analyze();
    expect(axe.violations, formatViolations(axe.violations)).toEqual([]);

    expect(pageErrors, pageErrors.join('; ')).toEqual([]);
  });

  test('/cita: axe clean + Modo Cita h1', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await page.goto('/cita');
    await expect(page.getByRole('heading', { name: 'Modo Cita', level: 1 })).toBeVisible();

    const axe = await new AxeBuilder({ page }).include('#main-content').analyze();
    expect(axe.violations, formatViolations(axe.violations)).toEqual([]);

    expect(pageErrors, pageErrors.join('; ')).toEqual([]);
  });

  test('/map: axe clean + Map intel h1 + layer switch', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await page.goto('/map');
    await expect(page.getByRole('heading', { name: 'Map intel', level: 1 })).toBeVisible();
    await expect(page.getByRole('switch').first()).toBeVisible();

    const axe = await new AxeBuilder({ page }).include('#main-content').analyze();
    expect(axe.violations, formatViolations(axe.violations)).toEqual([]);

    expect(pageErrors, pageErrors.join('; ')).toEqual([]);
  });

  test('/trusted: axe clean + Trusted network h1 (wireframe §7)', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await page.goto('/trusted');
    await expect(page.getByRole('heading', { name: 'Trusted network', level: 1 })).toBeVisible();

    const axe = await new AxeBuilder({ page }).include('#main-content').analyze();
    expect(axe.violations, formatViolations(axe.violations)).toEqual([]);

    expect(pageErrors, pageErrors.join('; ')).toEqual([]);
  });

  test('/journey/new: axe clean + New journey h1', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await page.goto('/journey/new');
    await expect(page.getByRole('heading', { name: 'New journey', level: 1 })).toBeVisible();

    const axe = await new AxeBuilder({ page }).include('#main-content').analyze();
    expect(axe.violations, formatViolations(axe.violations)).toEqual([]);

    expect(pageErrors, pageErrors.join('; ')).toEqual([]);
  });

  test('/journey/active: axe clean + Live tracking h1 (activeJourney bootstrap)', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

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
            displayName: 'A11y',
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
    }, ACTIVE_JOURNEY_ID);

    await page.goto('/journey/active');
    await expect(page.getByRole('heading', { name: 'Live tracking', level: 1 })).toBeVisible();

    const axe = await new AxeBuilder({ page }).include('#main-content').analyze();
    expect(axe.violations, formatViolations(axe.violations)).toEqual([]);

    expect(pageErrors, pageErrors.join('; ')).toEqual([]);
  });

  test('/emergency: axe clean + Emergency h1', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await page.goto('/emergency');
    await expect(page.getByRole('heading', { name: 'Emergency', level: 1 })).toBeVisible();

    const axe = await new AxeBuilder({ page }).include('#main-content').analyze();
    expect(axe.violations, formatViolations(axe.violations)).toEqual([]);

    expect(pageErrors, pageErrors.join('; ')).toEqual([]);
  });

  test('/settings: axe clean + Settings h1', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await page.goto('/settings');
    await expect(page.getByRole('heading', { name: 'Settings', level: 1 })).toBeVisible();

    const axe = await new AxeBuilder({ page }).include('#main-content').analyze();
    expect(axe.violations, formatViolations(axe.violations)).toEqual([]);

    expect(pageErrors, pageErrors.join('; ')).toEqual([]);
  });
});
