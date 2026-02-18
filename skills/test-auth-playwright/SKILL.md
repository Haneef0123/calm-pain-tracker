---
name: test-auth-playwright
description: Run local app testing with signup/sign-in walls bypassed via ENABLE_TEST_AUTH. Use when testing UI flows, validating routes behind auth, running Playwright checks without OAuth login, or debugging "redirected to /sign-in" blockers in this repository.
---

# Test Auth Playwright

## Workflow

1. Confirm test-auth mode is enabled:
- Check `.env.local` has `ENABLE_TEST_AUTH=true`.
- Keep this for local/dev testing only. Do not use for production validation.

2. Start the app with test-auth mode:
- `ENABLE_TEST_AUTH=true yarn dev`
- If a dev server is already running, continue.

3. Run the route bypass check:
- `bash skills/test-auth-playwright/scripts/run-test-auth-check.sh`
- Optional custom URL: `APP_URL=http://localhost:3001 bash skills/test-auth-playwright/scripts/run-test-auth-check.sh`

4. Report results:
- Include PASS/FAIL per route (`/`, `/history`, `/settings`, `/patterns`).
- Explicitly state whether signup/sign-in wall is present.
- Include screenshot path from script output.

## Notes

- This skill intentionally avoids OAuth login to keep local UI testing unblocked.
- If Playwright runner errors with `EPERM` on `.temp-execution-*`, rerun with escalated permissions.
- For full end-user auth verification, disable test-auth mode and run normal sign-in flow separately.
