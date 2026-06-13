#!/usr/bin/env node
// Guard: the required-status-check tables in the SSOT docs must reference
// jobs that actually exist in .github/workflows/**.
//
// Why this exists: branch protection on `dev` and `main` enumerates required
// checks by their exact "Workflow / Job" display names (see
// docs/SSOT/ENVIRONMENTS.md "Dev merge gates" and
// docs/SSOT/RELEASE_CHECKLIST.md "Merge gates"). GitHub matches required
// checks by string. When an agent renames or splits a job, the old name
// silently stops matching — the gate evaporates and auto-merge proceeds
// ungated, with no error anywhere. Only AI agents touch this repo, so there
// is no human reviewer to notice. This guard fails CI the moment a documented
// required check no longer maps to a real job, forcing the docs (and the
// operator's branch-protection settings) to be updated in the same change.
//
// It does NOT read GitHub branch-protection settings (no API token in CI);
// the SSOT tables are the source of truth it validates against.

import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEFAULT_REPO_ROOT = join(__dirname, '..');

const SOURCES = [
  {
    file: 'docs/SSOT/ENVIRONMENTS.md',
    heading: 'Dev merge gates',
  },
  {
    file: 'docs/SSOT/RELEASE_CHECKLIST.md',
    heading: 'Merge gates',
  },
];

// Parse a workflow file into { name, jobs: Set<jobName> }. Pure regex by
// indentation (no YAML dep, matching the other guard scripts): the workflow
// name is a column-0 `name:`; a job name is a 4-space-indented `name:` (job
// keys sit at 2 spaces, their props at 4). Step names live under `steps:` at
// 6+ spaces with a leading `-`, so they never match.
export function parseWorkflow(content) {
  const stripValue = (raw) => {
    let v = raw.trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    return v.trim();
  };
  const nameMatch = content.match(/^name:[ \t]*(.+)$/m);
  const name = nameMatch ? stripValue(nameMatch[1]) : null;
  const jobs = new Set();
  const jobNameRe = /^ {4}name:[ \t]*(.+)$/gm;
  let m;
  while ((m = jobNameRe.exec(content)) !== null) {
    jobs.add(stripValue(m[1]));
  }
  return { name, jobs };
}

function loadWorkflows(repoRoot) {
  const dir = join(repoRoot, '.github/workflows');
  const byName = new Map();
  for (const entry of readdirSync(dir)) {
    if (!entry.endsWith('.yml') && !entry.endsWith('.yaml')) continue;
    const parsed = parseWorkflow(readFileSync(join(dir, entry), 'utf8'));
    if (parsed.name) byName.set(parsed.name, parsed.jobs);
  }
  return byName;
}

// Extract required (workflow, job) pairs from the first markdown table that
// follows the given heading. The Job cell may list more than one backticked
// job name joined by "+" (e.g. the main release guard) — capture each.
export function parseRequiredTable(markdown, heading) {
  const lines = markdown.split('\n');
  const headingIdx = lines.findIndex(
    (l) => l.startsWith('## ') && l.includes(heading),
  );
  if (headingIdx === -1) {
    return { pairs: [], error: `heading "## …${heading}…" not found` };
  }
  // Find the header row of the checks table after the heading.
  let i = headingIdx + 1;
  for (; i < lines.length; i++) {
    if (lines[i].startsWith('## ')) {
      return { pairs: [], error: `no checks table under "${heading}"` };
    }
    const cells = splitRow(lines[i]);
    if (cells.length >= 3 && cells[0] === 'Check' && cells[1] === 'Workflow' && cells[2] === 'Job') {
      break;
    }
  }
  if (i >= lines.length) return { pairs: [], error: `no checks table under "${heading}"` };
  i += 1; // header row
  if (lines[i] && /^\|[\s:-]+\|/.test(lines[i])) i += 1; // separator row

  const pairs = [];
  for (; i < lines.length; i++) {
    const row = lines[i];
    if (!row.trim().startsWith('|')) break;
    const cells = splitRow(row);
    if (cells.length < 3) continue;
    const workflow = cells[1];
    const jobNames = [...cells[2].matchAll(/`([^`]+)`/g)].map((mm) => mm[1].trim());
    for (const job of jobNames) pairs.push({ workflow, job });
  }
  return { pairs, error: null };
}

function splitRow(row) {
  const t = row.trim();
  if (!t.startsWith('|')) return [];
  return t.slice(1, t.endsWith('|') ? -1 : undefined).split('|').map((c) => c.trim());
}

export function checkRequiredChecksDrift({ repoRoot = DEFAULT_REPO_ROOT } = {}) {
  const errors = [];
  let checked = 0;
  let workflows;
  try {
    workflows = loadWorkflows(repoRoot);
  } catch (err) {
    return { ok: false, errors: [`Could not read workflows: ${err.message}`], checked: 0 };
  }

  for (const src of SOURCES) {
    let markdown;
    try {
      markdown = readFileSync(join(repoRoot, src.file), 'utf8');
    } catch (err) {
      errors.push(`Could not read ${src.file}: ${err.message}`);
      continue;
    }
    const { pairs, error } = parseRequiredTable(markdown, src.heading);
    if (error) {
      errors.push(`${src.file}: ${error}`);
      continue;
    }
    if (pairs.length === 0) {
      errors.push(`${src.file}: parsed 0 required checks under "${src.heading}" — table format changed?`);
      continue;
    }
    for (const { workflow, job } of pairs) {
      checked += 1;
      const jobs = workflows.get(workflow);
      if (!jobs) {
        errors.push(
          `${src.file}: required check references workflow "${workflow}" but no workflow with that name: exists in .github/workflows/.`,
        );
        continue;
      }
      if (!jobs.has(job)) {
        errors.push(
          `${src.file}: required check "${workflow} / ${job}" has no matching job — ` +
            `a job was renamed/removed. Update the doc table AND GitHub branch protection. ` +
            `Jobs in "${workflow}": ${[...jobs].map((j) => `"${j}"`).join(', ')}.`,
        );
      }
    }
  }

  return { ok: errors.length === 0, errors, checked };
}

function main() {
  const result = checkRequiredChecksDrift();
  if (!result.ok) {
    console.error('✗ Required-checks drift detected:');
    for (const err of result.errors) console.error(`  • ${err}`);
    console.error(
      '\nThe SSOT required-check tables must match real workflow job names.\n' +
        'If you renamed a job: update the table(s) above AND the GitHub branch-protection\n' +
        'required-status-checks list (Settings → Branches → dev/main).',
    );
    process.exit(1);
  }
  console.log(`✓ Required-checks drift guard passed — ${result.checked} documented checks all map to real jobs.`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
