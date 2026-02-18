#!/usr/bin/env bash
set -euo pipefail

APP_URL="${APP_URL:-http://localhost:3000}"
PLAYWRIGHT_SKILL_DIR="${PLAYWRIGHT_SKILL_DIR:-$HOME/.codex/skills/playwright-skill}"
TEST_SCRIPT_PATH="/tmp/playwright-test-enable-test-auth.js"

cat > "$TEST_SCRIPT_PATH" <<'EOF'
const { chromium } = require('playwright');

const TARGET_URL = process.env.APP_URL || 'http://localhost:3000';
const ROUTES = ['/', '/history', '/settings', '/patterns'];

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 50 });
  const page = await browser.newPage();

  try {
    console.log(`Testing ENABLE_TEST_AUTH flow against: ${TARGET_URL}`);
    console.log('');

    for (const path of ROUTES) {
      const url = `${TARGET_URL}${path}`;
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});

      const currentPath = new URL(page.url()).pathname;
      const blockedBySignIn = currentPath === '/sign-in';

      console.log(`[${blockedBySignIn ? 'FAIL' : 'PASS'}] ${path} -> ${currentPath}`);
    }

    await page.goto(`${TARGET_URL}/`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.screenshot({ path: '/tmp/enable-test-auth-home.png', fullPage: true });

    const hasSignInButton = await page
      .locator('button:has-text("Sign in with Google")')
      .isVisible()
      .catch(() => false);

    console.log('');
    console.log(`Root shows sign-in button: ${hasSignInButton}`);
    console.log('Screenshot: /tmp/enable-test-auth-home.png');
  } catch (error) {
    console.error('Test failed:', error.message);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();
EOF

if [[ ! -d "$PLAYWRIGHT_SKILL_DIR" ]]; then
  echo "Playwright skill directory not found: $PLAYWRIGHT_SKILL_DIR" >&2
  exit 1
fi

cd "$PLAYWRIGHT_SKILL_DIR"
APP_URL="$APP_URL" node run.js "$TEST_SCRIPT_PATH"
