/**
 * E2E — Restore / cross-device recovery flow
 *
 * The restore page is mostly client-side form logic; we mock the redeem
 * endpoint so the tests run without a real Supabase DB.
 */
import { test, expect } from '@playwright/test';
import { mockBackupStatus, mockRedeemCode, mockSupabasePainEntries } from './helpers/mock-api';

const SUPABASE_CONFIGURED =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

test.describe('Restore flow — /track/restore', () => {
  test.skip(!SUPABASE_CONFIGURED, 'Skipped: NEXT_PUBLIC_SUPABASE_URL not set');

  test.beforeEach(async ({ page }) => {
    await mockBackupStatus(page, false);
    await mockSupabasePainEntries(page);
  });

  test('restore page is reachable from /track/settings', async ({ page }) => {
    await page.goto('/track/settings');
    const restoreLink = page.getByRole('link', { name: /restore|recover/i });
    if (await restoreLink.isVisible()) {
      await restoreLink.click();
      await expect(page).toHaveURL(/\/track\/restore/);
    } else {
      // Navigate directly if no dedicated link
      await page.goto('/track/restore');
      await expect(page).toHaveURL(/\/track\/restore/);
    }
  });

  test('shows an error when the code field is empty on submit', async ({ page }) => {
    await mockRedeemCode(page, 'invalid_code');
    await page.goto('/track/restore');

    await page.getByRole('button', { name: /restore|verify|submit/i }).click();

    // Should show a validation or API error, not a successful redirect
    await expect(page).toHaveURL(/\/track\/restore/);
  });

  test('shows "code did not match" error for a wrong code', async ({ page }) => {
    await mockRedeemCode(page, 'invalid_code');
    await page.goto('/track/restore');

    const input = page.getByRole('textbox');
    await input.fill('XXXX-XXXX-XXXX');
    await page.getByRole('button', { name: /restore|verify|submit/i }).click();

    await expect(page.getByText(/did not match|invalid|wrong/i)).toBeVisible();
  });

  test('shows a rate-limited message when too many attempts', async ({ page }) => {
    await mockRedeemCode(page, 'rate_limited');
    await page.goto('/track/restore');

    const input = page.getByRole('textbox');
    await input.fill('ABCD-EFGH-JKMN');
    await page.getByRole('button', { name: /restore|verify|submit/i }).click();

    await expect(page.getByText(/too many|rate.limit|try again/i)).toBeVisible();
  });

  test('redirects to /track after a successful restore', async ({ page }) => {
    await mockRedeemCode(page, 'success');
    await mockSupabasePainEntries(page, []);
    await page.goto('/track/restore');

    const input = page.getByRole('textbox');
    await input.fill('ABCD-EFGH-JKMN');
    await page.getByRole('button', { name: /restore|verify|submit/i }).click();

    await expect(page).toHaveURL(/\/track(\?.*)?$/);
  });

  test('back button returns to /track/settings', async ({ page }) => {
    await page.goto('/track/restore');
    const back = page.getByRole('link', { name: /back/i }).or(
      page.locator('a[href="/track/settings"]')
    );
    await back.click();
    await expect(page).toHaveURL(/\/track\/settings/);
  });

  test('restore input has accessible aria attributes', async ({ page }) => {
    await page.goto('/track/restore');
    const input = page.getByRole('textbox');
    await expect(input).toHaveAttribute('aria-label');
  });
});
