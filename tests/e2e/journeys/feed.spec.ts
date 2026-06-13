import { test, expect } from '@playwright/test';

test('home feed renders for authenticated user', async ({ page }) => {
  await page.goto('/');

  // Super-admins land on the admin portal, not the public home feed — switch to
  // the Home tab when the feed is not already the active surface (no-op for
  // normal users). Mirrors auth.setup.ts.
  const feed = page.getByTestId('feed-screen');
  if (!(await feed.isVisible({ timeout: 5_000 }).catch(() => false))) {
    await page.getByRole('tab', { name: 'בית' }).click().catch(() => {});
  }

  await expect(feed).toBeVisible();

  const postCards = page.getByTestId('feed-post-card');
  const empty = page.getByTestId('feed-empty-state');
  const postCount = await postCards.count();
  if (postCount > 0) {
    await expect(postCards.first()).toBeVisible();
  } else {
    await expect(empty).toBeVisible();
  }
});
