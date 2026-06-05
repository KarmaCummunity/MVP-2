import { test, expect } from '@playwright/test';

test('create-post screen accepts title input', async ({ page }) => {
  await page.goto('/create');
  await expect(page.getByTestId('create-post-screen')).toBeVisible({ timeout: 30_000 });

  const title = page.getByTestId('create-post-title');
  await expect(title).toBeVisible();
  await title.fill('e2e-smoke-title');
  await expect(title).toHaveValue('e2e-smoke-title');
});
