#!/usr/bin/env node
// Poll until URL returns HTTP 2xx. Used before E2E against Railway dev deploys.

const url = process.argv[2];
const maxAttempts = parseInt(process.argv[3] ?? '24', 10);
const delayMs = parseInt(process.argv[4] ?? '15000', 10);

if (!url) {
  console.error('usage: node scripts/wait-for-url.mjs <url> [attempts] [delayMs]');
  process.exit(2);
}

const target = url.endsWith('/') ? url : `${url}/`;

for (let i = 1; i <= maxAttempts; i++) {
  try {
    const res = await fetch(target, { redirect: 'follow' });
    if (res.ok) {
      console.log(`OK ${target} (attempt ${i}/${maxAttempts})`);
      process.exit(0);
    }
    console.log(`attempt ${i}/${maxAttempts}: HTTP ${res.status}`);
  } catch (err) {
    console.log(`attempt ${i}/${maxAttempts}: ${err.message}`);
  }
  await new Promise((r) => setTimeout(r, delayMs));
}

console.error(`::error::${target} not ready after ${maxAttempts} attempts`);
process.exit(1);
