#!/usr/bin/env node
/**
 * Persist Playwright prod-health JSON results into glowe_health_checks (INFRA-QA-W7).
 *
 * Requires:
 *   EXPO_PUBLIC_SUPABASE_URL (or SUPABASE_URL) — prod project URL
 *   SUPABASE_SERVICE_ROLE_KEY — prod service role (GitHub secret)
 *
 * Usage:
 *   node scripts/record-prod-health.mjs tests/e2e/test-results/results.json
 */
import fs from 'node:fs';
import path from 'node:path';

const reportPath = process.argv[2];
if (!reportPath) {
  console.error('Usage: node scripts/record-prod-health.mjs <playwright-report.json>');
  process.exit(1);
}

const supabaseUrl = (process.env.EXPO_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? '').replace(/\/$/, '');
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
const runId = process.env.GITHUB_RUN_ID ?? `local-${Date.now()}`;
const environment = process.env.GLOWE_HEALTH_ENV ?? 'production';
const appVersion = process.env.GLOWE_APP_VERSION ?? null;

if (!supabaseUrl || !serviceKey) {
  console.error('::warning::Skipping health ingest — SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set.');
  process.exit(0);
}

const raw = JSON.parse(fs.readFileSync(path.resolve(reportPath), 'utf8'));
const specs = collectSpecs(raw);
if (!specs.length) {
  console.error('::warning::No test results found in report — nothing to ingest.');
  process.exit(0);
}

const rows = specs.map((spec) => {
  const checkName = slugCheckName(spec.title);
  const failed = spec.status === 'failed' || spec.status === 'timedOut' || spec.status === 'interrupted';
  const skipped = spec.status === 'skipped';
  const status = skipped ? 'degraded' : failed ? 'fail' : 'ok';
  const errorDetail = failed
    ? (spec.errors?.map((e) => e.message).join(' | ') || 'assertion failed').slice(0, 2000)
    : skipped ? 'skipped in this environment' : null;
  return {
    run_id: runId,
    check_name: checkName,
    status,
    latency_ms: spec.duration ?? null,
    error_code: failed ? 'assertion' : skipped ? 'skipped' : null,
    error_detail: errorDetail,
    app_version: appVersion,
    environment,
  };
});

const res = await fetch(`${supabaseUrl}/rest/v1/glowe_health_checks`, {
  method: 'POST',
  headers: {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    'Content-Type': 'application/json',
    Prefer: 'return=minimal',
  },
  body: JSON.stringify(rows),
});

if (!res.ok) {
  const body = await res.text();
  console.error(`::error::Health ingest failed (${res.status}): ${body}`);
  process.exit(1);
}

console.log(`Ingested ${rows.length} health probe row(s) for run ${runId}.`);

function collectSpecs(node, out = []) {
  if (!node || typeof node !== 'object') return out;
  if (Array.isArray(node.suites)) {
    for (const suite of node.suites) collectSpecs(suite, out);
  }
  if (Array.isArray(node.specs)) {
    for (const spec of node.specs) {
      const results = spec.tests?.flatMap((t) => t.results ?? []) ?? [];
      const last = results[results.length - 1] ?? {};
      out.push({
        title: spec.title,
        status: last.status ?? spec.ok === false ? 'failed' : 'passed',
        duration: last.duration ?? null,
        errors: last.errors ?? [],
      });
    }
  }
  return out;
}

function slugCheckName(title) {
  const prefix = String(title).split('—')[0].trim().toLowerCase();
  const slug = prefix.replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  return slug.slice(0, 64) || 'unknown_check';
}
