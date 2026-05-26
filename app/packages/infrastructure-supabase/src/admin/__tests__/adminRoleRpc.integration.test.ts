import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const URL = process.env['SUPABASE_URL'];
const SERVICE = process.env['SUPABASE_SERVICE_ROLE_KEY'];
const ANON = process.env['SUPABASE_ANON_KEY'];

const skip = !URL || !SERVICE || !ANON;
const d = skip ? describe.skip : describe;

d('admin RBAC primitives (A0)', () => {
  let admin: SupabaseClient;
  const cleanup: Array<() => Promise<void>> = [];
  let preExistingSuperAdminUserId: string | null = null;

  beforeAll(async () => {
    admin = createClient(URL!, SERVICE!, { auth: { persistSession: false } });

    // The single-active-super_admin invariant means we must temporarily
    // revoke any pre-existing super_admin grant for the duration of the suite,
    // then restore it in afterAll.
    const { data: pre } = await admin
      .from('admin_role_grants')
      .select('user_id')
      .eq('role', 'super_admin')
      .is('revoked_at', null)
      .maybeSingle();
    if (pre?.user_id) {
      preExistingSuperAdminUserId = pre.user_id;
      await admin
        .from('admin_role_grants')
        .update({ revoked_at: new Date().toISOString() })
        .eq('user_id', pre.user_id)
        .eq('role', 'super_admin')
        .is('revoked_at', null);
    }
  });

  afterAll(async () => {
    for (const fn of cleanup.reverse()) await fn();
    if (preExistingSuperAdminUserId !== null) {
      // Restore the original super_admin so the dev DB returns to its prior state.
      await admin
        .from('admin_role_grants')
        .insert({ user_id: preExistingSuperAdminUserId, role: 'super_admin' });
      preExistingSuperAdminUserId = null;
    }
  });

  async function seedUser(): Promise<string> {
    const email = `a0-rbac-${Date.now()}-${Math.random().toString(36).slice(2)}@kc.test`;
    const { data, error } = await admin.auth.admin.createUser({
      email, password: 'p4ssword!!', email_confirm: true,
    });
    if (error || !data.user) throw error ?? new Error('no user');
    const uid = data.user.id;
    await admin.from('users').insert({ user_id: uid, display_name: 'rbac test' });
    cleanup.push(async () => { await admin.auth.admin.deleteUser(uid); });
    return uid;
  }

  it('has_admin_role returns false for users without grants', async () => {
    const uid = await seedUser();
    const { data, error } = await admin.rpc('has_admin_role', { uid, role_name: 'support' });
    expect(error).toBeNull();
    expect(data).toBe(false);
  });

  it('inserting a moderator grant flips has_admin_role to true', async () => {
    const uid = await seedUser();
    await admin.from('admin_role_grants').insert({ user_id: uid, role: 'moderator' });
    const { data } = await admin.rpc('has_admin_role', { uid, role_name: 'moderator' });
    expect(data).toBe(true);
  });

  it('admin_assert_role raises 42501 when the user has no matching role', async () => {
    const uid = await seedUser();
    const { error } = await admin.rpc('admin_assert_role', {
      uid, allowed: ['super_admin'],
    });
    expect(error).not.toBeNull();
    expect(error!.code).toBe('42501');
  });

  it('single-super_admin invariant rejects a second active row', async () => {
    const uid1 = await seedUser();
    const uid2 = await seedUser();
    await admin.from('admin_role_grants').insert({ user_id: uid1, role: 'super_admin' });
    const { error } = await admin
      .from('admin_role_grants')
      .insert({ user_id: uid2, role: 'super_admin' });
    expect(error).not.toBeNull();
    expect(error!.code).toBe('23505');
    await admin.from('admin_role_grants')
      .update({ revoked_at: new Date().toISOString() })
      .eq('user_id', uid1).eq('role', 'super_admin');
  });

  it('granting super_admin syncs users.is_super_admin to true', async () => {
    const uid = await seedUser();
    await admin.from('admin_role_grants').insert({ user_id: uid, role: 'super_admin' });
    const { data } = await admin.from('users')
      .select('is_super_admin').eq('user_id', uid).single();
    expect(data?.is_super_admin).toBe(true);
    await admin.from('admin_role_grants')
      .update({ revoked_at: new Date().toISOString() })
      .eq('user_id', uid).eq('role', 'super_admin');
  });

  it('revoking super_admin syncs users.is_super_admin back to false', async () => {
    const uid = await seedUser();
    await admin.from('admin_role_grants').insert({ user_id: uid, role: 'super_admin' });
    await admin.from('admin_role_grants')
      .update({ revoked_at: new Date().toISOString() })
      .eq('user_id', uid).eq('role', 'super_admin');
    const { data } = await admin.from('users')
      .select('is_super_admin').eq('user_id', uid).single();
    expect(data?.is_super_admin).toBe(false);
  });
});
