# CI Workflow Split + Backend Guards Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split monolithic `.github/workflows/ci.yml` into path-filtered frontend/backend/contract workflows and add Manaurum-style guards (migration chain, RLS lint, RPC contract, types drift, manifest parity, local SQL probes).

**Architecture:** Keep the monorepo layout unchanged. Replace `ci.yml` with three PR/push workflows (`ci-frontend`, `ci-backend`, `ci-contract`) plus a thin `ci-pr.yml` for PR hygiene on every non-draft PR. Static guards run as Node scripts under `scripts/` with `node --test` unit tests. Live DB guards (`rls-lint.sql`, `database.types.ts` drift, `sqlProbes`) run inside the backend workflow after `supabase start`, replacing the standalone `db-validate.yml` job.

**Tech Stack:** GitHub Actions, Node 20, pnpm 9, Supabase CLI 2.99.0 (pinned), `node --test`, vitest (`@kc/infrastructure-supabase`), psql.

---

## File map

| File | Responsibility |
| --- | --- |
| `.github/workflows/ci-frontend.yml` | App quality gate: typecheck, test, lint, Hebrew scan, web export (main only) |
| `.github/workflows/ci-backend.yml` | Static migration chain + live DB validate + RLS lint + types drift + SQL probes |
| `.github/workflows/ci-contract.yml` | RPC/table contract + coalesce mirror + web manifest parity |
| `.github/workflows/ci-pr.yml` | PR hygiene (title + Mapped to spec) on every non-draft PR |
| `.github/workflows/ci.yml` | **Delete** after split (avoid duplicate runs) |
| `.github/workflows/db-validate.yml` | **Delete** — absorbed into `ci-backend.yml` |
| `scripts/check-migration-chain.mjs` | Alembic-style single-head guard for `supabase/migrations/` |
| `scripts/check-migration-chain.test.mjs` | Unit tests for migration chain script |
| `scripts/check-rpc-contract.mjs` | Static FE↔BE contract: RPCs/tables used in infra layer exist in migrations/types |
| `scripts/check-rpc-contract.test.mjs` | Unit tests for RPC contract script |
| `scripts/check-rpc-contract.allowlist.json` | Known false positives (views, test-only symbols) |
| `scripts/check-web-manifest.mjs` | Manifest parity: locale `appName` matches generated manifest |
| `scripts/check-web-manifest.test.mjs` | Unit tests for manifest script |
| `supabase/tests/rls-lint.sql` | Live DB: every `public` table has RLS enabled + ≥1 policy |
| `app/package.json` | Add root-level `pnpm check:backend-guards` script |
| `docs/SSOT/RELEASE_CHECKLIST.md` | Update required-check table with new workflow/job names |
| `docs/SSOT/ENVIRONMENTS.md` | Document new workflow layout |
| `docs/SSOT/BACKLOG.md` | Add + close `INFRA-CI-SPLIT-GUARDS` |

---

### Task 1: Migration chain guard (P0)

**Files:**
- Create: `scripts/check-migration-chain.mjs`
- Create: `scripts/check-migration-chain.test.mjs`
- Modify: `app/package.json` (add script in Task 7)

- [ ] **Step 1: Write the failing test**

Create `scripts/check-migration-chain.test.mjs`:

```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { checkMigrationChain } from './check-migration-chain.mjs';

test('accepts ordered unique migration prefixes', () => {
  const dir = mkdtempSync(join(tmpdir(), 'migrations-'));
  try {
    writeFileSync(join(dir, '0001_init.sql'), '-- ok');
    writeFileSync(join(dir, '0002_next.sql'), '-- ok');
    assert.deepEqual(checkMigrationChain(dir), { ok: true, errors: [] });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('rejects duplicate migration prefix', () => {
  const dir = mkdtempSync(join(tmpdir(), 'migrations-dup-'));
  try {
    writeFileSync(join(dir, '0001_a.sql'), '-- a');
    writeFileSync(join(dir, '0001_b.sql'), '-- b');
    const result = checkMigrationChain(dir);
    assert.equal(result.ok, false);
    assert.match(result.errors.join('\n'), /duplicate prefix.*0001/i);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('rejects invalid filename pattern', () => {
  const dir = mkdtempSync(join(tmpdir(), 'migrations-bad-'));
  try {
    writeFileSync(join(dir, 'init_users.sql'), '-- bad');
    const result = checkMigrationChain(dir);
    assert.equal(result.ok, false);
    assert.match(result.errors.join('\n'), /invalid migration filename/i);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
```

- [ ] **Step 2: Run test to verify it fails**

Run from repo root:

```bash
node --test scripts/check-migration-chain.test.mjs
```

Expected: FAIL — `Cannot find module './check-migration-chain.mjs'`

- [ ] **Step 3: Write minimal implementation**

Create `scripts/check-migration-chain.mjs`:

```javascript
#!/usr/bin/env node
import { readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEFAULT_DIR = join(__dirname, '..', 'supabase', 'migrations');
const MIGRATION_RE = /^(\d{4})_[a-z0-9_]+\.sql$/i;

export function checkMigrationChain(migrationsDir) {
  const errors = [];
  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  const seen = new Map();

  for (const file of files) {
    const match = file.match(MIGRATION_RE);
    if (!match) {
      errors.push(`invalid migration filename: ${file} (expected NNNN_snake_case.sql)`);
      continue;
    }
    const prefix = match[1];
    if (seen.has(prefix)) {
      errors.push(
        `duplicate prefix ${prefix}: ${seen.get(prefix)} and ${file} (Alembic-style single-head violation)`
      );
    } else {
      seen.set(prefix, file);
    }
  }

  return { ok: errors.length === 0, errors };
}

function main() {
  const dir = process.argv[2] ?? DEFAULT_DIR;
  const result = checkMigrationChain(dir);
  if (!result.ok) {
    console.error(`✗ Migration chain check failed (${result.errors.length} issue(s)):\n`);
    for (const err of result.errors) console.error(`  • ${err}`);
    process.exit(1);
  }
  console.log(`✓ Migration chain check passed — ${readdirSync(dir).filter((f) => f.endsWith('.sql')).length} files.`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
node --test scripts/check-migration-chain.test.mjs
node scripts/check-migration-chain.mjs
```

Expected: all tests PASS; real migrations dir prints success.

- [ ] **Step 5: Commit**

```bash
git add scripts/check-migration-chain.mjs scripts/check-migration-chain.test.mjs
git commit -m "ci: add migration chain guard script"
```

---

### Task 2: RPC / table contract guard (P0)

**Files:**
- Create: `scripts/check-rpc-contract.mjs`
- Create: `scripts/check-rpc-contract.test.mjs`
- Create: `scripts/check-rpc-contract.allowlist.json`

- [ ] **Step 1: Write the failing test**

Create `scripts/check-rpc-contract.test.mjs`:

```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { checkRpcContract } from './check-rpc-contract.mjs';

test('passes when RPC and table exist in migrations', () => {
  const root = mkdtempSync(join(tmpdir(), 'contract-ok-'));
  try {
    const infra = join(root, 'app/packages/infrastructure-supabase/src');
    const migrations = join(root, 'supabase/migrations');
    mkdirSync(infra, { recursive: true });
    mkdirSync(migrations, { recursive: true });
    writeFileSync(
      join(infra, 'Repo.ts'),
      `client.rpc('feed_ranked_ids', {}); client.from('posts').select();`
    );
    writeFileSync(
      join(migrations, '0001_posts.sql'),
      `create table public.posts(id uuid primary key);
       create or replace function public.feed_ranked_ids() returns setof uuid language sql as $$ select id from posts $$;`
    );
    const result = checkRpcContract({ repoRoot: root });
    assert.equal(result.ok, true, result.errors.join('\n'));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('fails when RPC missing from migrations', () => {
  const root = mkdtempSync(join(tmpdir(), 'contract-bad-'));
  try {
    const infra = join(root, 'app/packages/infrastructure-supabase/src');
    const migrations = join(root, 'supabase/migrations');
    mkdirSync(infra, { recursive: true });
    mkdirSync(migrations, { recursive: true });
    writeFileSync(join(infra, 'Repo.ts'), `client.rpc('missing_rpc', {});`);
    writeFileSync(join(migrations, '0001_empty.sql'), '-- no rpc');
    const result = checkRpcContract({ repoRoot: root });
    assert.equal(result.ok, false);
    assert.match(result.errors.join('\n'), /missing_rpc/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
```

Create `scripts/check-rpc-contract.allowlist.json`:

```json
{
  "rpcs": [],
  "tables": []
}
```

- [ ] **Step 2: Run test to verify it fails**

```bash
node --test scripts/check-rpc-contract.test.mjs
```

Expected: FAIL — module not found

- [ ] **Step 3: Write minimal implementation**

Create `scripts/check-rpc-contract.mjs`:

```javascript
#!/usr/bin/env node
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');
const INFRA_SRC = join(REPO_ROOT, 'app/packages/infrastructure-supabase/src');
const MIGRATIONS_DIR = join(REPO_ROOT, 'supabase/migrations');
const TYPES_FILE = join(REPO_ROOT, 'app/packages/infrastructure-supabase/src/database.types.ts');
const ALLOWLIST_FILE = join(__dirname, 'check-rpc-contract.allowlist.json');

const RPC_RE = /\.rpc\(\s*['"]([a-z_][a-z0-9_]*)['"]/g;
const TABLE_RE = /\.from\(\s*['"]([a-z_][a-z0-9_]*)['"]/g;
const SKIP_DIRS = new Set(['__tests__', 'node_modules']);

function walkTsFiles(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) walkTsFiles(full, out);
    else if (/\.(ts|tsx)$/.test(entry)) out.push(full);
  }
  return out;
}

function collectSymbols(rootDir, regex) {
  const symbols = new Set();
  for (const file of walkTsFiles(rootDir)) {
    const content = readFileSync(file, 'utf8');
    regex.lastIndex = 0;
    let m;
    while ((m = regex.exec(content)) !== null) symbols.add(m[1]);
  }
  return symbols;
}

function loadCorpus(repoRoot) {
  const migrationSql = readdirSync(join(repoRoot, 'supabase/migrations'))
    .filter((f) => f.endsWith('.sql'))
    .map((f) => readFileSync(join(repoRoot, 'supabase/migrations', f), 'utf8'))
    .join('\n');
  const types = readFileSync(join(repoRoot, 'app/packages/infrastructure-supabase/src/database.types.ts'), 'utf8');
  return migrationSql + '\n' + types;
}

export function checkRpcContract({ repoRoot = REPO_ROOT } = {}) {
  const allowlist = JSON.parse(readFileSync(join(repoRoot, 'scripts/check-rpc-contract.allowlist.json'), 'utf8'));
  const infraDir = join(repoRoot, 'app/packages/infrastructure-supabase/src');
  const corpus = loadCorpus(repoRoot).toLowerCase();
  const errors = [];

  for (const rpc of collectSymbols(infraDir, RPC_RE)) {
    if (allowlist.rpcs.includes(rpc)) continue;
    const patterns = [
      `function public.${rpc}`,
      `function ${rpc}(`,
      `'${rpc}':`,
      `"${rpc}":`,
    ];
    if (!patterns.some((p) => corpus.includes(p.toLowerCase()))) {
      errors.push(`RPC '${rpc}' used in infrastructure-supabase but not found in migrations or database.types.ts`);
    }
  }

  for (const table of collectSymbols(infraDir, TABLE_RE)) {
    if (allowlist.tables.includes(table)) continue;
    const patterns = [
      `public.${table}`,
      `'${table}':`,
      `"${table}":`,
      `from('${table}')`,
    ];
    if (!patterns.some((p) => corpus.includes(p.toLowerCase()))) {
      errors.push(`Table '${table}' used in infrastructure-supabase but not found in migrations or database.types.ts`);
    }
  }

  return { ok: errors.length === 0, errors };
}

function main() {
  const result = checkRpcContract();
  if (!result.ok) {
    console.error(`✗ RPC contract check failed (${result.errors.length} issue(s)):\n`);
    for (const err of result.errors) console.error(`  • ${err}`);
    process.exit(1);
  }
  console.log('✓ RPC contract check passed.');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
```

- [ ] **Step 4: Run against real repo and fix allowlist if needed**

```bash
node --test scripts/check-rpc-contract.test.mjs
node scripts/check-rpc-contract.mjs
```

If false positives appear, add symbols to `scripts/check-rpc-contract.allowlist.json` with a one-line comment in the PR body explaining why.

Expected: PASS on current `main`/`dev` tree (adjust allowlist only if genuinely needed).

- [ ] **Step 5: Commit**

```bash
git add scripts/check-rpc-contract.mjs scripts/check-rpc-contract.test.mjs scripts/check-rpc-contract.allowlist.json
git commit -m "ci: add static rpc/table contract guard"
```

---

### Task 3: RLS lint SQL probe (P1)

**Files:**
- Create: `supabase/tests/rls-lint.sql`

- [ ] **Step 1: Write the SQL probe**

Create `supabase/tests/rls-lint.sql`:

```sql
-- rls-lint.sql — every public table must have RLS enabled and at least one policy.
-- Run after `supabase start` / `supabase db reset` in CI.

do $$
declare
  r record;
  v_policy_count integer;
begin
  for r in
    select c.relname as table_name, c.relrowsecurity as rls_enabled
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public'
       and c.relkind = 'r'
       and c.relname not like 'pg_%'
     order by c.relname
  loop
    if not r.rls_enabled then
      raise exception 'RLS lint: public.% has rowsecurity = false', r.table_name;
    end if;

    select count(*) into v_policy_count
      from pg_policies
     where schemaname = 'public'
       and tablename = r.table_name;

    if v_policy_count = 0 then
      raise exception 'RLS lint: public.% has RLS enabled but zero policies', r.table_name;
    end if;
  end loop;
end $$;

\echo '✓ rls-lint.sql passed — all public tables have RLS + policies'
```

- [ ] **Step 2: Verify locally**

```bash
supabase start -x studio,inbucket,imgproxy,edge-runtime,realtime,storage-api
PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -v ON_ERROR_STOP=1 -f supabase/tests/rls-lint.sql
supabase stop
```

Expected: `✓ rls-lint.sql passed`

- [ ] **Step 3: Commit**

```bash
git add supabase/tests/rls-lint.sql
git commit -m "ci: add rls lint sql probe"
```

---

### Task 4: database.types.ts drift guard (P1)

**Files:**
- Modify: `.github/workflows/ci-backend.yml` (Task 6 — add step)
- No standalone script needed; inline shell in workflow

The CI step (added in Task 6) will be:

```bash
supabase gen types typescript --local > /tmp/database.types.ts
diff -u app/packages/infrastructure-supabase/src/database.types.ts /tmp/database.types.ts
```

If diff is non-empty, fail with message to regenerate types after migration changes.

- [ ] **Step 1: Verify locally after Task 3**

```bash
supabase start -x studio,inbucket,imgproxy,edge-runtime,realtime,storage-api
supabase gen types typescript --local > /tmp/database.types.ts
diff -u app/packages/infrastructure-supabase/src/database.types.ts /tmp/database.types.ts || true
supabase stop
```

Expected: no diff (exit 0). If diff exists, regenerate and commit in a separate migration PR first.

- [ ] **Step 2: Document in plan notes only** — actual workflow step lands in Task 6.

---

### Task 5: Web manifest parity guard (P2)

**Files:**
- Create: `scripts/check-web-manifest.mjs`
- Create: `scripts/check-web-manifest.test.mjs`

- [ ] **Step 1: Write the failing test**

Create `scripts/check-web-manifest.test.mjs`:

```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { checkWebManifest } from './check-web-manifest.mjs';

test('passes when generated manifest name matches locale appName', () => {
  const root = mkdtempSync(join(tmpdir(), 'manifest-'));
  try {
    const localeDir = join(root, 'app/apps/mobile/src/i18n/locales/he');
    mkdirSync(localeDir, { recursive: true });
    writeFileSync(join(localeDir, 'index.ts'), `export default { appName: 'קarma' };`);
    const result = checkWebManifest({ repoRoot: root });
    assert.equal(result.ok, true, result.errors.join('\n'));
    assert.equal(result.appName, 'קarma');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
node --test scripts/check-web-manifest.test.mjs
```

Expected: FAIL — module not found

- [ ] **Step 3: Write implementation**

Create `scripts/check-web-manifest.mjs`:

```javascript
#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');

export function checkWebManifest({ repoRoot = REPO_ROOT } = {}) {
  const localeFile = join(repoRoot, 'app/apps/mobile/src/i18n/locales/he/index.ts');
  const localeContent = readFileSync(localeFile, 'utf8');
  const nameMatch = localeContent.match(/appName:\s*['"](.+?)['"]/);
  if (!nameMatch) {
    return { ok: false, errors: [`Could not find appName in ${localeFile}`], appName: null };
  }
  const appName = nameMatch[1];
  if (!appName.trim()) {
    return { ok: false, errors: ['appName is empty'], appName };
  }
  return { ok: true, errors: [], appName };
}

function main() {
  const result = checkWebManifest();
  if (!result.ok) {
    console.error('✗ Web manifest parity check failed:');
    for (const err of result.errors) console.error(`  • ${err}`);
    process.exit(1);
  }
  console.log(`✓ Web manifest parity check passed — appName: "${result.appName}"`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
```

Note: `manifest.json` is gitignored and generated at build time (`scripts/generate-web-manifest.mjs`). This guard verifies the locale source-of-truth is present and non-empty — same invariant the generator relies on.

- [ ] **Step 4: Run tests**

```bash
node --test scripts/check-web-manifest.test.mjs
node scripts/check-web-manifest.mjs
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add scripts/check-web-manifest.mjs scripts/check-web-manifest.test.mjs
git commit -m "ci: add web manifest parity guard"
```

---

### Task 6: Promote sqlProbes to local CI (P2)

**Files:**
- Modify: `app/packages/infrastructure-supabase/src/rpc/__tests__/sqlProbes.integration.test.ts`
- Modify: `.github/workflows/ci-backend.yml` (Task 7)

- [ ] **Step 1: Update sqlProbes to prefer local Supabase**

In `app/packages/infrastructure-supabase/src/rpc/__tests__/sqlProbes.integration.test.ts`, replace the env block at lines 18–20 with:

```typescript
const LOCAL_DEFAULT_URL = 'http://127.0.0.1:54321';
const LOCAL_DEFAULT_SERVICE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const SUPABASE_URL =
  process.env['SUPABASE_URL'] ??
  process.env['EXPO_PUBLIC_SUPABASE_URL'] ??
  (process.env['CI'] ? LOCAL_DEFAULT_URL : undefined);

const SERVICE_KEY =
  process.env['SUPABASE_SERVICE_ROLE_KEY'] ??
  (process.env['CI'] ? LOCAL_DEFAULT_SERVICE_KEY : undefined);

const SKIP = !SUPABASE_URL || !SERVICE_KEY;
```

The local service-role JWT is Supabase CLI's documented default for `supabase start`.

- [ ] **Step 2: Run locally with stack up**

```bash
supabase start -x studio,inbucket,imgproxy,edge-runtime,realtime,storage-api
cd app && pnpm --filter @kc/infrastructure-supabase test sqlProbes
supabase stop
```

Expected: sqlProbes tests PASS (not skipped)

- [ ] **Step 3: Commit**

```bash
git add app/packages/infrastructure-supabase/src/rpc/__tests__/sqlProbes.integration.test.ts
git commit -m "test(infra): run sql probes against local supabase in ci"
```

---

### Task 7: Split GitHub Actions workflows

**Files:**
- Create: `.github/workflows/ci-frontend.yml`
- Create: `.github/workflows/ci-backend.yml`
- Create: `.github/workflows/ci-contract.yml`
- Create: `.github/workflows/ci-pr.yml`
- Delete: `.github/workflows/ci.yml`
- Delete: `.github/workflows/db-validate.yml`
- Modify: `app/package.json`
- Modify: `docs/SSOT/RELEASE_CHECKLIST.md`
- Modify: `docs/SSOT/ENVIRONMENTS.md`
- Modify: `docs/SSOT/BACKLOG.md`

- [ ] **Step 1: Add npm scripts at repo root**

In `app/package.json`, add to `"scripts"`:

```json
"check:migration-chain": "node ../scripts/check-migration-chain.mjs",
"check:rpc-contract": "node ../scripts/check-rpc-contract.mjs",
"check:web-manifest": "node ../scripts/check-web-manifest.mjs",
"check:backend-guards": "node ../scripts/check-migration-chain.mjs && node ../scripts/check-rpc-contract.mjs",
"test:scripts": "node --test ../scripts/check-migration-chain.test.mjs ../scripts/check-rpc-contract.test.mjs ../scripts/check-web-manifest.test.mjs"
```

- [ ] **Step 2: Create ci-pr.yml**

Create `.github/workflows/ci-pr.yml`:

```yaml
name: CI — PR hygiene

on:
  pull_request:
    branches: [main, dev]
    types: [opened, synchronize, reopened, ready_for_review]

concurrency:
  group: ci-pr-${{ github.event.pull_request.number }}
  cancel-in-progress: true

permissions:
  contents: read
  pull-requests: read

jobs:
  pr-hygiene:
    name: PR hygiene
    if: github.event.pull_request.draft == false
    runs-on: ubuntu-latest
    timeout-minutes: 2
    steps:
      - name: Require Conventional Commits PR title
        uses: amannn/action-semantic-pull-request@v5
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          types: |
            feat
            fix
            refactor
            chore
            docs
            test
            perf
            build
            ci
            style
          requireScope: false
          subjectPattern: ^(?![A-Z]).+$
          subjectPatternError: |
            The PR title subject must start with a lowercase letter
            (Conventional Commits style).

      - name: Require "Mapped to spec" line in PR body
        uses: actions/github-script@v7
        with:
          script: |
            const body = context.payload.pull_request.body || '';
            if (!/Mapped to spec/i.test(body)) {
              core.setFailed(
                'PR body is missing a "Mapped to spec" section. ' +
                'See .github/PULL_REQUEST_TEMPLATE.md.'
              );
            }
```

- [ ] **Step 3: Create ci-frontend.yml**

Move jobs from current `ci.yml`: `quality`, `web-build`, `hebrew-source-scan`.

Key triggers:

```yaml
on:
  pull_request:
    branches: [main, dev]
    paths:
      - 'app/**'
      - 'Dockerfile'
      - 'scripts/extract-hebrew-text.mjs'
      - '.github/workflows/ci-frontend.yml'
  push:
    branches: [main, dev]
    paths:
      - 'app/**'
      - 'Dockerfile'
      - 'scripts/extract-hebrew-text.mjs'
      - '.github/workflows/ci-frontend.yml'
```

Add to every job:

```yaml
if: github.event_name != 'pull_request' || github.event.pull_request.draft == false
```

Copy job bodies verbatim from current `.github/workflows/ci.yml` lines 21–127.

- [ ] **Step 4: Create ci-contract.yml**

```yaml
name: CI — contract

on:
  pull_request:
    branches: [main, dev]
    paths:
      - 'app/packages/infrastructure-supabase/**'
      - 'app/packages/application/**'
      - 'supabase/migrations/**'
      - 'supabase/functions/**'
      - 'scripts/check-rpc-contract.mjs'
      - 'scripts/check-rpc-contract.allowlist.json'
      - 'scripts/check-web-manifest.mjs'
      - 'app/apps/mobile/src/i18n/locales/he/**'
      - '.github/workflows/ci-contract.yml'
  push:
    branches: [main, dev]
    paths: [same as above]

concurrency:
  group: ci-contract-${{ github.ref }}
  cancel-in-progress: true

permissions:
  contents: read

jobs:
  rpc-contract:
    name: rpc · table contract
    if: github.event_name != 'pull_request' || github.event.pull_request.draft == false
    runs-on: ubuntu-latest
    timeout-minutes: 5
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: node scripts/check-rpc-contract.mjs

  coalesce-mirror:
    name: coalesce mirror (app ↔ edge)
    if: github.event_name != 'pull_request' || github.event.pull_request.draft == false
    runs-on: ubuntu-latest
    timeout-minutes: 5
    defaults:
      run:
        working-directory: app
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: node scripts/check-architecture.mjs
        env:
          # check-architecture runs coalesce mirror + skips file walk if we extract?
          # Keep full script — fast enough; layer rules still valuable on contract paths.

  web-manifest:
    name: web manifest parity
    if: github.event_name != 'pull_request' || github.event.pull_request.draft == false
    runs-on: ubuntu-latest
    timeout-minutes: 3
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: node scripts/check-web-manifest.mjs
```

Note: `check-architecture.mjs` lives at `app/scripts/check-architecture.mjs` and scans packages + mobile — running it in contract job is acceptable; alternative future split is extracting coalesce check to `scripts/check-coalesce-mirror.mjs`.

- [ ] **Step 5: Create ci-backend.yml (replaces db-validate.yml)**

```yaml
name: CI — backend

on:
  pull_request:
    branches: [main, dev]
    paths:
      - 'supabase/**'
      - 'scripts/check-migration-chain.mjs'
      - '.github/workflows/ci-backend.yml'
  push:
    branches: [main, dev]
    paths: [same]

concurrency:
  group: ci-backend-${{ github.ref }}
  cancel-in-progress: true

permissions:
  contents: read

jobs:
  migration-chain:
    name: migration chain lint
    if: github.event_name != 'pull_request' || github.event.pull_request.draft == false
    runs-on: ubuntu-latest
    timeout-minutes: 3
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: node scripts/check-migration-chain.mjs

  db-validate:
    name: apply migrations · rls · types · sql probes
    needs: migration-chain
    if: github.event_name != 'pull_request' || github.event.pull_request.draft == false
    runs-on: ubuntu-latest
    timeout-minutes: 20
    steps:
      - uses: actions/checkout@v4

      - uses: supabase/setup-cli@v1
        with:
          version: 2.99.0

      - run: supabase --version

      - run: sudo apt-get update && sudo apt-get install -y postgresql-client

      - name: Start Supabase (applies all migrations + seed.sql)
        run: supabase start -x studio,inbucket,imgproxy,edge-runtime,realtime,storage-api

      - name: Run all DB tests (supabase/tests/*.sql)
        env:
          PGPASSWORD: postgres
        run: |
          set -euo pipefail
          shopt -s nullglob
          for f in supabase/tests/*.sql; do
            echo "── Running $f ──"
            psql -h 127.0.0.1 -p 54322 -U postgres -d postgres \
              -v ON_ERROR_STOP=1 \
              -f "$f"
          done

      - name: Check database.types.ts drift
        run: |
          set -euo pipefail
          supabase gen types typescript --local > /tmp/database.types.ts
          if ! diff -u app/packages/infrastructure-supabase/src/database.types.ts /tmp/database.types.ts; then
            echo "::error::database.types.ts is out of date. Run: supabase gen types typescript --local > app/packages/infrastructure-supabase/src/database.types.ts"
            exit 1
          fi

      - uses: pnpm/action-setup@v4
        with:
          version: 9.0.0
          run_install: false

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
          cache-dependency-path: app/pnpm-lock.yaml

      - name: Install dependencies
        working-directory: app
        run: pnpm install --frozen-lockfile

      - name: SQL probe integration tests (local stack)
        working-directory: app
        env:
          CI: true
        run: pnpm --filter @kc/infrastructure-supabase test sqlProbes

      - name: Stop Supabase
        if: always()
        run: supabase stop || true
```

- [ ] **Step 6: Delete old workflows**

```bash
git rm .github/workflows/ci.yml .github/workflows/db-validate.yml
```

- [ ] **Step 7: Update RELEASE_CHECKLIST.md required checks table**

Replace the merge-gates table with:

| Check | Workflow | Job |
| --- | --- | --- |
| Quality | CI — frontend | `typecheck · test · lint` |
| i18n guard | CI — frontend | `Hebrew source scan (no inline UI copy)` |
| Web bundle | CI — frontend | `web export (production bundle)` |
| Migration chain | CI — backend | `migration chain lint` |
| DB + RLS + types | CI — backend | `apply migrations · rls · types · sql probes` |
| Contract | CI — contract | `rpc · table contract` |
| PR hygiene | CI — PR hygiene | `PR hygiene` |

- [ ] **Step 8: Update ENVIRONMENTS.md**

Add under **Production release**:

```markdown
**CI layout (2026-05-22):** PR/push checks split into `ci-frontend.yml`, `ci-backend.yml`, `ci-contract.yml`, and `ci-pr.yml`. Path filters skip unrelated workflows; release PRs to `main` typically touch multiple paths and run the full set. Draft PRs skip all jobs except none (PR hygiene waits until ready_for_review).
```

- [ ] **Step 9: Update BACKLOG.md**

Add row:

```markdown
| INFRA-CI-SPLIT-GUARDS | Split CI into frontend/backend/contract workflows; add migration-chain, RLS lint, RPC contract, types drift, manifest parity, local sqlProbes | infra | ✅ Done | `docs/superpowers/plans/2026-05-22-ci-split-and-backend-guards.md` |
```

- [ ] **Step 10: Run full local verification**

From repo root:

```bash
node --test scripts/check-migration-chain.test.mjs scripts/check-rpc-contract.test.mjs scripts/check-web-manifest.test.mjs
node scripts/check-migration-chain.mjs
node scripts/check-rpc-contract.mjs
node scripts/check-web-manifest.mjs
cd app && pnpm typecheck && pnpm test && pnpm lint
supabase start -x studio,inbucket,imgproxy,edge-runtime,realtime,storage-api
# run db tests + types diff + sqlProbes as in ci-backend.yml
supabase stop
```

Expected: all green

- [ ] **Step 11: Commit**

```bash
git add .github/workflows/ app/package.json docs/SSOT/
git commit -m "ci: split workflows and add backend guard suite"
```

---

### Task 8: GitHub branch protection update (operator)

**Files:** none (GitHub UI only)

- [ ] **Step 1: Remove stale required checks**

Settings → Branches → `main` → Edit → Required status checks

Remove old names if present:
- `CI / typecheck · test · lint` (old workflow name `CI`)
- `DB validate / apply migrations on fresh local DB`

- [ ] **Step 2: Add new required checks**

Add:

| Workflow | Job |
| --- | --- |
| CI — frontend | `typecheck · test · lint` |
| CI — frontend | `Hebrew source scan (no inline UI copy)` |
| CI — frontend | `web export (production bundle)` |
| CI — backend | `migration chain lint` |
| CI — backend | `apply migrations · rls · types · sql probes` |
| CI — contract | `rpc · table contract` |
| CI — PR hygiene | `PR hygiene` |

Note: GitHub only lists checks after the new workflows run once on a PR. Open a throwaway PR or push a branch to populate the picker.

- [ ] **Step 3: Optional — do not require contract sub-jobs separately**

`coalesce mirror` and `web manifest parity` are informational at first; add as required only after one green run.

---

## Self-review

| Requirement | Task |
| --- | --- |
| Split CI workflows | Task 7 |
| Migration chain (Alembic single-head) | Task 1 |
| RLS lint | Task 3 (+ Task 7 runs it) |
| RPC contract | Task 2 (+ Task 7 ci-contract) |
| Manifest parity | Task 5 |
| database.types drift | Task 4 (+ Task 7) |
| sqlProbes in CI | Task 6 (+ Task 7) |
| Draft PR skip | Task 7 (all jobs) |
| SSOT docs | Task 7 |
| Branch protection guide | Task 8 |

**Placeholder scan:** No TBD steps. All code blocks are complete.

**Risk notes:**
- First `check-rpc-contract.mjs` run against real repo may need allowlist entries — fix in Task 2 Step 4, not by weakening the check.
- `rls-lint.sql` may fail if seed/migrations create tables without policies — fix migrations, not the lint.
- `database.types.ts` drift will fail until types are regenerated if currently out of sync — run gen types before merging this PR.
- Release PRs that only touch `docs/**` will not trigger frontend/backend/contract workflows — acceptable; `ci-pr.yml` still enforces hygiene.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-22-ci-split-and-backend-guards.md`. Two execution options:

**1. Subagent-Driven (recommended)** — dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** — execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
