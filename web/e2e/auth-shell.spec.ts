import { expect, test } from '@playwright/test';

test.describe('/auth shell (AURA-312)', () => {
  test('loads skip link, main landmark, Sign in title, degraded setup copy — no page/console errors', async ({
    page,
  }) => {
    const pageErrors: string[] = [];
    const consoleErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto('/auth');

    await expect(page.locator('#main-content')).toBeVisible();
    await expect(page.getByRole('link', { name: /skip to main content/i })).toBeAttached();
    await expect.poll(async () => page.title()).toMatch(/^Sign in · /);
    await expect(page.getByRole('heading', { name: 'Aura account', level: 1 })).toBeVisible();

    // CI/dev without Firebase + BFF: assert degraded setup copy, not OAuth success.
    await expect(page.getByRole('alert').filter({ hasText: /VITE_FIREBASE_/i })).toBeVisible();
    await expect(page.getByRole('alert').filter({ hasText: /VITE_AURA_BFF_URL/i })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeDisabled();

    expect(pageErrors, `pageerror: ${pageErrors.join('; ')}`).toEqual([]);
    expect(consoleErrors, `console.error: ${consoleErrors.join('; ')}`).toEqual([]);
  });
});
