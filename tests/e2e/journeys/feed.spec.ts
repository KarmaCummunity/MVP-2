import { test, expect } from '@playwright/test';

test('home feed renders for authenticated user', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('feed-screen')).toBeVisible();

  const postCards = page.getByTestId('feed-post-card');
  const empty = page.getByTestId('feed-empty-state');
  const postCount = await postCards.count();
  if (postCount > 0) {
    await expect(postCards.first()).toBeVisible();
  } else {
    await expect(empty).toBeVisible();
  }
});
