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
  },
  projects: [
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: 'journeys',
      testIgnore: /auth\.setup\.ts/,
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: '.auth/user.json',
      },
    },
  ],
});
