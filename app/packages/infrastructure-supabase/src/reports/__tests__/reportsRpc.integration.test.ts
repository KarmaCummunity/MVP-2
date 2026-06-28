// A1 — Reports moderation RPC integration tests (widening + TD-94).
// Mapped to spec: FR-ADMIN-012, FR-ADMIN-013. Closes TD-94.
//
// Covers:
//   1. admin_dismiss_report under moderator role.
//   2. admin_remove_post under moderator role.
//   3. admin_confirm_report under moderator role.
//   4. admin_ban_user rejects moderator (42501) — super_admin only.
//   5. TD-94: 3 reporters → auto-remove → dismiss one → restored AND
//      the other two reports stay 'open'.
//
// Inbox + case detail tests live in reportsInboxAndDetail.integration.test.ts.

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  fileReport, seedPost, seedUser, setupSuiteFixtures, signedInClient,
  skip, teardownSuiteFixtures, type SuiteFixtures,
} from './reportsTestHelpers';

const d = skip ? describe.skip : describe;

d('A1 reports moderation RPCs (integration)', () => {
  let ctx: SuiteFixtures;
  let admin: SupabaseClient;
  let moderatorClient: SupabaseClient;

  beforeAll(async () => {
    ctx = await setupSuiteFixtures();
    admin = ctx.admin;
    moderatorClient = ctx.moderatorClient;
  }, 60_000);

  afterAll(async () => {
    await teardownSuiteFixtures(ctx);
  }, 30_000);

  // ── 1. admin_dismiss_report works for moderator ─────────────────────────
  it('admin_dismiss_report succeeds for moderator role', async () => {
    const { postId } = await seedPost(admin, ctx.cleanup);
    const reporter = await seedUser(admin, ctx.cleanup);
    const reporterClient = await signedInClient(reporter);
    const reportId = await fileReport(reporterClient, 'post', postId);

    const { error } = await moderatorClient.rpc('admin_dismiss_report', {
      p_report_id: reportId,
    });
    expect(error).toBeNull();

    const { data: row } = await admin
      .from('reports')
      .select('status')
      .eq('report_id', reportId)
      .single();
    expect(row?.status).toBe('dismissed_no_violation');
  });

  // ── 2. admin_remove_post works for moderator ────────────────────────────
  it('admin_remove_post succeeds for moderator role', async () => {
    const { postId } = await seedPost(admin, ctx.cleanup);
    const { error } = await moderatorClient.rpc('admin_remove_post', {
      p_post_id: postId,
    });
    expect(error).toBeNull();
    const { data: row } = await admin
      .from('posts')
      .select('status, status_before_admin_removal')
      .eq('post_id', postId)
      .single();
    expect(row?.status).toBe('removed_admin');
    expect(row?.status_before_admin_removal).toBe('open');
  });

  // ── 3. admin_confirm_report works for moderator ─────────────────────────
  it('admin_confirm_report succeeds for moderator role', async () => {
    const { postId } = await seedPost(admin, ctx.cleanup);
    const reporter = await seedUser(admin, ctx.cleanup);
    const reporterClient = await signedInClient(reporter);
    const reportId = await fileReport(reporterClient, 'post', postId);

    const { error } = await moderatorClient.rpc('admin_confirm_report', {
      p_report_id: reportId,
    });
    expect(error).toBeNull();
    const { data: row } = await admin
      .from('reports')
      .select('status')
      .eq('report_id', reportId)
      .single();
    expect(row?.status).toBe('confirmed_violation');
  });

  // ── 4. admin_ban_user rejects moderator ─────────────────────────────────
  it('admin_ban_user rejects moderator role with 42501', async () => {
    const victim = await seedUser(admin, ctx.cleanup);
    const { error } = await moderatorClient.rpc('admin_ban_user', {
      p_target_user_id: victim.uid,
      p_reason: 'policy_violation',
      p_note: null,
    });
    expect(error).not.toBeNull();
    // admin_ban_user still uses is_admin(); moderator is_super_admin=false so
    // 'forbidden' / 42501 is raised.
    expect(error!.code).toBe('42501');
  });

  // ── 5. TD-94 fix ────────────────────────────────────────────────────────
  it('TD-94: dismissing one of 3 reports restores target but leaves other reports open',
    async () => {
      const { postId } = await seedPost(admin, ctx.cleanup);
      const r1 = await signedInClient(await seedUser(admin, ctx.cleanup));
      const r2 = await signedInClient(await seedUser(admin, ctx.cleanup));
      const r3 = await signedInClient(await seedUser(admin, ctx.cleanup));

      const id1 = await fileReport(r1, 'post', postId);
      const id2 = await fileReport(r2, 'post', postId);
      const id3 = await fileReport(r3, 'post', postId);

      // After 3 distinct reporters: auto-removal trigger fires.
      const { data: postAfter3 } = await admin
        .from('posts').select('status').eq('post_id', postId).single();
      expect(postAfter3?.status).toBe('removed_admin');

      // Dismiss one report → count drops to 2 → cascade restore should fire.
      const { error: dismissErr } = await moderatorClient.rpc('admin_dismiss_report', {
        p_report_id: id1,
      });
      expect(dismissErr).toBeNull();

      const { data: postRestored } = await admin
        .from('posts').select('status').eq('post_id', postId).single();
      expect(postRestored?.status).toBe('open');

      // TD-94 invariant: the other two reports MUST stay open.
      const { data: rows } = await admin
        .from('reports')
        .select('report_id, status')
        .in('report_id', [id2, id3])
        .order('report_id');
      expect(rows).toHaveLength(2);
      for (const r of rows!) {
        expect(r.status).toBe('open');
      }
    },
    30_000,
  );
});
