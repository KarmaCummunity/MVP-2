#!/usr/bin/env node
// Creates (or updates) the E2E test user on Supabase dev via Admin API.
// Requires service role — source ~/.kc-dev-secrets.env or set SUPABASE_SERVICE_ROLE_KEY.
//
// Usage:
//   E2E_TEST_EMAIL=e2e@example.test E2E_TEST_PASSWORD='…' node scripts/create-e2e-user.mjs

const email = process.env.E2E_TEST_EMAIL;
const password = process.env.E2E_TEST_PASSWORD;
const url = (process.env.SUPABASE_URL ?? process.env.EXPO_PUBLIC_SUPABASE_URL ?? '').replace(/\/$/, '');
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

function fail(msg) {
  console.error(`::error::${msg}`);
  process.exit(1);
}

if (!email || !password) fail('Set E2E_TEST_EMAIL and E2E_TEST_PASSWORD');
if (!url) fail('Set SUPABASE_URL or EXPO_PUBLIC_SUPABASE_URL (dev project)');
if (!service) fail('Set SUPABASE_SERVICE_ROLE_KEY (dev service role, not in git)');

const res = await fetch(`${url}/auth/v1/admin/users`, {
  method: 'POST',
  headers: {
    apikey: service,
    Authorization: `Bearer ${service}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email,
    password,
    email_confirm: true,
    user_metadata: { display_name: 'E2E Bot' },
  }),
});

const body = await res.json().catch(() => ({}));

if (res.status === 422 && /already|exists/i.test(JSON.stringify(body))) {
  console.log('User already exists — run ensure-e2e-user.mjs to verify password sign-in');
  process.exit(0);
}

if (!res.ok) {
  fail(`Admin create user failed (${res.status}): ${body.msg ?? body.error_description ?? JSON.stringify(body)}`);
}

console.log('OK — E2E user created with email_confirm=true');
console.log(`user_id=${body.id ?? body.user?.id ?? 'unknown'}`);
console.log('Next: node scripts/ensure-e2e-user.mjs');
