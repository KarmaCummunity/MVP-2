// Hardening (Pre-A2) — integration coverage for the 4 hardening migrations.
// Mapped to: TD-94 (#2, #5, #6) closures + FR-ADMIN-010 (admin_delete_message
// widening) + FR-MOD-001 freshness window.
//
// Suite contract mirrors adminRoleRpc.integration.test.ts: the dev DB has
// a live super_admin row; we revoke it for the duration of the suite and
// un-revoke in afterAll so granted_at/granted_by stay intact.
//
// Tests:
//   1. admin_delete_message succeeds for a moderator (was super_admin only).
//   2. Freshness window: stale reports don't tip the threshold; only fresh
//      ones do.
//   3. Restore audit metadata includes distinct_reporters as a UUID array.
//   4. target_already_moderated raises SQLSTATE P0020 when reporting a
//      post that's already in 'removed_admin'.
//   5. Regression: report_target_not_visible still fires for true privacy
//      gating (target the reporter cannot see).

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const URL = process.env['SUPABASE_URL'];
const SERVICE = process.env['SUPABASE_SERVICE_ROLE_KEY'];
const ANON = process.env['SUPABASE_ANON_KEY'];

const skip = !URL || !SERVICE || !ANON;
const d = skip ? describe.skip : describe;

d('admin portal hardening (integration)', () => {
  let admin: SupabaseClient;
  const cleanup: Array<() => Promise<void>> = [];
  let preExistingSuperAdminGrantId: string | null = null;
  let suiteModeratorClient: SupabaseClient;
  let suiteModeratorUid: string;

  beforeAll(async () => {
    admin = createClient(URL!, SERVICE!, { auth: { persistSession: false } });

    // The single-active-super_admin invariant requires us to temporarily
    // revoke any pre-existing super_admin grant for the suite's duration.
    const { data: pre } = await admin
      .from('admin_role_grants')
      .select('grant_id, user_id')
      .eq('role', 'super_admin')
      .is('revoked_at', null)
      .maybeSingle();
    if (pre?.grant_id) {
      preExistingSuperAdminGrantId = pre.grant_id;
      await admin
        .from('admin_role_grants')
        .update({ revoked_at: new Date().toISOString() })
        .eq('grant_id', pre.grant_id);
    }

    // Suite moderator (used by tests 1 + 3 — and any test that needs a
    // moderator-authenticated client). Seeded once for the whole suite.
    suiteModeratorUid = await seedUser();
    await admin.from('admin_role_grants').insert({ user_id: suiteModeratorUid, role: 'moderator' });
    cleanup.push(async () => {
      await admin
        .from('admin_role_grants')
        .update({ revoked_at: new Date().toISOString() })
        .eq('user_id', suiteModeratorUid)
        .eq('role', 'moderator')
        .is('revoked_at', null);
    });
    suiteModeratorClient = await signInAs(suiteModeratorUid);
  }, 60_000);

  afterAll(async () => {
    for (const fn of cleanup.reverse()) {
      try { await fn(); } catch { /* best-effort */ }
    }
    if (preExistingSuperAdminGrantId !== null) {
      await admin
        .from('admin_role_grants')
        .update({ revoked_at: null, revoked_by: null })
        .eq('grant_id', preExistingSuperAdminGrantId);
      preExistingSuperAdminGrantId = null;
    }
  }, 30_000);

  // ── helpers ───────────────────────────────────────────────────────────────
  async function seedUser(): Promise<string> {
    const stamp = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const email = `hardening-${stamp}@kc.test`;
    const { data, error } = await admin.auth.admin.createUser({
      email, password: 'p4ssword!!', email_confirm: true,
    });
    if (error || !data.user) throw error ?? new Error('no user');
    const uid = data.user.id;
    await admin.from('users').upsert({ user_id: uid, display_name: 'hardening test' });
    cleanup.push(async () => {
      try { await admin.auth.admin.deleteUser(uid); } catch { /* best-effort */ }
    });
    return uid;
  }

  async function signInAs(uid: string): Promise<SupabaseClient> {
    // Re-fetch the email we set above; the auth.admin API requires it for
    // password sign-in. We use service-role to mint a session via OTP-less
    // shortcut: signInWithPassword. Since we set `email_confirm: true` at
    // creation, the password is enough.
    const { data: { user }, error: fetchErr } = await admin.auth.admin.getUserById(uid);
    if (fetchErr || !user?.email) throw fetchErr ?? new Error('user missing email');
    const c = createClient(URL!, ANON!, { auth: { persistSession: false } });
    const { error } = await c.auth.signInWithPassword({
      email: user.email, password: 'p4ssword!!',
    });
    if (error) throw error;
    return c;
  }

  async function seedPost(): Promise<{ postId: string; ownerUid: string }> {
    const ownerUid = await seedUser();
    const { data: city } = await admin
      .from('cities')
      .select('city_id')
      .limit(1)
      .single();
    if (!city) throw new Error('no city in dev db');
    const { data, error } = await admin
      .from('posts')
      .insert({
        owner_id: ownerUid,
        type: 'Give',
        title: 'hardening-' + Math.random().toString(36).slice(2, 8),
        category: 'Other',
        city: city.city_id,
        street: 'Test St',
        street_number: '1',
      })
      .select('post_id')
      .single();
    if (error || !data) throw error ?? new Error('post insert failed');
    return { postId: data.post_id, ownerUid };
  }

  async function seedChatBetween(a: string, b: string): Promise<string> {
    // chats_canonical_order requires participant_a < participant_b lexically.
    const [pa, pb] = a < b ? [a, b] : [b, a];
    const { data, error } = await admin
      .from('chats')
      .insert({ participant_a: pa, participant_b: pb })
      .select('chat_id')
      .single();
    if (error || !data) throw error ?? new Error('chat insert failed');
    return data.chat_id;
  }

  async function fileReportAs(
    client: SupabaseClient,
    reporterId: string,
    targetType: 'post' | 'user' | 'chat',
    targetId: string,
  ): Promise<{ reportId: string; reporterId: string }> {
    const { data, error } = await client
      .from('reports')
      .insert({
        reporter_id: reporterId, target_type: targetType, target_id: targetId, reason: 'Spam',
      })
      .select('report_id')
      .single();
    if (error || !data) throw error ?? new Error('report insert failed');
    return { reportId: data.report_id, reporterId };
  }

  // ── 1. admin_delete_message widened to RBAC (moderator role) ──────────────
  it('admin_delete_message succeeds for a moderator role', async () => {
    const senderUid = await seedUser();
    const otherUid = await seedUser();
    const chatId = await seedChatBetween(senderUid, otherUid);

    // Service-role insert: the messages INSERT policy restricts kind to 'user'
    // for clients, but we want a user-kind message that the admin RPC can
    // delete. Service-role bypasses RLS.
    const { data: msg, error: msgErr } = await admin
      .from('messages')
      .insert({
        chat_id: chatId, sender_id: senderUid, kind: 'user',
        body: 'hardening test message',
      })
      .select('message_id')
      .single();
    if (msgErr || !msg) throw msgErr ?? new Error('message insert failed');

    const { error } = await suiteModeratorClient.rpc('admin_delete_message', {
      p_message_id: msg.message_id,
    });
    expect(error).toBeNull();

    // Migration 0124 keeps the original hard-delete semantic: row is gone.
    const { data: gone } = await admin
      .from('messages')
      .select('message_id')
      .eq('message_id', msg.message_id)
      .maybeSingle();
    expect(gone).toBeNull();
  });

  // ── 2. Freshness window: stale reports don't tip the threshold ────────────
  it('auto-removal counts only reports within the 14-day freshness window', async () => {
    const { postId } = await seedPost();

    // Three reporters file reports dated 20 days ago. Direct service-role
    // INSERT bypasses the BEFORE trigger's auth.uid() check so we can backdate
    // created_at — exactly what we want for "stale signal" simulation.
    const staleDate = new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString();
    const staleReporters: string[] = [];
    for (let i = 0; i < 3; i++) {
      const uid = await seedUser();
      staleReporters.push(uid);
      await admin
        .from('reports')
        .insert({
          reporter_id: uid, target_type: 'post', target_id: postId,
          reason: 'Spam', created_at: staleDate,
        });
    }

    // Three stale reports exist. The AFTER trigger runs on each INSERT but its
    // freshness filter counts only reports within the last 14 days; the
    // backdated rows have just been inserted with a stale created_at, so each
    // re-runs the count and finds zero fresh reporters → no auto-removal.
    const { data: afterStale } = await admin
      .from('posts').select('status').eq('post_id', postId).single();
    expect(afterStale?.status).toBe('open');

    // A fresh 4th report from a NEW reporter brings the fresh count to 1 →
    // still below threshold.
    const freshUid1 = await seedUser();
    const freshClient1 = await signInAs(freshUid1);
    await fileReportAs(freshClient1, freshUid1, 'post', postId);
    const { data: after1Fresh } = await admin
      .from('posts').select('status').eq('post_id', postId).single();
    expect(after1Fresh?.status).toBe('open');

    // 5th report (2nd distinct fresh reporter) → still below threshold.
    const freshUid2 = await seedUser();
    const freshClient2 = await signInAs(freshUid2);
    await fileReportAs(freshClient2, freshUid2, 'post', postId);
    const { data: after2Fresh } = await admin
      .from('posts').select('status').eq('post_id', postId).single();
    expect(after2Fresh?.status).toBe('open');

    // 6th report (3rd distinct fresh reporter) → fresh count is now 3 →
    // auto-removal fires regardless of the 3 stale rows.
    const freshUid3 = await seedUser();
    const freshClient3 = await signInAs(freshUid3);
    await fileReportAs(freshClient3, freshUid3, 'post', postId);
    const { data: after3Fresh } = await admin
      .from('posts').select('status').eq('post_id', postId).single();
    expect(after3Fresh?.status).toBe('removed_admin');
  }, 60_000);

  // ── 3. Restore audit metadata carries distinct_reporters as UUID array ────
  it('admin_restore_target writes distinct_reporters into audit metadata', async () => {
    const { postId } = await seedPost();

    const reporterUids: string[] = [];
    for (let i = 0; i < 3; i++) {
      const uid = await seedUser();
      reporterUids.push(uid);
      const c = await signInAs(uid);
      await fileReportAs(c, uid, 'post', postId);
    }

    // Threshold fired in the 3rd INSERT trigger.
    const { data: removed } = await admin
      .from('posts').select('status').eq('post_id', postId).single();
    expect(removed?.status).toBe('removed_admin');

    // Restore via the suite moderator. Open reports still exist; the audit
    // metadata should carry their reporter_ids.
    const { error: restoreErr } = await suiteModeratorClient.rpc('admin_restore_target', {
      p_target_type: 'post', p_target_id: postId,
    });
    expect(restoreErr).toBeNull();

    const { data: row, error: auditErr } = await admin
      .from('audit_events')
      .select('metadata')
      .eq('action', 'restore_target')
      .eq('target_type', 'post')
      .eq('target_id', postId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    expect(auditErr).toBeNull();
    const reporters = (row?.metadata as { distinct_reporters?: string[] } | null)?.distinct_reporters;
    expect(Array.isArray(reporters)).toBe(true);
    expect(reporters).toHaveLength(3);
    // Deterministic order: the migration sorts by reporter_id ascending.
    const expected = [...reporterUids].sort();
    expect(reporters).toEqual(expected);
  }, 60_000);

  // ── 4. target_already_moderated raises SQLSTATE P0020 ─────────────────────
  it('reporting an already-moderated post raises P0020 target_already_moderated (defense in depth)', async () => {
    // Migration 0127 surfaces P0020 'target_already_moderated' as a
    // defense-in-depth check ordered BEFORE the visibility gate. In
    // practice, the public RLS policies (is_post_visible_to,
    // is_chat_visible_to as of 0028, and users_select with account_status
    // filtering) already hide moderated rows from non-owner viewers, so a
    // regular reporter falls through to 'report_target_not_visible' (test
    // #5 covers that path). The P0020 branch is exercised here through a
    // service-role insert, which bypasses RLS and lets the EXISTS see the
    // moderated row — proving the trigger's branch fires with the correct
    // SQLSTATE for any future surface that legitimately exposes a
    // moderated row to a reporter (e.g. an admin-search RPC).
    //
    // Service role has auth.uid() = NULL. The trigger's reporter sanity
    // check is `new.reporter_id is null or new.reporter_id <> auth.uid()`.
    // With reporter_id set to a real UUID and auth.uid() NULL, the second
    // branch evaluates to NULL (treated as false) and the first is false,
    // so the check passes — letting us reach the P0020 branch.
    const { postId } = await seedPost();

    const { error: flipErr } = await admin
      .from('posts')
      .update({ status: 'removed_admin' })
      .eq('post_id', postId);
    expect(flipErr).toBeNull();

    const reporterUid = await seedUser();
    const { error } = await admin
      .from('reports')
      .insert({
        reporter_id: reporterUid, target_type: 'post', target_id: postId, reason: 'Spam',
      });
    expect(error).not.toBeNull();
    expect(error!.code).toBe('P0020');
    expect(error!.message).toContain('target_already_moderated');
  });

  // ── 5. Regression: report_target_not_visible still fires on privacy gate ──
  it('reporting a target the reporter cannot see still raises report_target_not_visible', async () => {
    const { postId } = await seedPost();

    // Make the post visibility-gated: OnlyMe (owner-only). A different
    // reporter then has no SELECT permission via RLS → posts.exists(...)
    // returns false → 'report_target_not_visible' fires.
    const { error: flipErr } = await admin
      .from('posts')
      .update({ visibility: 'OnlyMe' })
      .eq('post_id', postId);
    expect(flipErr).toBeNull();

    const reporterUid = await seedUser();
    const reporterClient = await signInAs(reporterUid);

    const { error } = await reporterClient
      .from('reports')
      .insert({
        reporter_id: reporterUid, target_type: 'post', target_id: postId, reason: 'Spam',
      });
    expect(error).not.toBeNull();
    // The new P0020 check runs first but only fires for status='removed_admin';
    // this post is status='open' + visibility='OnlyMe' so it falls through to
    // the visibility check which raises 'report_target_not_visible' with the
    // legacy SQLSTATE 'check_violation' (23514).
    expect(error!.message).toContain('report_target_not_visible');
    expect(error!.code).not.toBe('P0020');
  });
});
