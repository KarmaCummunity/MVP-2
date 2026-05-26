// A1 — Reports dashboard RPC integration tests.
// Mapped to spec: FR-ADMIN-012, FR-ADMIN-013. Closes TD-94.
//
// Covers:
//   1. admin_dismiss_report under moderator role.
//   2. admin_remove_post under moderator role.
//   3. admin_confirm_report under moderator role.
//   4. admin_ban_user rejects moderator (42501) — super_admin only.
//   5. TD-94: 3 reporters → auto-remove → dismiss one → restored AND
//      the other two reports stay 'open'.
//   6. reports_open_inbox returns empty rows when no reports.
//   7. reports_open_inbox collapses duplicates per (target_type, target_id).
//   8. reports_open_inbox honors p_target_type_filter='post'.
//   9. reports_open_inbox paginates: 27 cases, limit 10 → 3 pages, last page
//      no next_cursor, no duplicates across pages.
//  10. reports_case_detail returns target + reporters + timeline.
//  11. reports_case_detail raises 22023 on invalid target_type.
//
// Idempotency: the suite revokes any pre-existing live super_admin grant in
// beforeAll, restores it in afterAll. Moderator/super_admin grants for the
// suite's own actors are created on demand and revoked on teardown.

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const URL = process.env['SUPABASE_URL'];
const SERVICE = process.env['SUPABASE_SERVICE_ROLE_KEY'];
const ANON = process.env['SUPABASE_ANON_KEY'];

const skip = !URL || !SERVICE || !ANON;
const d = skip ? describe.skip : describe;

interface SeededUser {
  uid: string;
  email: string;
  password: string;
}

d('A1 reports RPCs (integration)', () => {
  let admin: SupabaseClient;
  const cleanup: Array<() => Promise<void>> = [];
  let preExistingSuperAdminGrantId: string | null = null;

  // Roles seeded once per suite.
  let suiteSuperAdmin: SeededUser;
  let superAdminClient: SupabaseClient;

  // Moderator seeded once and reused across tests that need a moderator caller.
  let suiteModerator: SeededUser;
  let moderatorClient: SupabaseClient;

  // ── helpers ───────────────────────────────────────────────────────────────
  function makeAnon(): SupabaseClient {
    return createClient(URL!, ANON!, { auth: { persistSession: false } });
  }

  async function seedUser(): Promise<SeededUser> {
    const stamp = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const email = `a1-reports-${stamp}@kc.test`;
    const password = 'p4ssword!!';
    const { data, error } = await admin.auth.admin.createUser({
      email, password, email_confirm: true,
    });
    if (error || !data.user) throw error ?? new Error('no user');
    const uid = data.user.id;
    cleanup.push(async () => {
      // Deleting the auth user cascades to public.users → public.reports etc.
      try { await admin.auth.admin.deleteUser(uid); } catch { /* best-effort */ }
    });
    return { uid, email, password };
  }

  async function signedInClient(u: SeededUser): Promise<SupabaseClient> {
    const c = makeAnon();
    const { error } = await c.auth.signInWithPassword({
      email: u.email, password: u.password,
    });
    if (error) throw error;
    return c;
  }

  /** Grant a role to a user, revoke it during cleanup. */
  async function grantRole(uid: string, role: string): Promise<void> {
    const { error } = await admin
      .from('admin_role_grants')
      .insert({ user_id: uid, role });
    if (error) throw error;
    cleanup.push(async () => {
      await admin
        .from('admin_role_grants')
        .update({ revoked_at: new Date().toISOString() })
        .eq('user_id', uid)
        .eq('role', role)
        .is('revoked_at', null);
    });
  }

  /** Seed a post owned by a fresh user. Returns post_id + owner uid. */
  async function seedPost(): Promise<{ postId: string; ownerUid: string }> {
    const owner = await seedUser();
    const { data: city } = await admin
      .from('cities')
      .select('city_id, name_he')
      .limit(1)
      .single();
    if (!city) throw new Error('no city in dev db');
    // Use service-role insert; bypasses RLS but trigger reports_validate_before_insert
    // only fires on report inserts, not posts. posts_enforce_active_cap fires on
    // status changes, INSERT included, but our owner has 0 active posts.
    const { data, error } = await admin
      .from('posts')
      .insert({
        owner_id: owner.uid,
        type: 'Give',
        title: 'test-' + Math.random().toString(36).slice(2, 8),
        category: 'Other',
        city: city.city_id,
        street: 'Test St',
        street_number: '1',
      })
      .select('post_id')
      .single();
    if (error || !data) throw error ?? new Error('post insert failed');
    return { postId: data.post_id, ownerUid: owner.uid };
  }

  /** Insert a report as the given user via their authenticated client. */
  async function fileReport(
    reporter: SupabaseClient,
    targetType: 'post' | 'user' | 'chat',
    targetId: string,
    reason: 'Spam' | 'Offensive' | 'Misleading' | 'Illegal' | 'Other' = 'Spam',
  ): Promise<string> {
    const { data: row, error } = await reporter
      .from('reports')
      .insert({ target_type: targetType, target_id: targetId, reason,
                reporter_id: (await reporter.auth.getUser()).data.user!.id })
      .select('report_id')
      .single();
    if (error) throw error;
    return row!.report_id;
  }

  beforeAll(async () => {
    admin = createClient(URL!, SERVICE!, { auth: { persistSession: false } });

    // Single-active-super_admin invariant — stash and revoke any prior holder.
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

    // Suite super admin (single instance reused).
    suiteSuperAdmin = await seedUser();
    await grantRole(suiteSuperAdmin.uid, 'super_admin');
    superAdminClient = await signedInClient(suiteSuperAdmin);

    // Suite moderator.
    suiteModerator = await seedUser();
    await grantRole(suiteModerator.uid, 'moderator');
    moderatorClient = await signedInClient(suiteModerator);
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

  // ── 1. admin_dismiss_report works for moderator ─────────────────────────
  it('admin_dismiss_report succeeds for moderator role', async () => {
    const { postId } = await seedPost();
    const reporter = await seedUser();
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
    const { postId } = await seedPost();
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
    const { postId } = await seedPost();
    const reporter = await seedUser();
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
    const victim = await seedUser();
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
      const { postId } = await seedPost();
      const r1 = await signedInClient(await seedUser());
      const r2 = await signedInClient(await seedUser());
      const r3 = await signedInClient(await seedUser());

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

  // ── 6. reports_open_inbox empty ─────────────────────────────────────────
  it('reports_open_inbox returns empty rows when filtered to a non-existent reporter',
    async () => {
      // Filtering by a fresh user with no reports gives an empty result, no
      // matter the global inbox state.
      const ghost = await seedUser();
      const { data, error } = await moderatorClient.rpc('reports_open_inbox', {
        p_reporter_filter: ghost.uid,
        p_limit: 25,
      });
      expect(error).toBeNull();
      expect(data).toMatchObject({ rows: [] });
      expect((data as { next_cursor: unknown }).next_cursor).toBeNull();
    },
  );

  // ── 7. reports_open_inbox groups duplicates per target ──────────────────
  it('reports_open_inbox returns one row per (target_type, target_id)', async () => {
    const { postId } = await seedPost();
    const a = await signedInClient(await seedUser());
    const b = await signedInClient(await seedUser());
    await fileReport(a, 'post', postId);
    await fileReport(b, 'post', postId);

    const { data, error } = await moderatorClient.rpc('reports_open_inbox', {
      p_target_type_filter: 'post',
      p_limit: 100,
    });
    expect(error).toBeNull();
    const rows = (data as { rows: Array<{ target_id: string; reporter_count: number }> }).rows;
    const ourRow = rows.find((r) => r.target_id === postId);
    expect(ourRow).toBeDefined();
    expect(ourRow!.reporter_count).toBe(2);
  });

  // ── 8. reports_open_inbox honors target_type filter ─────────────────────
  it('reports_open_inbox honors p_target_type_filter', async () => {
    // Seed: one open post-report.
    const { postId } = await seedPost();
    const r = await signedInClient(await seedUser());
    await fileReport(r, 'post', postId);

    const { data, error } = await moderatorClient.rpc('reports_open_inbox', {
      p_target_type_filter: 'user',
      p_limit: 100,
    });
    expect(error).toBeNull();
    const rows = (data as { rows: Array<{ target_type: string }> }).rows;
    for (const row of rows) {
      expect(row.target_type).toBe('user');
    }
  });

  // ── 9. reports_open_inbox cursor pagination ─────────────────────────────
  it('reports_open_inbox paginates correctly: 27 cases, limit 10 → 3 pages',
    async () => {
      // Use a single reporter filter to isolate our seeded cases from any
      // ambient open reports living in the dev DB.
      const reporter = await seedUser();
      const reporterClient = await signedInClient(reporter);

      // Seed 27 distinct posts, file one report on each. Sleep 4ms between
      // inserts so created_at orders are unambiguous.
      const seededTargetIds: string[] = [];
      for (let i = 0; i < 27; i += 1) {
        const { postId } = await seedPost();
        const rid = await fileReport(reporterClient, 'post', postId);
        seededTargetIds.push(postId);
        if (!rid) throw new Error('report insert returned no id');
        // Postgres NOW() inside a single statement is fine — but we want
        // monotonic created_at across reports for deterministic ordering.
        await new Promise((r) => setTimeout(r, 4));
      }

      // Sanity: confirm all 27 rows landed in public.reports before walking
      // pages. Catches the case where a side-effect (reporter_hide insert,
      // support-thread injection) silently broke an insert.
      const { count: rowCount } = await admin
        .from('reports')
        .select('report_id', { count: 'exact', head: true })
        .eq('reporter_id', reporter.uid)
        .eq('status', 'open');
      expect(rowCount).toBe(27);

      const seenIds = new Set<string>();
      let cursor: unknown = null;
      const pageSizes: number[] = [];
      const pageLimit = 10;

      // Walk the pages.
      for (let page = 0; page < 5; page += 1) {
        // 5 = safety cap
        const { data, error } = await moderatorClient.rpc('reports_open_inbox', {
          p_target_type_filter: 'post',
          p_reporter_filter: reporter.uid,
          p_cursor: cursor as object | null,
          p_limit: pageLimit,
        });
        expect(error).toBeNull();
        const payload = data as {
          rows: Array<{ target_id: string; oldest_at: string }>;
          next_cursor: object | null;
        };
        pageSizes.push(payload.rows.length);
        for (const row of payload.rows) {
          expect(seenIds.has(row.target_id)).toBe(false);
          seenIds.add(row.target_id);
        }
        cursor = payload.next_cursor;
        if (cursor === null) break;
      }

      expect(pageSizes).toEqual([10, 10, 7]);
      expect(cursor).toBeNull();
      expect(seenIds.size).toBe(27);
      for (const id of seededTargetIds) {
        expect(seenIds.has(id)).toBe(true);
      }
    },
    120_000,
  );

  // ── 10. reports_case_detail returns target + reporters + timeline ───────
  it('reports_case_detail returns target preview, reporters, and timeline',
    async () => {
      const { postId } = await seedPost();
      const r1 = await signedInClient(await seedUser());
      const r2 = await signedInClient(await seedUser());
      const id1 = await fileReport(r1, 'post', postId, 'Spam');
      const id2 = await fileReport(r2, 'post', postId, 'Misleading');

      // Confirm one report to populate the audit timeline.
      const { error: confirmErr } = await moderatorClient.rpc(
        'admin_confirm_report',
        { p_report_id: id1 },
      );
      expect(confirmErr).toBeNull();

      const { data, error } = await moderatorClient.rpc('reports_case_detail', {
        p_target_type: 'post',
        p_target_id: postId,
      });
      expect(error).toBeNull();
      const payload = data as {
        target_type: string;
        target_id: string;
        target: { status?: string; author_id?: string };
        reporters: Array<{ report_id: string; reason: string; status: string }>;
        timeline: Array<{ action: string }>;
      };
      expect(payload.target_type).toBe('post');
      expect(payload.target_id).toBe(postId);
      expect(payload.target.status).toBeDefined();
      expect(payload.reporters).toHaveLength(2);
      const reportIds = payload.reporters.map((r) => r.report_id).sort();
      expect(reportIds).toEqual([id1, id2].sort());

      // Timeline (target=post) holds 'manual_remove_target' / 'restore_target'
      // entries. The confirm/dismiss audit rows attach to target_type='report'
      // (per the AFTER trigger in 0005), so they live on a different timeline.
      // We just assert the timeline is an array shaped like [{action,...}]
      // (possibly empty for this fresh post).
      expect(Array.isArray(payload.timeline)).toBe(true);
    },
    30_000,
  );

  // ── 11. reports_case_detail rejects invalid target ─────────────────────
  it('reports_case_detail raises 22023 on invalid target_type', async () => {
    const { error } = await moderatorClient.rpc('reports_case_detail', {
      p_target_type: 'comment',
      p_target_id: '00000000-0000-0000-0000-000000000000',
    });
    expect(error).not.toBeNull();
    expect(error!.code).toBe('22023');
  });
});
