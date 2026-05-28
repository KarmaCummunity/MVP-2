# Web E2E (Playwright)

P0 user journeys against the **live dev deployment** (`DEV_WEB_URL`). See `docs/SSOT/TESTING.md`.

## Local run

```bash
export DEV_WEB_URL=https://mvp-2-dev.up.railway.app
export E2E_TEST_EMAIL=your-dev-test-user@example.com
export E2E_TEST_PASSWORD=…
cd tests/e2e
npm install
npm run install:browsers
npm test
```

## CI

Workflow: `.github/workflows/ci-e2e-dev.yml` — runs on PRs to `main` (from `dev`).

Required GitHub configuration is documented in `docs/SSOT/ENVIRONMENTS.md` § E2E automation.
