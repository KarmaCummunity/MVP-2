// GloWe full-flow journey (FR-GLOWE-006/007/012/016) — the golden path across
// two personas in one spec: a volunteer offers help on an organization's need
// and the conversation lands on the KC chat backend for both sides; the
// duplicate-application guard holds on re-apply. Skips when unseeded.
import { test, expect } from '@playwright/test';
import { gloweUrl, readMeta, stateFile } from '../lib/glowe';

const meta = readMeta();
test.skip(!meta.seeded, 'GloWe seed personas missing — run scripts/seed-glowe-dev.mjs');

test.describe('GloWe full flow: help on a need → conversation on both sides', () => {
  test('volunteer offers support and the org receives the chat', async ({ browser }) => {
    const stamp = Date.now();

    // ── Side A: יוסי (volunteer) offers support on לב פתוח's seeded need ──
    const volunteer = await browser.newContext({ storageState: stateFile('yossi') });
    const pageA = await volunteer.newPage();
    await pageA.goto(gloweUrl('wishing-well.html'));
    const wishCard = pageA.locator('.wish-card', { hasText: 'מתנדבים לחלוקת סלי חג' }).first();
    await expect(wishCard).toBeVisible({ timeout: 25_000 });
    await wishCard.getByRole('button', { name: 'Offer Support' }).click();
    await expect(pageA.locator('#connect-modal')).toBeVisible();
    await pageA.locator('#support-type').selectOption({ index: 1 });
    await pageA.locator('#support-availability').selectOption({ index: 1 });
    await pageA.locator('#connect-message').fill(`אשמח לעזור בחלוקה! (E2E ${stamp})`);
    await pageA.locator('#connect-modal button[type="submit"]').click();

    // FR-GLOWE-016 AC6 — the offer opens the 1:1 chat seeded with the need
    // title; the volunteer lands in the thread.
    await expect(pageA).toHaveURL(/messages\.html\?chat=/, { timeout: 25_000 });
    await expect(pageA.locator('.chat-bubble.mine').last()).toContainText(String(stamp), { timeout: 20_000 });
    await volunteer.close();

    // ── Side B: לב פתוח (org) sees the conversation with the seeded intro ──
    const org = await browser.newContext({ storageState: stateFile('levpatuach') });
    const pageB = await org.newPage();
    await pageB.goto(gloweUrl('messages.html'));
    const inboxRow = pageB.locator('.chat-inbox-row', { hasText: 'יוסי מזרחי' }).first();
    await expect(inboxRow).toBeVisible({ timeout: 25_000 });
    await inboxRow.click();
    await expect(pageB.locator('.chat-bubble', { hasText: String(stamp) }).first()).toBeVisible({ timeout: 25_000 });

    // The org replies; the reply lands in the same thread.
    await pageB.locator('.chat-send-form input').fill(`תודה רבה! נתאם בהמשך (E2E ${stamp})`);
    await pageB.locator('.chat-send-form button[type="submit"]').click();
    await expect(pageB.locator('.chat-bubble.mine', { hasText: `נתאם בהמשך (E2E ${stamp})` })).toBeVisible({ timeout: 20_000 });
    await org.close();
  });

  test('duplicate application guard holds on the seeded opportunity', async ({ browser }) => {
    // יוסי already has a seeded Pending application on the code-mentoring
    // opportunity — applying again must be blocked client-side.
    const volunteer = await browser.newContext({ storageState: stateFile('yossi') });
    const page = await volunteer.newPage();
    await page.goto(gloweUrl('opportunity.html?id=seed-opp-code-mentor'));
    const applyButton = page.getByRole('button', { name: /Apply/i }).first();
    await expect(applyButton).toBeVisible({ timeout: 25_000 });
    await applyButton.click();
    // Either the apply modal opens and submit is rejected as duplicate, or the
    // UI already flags the existing application — both satisfy the guard.
    const applyModal = page.locator('#apply-modal');
    if (await applyModal.isVisible().catch(() => false)) {
      const submit = applyModal.locator('button[type="submit"]');
      if (await submit.isVisible().catch(() => false)) {
        await submit.click();
        await expect(page.locator('#success-modal')).toContainText(/already|כבר/i, { timeout: 20_000 });
      }
    } else {
      await expect(page.locator('body')).toContainText(/already applied|כבר הגשת/i);
    }
    await volunteer.close();
  });
});
