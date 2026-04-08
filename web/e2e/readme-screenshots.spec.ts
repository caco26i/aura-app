import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { test } from '@playwright/test';

/**
 * Generates repo-root `docs/assets/screenshot-*.png` for the root README.
 * Skipped in normal CI — run: `CAPTURE_README_SCREENSHOTS=1 npm run capture:readme-screens` from `web/`.
 */
const ASSETS_DIR = join(process.cwd(), '..', 'docs', 'assets');

const DEMO_JOURNEY = {
  id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  label: 'Evening walk',
  destinationLabel: 'Market & 4th',
  etaMinutes: 14,
  trackState: 'on_track' as const,
  startedAt: '2026-04-08T18:30:00.000Z',
};

function auraPayload(overrides: { activeJourney: typeof DEMO_JOURNEY | null }) {
  return JSON.stringify({
    contacts: [{ id: 'c1', name: 'Alex', group: 'Family', permission: 'full' as const }],
    activeJourney: overrides.activeJourney,
    mapLayers: { risk: true, safePoints: true, activity: false },
    settings: {
      displayName: 'Jamie',
      voiceKeyword: 'Aura help',
      silentTriggerMs: 800,
      timerDefaultMinutes: 15,
      locationPrecision: 'approximate',
    },
    globalStatus: 'calm',
    onboardingCompleted: true,
    shareLocationPrimerAcknowledged: true,
  });
}

test.describe('README screenshots (opt-in)', () => {
  test.beforeAll(() => {
    mkdirSync(ASSETS_DIR, { recursive: true });
  });

  test('capture home, live journey, emergency @ mobile width', async ({ page, browserName }) => {
    test.skip(!process.env.CAPTURE_README_SCREENSHOTS, 'set CAPTURE_README_SCREENSHOTS=1 to regenerate assets');
    test.skip(browserName !== 'chromium', 'chromium only for deterministic captures');

    await page.setViewportSize({ width: 390, height: 844 });

    await page.addInitScript((payload) => {
      window.localStorage.setItem('aura:v1', payload);
    }, auraPayload({ activeJourney: null }));

    await page.goto('/');
    await page.locator('#main-content').waitFor({ state: 'visible' });
    await page.waitForTimeout(500);
    await page.screenshot({
      path: join(ASSETS_DIR, 'screenshot-home.png'),
      fullPage: false,
    });

    await page.addInitScript((payload) => {
      window.localStorage.setItem('aura:v1', payload);
    }, auraPayload({ activeJourney: DEMO_JOURNEY }));

    await page.goto('/journey/active');
    await page.getByRole('heading', { name: 'Live tracking', level: 1 }).waitFor({ state: 'visible' });
    await page.waitForTimeout(800);
    await page.screenshot({
      path: join(ASSETS_DIR, 'screenshot-journey.png'),
      fullPage: false,
    });

    await page.addInitScript((payload) => {
      window.localStorage.setItem('aura:v1', payload);
    }, auraPayload({ activeJourney: null }));

    await page.goto('/emergency');
    await page.getByRole('heading', { name: 'Emergency', level: 1 }).waitFor({ state: 'visible' });
    await page.waitForTimeout(400);
    await page.screenshot({
      path: join(ASSETS_DIR, 'screenshot-sos.png'),
      fullPage: false,
    });
  });
});
