# Web E2E (Playwright)

P0 user journeys against the **live dev deployment** (`DEV_WEB_URL`). See `docs/SSOT/TESTING.md`.

## Auth (session injection)

Tests do **not** use the `/sign-in` screen. Setup calls Supabase Auth API, writes `sb-<project-ref>-auth-token` to `localStorage`, then runs feed / create / chat journeys.

Create the user in Supabase dev Dashboard (**Add user** + **Auto Confirm**), even if the login form fails for you personally.

## Local run

```bash
export DEV_WEB_URL=https://mvp-2-dev.up.railway.app
export E2E_TEST_EMAIL=your-dev-test-user@example.com
export E2E_TEST_PASSWORD=…
export E2E_SUPABASE_ANON_KEY=your-dev-publishable-anon-key
node scripts/ensure-e2e-user.mjs   # optional preflight
cd tests/e2e
npm install
npm run install:browsers
npm test
```

## CI

Workflow: `.github/workflows/ci-e2e-dev.yml` — runs on PRs to `main` (from `dev`).

Required GitHub configuration is documented in `docs/SSOT/ENVIRONMENTS.md` § E2E automation.
