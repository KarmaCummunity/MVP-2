import { test as setup, expect } from '@playwright/test';
import { fetchPasswordSession } from '../lib/supabaseSession';

const email = process.env.E2E_TEST_EMAIL;
const password = process.env.E2E_TEST_PASSWORD;
const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'https://roeefqpdbftlndzsvhfj.supabase.co';
const anonKey = process.env.E2E_SUPABASE_ANON_KEY ?? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

setup('inject Supabase session (API, no sign-in UI)', async ({ page, baseURL }) => {
  if (!email || !password) {
    throw new Error('E2E_TEST_EMAIL and E2E_TEST_PASSWORD must be set');
  }
  if (!anonKey) {
    throw new Error('E2E_SUPABASE_ANON_KEY (dev publishable anon) must be set');
  }

  const { storageKey, session } = await fetchPasswordSession({
    supabaseUrl,
    anonKey,
    email,
    password,
  });

  const origin = (baseURL ?? process.env.DEV_WEB_URL ?? '').replace(/\/$/, '');
  if (!origin) throw new Error('Playwright baseURL / DEV_WEB_URL is required');

  await page.goto(`${origin}/`);
  await page.evaluate(
    ({ key, value }) => {
      localStorage.setItem(key, JSON.stringify(value));
    },
    { key: storageKey, value: session },
  );

  await page.reload({ waitUntil: 'networkidle' });

  const legalContinue = page.getByRole('button', { name: 'המשך' });
  if (await legalContinue.isVisible({ timeout: 8_000 }).catch(() => false)) {
    await legalContinue.click();
  }

  const legalConfirm = page.getByRole('button', { name: 'אישור' });
  if (await legalConfirm.isVisible({ timeout: 5_000 }).catch(() => false)) {
    await legalConfirm.click();
  }

  // Super-admin accounts land on the admin portal rather than the public home
  // feed, so the feed surface is not the active screen on first paint. Switch to
  // the Home tab when the feed is not already showing; harmless for normal users
  // (already on Home). Keeps the E2E user able to be a super-admin (D-55).
  const feed = page.getByTestId('feed-screen');
  if (!(await feed.isVisible({ timeout: 5_000 }).catch(() => false))) {
    await page.getByRole('tab', { name: 'בית' }).click().catch(() => {});
  }

  await expect(feed).toBeVisible({ timeout: 45_000 });
  await page.context().storageState({ path: '.auth/user.json' });
});
