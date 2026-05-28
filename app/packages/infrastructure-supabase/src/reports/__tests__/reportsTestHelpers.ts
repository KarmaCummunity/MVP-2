// Shared helpers for A1 reports RPC integration tests.
// Mapped to spec: FR-ADMIN-012, FR-ADMIN-013. Closes TD-94.
//
// Two suites consume this module:
//   - reportsRpc.integration.test.ts        (RPC widening + TD-94)
//   - reportsInboxAndDetail.integration.test.ts (inbox + case detail)
//
// Idempotency contract: callers install setupSuiteFixtures() in beforeAll
// and teardownSuiteFixtures(ctx) in afterAll. The fixtures only seed a
// moderator (used by every test). super_admin is NOT seeded suite-wide —
// the single-active-super_admin DB invariant means parallel test files
// would collide; tests that need a super_admin caller seed one inline.

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export const URL = process.env['SUPABASE_URL'];
export const SERVICE = process.env['SUPABASE_SERVICE_ROLE_KEY'];
export const ANON = process.env['SUPABASE_ANON_KEY'];

export const skip = !URL || !SERVICE || !ANON;

export interface SeededUser {
  uid: string;
  email: string;
  password: string;
}

export interface SuiteFixtures {
  admin: SupabaseClient;
  cleanup: Array<() => Promise<void>>;
  suiteModerator: SeededUser;
  moderatorClient: SupabaseClient;
}

export function makeAnon(): SupabaseClient {
  return createClient(URL!, ANON!, { auth: { persistSession: false } });
}

export async function seedUser(
  admin: SupabaseClient,
  cleanup: Array<() => Promise<void>>,
): Promise<SeededUser> {
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

export async function signedInClient(u: SeededUser): Promise<SupabaseClient> {
  const c = makeAnon();
  const { error } = await c.auth.signInWithPassword({
    email: u.email, password: u.password,
  });
  if (error) throw error;
  return c;
}

/** Grant a role to a user, revoke it during cleanup. */
export async function grantRole(
  admin: SupabaseClient,
  cleanup: Array<() => Promise<void>>,
  uid: string,
  role: string,
): Promise<void> {
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
export async function seedPost(
  admin: SupabaseClient,
  cleanup: Array<() => Promise<void>>,
): Promise<{ postId: string; ownerUid: string }> {
  const owner = await seedUser(admin, cleanup);
  const { data: city } = await admin
    .from('cities')
    .select('city_id, name_he')
    .limit(1)
    .single();
  if (!city) throw new Error('no city in dev db');
  // Service-role insert bypasses RLS but trigger reports_validate_before_insert
  // only fires on report inserts. posts_enforce_active_cap fires on INSERT
  // too, but our owner has 0 active posts.
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
export async function fileReport(
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

/** Stand up the per-suite fixtures (admin client + moderator). */
export async function setupSuiteFixtures(): Promise<SuiteFixtures> {
  const admin = createClient(URL!, SERVICE!, { auth: { persistSession: false } });
  const cleanup: Array<() => Promise<void>> = [];

  const suiteModerator = await seedUser(admin, cleanup);
  await grantRole(admin, cleanup, suiteModerator.uid, 'moderator');
  const moderatorClient = await signedInClient(suiteModerator);

  return { admin, cleanup, suiteModerator, moderatorClient };
}

export async function teardownSuiteFixtures(ctx: SuiteFixtures): Promise<void> {
  for (const fn of ctx.cleanup.reverse()) {
    try { await fn(); } catch { /* best-effort */ }
  }
}
