import { test, expect } from '@playwright/test';

test('chat inbox opens', async ({ page }) => {
  await page.goto('/chat');
  await expect(page.getByTestId('chat-inbox-screen')).toBeVisible({ timeout: 30_000 });
});
