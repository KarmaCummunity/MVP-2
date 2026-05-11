#!/usr/bin/env node
// Guards against dead-file references in active docs. Run from `app/` via
// `pnpm lint:arch` (chained after check-architecture.mjs). Exits non-zero
// if any of the dead refs below appear outside the excluded paths.
//
// To add a new dead ref: extend DEAD_REFS. To allow a path to keep a ref
// (e.g., archive content), extend EXCLUDE.

import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..');

const DEAD_REFS = [
  'PROJECT_STATUS',
  'HISTORY\\.md',
  'CODE_QUALITY',
  'SRS/02_functional_requirements',
  'PRD_MVP_CORE_SSOT',
  'docs/SSOT/SRS\\.md',
];

const EXCLUDE = [
  ':!docs/SSOT/archive/',
  ':!.claude/worktrees/',
  ':!docs/superpowers/',
  ':!app/scripts/check-ssot-links.mjs',
  // DECISIONS.md preserves historical refs in D-1 / D-3 (annotated with
  // inline `> Note (2026-05-11)` blocks pointing to the live source).
  // Excluded so the lint doesn't fail on intentional historical text.
  ':!docs/SSOT/DECISIONS.md',
];

const pattern = `(${DEAD_REFS.join('|')})`;
const args = ['-C', REPO_ROOT, 'grep', '-nE', pattern, '--', ...EXCLUDE];

try {
  const out = execFileSync('git', args, { encoding: 'utf8' });
  if (out.trim()) {
    console.error('❌ Dead doc references found in active docs:\n');
    console.error(out);
    console.error('Fix: replace with a reference to a live file, or move the content to docs/SSOT/archive/.');
    process.exit(1);
  }
} catch (e) {
  // git grep exits 1 when there are no matches — that's the success path here.
  if (e.status === 1) {
    console.log('✅ No dead SSOT references');
    process.exit(0);
  }
  console.error('check-ssot-links: unexpected error', e);
  process.exit(2);
}
