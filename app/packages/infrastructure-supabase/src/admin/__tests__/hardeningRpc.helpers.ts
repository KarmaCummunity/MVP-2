// Helpers for hardeningRpc.integration.test.ts.
// Extracted so the test file stays under the 300-line architecture cap.
// Imported only from the integration suite — kept out of the main bundle by
// the `*.helpers.ts` naming + tsconfig include scope.

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export interface TestHarness {
  readonly admin: SupabaseClient;
  readonly cleanup: Array<() => Promise<void>>;
  readonly url: string;
  readonly anon: string;
}

export async function seedUser(h: TestHarness): Promise<string> {
  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const email = `hardening-${stamp}@kc.test`;
  const { data, error } = await h.admin.auth.admin.createUser({
    email, password: 'p4ssword!!', email_confirm: true,
  });
  if (error || !data.user) throw error ?? new Error('no user');
  const uid = data.user.id;
  await h.admin.from('users').upsert({ user_id: uid, display_name: 'hardening test' });
  h.cleanup.push(async () => {
    try { await h.admin.auth.admin.deleteUser(uid); } catch { /* best-effort */ }
  });
  return uid;
}

export async function signInAs(h: TestHarness, uid: string): Promise<SupabaseClient> {
  // Re-fetch the email we set above; the auth.admin API requires it for
  // password sign-in. We use service-role to mint a session via OTP-less
  // shortcut: signInWithPassword. Since we set `email_confirm: true` at
  // creation, the password is enough.
  const { data: { user }, error: fetchErr } = await h.admin.auth.admin.getUserById(uid);
  if (fetchErr || !user?.email) throw fetchErr ?? new Error('user missing email');
  const c = createClient(h.url, h.anon, { auth: { persistSession: false } });
  const { error } = await c.auth.signInWithPassword({
    email: user.email, password: 'p4ssword!!',
  });
  if (error) throw error;
  return c;
}

export async function seedPost(h: TestHarness): Promise<{ postId: string; ownerUid: string }> {
  const ownerUid = await seedUser(h);
  const { data: city } = await h.admin
    .from('cities')
    .select('city_id')
    .limit(1)
    .single();
  if (!city) throw new Error('no city in dev db');
  const { data, error } = await h.admin
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

export async function seedChatBetween(h: TestHarness, a: string, b: string): Promise<string> {
  // chats_canonical_order requires participant_a < participant_b lexically.
  const [pa, pb] = a < b ? [a, b] : [b, a];
  const { data, error } = await h.admin
    .from('chats')
    .insert({ participant_a: pa, participant_b: pb })
    .select('chat_id')
    .single();
  if (error || !data) throw error ?? new Error('chat insert failed');
  return data.chat_id;
}

export async function fileReportAs(
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
