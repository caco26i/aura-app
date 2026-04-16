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

test.describe('a11y axe — transport + check-in IA (AURA-278)', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript((payload) => {
      if (window.localStorage.getItem('aura:v1')) return;
      window.localStorage.setItem('aura:v1', payload);
    }, AURA_STORAGE_BOOTSTRAP);
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
});
