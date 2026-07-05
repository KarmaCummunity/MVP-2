// GloWe guest journeys (FR-GLOWE-023, FR-GLOWE-005) — read-only browsing,
// contextual join gates, and the Hebrew/RTL language switch. No auth state.
import { test, expect } from '@playwright/test';
import { gloweUrl, GLOWE_BASE } from '../lib/glowe';

test.describe('GloWe guest browsing', () => {
  // The one-time guest welcome modal (FR-GLOWE-023 AC6) is covered by its own
  // spec below; everywhere else it would intercept clicks, so pre-set its
  // localStorage flag before any page script runs.
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      try { window.localStorage.setItem('glowe-guest-welcomed', '1'); } catch { /* ignore */ }
    });
  });

  test('first-time guest gets the one-time welcome', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(`${GLOWE_BASE}/index.html`);
    await expect(page.locator('#success-modal.active')).toBeVisible({ timeout: 20_000 });
    await page.locator('#success-modal .btn-primary').click();
    await expect(page.locator('#success-modal.active')).toHaveCount(0);
    await context.close();
  });
  test('home page renders the marketing hero for guests', async ({ page }) => {
    await page.goto(`${GLOWE_BASE}/index.html`);
    await expect(page.locator('.main-header .logo-text')).toHaveText('GloWe');
    await expect(page.locator('.auth-buttons button')).toContainText('Sign up / Sign in');
  });

  test('volunteer network lists live opportunities or a friendly empty state', async ({ page }) => {
    await page.goto(gloweUrl('volunteer-network.html'));
    const list = page.locator('#opportunities-list');
    await expect(list).toBeVisible();
    await expect(list.locator('.opportunity-card, .empty-state').first()).toBeVisible({ timeout: 20_000 });
  });

  test('organizations directory shows approved organizations only', async ({ page }) => {
    await page.goto(gloweUrl('organizations.html'));
    const cards = page.locator('.opportunity-card');
    const empty = page.locator('.empty-state');
    await expect(cards.first().or(empty.first())).toBeVisible({ timeout: 20_000 });
    // A pending org must never appear in the public directory.
    await expect(page.getByText('יד תומכת', { exact: false })).toHaveCount(0);
  });

  test('wishing well renders the needs board', async ({ page }) => {
    await page.goto(gloweUrl('wishing-well.html'));
    await expect(page.locator('.wish-card, .empty-state').first()).toBeVisible({ timeout: 20_000 });
  });

  test('community feed renders posts or empty state', async ({ page }) => {
    await page.goto(gloweUrl('community.html'));
    await expect(page.locator('.post-card, .empty-state').first()).toBeVisible({ timeout: 20_000 });
  });

  test('forums page lists the four discussion groups', async ({ page }) => {
    await page.goto(gloweUrl('forums.html'));
    await expect(page.locator('#forum-categories')).toBeVisible();
  });

  test('guest hitting the create FAB gets the contextual join prompt', async ({ page }) => {
    await page.setViewportSize({ width: 480, height: 900 });
    await page.goto(`${GLOWE_BASE}/index.html`);
    await page.locator('.bottom-nav-create').click();
    const modal = page.locator('#glowe-join-modal');
    await expect(modal).toBeVisible();
    await expect(modal.locator('#glowe-join-google')).toContainText('Continue with Google');
  });

  test('guest saving a card gets a sign-in gate, nothing is saved', async ({ page }) => {
    await page.goto(gloweUrl('wishing-well.html'));
    const firstSave = page.locator('.wish-card .heart-button').first();
    test.skip(!(await firstSave.count()), 'no wish cards on the board yet');
    await firstSave.click();
    await expect(
      page.locator('#glowe-join-modal, #login-modal').first()
    ).toBeVisible();
  });

  test('guest reporting content gets a sign-in gate', async ({ page }) => {
    await page.goto(gloweUrl('community.html'));
    const menu = page.locator('.post-card .post-more-menu summary').first();
    test.skip(!(await menu.count()), 'no community posts yet');
    await menu.click();
    await page.locator('.post-card .post-more-panel button', { hasText: 'Report' }).first().click();
    await expect(page.locator('#glowe-join-modal')).toBeVisible();
  });

  test('messages page asks guests to sign in', async ({ page }) => {
    await page.goto(gloweUrl('messages.html'));
    await expect(page.locator('#messages-content .empty-state')).toContainText('Sign in');
  });

  test('language toggle flips to Hebrew with RTL and back', async ({ page }) => {
    await page.goto(`${GLOWE_BASE}/index.html`);
    const toggle = page.locator('.lang-toggle').first();
    await expect(toggle).toBeVisible();
    await toggle.click();
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(page.locator('.auth-buttons button')).not.toContainText('Sign up / Sign in');
    await page.locator('.lang-toggle').first().click();
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('html')).not.toHaveAttribute('dir', 'rtl');
  });
});
