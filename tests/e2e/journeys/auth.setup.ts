import { test as setup, expect } from '@playwright/test';

const email = process.env.E2E_TEST_EMAIL;
const password = process.env.E2E_TEST_PASSWORD;

setup('authenticate via email/password', async ({ page }) => {
  if (!email || !password) {
    throw new Error('E2E_TEST_EMAIL and E2E_TEST_PASSWORD must be set');
  }

  await page.goto('/sign-in');
  await page.getByTestId('auth-email').fill(email);
  await page.getByTestId('auth-password').fill(password);
  await page.getByTestId('auth-submit').click();

  const legalContinue = page.getByRole('button', { name: 'המשך' });
  if (await legalContinue.isVisible({ timeout: 8_000 }).catch(() => false)) {
    await legalContinue.click();
  }

  const legalConfirm = page.getByRole('button', { name: 'אישור' });
  if (await legalConfirm.isVisible({ timeout: 5_000 }).catch(() => false)) {
    await legalConfirm.click();
  }

  await expect(page.getByTestId('feed-screen')).toBeVisible({ timeout: 45_000 });
  await page.context().storageState({ path: '.auth/user.json' });
});
