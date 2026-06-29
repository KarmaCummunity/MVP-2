#!/usr/bin/env node
// Creates (or updates) the two canonical agent test users on Supabase dev via Admin API.
// Both users get realistic Israeli profiles so they behave like real users in tests.
// Alpha gets the 'moderator' admin role for full-platform test coverage.
//
// Requires: SUPABASE_SERVICE_ROLE_KEY (dev service role — never commit)
//           SUPABASE_URL or EXPO_PUBLIC_SUPABASE_URL
//           AGENT_ALPHA_PASSWORD and AGENT_BETA_PASSWORD
//           (or a shared AGENT_TEST_PASSWORD for both)
//
// Usage:
//   source ~/.kc-dev-secrets.env && node scripts/create-agent-test-users.mjs
//
// Idempotent: safe to run multiple times. Re-applies profile data on each run.

const url = (process.env.SUPABASE_URL ?? process.env.EXPO_PUBLIC_SUPABASE_URL ?? '').replace(/\/$/, '');
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
const alphaPassword = process.env.AGENT_ALPHA_PASSWORD ?? process.env.AGENT_TEST_PASSWORD;
const betaPassword = process.env.AGENT_BETA_PASSWORD ?? process.env.AGENT_TEST_PASSWORD;

function fail(msg) {
  console.error(`\n::error::${msg}`);
  process.exit(1);
}

if (!url) fail('Set SUPABASE_URL or EXPO_PUBLIC_SUPABASE_URL (dev project)');
if (!service) fail('Set SUPABASE_SERVICE_ROLE_KEY (dev service role, not in git)');
if (!alphaPassword) fail('Set AGENT_ALPHA_PASSWORD or AGENT_TEST_PASSWORD');
if (!betaPassword) fail('Set AGENT_BETA_PASSWORD or AGENT_TEST_PASSWORD');

// ── User definitions ────────────────────────────────────────────────────────
// Realistic test profiles. Names/cities/bios are kept in Latin script so this
// script stays free of inline Hebrew (enforced by the Hebrew source scan — UI
// copy belongs in locale bundles, not source). They still read as plausible
// Israeli personas in screenshots, admin queues, and inter-user flows.
const AGENT_USERS = [
  {
    key: 'alpha',
    email: 'agent-alpha@karma-community.test',
    password: alphaPassword,
    userMeta: {
      full_name: 'Daniel Levi',
      name: 'Daniel Levi',
    },
    profile: {
      display_name: 'Daniel Levi',
      city: 'tel-aviv',
      city_name: 'Tel Aviv-Yafo',
      biography: 'Loves helping neighbours. Donates unused items and connects people in need.',
      contact_phone: '050-1234567',
      onboarding_state: 'completed',
      account_status: 'active',
    },
    // 'moderator' gives portal.access, reports, chat moderation, users/posts search.
    // NOT 'super_admin' — only one active super_admin is allowed (DB constraint).
    adminRole: 'moderator',
  },
  {
    key: 'beta',
    email: 'agent-beta@karma-community.test',
    password: betaPassword,
    userMeta: {
      full_name: 'Michal Cohen',
      name: 'Michal Cohen',
    },
    profile: {
      display_name: 'Michal Cohen',
      city: 'jerusalem',
      city_name: 'Jerusalem',
      biography: 'Believes in a strong community. Seeks and gives second-hand items.',
      contact_phone: '052-9876543',
      onboarding_state: 'completed',
      account_status: 'active',
    },
    adminRole: null,
  },
];

// ── Helpers ────────────────────────────────────────────────────────────────
async function authAdminFetch(path, method = 'GET', body = null) {
  const res = await fetch(`${url}/auth/v1/admin${path}`, {
    method,
    headers: {
      apikey: service,
      Authorization: `Bearer ${service}`,
      'Content-Type': 'application/json',
    },
    ...(body != null ? { body: JSON.stringify(body) } : {}),
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

async function restFetch(path, method, body, extraHeaders = {}) {
  const res = await fetch(`${url}/rest/v1${path}`, {
    method,
    headers: {
      apikey: service,
      Authorization: `Bearer ${service}`,
      'Content-Type': 'application/json',
      ...extraHeaders,
    },
    ...(body != null ? { body: JSON.stringify(body) } : {}),
  });
  const text = await res.text();
  let data = {};
  if (text) { try { data = JSON.parse(text); } catch { data = { raw: text }; } }
  return { status: res.status, ok: res.ok, data };
}

// ── Main loop ───────────────────────────────────────────────────────────────
for (const user of AGENT_USERS) {
  console.log(`\n── Processing agent-${user.key}: ${user.email}`);

  // 1. Create auth user (or detect existing)
  let userId;
  const createRes = await authAdminFetch('/users', 'POST', {
    email: user.email,
    password: user.password,
    email_confirm: true,
    user_metadata: user.userMeta,
  });

  if (createRes.ok) {
    userId = createRes.data.id;
    console.log(`  ✔ Auth user created — ${userId}`);
  } else if (createRes.status === 422 && /already|exists/i.test(JSON.stringify(createRes.data))) {
    // User exists: find it by email via the admin list search
    const listRes = await authAdminFetch(
      `/users?filter=${encodeURIComponent(user.email)}&page=1&per_page=10`,
    );
    if (!listRes.ok) fail(`Cannot list admin users: ${JSON.stringify(listRes.data)}`);
    const match = (listRes.data.users ?? []).find((u) => u.email === user.email);
    if (!match) fail(`User ${user.email} reported as existing but not found in admin list`);
    userId = match.id;
    console.log(`  ℹ Auth user already exists — ${userId}`);
  } else {
    fail(`Create auth user failed (${createRes.status}): ${JSON.stringify(createRes.data)}`);
  }

  // 2. Update public.users with realistic profile data.
  //    service_role bypasses RLS + column-level grants so all columns are writable.
  const profileRes = await restFetch(
    `/users?user_id=eq.${userId}`,
    'PATCH',
    user.profile,
    { Prefer: 'return=minimal' },
  );
  if (!profileRes.ok) {
    fail(`public.users profile update failed (${profileRes.status}): ${JSON.stringify(profileRes.data)}`);
  }
  console.log('  ✔ public.users profile updated');

  // 3. Ensure admin role grant (idempotent via ignore-duplicates)
  if (user.adminRole) {
    const roleRes = await restFetch(
      '/admin_role_grants',
      'POST',
      { user_id: userId, role: user.adminRole },
      { Prefer: 'resolution=ignore-duplicates' },
    );
    // 201 = newly inserted, 200 = noop (already exists), both are success
    if (!roleRes.ok) {
      console.warn(`  ⚠ Role grant '${user.adminRole}' may have failed (${roleRes.status}): ${JSON.stringify(roleRes.data)}`);
      console.warn('    (if role already active this is harmless)');
    } else {
      console.log(`  ✔ Admin role '${user.adminRole}' ensured`);
    }
  }

  console.log(`  → user_id=${userId}`);
}

console.log('\n✔ All agent test users provisioned.');
console.log('  Next: node scripts/ensure-agent-test-users.mjs');
