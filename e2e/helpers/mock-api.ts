import type { Page } from '@playwright/test';

/** Mock GET /api/recovery/status */
export async function mockBackupStatus(page: Page, backedUp: boolean) {
  await page.route('**/api/recovery/status', (route) =>
    route.fulfill({ json: { backedUp } })
  );
}

/** Mock POST /api/recovery/create — returns a formatted code */
export async function mockCreateCode(page: Page, code = 'ABCD-EFGH-JKMN') {
  await page.route('**/api/recovery/create', (route) =>
    route.fulfill({ json: { code } })
  );
}

/** Mock POST /api/recovery/redeem */
export async function mockRedeemCode(
  page: Page,
  outcome: 'success' | 'invalid_code' | 'rate_limited' | 'server_error'
) {
  const responses: Record<string, { status: number; json: object }> = {
    success: { status: 200, json: { success: true } },
    invalid_code: { status: 401, json: { error: 'invalid_code' } },
    rate_limited: { status: 429, json: { error: 'rate_limited', retryAfterMinutes: 15 } },
    server_error: { status: 500, json: { error: 'server_error' } },
  };
  const { status, json } = responses[outcome];
  await page.route('**/api/recovery/redeem', (route) =>
    route.fulfill({ status, json })
  );
}

/** Stub Supabase REST calls so the pain-entries hook returns an empty list */
export async function mockSupabasePainEntries(page: Page, entries: object[] = []) {
  await page.route('**/rest/v1/pain_entries*', (route) =>
    route.fulfill({ json: entries, headers: { 'content-range': '0-0/0' } })
  );
}
