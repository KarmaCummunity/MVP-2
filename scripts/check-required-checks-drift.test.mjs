import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  parseWorkflow,
  parseRequiredTable,
  checkRequiredChecksDrift,
} from './check-required-checks-drift.mjs';

test('parseWorkflow extracts workflow name and 4-space job names, ignores step names', () => {
  const wf = [
    'name: CI — frontend',
    'on:',
    '  pull_request:',
    'jobs:',
    '  quality:',
    '    name: typecheck · test · lint',
    '    steps:',
    '      - name: Checkout',
    '      - name: Setup Node.js',
    '  web-build:',
    '    name: web export (production bundle)',
    '    steps:',
    '      - name: Build',
  ].join('\n');
  const parsed = parseWorkflow(wf);
  assert.equal(parsed.name, 'CI — frontend');
  assert.deepEqual(
    [...parsed.jobs].sort(),
    ['typecheck · test · lint', 'web export (production bundle)'].sort(),
  );
});

test('parseWorkflow strips quotes from names', () => {
  const parsed = parseWorkflow('name: "CI — backend"\njobs:\n  a:\n    name: \'job one\'\n');
  assert.equal(parsed.name, 'CI — backend');
  assert.ok(parsed.jobs.has('job one'));
});

test('parseRequiredTable reads workflow/job pairs and splits multi-job cells', () => {
  const md = [
    '## Merge gates (automated — must be green)',
    '',
    '| Check | Workflow | Job |',
    '| --- | --- | --- |',
    '| Quality | CI — frontend | `typecheck · test · lint` |',
    '| Guard | CI — main release guard | `release PR source is dev` + `migration destructive-op scan` |',
    '',
    'Some prose after.',
  ].join('\n');
  const { pairs, error } = parseRequiredTable(md, 'Merge gates');
  assert.equal(error, null);
  assert.deepEqual(pairs, [
    { workflow: 'CI — frontend', job: 'typecheck · test · lint' },
    { workflow: 'CI — main release guard', job: 'release PR source is dev' },
    { workflow: 'CI — main release guard', job: 'migration destructive-op scan' },
  ]);
});

test('parseRequiredTable errors when heading missing', () => {
  const { pairs, error } = parseRequiredTable('# nothing here\n', 'Merge gates');
  assert.equal(pairs.length, 0);
  assert.match(error, /not found/);
});

// ── Integration over a synthetic repo ────────────────────────────────────

function makeRepo(workflows, docs) {
  const root = mkdtempSync(join(tmpdir(), 'drift-'));
  const wfDir = join(root, '.github/workflows');
  mkdirSync(wfDir, { recursive: true });
  for (const [file, content] of Object.entries(workflows)) {
    writeFileSync(join(wfDir, file), content);
  }
  const ssot = join(root, 'docs/SSOT');
  mkdirSync(ssot, { recursive: true });
  writeFileSync(join(ssot, 'ENVIRONMENTS.md'), docs.environments);
  writeFileSync(join(ssot, 'RELEASE_CHECKLIST.md'), docs.release);
  return root;
}

const ENV_OK = [
  '## Dev merge gates (branch protection)',
  '',
  '| Check | Workflow | Job |',
  '| --- | --- | --- |',
  '| Quality | CI — frontend | `typecheck · test · lint` |',
  '',
].join('\n');

const REL_OK = [
  '## Merge gates (automated — must be green)',
  '',
  '| Check | Workflow | Job |',
  '| --- | --- | --- |',
  '| Quality | CI — frontend | `typecheck · test · lint` |',
  '',
].join('\n');

const FRONTEND_WF = 'name: CI — frontend\njobs:\n  quality:\n    name: typecheck · test · lint\n    steps:\n      - name: x\n';

test('passes when every documented check maps to a real job', () => {
  const root = makeRepo(
    { 'ci-frontend.yml': FRONTEND_WF },
    { environments: ENV_OK, release: REL_OK },
  );
  try {
    const result = checkRequiredChecksDrift({ repoRoot: root });
    assert.equal(result.ok, true, result.errors.join('\n'));
    assert.equal(result.checked, 2);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('fails when a documented job was renamed in the workflow', () => {
  const renamed = 'name: CI — frontend\njobs:\n  quality:\n    name: typecheck and test and lint\n';
  const root = makeRepo(
    { 'ci-frontend.yml': renamed },
    { environments: ENV_OK, release: REL_OK },
  );
  try {
    const result = checkRequiredChecksDrift({ repoRoot: root });
    assert.equal(result.ok, false);
    assert.match(result.errors.join('\n'), /no matching job/);
    assert.match(result.errors.join('\n'), /typecheck · test · lint/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('fails when a documented workflow name does not exist', () => {
  const root = makeRepo(
    { 'other.yml': 'name: CI — something else\njobs:\n  a:\n    name: foo\n' },
    { environments: ENV_OK, release: REL_OK },
  );
  try {
    const result = checkRequiredChecksDrift({ repoRoot: root });
    assert.equal(result.ok, false);
    assert.match(result.errors.join('\n'), /no workflow with that name/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('fails when the doc table parses to zero checks (format changed)', () => {
  const brokenEnv = '## Dev merge gates (branch protection)\n\nNo table here anymore.\n';
  const root = makeRepo(
    { 'ci-frontend.yml': FRONTEND_WF },
    { environments: brokenEnv, release: REL_OK },
  );
  try {
    const result = checkRequiredChecksDrift({ repoRoot: root });
    assert.equal(result.ok, false);
    assert.match(result.errors.join('\n'), /ENVIRONMENTS\.md/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
