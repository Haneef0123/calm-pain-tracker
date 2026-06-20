/**
 * E2E — Recovery-code backup flow
 *
 * Mocks /api/recovery/* so no real Supabase DB writes occur.
 * Requires anonymous auth to be available (real Supabase or local instance).
 */
import { test, expect } from '@playwright/test';
import {
  mockBackupStatus,
  mockCreateCode,
  mockSupabasePainEntries,
} from './helpers/mock-api';

const SUPABASE_CONFIGURED =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

test.describe('Backup flow — /track/settings', () => {
  test.skip(!SUPABASE_CONFIGURED, 'Skipped: NEXT_PUBLIC_SUPABASE_URL not set');

  test('settings page shows "not backed up" status when no code exists', async ({ page }) => {
    await mockBackupStatus(page, false);
    await mockSupabasePainEntries(page);

    await page.goto('/track/settings');
    await expect(page.getByText(/not backed up/i)).toBeVisible();
  });

  test('settings page shows "backed up" status when a code already exists', async ({ page }) => {
    await mockBackupStatus(page, true);
    await mockSupabasePainEntries(page);

    await page.goto('/track/settings');
    await expect(page.getByText(/backed up/i)).toBeVisible();
  });

  test('backup drawer opens and displays a recovery code', async ({ page }) => {
    await mockBackupStatus(page, false);
    await mockCreateCode(page, 'ABCD-EFGH-JKMN');
    await mockSupabasePainEntries(page);

    await page.goto('/track/settings');

    // Open the backup drawer
    const saveButton = page.getByRole('button', { name: /save.*code|back.*up|generate/i });
    await saveButton.click();

    // Step through to the reveal step — click "Generate code" or equivalent CTA
    const generateBtn = page.getByRole('button', { name: /generate|get.*code/i });
    if (await generateBtn.isVisible()) {
      await generateBtn.click();
    }

    // The formatted code should appear
    await expect(page.getByText('ABCD-EFGH-JKMN')).toBeVisible();
  });

  test('recovery code card has a Copy button', async ({ page }) => {
    await mockBackupStatus(page, false);
    await mockCreateCode(page, 'ABCD-EFGH-JKMN');
    await mockSupabasePainEntries(page);

    await page.goto('/track/settings');
    const saveButton = page.getByRole('button', { name: /save.*code|back.*up|generate/i });
    await saveButton.click();

    const generateBtn = page.getByRole('button', { name: /generate|get.*code/i });
    if (await generateBtn.isVisible()) await generateBtn.click();

    await expect(page.getByRole('button', { name: /copy/i })).toBeVisible();
  });

  test('backup nudge banner appears on /track when not backed up', async ({ page }) => {
    await mockBackupStatus(page, false);
    await mockSupabasePainEntries(page, [
      // Simulate at least one entry so the nudge renders
      { id: '1', pain_level: 5, created_at: new Date().toISOString() },
    ]);

    await page.goto('/track');
    await expect(page.getByText(/save your data/i)).toBeVisible();
  });

  test('nudge banner is absent when already backed up', async ({ page }) => {
    await mockBackupStatus(page, true);
    await mockSupabasePainEntries(page, [
      { id: '1', pain_level: 5, created_at: new Date().toISOString() },
    ]);

    await page.goto('/track');
    await expect(page.getByText(/save your data/i)).not.toBeVisible();
  });
});
