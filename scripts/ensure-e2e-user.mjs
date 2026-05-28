#!/usr/bin/env node
// Verifies E2E credentials can sign in to Supabase dev. Run locally or in CI setup.
// Does not print passwords. Requires: E2E_TEST_EMAIL, E2E_TEST_PASSWORD, EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY

const email = process.env.E2E_TEST_EMAIL;
const password = process.env.E2E_TEST_PASSWORD;
const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const anon = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY;

function fail(msg) {
  console.error(`::error::${msg}`);
  process.exit(1);
}

if (!email || !password) fail('Set E2E_TEST_EMAIL and E2E_TEST_PASSWORD');
if (!url || !anon) fail('Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY (dev project)');

const res = await fetch(`${url.replace(/\/$/, '')}/auth/v1/token?grant_type=password`, {
  method: 'POST',
  headers: {
    apikey: anon,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ email, password }),
});

const body = await res.json().catch(() => ({}));

if (!res.ok) {
  fail(`Sign-in failed (${res.status}): ${body.error_description ?? body.msg ?? 'unknown'}`);
}

if (!body.access_token) fail('Sign-in response missing access_token');

console.log('OK — E2E user can authenticate against Supabase dev');
console.log(`user_id=${body.user?.id ?? 'unknown'}`);
