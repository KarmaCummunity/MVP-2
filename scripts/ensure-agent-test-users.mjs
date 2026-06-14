#!/usr/bin/env node
// Verifies both agent test users can sign in to Supabase dev.
// Run locally or in CI setup as a preflight check.
// Does NOT print passwords.
//
// Requires: EXPO_PUBLIC_SUPABASE_URL or SUPABASE_URL
//           EXPO_PUBLIC_SUPABASE_ANON_KEY or SUPABASE_ANON_KEY
//           AGENT_ALPHA_PASSWORD and AGENT_BETA_PASSWORD
//           (or a shared AGENT_TEST_PASSWORD for both)
//
// Usage:
//   source ~/.kc-dev-secrets.env && node scripts/ensure-agent-test-users.mjs

const url = (process.env.EXPO_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? '').replace(/\/$/, '');
const anon = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY;
const alphaPassword = process.env.AGENT_ALPHA_PASSWORD ?? process.env.AGENT_TEST_PASSWORD;
const betaPassword = process.env.AGENT_BETA_PASSWORD ?? process.env.AGENT_TEST_PASSWORD;

function fail(msg) {
  console.error(`\n::error::${msg}`);
  process.exit(1);
}

if (!url || !anon) fail('Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY (dev project)');
if (!alphaPassword) fail('Set AGENT_ALPHA_PASSWORD or AGENT_TEST_PASSWORD');
if (!betaPassword) fail('Set AGENT_BETA_PASSWORD or AGENT_TEST_PASSWORD');

const AGENT_USERS = [
  { key: 'alpha', email: 'agent-alpha@karma-community.test', password: alphaPassword },
  { key: 'beta',  email: 'agent-beta@karma-community.test',  password: betaPassword  },
];

let allOk = true;

for (const user of AGENT_USERS) {
  process.stdout.write(`Checking agent-${user.key} (${user.email})... `);

  const res = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: anon, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: user.email, password: user.password }),
  });

  const body = await res.json().catch(() => ({}));

  if (!res.ok || !body.access_token) {
    console.error(`FAIL (${res.status}): ${body.error_description ?? body.msg ?? 'unknown'}`);
    allOk = false;
    continue;
  }

  console.log(`OK  [user_id=${body.user?.id ?? 'unknown'}]`);
}

if (!allOk) {
  fail('One or more agent test users failed to authenticate. Run create-agent-test-users.mjs to re-provision.');
}

console.log('\n✔ Both agent test users authenticated successfully.');
