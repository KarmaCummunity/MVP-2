#!/usr/bin/env node
// Enforces architecture invariants declared in `.cursor/rules/srs-architecture.mdc`.
// Run from `app/`: `node scripts/check-architecture.mjs`. Wired into `pnpm lint`.
// Exits non-zero on any violation.
//
// Rules enforced:
//   1. File-size cap: ≤200 lines per .ts/.tsx file. Pre-existing violations live
//      in FILE_SIZE_ALLOWLIST with a TD-N pointer; the list shrinks over time.
//   2. Layer boundaries: a layer never imports from a layer below it
//      (domain ⇏ application/infra; application ⇏ infra; ui ⇏ domain/app/infra).
//   3. Domain typed-error rule: `packages/domain/src/**` may not `throw new Error(...)` —
//      must throw a domain-specific error class. Pre-existing exemptions are listed.

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..'); // app/

const FILE_SIZE_CAP = 200;

// Pre-existing 200-LOC violations. Each entry must reference a TD-N for follow-up.
// `max` is the current line count: the file cannot grow past it. Shrinking the file
// below the cap triggers a STALE-ALLOWLIST error, prompting removal from this list.
const FILE_SIZE_ALLOWLIST = new Map([
  ['apps/mobile/app/(tabs)/create.tsx', { td: 'TD-29', max: 386 }],
  ['apps/mobile/app/(auth)/index.tsx', { td: 'TD-29', max: 266 }],
  // Bumped from 245→254 (FR-ADMIN-009 added adminRemove method). Remove once TD-50 splits the file.
  ['packages/infrastructure-supabase/src/posts/SupabasePostRepository.ts', { td: 'TD-50', max: 254 }],
  ['apps/mobile/app/settings.tsx', { td: 'TD-29', max: 232 }],
  ['apps/mobile/app/(tabs)/profile.tsx', { td: 'TD-29', max: 204 }],
  ['apps/mobile/src/components/PostCard.tsx', { td: 'TD-29', max: 212 }],
  ['apps/mobile/src/i18n/he.ts', { td: 'TD-35', max: 217 }],
  ['packages/domain/src/entities.ts', { td: 'TD-29', max: 214 }],
  ['packages/infrastructure-supabase/src/users/SupabaseUserRepository.ts', { td: 'TD-112', max: 215 }],
  ['apps/mobile/app/chat/[id].tsx', { td: 'TD-118', max: 229 }],
  ['apps/mobile/src/store/chatStore.ts', { td: 'TD-118', max: 232 }],
  // Search mechanism (merged in #44…#50 stack on main without arch-lint pass).
  // Pre-existing on main before this PR; allow-listed here to unblock the
  // FR-ADMIN-009 PR. TD-128 tracks the split work.
  ['packages/infrastructure-supabase/src/search/SupabaseSearchRepository.ts', { td: 'TD-128', max: 418 }],
  ['apps/mobile/app/(tabs)/search.tsx', { td: 'TD-128', max: 646 }],
  ['apps/mobile/src/components/SearchFilterSheet.tsx', { td: 'TD-128', max: 306 }],
  ['apps/mobile/src/components/SearchResultCard.tsx', { td: 'TD-128', max: 354 }],
]);

const LAYER_RULES = [
  {
    label: 'domain',
    fromPattern: /^packages\/domain\/src\//,
    forbidden: [/^@kc\/infrastructure-supabase/, /^@supabase\//, /^@kc\/application/, /^@kc\/ui/],
  },
  {
    label: 'application',
    fromPattern: /^packages\/application\/src\//,
    forbidden: [/^@kc\/infrastructure-supabase/, /^@supabase\//, /^@kc\/ui/],
  },
  {
    label: 'ui',
    fromPattern: /^packages\/ui\/src\//,
    forbidden: [
      /^@kc\/infrastructure-supabase/,
      /^@supabase\//,
      /^@kc\/application/,
      /^@kc\/domain/,
    ],
  },
];

const DOMAIN_ERROR_RULE = {
  fromPattern: /^packages\/domain\/src\//,
  forbid: /\bthrow\s+new\s+Error\s*\(/,
  message:
    'Domain code must throw a typed error class (e.g. DomainError, ValidationError from `packages/domain/src/errors.ts`). Raw `throw new Error(...)` is forbidden.',
  exemptLines: new Set(),
};

const SKIP_DIRS = new Set(['node_modules', 'dist', '.expo', '.turbo', '.next', 'build']);
const SKIP_FILES = new Set(['database.types.ts']);

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      walk(full, files);
    } else if (/\.(ts|tsx)$/.test(entry) && !SKIP_FILES.has(entry)) {
      files.push(full);
    }
  }
  return files;
}

const IMPORT_REGEX = /(?:^|\n)(?:\s*(?:import|export)\b[^'"\n]*from\s+|\s*import\s*\(\s*)['"]([^'"]+)['"]/g;

function checkFile(absPath, violations) {
  const rel = relative(ROOT, absPath).replace(/\\/g, '/');
  const content = readFileSync(absPath, 'utf8');
  const lines = content.split('\n');
  // Match `wc -l` semantics: count newlines, not segments. A file ending in '\n'
  // produces a trailing empty segment that `wc` doesn't count.
  const lineCount = content.endsWith('\n') ? lines.length - 1 : lines.length;

  const allow = FILE_SIZE_ALLOWLIST.get(rel);
  if (lineCount > FILE_SIZE_CAP) {
    if (!allow) {
      violations.push(
        `SIZE: ${rel} has ${lineCount} lines (cap: ${FILE_SIZE_CAP}). Split the file or, if truly necessary, add an entry to FILE_SIZE_ALLOWLIST with a TD-N pointer.`
      );
    } else if (lineCount > allow.max) {
      violations.push(
        `SIZE: ${rel} grew to ${lineCount} lines (allowlisted max: ${allow.max}, ${allow.td}). Either shrink the file or update the allowlist max — but the goal is to remove the entry, not raise it.`
      );
    }
  } else if (allow) {
    violations.push(
      `STALE-ALLOWLIST: ${rel} is now ${lineCount} lines (≤ ${FILE_SIZE_CAP} cap). Remove from FILE_SIZE_ALLOWLIST.`
    );
  }

  for (const rule of LAYER_RULES) {
    if (!rule.fromPattern.test(rel)) continue;
    IMPORT_REGEX.lastIndex = 0;
    let m;
    while ((m = IMPORT_REGEX.exec(content)) !== null) {
      const spec = m[1];
      for (const forbidden of rule.forbidden) {
        if (forbidden.test(spec)) {
          const lineNo = content.slice(0, m.index).split('\n').length;
          violations.push(
            `LAYER: ${rel}:${lineNo} — ${rule.label} layer cannot import "${spec}". Push the dependency through a port + adapter.`
          );
        }
      }
    }
  }

  if (DOMAIN_ERROR_RULE.fromPattern.test(rel)) {
    lines.forEach((line, i) => {
      if (DOMAIN_ERROR_RULE.forbid.test(line)) {
        const tag = `${rel}:${i + 1}`;
        if (!DOMAIN_ERROR_RULE.exemptLines.has(tag)) {
          violations.push(`DOMAIN-ERROR: ${tag} — ${DOMAIN_ERROR_RULE.message}`);
        }
      }
    });
  }
}

const targets = [join(ROOT, 'packages'), join(ROOT, 'apps', 'mobile')];
const files = targets.flatMap((t) => walk(t));
const violations = [];
for (const f of files) checkFile(f, violations);

if (violations.length > 0) {
  console.error(
    `\n✗ Architecture check failed — ${violations.length} violation${violations.length === 1 ? '' : 's'}:\n`
  );
  for (const v of violations) console.error('  • ' + v);
  console.error('\nRules: .cursor/rules/srs-architecture.mdc');
  console.error('Allowlists: app/scripts/check-architecture.mjs\n');
  process.exit(1);
}

console.log(`✓ Architecture check passed — ${files.length} files scanned.`);
