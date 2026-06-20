/**
 * E2E — Anonymous /track experience
 *
 * Requires a running Next.js server with Supabase anonymous sign-ins enabled.
 * Set PLAYWRIGHT_BASE_URL if the server is not on localhost:3000.
 *
 * The tests mock pain_entries and recovery API endpoints so no real DB rows
 * are written; auth (anonymous session creation) still goes through Supabase.
 */
import { test, expect } from '@playwright/test';
import { mockBackupStatus, mockSupabasePainEntries } from './helpers/mock-api';

const SUPABASE_CONFIGURED =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

test.describe('Anonymous /track page', () => {
  test.skip(!SUPABASE_CONFIGURED, 'Skipped: NEXT_PUBLIC_SUPABASE_URL not set');

  test.beforeEach(async ({ page }) => {
    await mockBackupStatus(page, false);
    await mockSupabasePainEntries(page, []);
  });

  test('loads without redirecting to sign-in', async ({ page }) => {
    await page.goto('/track');
    await expect(page).not.toHaveURL(/sign-in/);
    await expect(page).toHaveURL(/\/track/);
  });

  test('shows the day header with a settings gear link', async ({ page }) => {
    await page.goto('/track');
    const gear = page.locator('a[href="/track/settings"]');
    await expect(gear).toBeVisible();
  });

  test('renders the pain-level selector', async ({ page }) => {
    await page.goto('/track');
    // The entry form should contain pain level buttons (0–10)
    const painButtons = page.locator('[data-pain-level]');
    await expect(painButtons.first()).toBeVisible();
  });

  test('navigates to /track/settings via the gear icon', async ({ page }) => {
    await page.goto('/track');
    await page.click('a[href="/track/settings"]');
    await expect(page).toHaveURL(/\/track\/settings/);
  });

  test('has no links to the main app or sign-in page', async ({ page }) => {
    await page.goto('/track');
    const signInLinks = page.locator('a[href*="sign-in"]');
    await expect(signInLinks).toHaveCount(0);
  });
});
