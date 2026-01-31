import { test, expect } from '@playwright/test';

// NOTE: These are lightweight perf sanity checks. They are not precise lab metrics,
// but are useful to catch regressions in nav speed and server TTFB behavior.

test.describe('Perf smoke', () => {
  test('home TTFB is fast (static)', async ({ page }) => {
    const [response] = await Promise.all([
      page.waitForResponse((resp) => resp.url().endsWith('/') && resp.request().resourceType() === 'document'),
      page.goto('/', { waitUntil: 'domcontentloaded' }),
    ]);

    // These timestamps are relative to the browser navigation start
    const timing = await response.timing();
    const ttfbMs = timing.responseStart - timing.startTime;
    console.log('TTFB /:', ttfbMs);

    // Static route should be CDN-fast in most regions
    expect(ttfbMs).toBeLessThan(600);
  });

  test('nav to /patterns feels instant-ish', async ({ page }) => {
    await page.goto('/');

    // Give idle prefetch a moment
    await page.waitForTimeout(800);

    const start = Date.now();
    await Promise.all([
      page.waitForURL('**/patterns'),
      page.click('a[href="/patterns"]'),
    ]);
    const navTime = Date.now() - start;
    console.log('Nav to /patterns:', navTime);

    // With prefetch + code-split charts, this should be quick
    expect(navTime).toBeLessThan(800);
  });
});
