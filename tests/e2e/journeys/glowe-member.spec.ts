// GloWe signed-in member journeys (individual persona) — adaptive home +
// create menu (FR-GLOWE-016), saved toggles (FR-GLOWE-013), messaging
// (FR-GLOWE-016 AC6) and reporting (FR-GLOWE-015). Uses the seeded persona
// מיכל רוזן; all specs skip when the dev seed has not run.
import { test, expect } from '@playwright/test';
import { gloweUrl, GLOWE_BASE, readMeta, stateFile } from '../lib/glowe';

const meta = readMeta();
test.skip(!meta.seeded, 'GloWe seed personas missing — run scripts/seed-glowe-dev.mjs');

test.use({ storageState: stateFile('michal') });

test.describe('GloWe member (individual)', () => {
  test('home shows the adaptive member view', async ({ page }) => {
    await page.goto(`${GLOWE_BASE}/index.html`);
    await expect(page.locator('#member-home')).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('.user-menu')).toBeVisible();
  });

  test('create menu offers the individual set: post, need, offer', async ({ page }) => {
    await page.goto(`${GLOWE_BASE}/index.html`);
    await page.locator('.header-create-btn').click();
    const options = page.locator('#glowe-create-options .create-menu-option');
    await expect(options).toHaveCount(3);
    await expect(options.nth(0)).toContainText('Post');
    await expect(options.nth(1)).toContainText('Need');
    await expect(options.nth(2)).toContainText('Volunteer Offer');
  });

  test('need option opens the wish composer with tailored required fields', async ({ page }) => {
    await page.goto(`${GLOWE_BASE}/index.html`);
    await page.locator('.header-create-btn').click();
    await page.locator('#glowe-create-options .create-menu-option', { hasText: 'Need' }).click();
    await expect(page.locator('#wish-modal')).toBeVisible();
    await expect(page.locator('#wish-title')).toBeVisible();
  });

  test('saved toggle saves and unsaves a wish card in place', async ({ page }) => {
    await page.goto(gloweUrl('wishing-well.html'));
    const heart = page.locator('.wish-card .heart-button').first();
    test.skip(!(await heart.count()), 'no wish cards on the board yet');
    const initiallySaved = (await heart.getAttribute('aria-pressed')) === 'true';
    await heart.click();
    // saveItem pops a confirmation modal on save; close it if shown.
    const successClose = page.locator('#success-modal .btn-primary');
    if (await successClose.isVisible().catch(() => false)) await successClose.click();
    await expect(heart).toHaveAttribute('aria-pressed', String(!initiallySaved));
    // Restore the original state so the spec is idempotent on dev data.
    await heart.click();
    if (await successClose.isVisible().catch(() => false)) await successClose.click();
    await expect(heart).toHaveAttribute('aria-pressed', String(initiallySaved));
  });

  test('messages inbox lists the seeded conversation and opens the thread', async ({ page }) => {
    await page.goto(gloweUrl('messages.html'));
    const row = page.locator('.chat-inbox-row', { hasText: 'לב פתוח' }).first();
    await expect(row).toBeVisible({ timeout: 20_000 });
    await row.click();
    await expect(page.locator('.chat-thread')).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('.chat-bubble').first()).toBeVisible();
  });

  test('sending a chat message appends it to the thread', async ({ page }) => {
    await page.goto(gloweUrl('messages.html'));
    const row = page.locator('.chat-inbox-row', { hasText: 'לב פתוח' }).first();
    await expect(row).toBeVisible({ timeout: 20_000 });
    await row.click();
    await expect(page.locator('.chat-send-form input')).toBeVisible({ timeout: 20_000 });
    const stamp = `בדיקת E2E ${Date.now()}`;
    await page.locator('.chat-send-form input').fill(stamp);
    await page.locator('.chat-send-form button[type="submit"]').click();
    await expect(page.locator('.chat-bubble.mine', { hasText: stamp })).toBeVisible({ timeout: 20_000 });
  });

  test('reporting a post persists (first time) or dedupes (already reported)', async ({ page }) => {
    await page.goto(gloweUrl('community.html'));
    const card = page.locator('.post-card').first();
    test.skip(!(await card.count()), 'no community posts yet');
    await card.locator('.post-more-menu summary').click();
    await card.locator('.post-more-panel button', { hasText: 'Report' }).click();
    await expect(page.locator('#report-modal')).toBeVisible();
    await page.locator('#report-reason').selectOption('other');
    await page.locator('#report-details').fill('בדיקת E2E — אפשר לדחות את הדיווח הזה.');
    await page.locator('#report-modal button[type="submit"]').click();
    await expect(page.locator('#success-modal #success-title')).toHaveText(/Report received|Already reported/, { timeout: 20_000 });
  });

  test('personal area is reachable from the greeting', async ({ page }) => {
    await page.goto(gloweUrl('my-applications.html'));
    await expect(page.locator('body')).not.toContainText('Sign in to see');
  });
});
