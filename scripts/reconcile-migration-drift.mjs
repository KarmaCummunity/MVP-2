#!/usr/bin/env node
// Helper: list the dev migration-ledger drift and emit the exact
// `supabase migration repair` commands to reconcile it.
//
// The drift is caused by applying schema changes via the Supabase MCP
// `apply_migration` tool (records a TIMESTAMP version) instead of
// `supabase db push` from a committed sequential file. See
// docs/SSOT/OPERATOR_RUNBOOK.md → "Migration application rules".
//
// Usage (from repo root, after sourcing dev secrets):
//   source ~/.kc-dev-secrets.env
//   supabase link --project-ref "$SUPABASE_PROJECT_REF"
//   node scripts/reconcile-migration-drift.mjs
//
// This script is PRINT-ONLY — it never mutates the ledger. It prints the repair
// commands for you to review and run manually (the repairs rewrite only the
// `schema_migrations` history table, not the actual schema, since the DDL was
// already applied when the MCP migration ran).

import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  parseRemoteVersions,
  readLocalVersions,
  findDrift,
  repairCommands,
} from './check-migration-drift.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = join(__dirname, '..', 'supabase', 'migrations');

function listRemoteMigrations() {
  try {
    return execFileSync(
      'supabase',
      ['migration', 'list', '--linked', '--yes'],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] },
    );
  } catch (err) {
    console.error(
      '✗ `supabase migration list --linked` failed. Did you link the dev project first?\n' +
        '  source ~/.kc-dev-secrets.env && supabase link --project-ref "$SUPABASE_PROJECT_REF"',
    );
    console.error(err.message);
    process.exit(2);
  }
}

function main() {
  const cliOutput = listRemoteMigrations();
  const remoteVersions = parseRemoteVersions(cliOutput);
  const localVersions = readLocalVersions(MIGRATIONS_DIR);
  const drift = findDrift({ localVersions, remoteVersions });

  if (drift.ok) {
    console.log('✓ No drift — the dev migration ledger is clean. Nothing to reconcile.');
    return;
  }

  console.log(
    `Found ${drift.orphans.length} orphan remote version(s) and ${drift.missing.length} local file(s) not yet in the ledger.\n`,
  );
  console.log('Review, then run these commands to reconcile (history table only, not schema):\n');
  for (const cmd of repairCommands(drift)) console.log(`  ${cmd}`);
  console.log(
    '\nAfter reconciling, verify with:\n  supabase db push --dry-run --include-all --linked --yes\n' +
      '  → should print "Remote database is up to date."',
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
