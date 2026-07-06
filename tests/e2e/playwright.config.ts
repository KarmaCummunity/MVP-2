import { defineConfig, devices } from '@playwright/test';

const baseURL = (process.env.DEV_WEB_URL ?? 'http://127.0.0.1:8765').replace(/\/$/, '');

export default defineConfig({
  testDir: './journeys',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  timeout: 90_000,
  expect: {
    timeout: process.env.CI ? 30_000 : 15_000,
  },
  use: {
    baseURL,
    locale: 'he-IL',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // Sandboxed/remote environments ship a pinned Chromium instead of the
    // Playwright-managed download; point at it via env when needed.
    ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
      ? { launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE } }
      : {}),
  },
  projects: [
    {
      name: 'setup',
      testMatch: /(^|\/)auth\.setup\.ts/,
    },
    {
      name: 'journeys',
      testIgnore: /auth\.setup\.ts|glowe-/,
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: '.auth/user.json',
      },
    },
    // GloWe suite (FR-GLOWE-*): runs against DEV_WEB_URL + /glowe (or a local
    // static server via GLOWE_WEB_URL). Signed-in specs consume per-persona
    // storage states minted by glowe-auth.setup.ts and skip when the dev seed
    // (scripts/seed-glowe-dev.mjs) has not run.
    {
      name: 'glowe-setup',
      testMatch: /glowe-auth\.setup\.ts/,
    },
    {
      name: 'glowe',
      testMatch: /glowe-.*\.spec\.ts/,
      dependencies: ['glowe-setup'],
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],
});
