import { expect, test, type Page } from '@playwright/test';

/**
 * PDR §4.1 cold start: no `aura:v1` → onboarding → home shell inside AppShell.
 * Mirrors `emergency-pre-onboarding.spec.ts` (fresh storage) but completes `/welcome` and asserts `/` + `#main-content`.
 */
function attachErrorCollectors(page: Page) {
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];
  page.on('pageerror', (err) => pageErrors.push(err.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  return { pageErrors, consoleErrors };
}

test.describe('welcome onboarding → home', () => {
  test('fresh profile: / redirects to welcome; full steps → home shell; no page/console errors', async ({
    page,
  }) => {
    const { pageErrors, consoleErrors } = attachErrorCollectors(page);

    await page.addInitScript(() => {
      window.localStorage.removeItem('aura:v1');
    });

    await page.goto('/');

    await expect(page).toHaveURL(/\/welcome$/);
    await expect(page.getByRole('heading', { name: 'Welcome to Aura', level: 1 })).toBeVisible();
    await expect(page.locator('#main-content')).toBeVisible();

    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.getByRole('heading', { name: 'Emergency (SOS)', level: 1 })).toBeVisible();

    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.getByRole('heading', { name: 'Journeys and location', level: 1 })).toBeVisible();

    await page.getByRole('button', { name: 'Get started' }).click();

    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator('#main-content')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Home', level: 1 })).toBeAttached();
    await expect(page.getByRole('link', { name: 'Settings', exact: true })).toBeVisible();

    expect(pageErrors, `pageerror: ${pageErrors.join('; ')}`).toEqual([]);
    expect(consoleErrors, `console.error: ${consoleErrors.join('; ')}`).toEqual([]);
  });

  test('fresh profile: skip on first step → home shell; no page/console errors', async ({ page }) => {
    const { pageErrors, consoleErrors } = attachErrorCollectors(page);

    await page.addInitScript(() => {
      window.localStorage.removeItem('aura:v1');
    });

    await page.goto('/welcome');

    await expect(page.getByRole('heading', { name: 'Welcome to Aura', level: 1 })).toBeVisible();
    await page.getByRole('button', { name: 'Skip for now' }).click();

    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator('#main-content')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Settings', exact: true })).toBeVisible();

    expect(pageErrors, `pageerror: ${pageErrors.join('; ')}`).toEqual([]);
    expect(consoleErrors, `console.error: ${consoleErrors.join('; ')}`).toEqual([]);
  });
});
