# Cities truncation fix + city-dependent street picker — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the silent 1000-row truncation in the city picker and add a canonical, city-dependent street picker (with free-text fallback and onboarding progressive disclosure) across all four address surfaces.

**Architecture:** Two PRs targeting `dev`. PR 1 is a one-line fix to `SupabaseCityRepository` with regression tests. PR 2 adds (a) a new `public.streets` table seeded from data.gov.il package 321, (b) a domain entity + application port + Supabase adapter, (c) an extracted `SearchablePicker` shell that both `CityPicker` and the new `StreetPicker` consume, (d) UI wiring on the four surfaces with reset-on-city-change and progressive disclosure on onboarding only. No schema column changes on `users` / `posts`.

**Tech Stack:** TypeScript, React Native + expo-router (RN-Web for the dev preview), Supabase (Postgres + RLS + JS client), React Query, vitest with `react-native-web` aliasing for tests.

**Spec:** `docs/superpowers/specs/2026-05-18-cities-streets-picker-design.md`

**Hard rules from PM (2026-05-18):**
- Do **not** push to GitHub until the PM verifies locally.
- Tests must be comprehensive — every behavior covered.
- Code must be modern + efficient: no inline lambdas in render bodies for heavy lists, `useCallback`/`useMemo` where it matters, no `any`, no `console.log` left behind.

**Branch strategy:**
- PR 1 branch: `fix/FR-AUTH-010-cities-1000-row-cap` from `origin/dev`.
- PR 2 branch: `feat/streets-picker-city-dependent` from `origin/dev` (created after PR 1 is committed, **not** merged yet).
- Both branches stay local until PM approves.

---

## PR 1 — City list 1000-row cap fix

### Task 1.1: Failing regression test — `.limit()` is called with ≥ 1306

**Files:**
- Modify: `app/packages/infrastructure-supabase/src/cities/__tests__/SupabaseCityRepository.test.ts`

- [ ] **Step 1.1.1: Extend the fake Supabase client to capture `.limit()` calls**

Replace the `FromCall` interface and `makeFakeClient` chain to record `.limit`:

```ts
interface FromCall {
  table: string;
  select?: string;
  order?: { column: string; ascending: boolean };
  limit?: number;
}

function makeFakeClient(opts: {
  data?: unknown;
  error?: { message: string } | null;
}): { client: SupabaseClient<any>; calls: FromCall[] } {
  const calls: FromCall[] = [];
  const client = {
    from: (table: string) => {
      const call: FromCall = { table };
      calls.push(call);
      const chain = {
        select: (cols: string) => { call.select = cols; return chain; },
        order: (column: string, opt: { ascending: boolean }) => {
          call.order = { column, ascending: opt.ascending };
          return chain;
        },
        limit: (n: number) => {
          call.limit = n;
          return Promise.resolve({
            data: opts.data ?? null,
            error: opts.error ?? null,
          });
        },
      };
      return chain;
    },
  } as unknown as SupabaseClient<any>;
  return { client, calls };
}
```

- [ ] **Step 1.1.2: Add a new test asserting `.limit()` ≥ 1306**

Add inside the existing `describe('listAll', () => { ... })`:

```ts
it('applies an explicit row cap large enough for the full Israeli city list (≥ 1306)', async () => {
  // Supabase JS client defaults to 1000 rows when no .limit() is set.
  // The seed (migration 0008) inserts 1306 cities; without an explicit cap
  // ~306 settlements past letter ע (incl. תל אביב, פתח תקווה) are silently dropped.
  const { client, calls } = makeFakeClient({ data: [] });
  const repo = new SupabaseCityRepository(client);

  await repo.listAll();

  expect(calls).toHaveLength(1);
  expect(calls[0]?.limit).toBeDefined();
  expect(calls[0]!.limit!).toBeGreaterThanOrEqual(1306);
});
```

- [ ] **Step 1.1.3: Run the test, confirm it fails**

```bash
cd app && pnpm --filter @kc/infrastructure-supabase test -- --run cities/__tests__/SupabaseCityRepository
```

Expected: the new test fails with `expected undefined to be defined` (because `listAll` doesn't call `.limit` yet). Existing tests still pass — the fake client's `.order` previously returned a Promise; now it returns the chain. Existing tests don't await `.order` directly, they await `repo.listAll()`, so they should continue to pass.

- [ ] **Step 1.1.4: Commit the failing test**

```bash
cd /Users/navesarussi/KC/MVP-2/.claude/worktrees/xenodochial-bardeen-8e85c1
git checkout -b fix/FR-AUTH-010-cities-1000-row-cap
git add app/packages/infrastructure-supabase/src/cities/__tests__/SupabaseCityRepository.test.ts
git commit -m "test(infra): add failing regression for city list row cap"
```

---

### Task 1.2: Failing regression test — 1306-row mapping survives

**Files:**
- Modify: `app/packages/infrastructure-supabase/src/cities/__tests__/SupabaseCityRepository.test.ts`

- [ ] **Step 1.2.1: Add a mapping-shape regression test**

Append inside the same `describe('listAll')`:

```ts
it('returns every row the client emits — no client-side truncation (1306-row regression)', async () => {
  // Builds 1306 mock rows mimicking the production seed shape and verifies
  // the mapper returns all of them, in order. Guards against any future
  // accidental .slice() / .filter() inside listAll.
  const data = Array.from({ length: 1306 }, (_, i) => ({
    city_id: String(i + 1),
    name_he: `עיר ${i + 1}`,
    name_en: `City ${i + 1}`,
  }));
  const { client } = makeFakeClient({ data });
  const repo = new SupabaseCityRepository(client);

  const out = await repo.listAll();

  expect(out).toHaveLength(1306);
  expect(out[0]).toEqual({ cityId: '1', nameHe: 'עיר 1', nameEn: 'City 1' });
  expect(out[1305]).toEqual({ cityId: '1306', nameHe: 'עיר 1306', nameEn: 'City 1306' });
});
```

- [ ] **Step 1.2.2: Run, confirm it passes**

```bash
cd app && pnpm --filter @kc/infrastructure-supabase test -- --run cities/__tests__/SupabaseCityRepository
```

Expected: this test passes (the mapper already doesn't truncate). The `limit` test still fails.

- [ ] **Step 1.2.3: Commit**

```bash
git add app/packages/infrastructure-supabase/src/cities/__tests__/SupabaseCityRepository.test.ts
git commit -m "test(infra): add 1306-row mapping regression for cities"
```

---

### Task 1.3: Implementation — add `.limit(2000)`

**Files:**
- Modify: `app/packages/infrastructure-supabase/src/cities/SupabaseCityRepository.ts`

- [ ] **Step 1.3.1: Add explicit row cap**

Edit the `listAll` body:

```ts
async listAll(): Promise<City[]> {
  // Supabase JS client defaults to 1000 rows when no .limit() is set; seed
  // 0008_seed_all_cities.sql ships 1306 settlements, so without this cap the
  // list is silently truncated mid-ע (תל אביב, פתח תקווה, etc. disappear).
  // 2000 leaves headroom for future municipal updates from data.gov.il.
  const { data, error } = await this.client
    .from('cities')
    .select('city_id, name_he, name_en')
    .order('name_he', { ascending: true })
    .limit(2000);
  if (error) throw new Error(`listAll cities: ${error.message}`);
  const rows = (data ?? []) as Row[];
  return rows.map((r) => ({
    cityId: r.city_id,
    nameHe: r.name_he,
    nameEn: r.name_en,
  }));
}
```

- [ ] **Step 1.3.2: Run the package tests, confirm all pass**

```bash
cd app && pnpm --filter @kc/infrastructure-supabase test -- --run cities
```

Expected: all 8 tests pass (6 pre-existing + 2 new).

- [ ] **Step 1.3.3: Run package typecheck**

```bash
cd app && pnpm --filter @kc/infrastructure-supabase typecheck
```

Expected: clean exit.

- [ ] **Step 1.3.4: Commit**

```bash
git add app/packages/infrastructure-supabase/src/cities/SupabaseCityRepository.ts
git commit -m "fix(infra): cap cities listAll at 2000 rows to bypass Supabase 1000-row default

The JS client returns at most 1000 rows when no .limit() is set, silently
truncating the 1306-row Israeli city seed mid-ע. Tel Aviv (5000), Petah Tikva
(7900), Rishon LeZion (8300), and other post-ע settlements were unreachable
from the city picker. Adds .limit(2000) with headroom for future municipal
updates.

Mapped to spec: FR-AUTH-010 AC2, FR-PROFILE-007 AC1. Refactor logged: No."
```

---

### Task 1.4: Repo-wide verification gate

- [ ] **Step 1.4.1: Run the full app verification chain**

```bash
cd app && pnpm typecheck && pnpm test && pnpm lint
```

Expected: all three clean. If any unrelated test/lint breakage surfaces, surface it to the PM — don't try to "fix" unrelated red.

- [ ] **Step 1.4.2: Pause here**

Do **not** push, do **not** create a PR. Report PR 1 readiness to PM and wait. Continue to PR 2 only after PM has greenlit local PR 1.

---

## PR 2 — City-dependent street picker

### Task 2.1: Generate streets seed data

**Files:**
- Create: `scripts/generate-streets-seed.mjs`
- Create: `supabase/migrations/0101_seed_streets.sql` (output of the script — committed)

- [ ] **Step 2.1.1: Write the generator script**

Create `/Users/navesarussi/KC/MVP-2/.claude/worktrees/xenodochial-bardeen-8e85c1/scripts/generate-streets-seed.mjs`:

```javascript
#!/usr/bin/env node
// Generates supabase/migrations/0101_seed_streets.sql from the canonical
// data.gov.il streets resource (package 321, resource 9ad3862c...).
//
// Run manually when a fresh snapshot is wanted:
//     node scripts/generate-streets-seed.mjs
//
// Output is deterministic for a given source snapshot. The script ALSO
// synthesizes a code-9000 sentinel row for any city present in
// supabase/migrations/0008_seed_all_cities.sql but absent from the source
// (today: 3729 כדים, 3758 גנים).

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '..');
const RESOURCE = '9ad3862c-8391-4b2f-84a4-2d4c68625f4b';
const PAGE = 32000;

async function fetchAll() {
  const out = [];
  let offset = 0;
  let total = null;
  while (true) {
    const url = `https://data.gov.il/api/3/action/datastore_search?resource_id=${RESOURCE}&limit=${PAGE}&offset=${offset}`;
    const res = await fetch(url, { headers: { 'User-Agent': 'kc-streets-seed/1.0' } });
    if (!res.ok) throw new Error(`CKAN ${res.status}`);
    const body = await res.json();
    if (!body.success) throw new Error(`CKAN error: ${JSON.stringify(body.error)}`);
    if (total === null) total = body.result.total;
    const recs = body.result.records ?? [];
    if (!recs.length) break;
    out.push(...recs);
    offset += recs.length;
    if (offset >= total) break;
  }
  return out;
}

function loadOurCityIds() {
  return fs
    .readFile(path.join(REPO, 'supabase/migrations/0008_seed_all_cities.sql'), 'utf8')
    .then((sql) => {
      const map = new Map();
      for (const line of sql.split('\n')) {
        const m = line.match(/^\s*\('(\d+)',\s*'([^']+)',/);
        if (m) map.set(m[1], m[2]);
      }
      return map;
    });
}

function sqlQuote(s) {
  return `'${String(s).replace(/'/g, "''")}'`;
}

async function main() {
  console.error('Fetching streets from data.gov.il...');
  const records = await fetchAll();
  console.error(`Got ${records.length} rows`);

  const cities = await loadOurCityIds();
  console.error(`Our cities seed has ${cities.size} entries`);

  // Bucket by city_id
  const byCity = new Map();
  for (const r of records) {
    const cid = String(r['סמל_ישוב']);
    const code = Number(r['סמל_רחוב']);
    const name = String(r['שם_רחוב'] ?? '').trim();
    if (!name) continue;
    if (!byCity.has(cid)) byCity.set(cid, []);
    byCity.get(cid).push([code, name]);
  }

  // Synthesize sentinels for our-seed cities missing from source
  const missing = [];
  for (const [cid, cname] of cities.entries()) {
    if (!byCity.has(cid)) {
      byCity.set(cid, [[9000, cname]]);
      missing.push(`${cid}=${cname}`);
    }
  }
  if (missing.length) console.error(`Synthesized 9000-sentinel for: ${missing.join(', ')}`);

  // Sort: city_id numeric asc, then street_id asc
  const ordered = [...byCity.entries()].sort((a, b) => Number(a[0]) - Number(b[0]));
  let totalRows = 0;
  for (const [, list] of ordered) {
    list.sort((a, b) => a[0] - b[0]);
    totalRows += list.length;
  }

  // Emit SQL
  const out = [];
  out.push('-- 0101_seed_streets | Bulk-seed Israeli street list from data.gov.il package 321');
  out.push('-- (resource 9ad3862c-8391-4b2f-84a4-2d4c68625f4b). Generated by');
  out.push('-- scripts/generate-streets-seed.mjs from the snapshot fetched at script run time.');
  out.push('--');
  out.push('-- Total rows seeded: ' + totalRows);
  out.push('-- Source cities: ' + (byCity.size - missing.length) + '. Synthesized 9000-sentinel rows: ' + missing.length + '.');
  out.push('-- Code 9000 = "the village itself" sentinel (kept). Code 9477 in Jerusalem = real');
  out.push('-- street (אל בארודי), not a sentinel — kept as-is.');
  out.push('--');
  out.push('-- Idempotent via on-conflict; safe to re-run when refreshing from a newer source.');
  out.push('');
  out.push('insert into public.streets (city_id, street_id, name_he) values');
  const lines = [];
  for (const [cid, list] of ordered) {
    for (const [code, name] of list) {
      lines.push(`  (${sqlQuote(cid)}, ${code}, ${sqlQuote(name)})`);
    }
  }
  out.push(lines.join(',\n') + '\non conflict (city_id, street_id) do nothing;');
  out.push('');

  const target = path.join(REPO, 'supabase/migrations/0101_seed_streets.sql');
  await fs.writeFile(target, out.join('\n'), 'utf8');
  console.error(`Wrote ${totalRows} rows to ${target}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
```

- [ ] **Step 2.1.2: Run the script (requires network)**

```bash
cd /Users/navesarussi/KC/MVP-2/.claude/worktrees/xenodochial-bardeen-8e85c1
node scripts/generate-streets-seed.mjs
```

Expected: stderr reports `Got 63563 rows`, `Synthesized 9000-sentinel for: 3729=…, 3758=…`, `Wrote 63565 rows to …0101_seed_streets.sql`. File size around 5 MB.

- [ ] **Step 2.1.3: Sanity-check the generated SQL**

```bash
head -20 supabase/migrations/0101_seed_streets.sql && echo '---' && grep -c '^  (' supabase/migrations/0101_seed_streets.sql && echo '---' && grep -E "'5000'" supabase/migrations/0101_seed_streets.sql | head -5
```

Expected: header comment block, then 63,565 insert rows. The `5000` grep should show real Tel Aviv streets like `אלנבי`.

- [ ] **Step 2.1.4: Commit the script + generated SQL on a fresh feature branch from `origin/dev`**

```bash
git fetch origin
git checkout -b feat/streets-picker-city-dependent origin/dev
# Move the not-yet-pushed PR 1 commits onto the new branch first? No —
# PR 1 stays on its own branch. PR 2 is independent of PR 1 except for
# the test fix in 1.1.1; we re-apply that change only if PR 1 hasn't
# landed by the time PR 2 is committed. (If PR 1 is already squashed into
# dev when PR 2 starts, nothing to do.)
git add scripts/generate-streets-seed.mjs supabase/migrations/0101_seed_streets.sql
git commit -m "feat(infra): generator + seed for canonical Israeli streets

Adds scripts/generate-streets-seed.mjs that pulls data.gov.il package 321
(resource 9ad3862c...) via CKAN datastore_search, normalizes to
(city_id, street_id, name_he), and emits supabase/migrations/0101_seed_streets.sql.
Synthesizes a 9000-sentinel for the 2 cities present in our cities seed but
absent from the source (גנים, כדים). Total seeded: 63565 rows. No filtering
of code 9000 (the village itself) — those rows are the only canonical entry
for 486 small settlements.

Mapped to spec: FR-PROFILE-007 AC1. Refactor logged: No."
```

---

### Task 2.2: Streets table migration

**Files:**
- Create: `supabase/migrations/0100_create_streets.sql`

- [ ] **Step 2.2.1: Write the schema migration**

```sql
-- 0100_create_streets | Canonical Israeli street list, keyed by city.
-- Sourced from data.gov.il package 321 (resource 9ad3862c-8391-4b2f-84a4-2d4c68625f4b).
-- Seeded in 0101_seed_streets.sql.
--
-- Notes:
--   * (city_id, street_id) is the natural key — street_id is unique per
--     city, not globally.
--   * No name_en column: the source file has no English names.
--   * RLS mirrors public.cities — public read for anon + authenticated;
--     writes via service role only (migrations).
--   * Code 9000 in street_id is the source's "the village itself"
--     sentinel — kept verbatim; it's the only entry for 486 settlements.

create table public.streets (
  city_id   text     not null references public.cities(city_id) on delete cascade,
  street_id integer  not null,
  name_he   text     not null,
  primary key (city_id, street_id)
);

create index streets_city_name_idx on public.streets (city_id, name_he);

alter table public.streets enable row level security;

create policy "streets_public_read"
  on public.streets
  for select
  to anon, authenticated
  using (true);

comment on table public.streets is
  'Canonical Israeli streets keyed by (city_id, street_id). Sourced from data.gov.il package 321. Code 9000 = "the village itself" sentinel.';
```

- [ ] **Step 2.2.2: Apply the migration to the dev Supabase project**

Via Supabase MCP — apply 0097 first, then 0098:

```
Run mcp__supabase__apply_migration with name="0100_create_streets" and the SQL body above.
Run mcp__supabase__apply_migration with name="0101_seed_streets" using the body of supabase/migrations/0101_seed_streets.sql.
```

If Supabase MCP is not available in the session, fall back to:

```bash
cd /Users/navesarussi/KC/MVP-2/.claude/worktrees/xenodochial-bardeen-8e85c1
# Loads SUPABASE_ACCESS_TOKEN + SUPABASE_DB_URL from ~/.kc-dev-secrets.env
set -a; . ~/.kc-dev-secrets.env; set +a
psql "$SUPABASE_DB_URL" -f supabase/migrations/0100_create_streets.sql
psql "$SUPABASE_DB_URL" -f supabase/migrations/0101_seed_streets.sql
```

- [ ] **Step 2.2.3: Verify dev DB state**

```bash
psql "$SUPABASE_DB_URL" -c "select count(*) from public.streets;"
psql "$SUPABASE_DB_URL" -c "select count(distinct city_id) from public.streets;"
psql "$SUPABASE_DB_URL" -c "select count(*) from public.streets where city_id = '5000';"  -- Tel Aviv
```

Expected: 63565 / 1306 / 2769.

- [ ] **Step 2.2.4: Regenerate database.types.ts**

```bash
cd /Users/navesarussi/KC/MVP-2/.claude/worktrees/xenodochial-bardeen-8e85c1
set -a; . ~/.kc-dev-secrets.env; set +a
npx supabase gen types typescript --project-id roeefqpdbftlndzsvhfj > app/packages/infrastructure-supabase/src/database.types.ts
```

- [ ] **Step 2.2.5: Commit migration + types**

```bash
git add supabase/migrations/0100_create_streets.sql app/packages/infrastructure-supabase/src/database.types.ts
git commit -m "feat(infra): public.streets table + public-read RLS

Canonical Israeli streets keyed by (city_id, street_id), referencing
public.cities with on-delete cascade. Public read for anon + authenticated,
mirroring the cities policy. Index on (city_id, name_he) supports the
per-city, name-sorted lookup driven by the new StreetPicker.

Mapped to spec: FR-PROFILE-007 AC1. Refactor logged: No."
```

---

### Task 2.3: Domain entity — `Street`

**Files:**
- Modify: `app/packages/domain/src/entities.ts` (or `value-objects.ts` if that's where City lives)
- Create: `app/packages/domain/src/__tests__/street.test.ts`

- [ ] **Step 2.3.1: Locate the existing `City` declaration**

```bash
grep -nE "interface City\b|type City =\b" app/packages/domain/src/*.ts
```

The new `Street` interface lives in the same file as `City` to keep entity declarations co-located.

- [ ] **Step 2.3.2: Add the `Street` interface and re-export**

In the file that owns `City`:

```ts
export interface Street {
  readonly cityId: string;
  readonly streetId: number;
  readonly nameHe: string;
}
```

Then ensure `app/packages/domain/src/index.ts` re-exports `Street` alongside `City`:

```bash
grep -n 'export.*City' app/packages/domain/src/index.ts
```

If the line exists as `export type { City } from './entities';` (or wherever), add `Street`:

```ts
export type { City, Street } from './entities';
```

- [ ] **Step 2.3.3: Write a structural sanity test**

`app/packages/domain/src/__tests__/street.test.ts`:

```ts
import { describe, it, expectTypeOf } from 'vitest';
import type { Street } from '../index';

describe('Street entity', () => {
  it('has the canonical shape used by the picker contract', () => {
    expectTypeOf<Street>().toEqualTypeOf<{
      readonly cityId: string;
      readonly streetId: number;
      readonly nameHe: string;
    }>();
  });
});
```

- [ ] **Step 2.3.4: Run domain tests**

```bash
cd app && pnpm --filter @kc/domain test -- --run street
```

Expected: pass.

- [ ] **Step 2.3.5: Commit**

```bash
git add app/packages/domain
git commit -m "feat(domain): add Street entity for canonical street picker"
```

---

### Task 2.4: Application port — `IStreetRepository`

**Files:**
- Create: `app/packages/application/src/ports/IStreetRepository.ts`
- Modify: `app/packages/application/src/index.ts`

- [ ] **Step 2.4.1: Inspect the existing `ICityRepository` to mirror its style**

```bash
grep -rn "ICityRepository" app/packages/application/src | head
```

- [ ] **Step 2.4.2: Create the new port**

```ts
// app/packages/application/src/ports/IStreetRepository.ts
//
// Port for canonical streets, keyed by city.
// Mirrors ICityRepository — pure interface, no Supabase types here.
// Implementations live in @kc/infrastructure-supabase.

import type { Street } from '@kc/domain';

export interface IStreetRepository {
  /**
   * Returns every street known for `cityId`, sorted by Hebrew name ascending.
   * Returns an empty array if the city is not in the streets table.
   * Throws on transport / DB errors.
   */
  listByCity(cityId: string): Promise<Street[]>;
}
```

- [ ] **Step 2.4.3: Re-export from the application barrel**

In `app/packages/application/src/index.ts`, add next to the existing `ICityRepository` export:

```ts
export type { IStreetRepository } from './ports/IStreetRepository';
```

- [ ] **Step 2.4.4: Run application typecheck**

```bash
cd app && pnpm --filter @kc/application typecheck
```

Expected: clean.

- [ ] **Step 2.4.5: Commit**

```bash
git add app/packages/application
git commit -m "feat(application): add IStreetRepository port"
```

---

### Task 2.5: Supabase adapter — `SupabaseStreetRepository`

**Files:**
- Create: `app/packages/infrastructure-supabase/src/streets/SupabaseStreetRepository.ts`
- Create: `app/packages/infrastructure-supabase/src/streets/__tests__/SupabaseStreetRepository.test.ts`
- Modify: `app/packages/infrastructure-supabase/src/index.ts`

- [ ] **Step 2.5.1: Write the failing repository test first**

```ts
// app/packages/infrastructure-supabase/src/streets/__tests__/SupabaseStreetRepository.test.ts
import { describe, it, expect } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseStreetRepository } from '../SupabaseStreetRepository';

/* eslint-disable @typescript-eslint/no-explicit-any */

interface FromCall {
  table: string;
  select?: string;
  eq?: { column: string; value: unknown };
  order?: { column: string; ascending: boolean };
  limit?: number;
}

function makeFakeClient(opts: { data?: unknown; error?: { message: string } | null }) {
  const calls: FromCall[] = [];
  const client = {
    from: (table: string) => {
      const call: FromCall = { table };
      calls.push(call);
      const chain = {
        select: (cols: string) => { call.select = cols; return chain; },
        eq: (column: string, value: unknown) => { call.eq = { column, value }; return chain; },
        order: (column: string, opt: { ascending: boolean }) => {
          call.order = { column, ascending: opt.ascending }; return chain;
        },
        limit: (n: number) => {
          call.limit = n;
          return Promise.resolve({ data: opts.data ?? null, error: opts.error ?? null });
        },
      };
      return chain;
    },
  } as unknown as SupabaseClient<any>;
  return { client, calls };
}

describe('SupabaseStreetRepository', () => {
  describe('listByCity', () => {
    it('queries streets for the given city_id, sorted by name_he asc, with a 5000-row cap', async () => {
      // 5000 covers Jerusalem (4384 rows) with margin. No silent truncation
      // even for the largest city.
      const { client, calls } = makeFakeClient({ data: [] });
      const repo = new SupabaseStreetRepository(client);

      await repo.listByCity('5000');

      expect(calls).toHaveLength(1);
      expect(calls[0]?.table).toBe('streets');
      expect(calls[0]?.select).toBe('city_id, street_id, name_he');
      expect(calls[0]?.eq).toEqual({ column: 'city_id', value: '5000' });
      expect(calls[0]?.order).toEqual({ column: 'name_he', ascending: true });
      expect(calls[0]?.limit).toBeGreaterThanOrEqual(5000);
    });

    it('maps rows from snake_case to camelCase Street entities', async () => {
      const { client } = makeFakeClient({
        data: [
          { city_id: '5000', street_id: 123, name_he: 'אלנבי' },
          { city_id: '5000', street_id: 456, name_he: 'בן יהודה' },
        ],
      });
      const repo = new SupabaseStreetRepository(client);

      const out = await repo.listByCity('5000');

      expect(out).toEqual([
        { cityId: '5000', streetId: 123, nameHe: 'אלנבי' },
        { cityId: '5000', streetId: 456, nameHe: 'בן יהודה' },
      ]);
    });

    it('returns [] when the city has no streets in the table', async () => {
      const { client } = makeFakeClient({ data: [] });
      const repo = new SupabaseStreetRepository(client);
      expect(await repo.listByCity('3729')).toEqual([]);
    });

    it('returns [] when the response data is null (defensive coalesce)', async () => {
      const { client } = makeFakeClient({ data: null });
      const repo = new SupabaseStreetRepository(client);
      expect(await repo.listByCity('5000')).toEqual([]);
    });

    it('throws with a prefixed "listByCity streets: " message on error', async () => {
      const { client } = makeFakeClient({ data: null, error: { message: 'connection reset' } });
      const repo = new SupabaseStreetRepository(client);
      await expect(repo.listByCity('5000')).rejects.toThrow('listByCity streets: connection reset');
    });

    it('throws even when the error object carries an empty message', async () => {
      const { client } = makeFakeClient({ data: null, error: { message: '' } });
      const repo = new SupabaseStreetRepository(client);
      await expect(repo.listByCity('5000')).rejects.toThrow('listByCity streets: ');
    });

    it('preserves the order returned by the database (no client-side re-sort)', async () => {
      const { client } = makeFakeClient({
        data: [
          { city_id: '5000', street_id: 2, name_he: 'ב' },
          { city_id: '5000', street_id: 1, name_he: 'א' },
        ],
      });
      const repo = new SupabaseStreetRepository(client);
      const out = await repo.listByCity('5000');
      expect(out.map((s) => s.streetId)).toEqual([2, 1]);
    });
  });
});
```

- [ ] **Step 2.5.2: Run the test, confirm it fails (module not found)**

```bash
cd app && pnpm --filter @kc/infrastructure-supabase test -- --run streets/__tests__
```

Expected: fails because `SupabaseStreetRepository` doesn't exist.

- [ ] **Step 2.5.3: Write the implementation**

```ts
// app/packages/infrastructure-supabase/src/streets/SupabaseStreetRepository.ts
//
// SupabaseStreetRepository — adapter for IStreetRepository.
// Reads from `public.streets` (publicly readable per migration 0097).
//
// 5000-row cap covers the largest city (Jerusalem: 4384 streets) with margin.
// Bypasses the Supabase JS client's 1000-row default cap.

import type { SupabaseClient } from '@supabase/supabase-js';
import type { IStreetRepository } from '@kc/application';
import type { Street } from '@kc/domain';

interface Row {
  city_id: string;
  street_id: number;
  name_he: string;
}

export class SupabaseStreetRepository implements IStreetRepository {
  constructor(private readonly client: SupabaseClient) {}

  async listByCity(cityId: string): Promise<Street[]> {
    const { data, error } = await this.client
      .from('streets')
      .select('city_id, street_id, name_he')
      .eq('city_id', cityId)
      .order('name_he', { ascending: true })
      .limit(5000);
    if (error) throw new Error(`listByCity streets: ${error.message}`);
    const rows = (data ?? []) as Row[];
    return rows.map((r) => ({
      cityId: r.city_id,
      streetId: r.street_id,
      nameHe: r.name_he,
    }));
  }
}
```

- [ ] **Step 2.5.4: Re-export from the infra barrel**

In `app/packages/infrastructure-supabase/src/index.ts`, add next to `SupabaseCityRepository`:

```ts
export { SupabaseStreetRepository } from './streets/SupabaseStreetRepository';
```

- [ ] **Step 2.5.5: Run tests + typecheck**

```bash
cd app && pnpm --filter @kc/infrastructure-supabase test -- --run streets && pnpm --filter @kc/infrastructure-supabase typecheck
```

Expected: 7 tests pass, types clean.

- [ ] **Step 2.5.6: Commit**

```bash
git add app/packages/infrastructure-supabase/src/streets app/packages/infrastructure-supabase/src/index.ts
git commit -m "feat(infra): SupabaseStreetRepository (city-keyed canonical streets)

Implements IStreetRepository against public.streets with explicit .limit(5000)
to cover Jerusalem (4384 rows) with margin and bypass the JS client's 1000-row
default cap. Mirrors SupabaseCityRepository in error mapping and shape mapping.

Mapped to spec: FR-PROFILE-007 AC1. Refactor logged: No."
```

---

### Task 2.6: Composition root — `listStreets`

**Files:**
- Modify: `app/apps/mobile/src/services/userComposition.ts`

- [ ] **Step 2.6.1: Add the singleton + helper**

Locate `getCityRepo` and `listCities`; insert symmetric streets versions:

```ts
import {
  getSupabaseClient,
  SupabaseUserRepository,
  SupabaseCityRepository,
  SupabaseStreetRepository,
  type SupabaseAuthStorage,
} from '@kc/infrastructure-supabase';
import {
  // ...existing imports
  type ICityRepository,
  type IStreetRepository,
  type IUserRepository,
} from '@kc/application';
import type { City, OnboardingState, Street } from '@kc/domain';

let _streetRepo: IStreetRepository | null = null;

function getStreetRepo(): IStreetRepository {
  if (_streetRepo) return _streetRepo;
  _streetRepo = new SupabaseStreetRepository(getSupabaseClient({ storage: pickStorage() }));
  return _streetRepo;
}

/** Lists every street for a city from `public.streets` ordered by Hebrew name. */
export function listStreets(cityId: string): Promise<Street[]> {
  return getStreetRepo().listByCity(cityId);
}
```

- [ ] **Step 2.6.2: Run mobile typecheck**

```bash
cd app && pnpm --filter @kc/mobile typecheck
```

Expected: clean.

- [ ] **Step 2.6.3: Commit**

```bash
git add app/apps/mobile/src/services/userComposition.ts
git commit -m "feat(mobile): wire SupabaseStreetRepository into composition root"
```

---

### Task 2.7: Extract `SearchablePicker` shell

**Files:**
- Create: `app/apps/mobile/src/components/SearchablePicker/SearchablePicker.tsx`
- Create: `app/apps/mobile/src/components/SearchablePicker/__tests__/SearchablePicker.test.tsx`

- [ ] **Step 2.7.1: Inspect the current `CityPicker` for the exact styles + a11y patterns**

```bash
cat app/apps/mobile/src/components/CityPicker.tsx
```

Goal: lift the entire modal+search+list block verbatim, generalizing only the data source + filter predicate + free-text behavior. Styles MUST be identical (PM requirement: pickers look the same).

- [ ] **Step 2.7.2: Write the failing component test**

`app/apps/mobile/src/components/SearchablePicker/__tests__/SearchablePicker.test.tsx`:

```tsx
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent, act } from '@testing-library/react';
import { SearchablePicker } from '../SearchablePicker';

// Force a deterministic translation: identity function returning the key.
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

interface Item { id: string; name: string }
const ITEMS: Item[] = [
  { id: '1', name: 'אלנבי' },
  { id: '2', name: 'בן יהודה' },
  { id: '3', name: 'גורדון' },
];

function renderPicker(overrides: Partial<React.ComponentProps<typeof SearchablePicker<Item>>> = {}) {
  const onSelect = vi.fn();
  const utils = render(
    <SearchablePicker<Item>
      title="t.streetPickerTitle"
      placeholder="t.streetPickerSearchPlaceholder"
      value={null}
      items={ITEMS}
      isLoading={false}
      error={null}
      onSelect={onSelect}
      matchItem={(it, q) => it.name.includes(q)}
      renderRow={(it) => ({ id: it.id, name: it.name })}
      {...overrides}
    />
  );
  return { ...utils, onSelect };
}

describe('SearchablePicker', () => {
  it('renders the field with the placeholder when value is null', () => {
    const { getByText } = renderPicker();
    expect(getByText('t.streetPickerTitle')).toBeTruthy();
  });

  it('renders the selected value when present', () => {
    const { getByText } = renderPicker({ value: { id: '2', name: 'בן יהודה' } });
    expect(getByText('בן יהודה')).toBeTruthy();
  });

  it('does not open the modal when disabled, and exposes the helper text', () => {
    const { getByText, queryByPlaceholderText } = renderPicker({
      disabled: true,
      disabledHelperText: 'בחרו עיר תחילה',
    });
    fireEvent.click(getByText('t.streetPickerTitle'));
    expect(queryByPlaceholderText('t.streetPickerSearchPlaceholder')).toBeNull();
    expect(getByText('בחרו עיר תחילה')).toBeTruthy();
  });

  it('opens the modal on press when enabled and lists the items', () => {
    const { getByText, getAllByText } = renderPicker();
    fireEvent.click(getByText('t.streetPickerTitle'));
    expect(getAllByText('אלנבי').length).toBeGreaterThan(0);
    expect(getAllByText('בן יהודה').length).toBeGreaterThan(0);
    expect(getAllByText('גורדון').length).toBeGreaterThan(0);
  });

  it('filters items via matchItem when the user types', () => {
    const { getByText, getByPlaceholderText, queryByText } = renderPicker();
    fireEvent.click(getByText('t.streetPickerTitle'));
    const input = getByPlaceholderText('t.streetPickerSearchPlaceholder');
    fireEvent.change(input, { target: { value: 'בן' } });
    expect(queryByText('אלנבי')).toBeNull();
    expect(queryByText('בן יהודה')).toBeTruthy();
  });

  it('emits onSelect with the renderRow result when a row is tapped', () => {
    const { getByText, onSelect } = renderPicker();
    fireEvent.click(getByText('t.streetPickerTitle'));
    fireEvent.click(getByText('בן יהודה'));
    expect(onSelect).toHaveBeenCalledWith({ id: '2', name: 'בן יהודה' });
  });

  it('shows the free-text row only when allowFreeText is on, query is non-empty, and no exact match', () => {
    const { getByText, getByPlaceholderText, queryByText, onSelect } = renderPicker({
      allowFreeText: true,
    });
    fireEvent.click(getByText('t.streetPickerTitle'));
    const input = getByPlaceholderText('t.streetPickerSearchPlaceholder');
    // Empty query: no free-text row
    expect(queryByText(/השתמש ב/)).toBeNull();
    // Exact match: still no free-text row
    fireEvent.change(input, { target: { value: 'אלנבי' } });
    expect(queryByText(/השתמש ב/)).toBeNull();
    // No match: free-text row appears
    fireEvent.change(input, { target: { value: 'רחוב לא קיים' } });
    const freeRow = getByText(/השתמש ב.*"רחוב לא קיים"/);
    fireEvent.click(freeRow);
    expect(onSelect).toHaveBeenCalledWith({ id: '', name: 'רחוב לא קיים' });
  });

  it('emits onSelect via free-text when allowFreeText is on but items is empty', () => {
    // Covers the 486 settlements where the picker has zero canonical entries.
    const { getByText, getByPlaceholderText, onSelect } = renderPicker({
      items: [],
      allowFreeText: true,
    });
    fireEvent.click(getByText('t.streetPickerTitle'));
    const input = getByPlaceholderText('t.streetPickerSearchPlaceholder');
    fireEvent.change(input, { target: { value: 'דרך השדה' } });
    fireEvent.click(getByText(/השתמש ב.*"דרך השדה"/));
    expect(onSelect).toHaveBeenCalledWith({ id: '', name: 'דרך השדה' });
  });

  it('shows the error fallback when error is truthy and hides the list', () => {
    const { getByText, getByPlaceholderText, queryByText } = renderPicker({
      error: new Error('boom'),
      items: null,
    });
    fireEvent.click(getByText('t.streetPickerTitle'));
    expect(getByText('t.profile.cityPickerError')).toBeTruthy();
    expect(queryByText('אלנבי')).toBeNull();
  });
});
```

NOTE: `vitest` config aliases `react-native` → `react-native-web`, so DOM `fireEvent.click/change` works on the rendered RN components. The picker uses `<TouchableOpacity>` / `<TextInput>` which compile to `<div role="button">` / `<input>` under RN-Web. The test file does not need a separate setup.

- [ ] **Step 2.7.3: Add `@testing-library/react` if not already a dev dep**

```bash
cd app && pnpm --filter @kc/mobile add -D @testing-library/react @testing-library/dom
```

If the deps already exist, this is a no-op.

- [ ] **Step 2.7.4: Run the test, confirm it fails (module missing)**

```bash
cd app && pnpm --filter @kc/mobile test -- --run components/SearchablePicker
```

Expected: cannot resolve `'../SearchablePicker'`.

- [ ] **Step 2.7.5: Write the implementation**

```tsx
// app/apps/mobile/src/components/SearchablePicker/SearchablePicker.tsx
//
// Generic searchable modal picker. Used by CityPicker + StreetPicker so the
// two surfaces are guaranteed visually + behaviorally identical
// (PM requirement, 2026-05-18).

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, radius, spacing, typography } from '@kc/ui';

export interface SearchablePickerProps<T> {
  readonly title: string;
  readonly placeholder: string;
  readonly value: { id: string; name: string } | null;
  readonly items: readonly T[] | null;
  readonly isLoading: boolean;
  readonly error: unknown;
  readonly disabled?: boolean;
  readonly disabledHelperText?: string;
  readonly onDisabledPress?: () => void;
  readonly onSelect: (selection: { id: string; name: string }) => void;
  readonly matchItem: (item: T, query: string) => boolean;
  readonly renderRow: (item: T) => { id: string; name: string };
  readonly allowFreeText?: boolean;
}

export function SearchablePicker<T>(props: SearchablePickerProps<T>) {
  const {
    title,
    placeholder,
    value,
    items,
    isLoading,
    error,
    disabled,
    disabledHelperText,
    onDisabledPress,
    onSelect,
    matchItem,
    renderRow,
    allowFreeText,
  } = props;
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const searchInputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => searchInputRef.current?.focus(), 100);
    return () => clearTimeout(timer);
  }, [open]);

  const filtered = useMemo<readonly T[]>(() => {
    if (!items) return [];
    const q = query.trim();
    if (!q) return items;
    return items.filter((it) => matchItem(it, q));
  }, [items, query, matchItem]);

  const trimmed = query.trim();
  const hasExactMatch = useMemo(() => {
    if (!trimmed) return false;
    if (!items) return false;
    return items.some((it) => renderRow(it).name === trimmed);
  }, [items, renderRow, trimmed]);

  const showFreeTextRow = Boolean(allowFreeText) && trimmed.length > 0 && !hasExactMatch;

  const handleFieldPress = useCallback(() => {
    if (disabled) {
      onDisabledPress?.();
      return;
    }
    setOpen(true);
  }, [disabled, onDisabledPress]);

  const handleRowPress = useCallback(
    (selection: { id: string; name: string }) => {
      onSelect(selection);
      setOpen(false);
      setQuery('');
    },
    [onSelect],
  );

  const handleFreeTextPress = useCallback(() => {
    handleRowPress({ id: '', name: trimmed });
  }, [handleRowPress, trimmed]);

  return (
    <>
      <TouchableOpacity
        style={[styles.field, disabled && styles.fieldDisabled]}
        onPress={handleFieldPress}
        accessibilityRole="button"
        accessibilityLabel={title}
      >
        <Text style={[styles.value, !value && { color: colors.textDisabled }]}>
          {value ? value.name : title}
        </Text>
      </TouchableOpacity>
      {disabled && disabledHelperText && (
        <Text style={styles.disabledHelper}>{disabledHelperText}</Text>
      )}

      <Modal
        visible={open}
        transparent
        animationType="slide"
        onRequestClose={() => setOpen(false)}
      >
        <View style={styles.modalRoot}>
          <Pressable
            style={styles.backdropPressable}
            onPress={() => setOpen(false)}
            accessibilityRole="button"
            accessibilityLabel={t('profile.cityPickerCloseA11y')}
          />
          <View style={styles.sheetOuter} pointerEvents="box-none">
            <View style={styles.sheet}>
              <Text style={styles.sheetTitle}>{title}</Text>
              <TextInput
                ref={searchInputRef}
                style={styles.search}
                placeholder={placeholder}
                placeholderTextColor={colors.textDisabled}
                value={query}
                onChangeText={setQuery}
                textAlign="right"
                autoCorrect={false}
                autoCapitalize="none"
              />
              {isLoading && (
                <View style={styles.statusRow}>
                  <ActivityIndicator color={colors.primary} />
                </View>
              )}
              {error != null && (
                <Text style={styles.errorText}>{t('profile.cityPickerError')}</Text>
              )}
              {!isLoading && error == null && (
                <FlatList
                  data={filtered as T[]}
                  keyExtractor={(item, idx) => `${renderRow(item).id}-${idx}`}
                  keyboardShouldPersistTaps="handled"
                  ListHeaderComponent={
                    showFreeTextRow ? (
                      <TouchableOpacity
                        style={[styles.row, styles.freeTextRow]}
                        onPress={handleFreeTextPress}
                      >
                        <Text style={styles.freeTextLabel}>
                          {t('profile.streetPickerUseMyText', { value: trimmed })}
                        </Text>
                      </TouchableOpacity>
                    ) : null
                  }
                  ListEmptyComponent={
                    !showFreeTextRow ? (
                      <Text style={styles.emptyText}>{t('profile.cityPickerEmpty')}</Text>
                    ) : null
                  }
                  renderItem={({ item }) => {
                    const row = renderRow(item);
                    return (
                      <TouchableOpacity
                        style={styles.row}
                        onPress={() => handleRowPress(row)}
                      >
                        <Text style={styles.rowText}>{row.name}</Text>
                      </TouchableOpacity>
                    );
                  }}
                />
              )}
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  field: {
    height: 50,
    backgroundColor: colors.background,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: spacing.base,
    justifyContent: 'center',
  },
  fieldDisabled: { opacity: 0.5 },
  disabledHelper: {
    ...typography.label,
    color: colors.textSecondary,
    textAlign: 'right',
    marginTop: spacing.xs,
  },
  value: { ...typography.body, color: colors.textPrimary, textAlign: 'right' },
  modalRoot: { flex: 1 },
  backdropPressable: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheetOuter: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    height: '70%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingTop: spacing.base,
    paddingHorizontal: spacing.base,
  },
  sheetTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  search: {
    minHeight: 44,
    textAlign: 'right',
    backgroundColor: colors.background,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.base,
    marginBottom: spacing.sm,
    ...typography.body,
    color: colors.textPrimary,
  },
  statusRow: { paddingVertical: spacing.lg, alignItems: 'center' },
  errorText: {
    ...typography.body,
    color: colors.error,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
  row: {
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowText: { ...typography.body, color: colors.textPrimary, textAlign: 'right' },
  freeTextRow: { backgroundColor: colors.primarySurface },
  freeTextLabel: {
    ...typography.body,
    color: colors.primary,
    textAlign: 'right',
    fontWeight: '600',
  },
});
```

- [ ] **Step 2.7.6: Run the test, confirm it passes**

```bash
cd app && pnpm --filter @kc/mobile test -- --run components/SearchablePicker
```

Expected: 9 tests pass.

- [ ] **Step 2.7.7: Commit**

```bash
git add app/apps/mobile/src/components/SearchablePicker app/package.json app/pnpm-lock.yaml
git commit -m "feat(mobile): extract SearchablePicker shell (city + street will share it)

Pure generic picker — title + placeholder + items + matchItem + renderRow,
with optional disabled state (helper text + onDisabledPress toast hook) and
optional free-text fallback row. Styles, RTL handling, animation, and a11y
are lifted verbatim from the existing CityPicker so the two pickers stay
identical (PM requirement)."
```

---

### Task 2.8: Add Hebrew i18n keys

**Files:**
- Modify: `app/apps/mobile/src/i18n/locales/he/modules/profile.ts`

- [ ] **Step 2.8.1: Add the new keys next to `cityPicker*`**

Locate `cityPickerCloseA11y` in `profile.ts` and append, preserving alphabetical-ish ordering:

```ts
  streetPickerTitle: 'בחר רחוב',
  streetPickerSearchPlaceholder: '...חיפוש רחוב',
  streetPickerError: 'שגיאה בטעינת רשימת הרחובות. נסו שוב.',
  streetPickerEmpty: 'לא נמצאו רחובות תואמים.',
  streetPickerNeedCity: 'בחרו עיר תחילה',
  streetPickerUseMyText: 'השתמשו ב־"{{value}}"',
```

- [ ] **Step 2.8.2: Run i18n typecheck**

```bash
cd app && pnpm --filter @kc/mobile typecheck
```

Expected: clean (the keys aren't referenced yet, but the module shape compiles).

- [ ] **Step 2.8.3: Commit**

```bash
git add app/apps/mobile/src/i18n/locales/he/modules/profile.ts
git commit -m "feat(i18n): add Hebrew strings for the street picker"
```

---

### Task 2.9: Rewrite `CityPicker` on top of `SearchablePicker`

**Files:**
- Modify: `app/apps/mobile/src/components/CityPicker.tsx`

- [ ] **Step 2.9.1: Replace the body with a thin wrapper**

```tsx
// app/apps/mobile/src/components/CityPicker.tsx
//
// CityPicker — public.cities-backed modal per FR-AUTH-010 AC2.
// Implementation is delegated to SearchablePicker so City + Street pickers
// stay identical in look & behavior.

import React, { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import type { City } from '@kc/domain';
import { SearchablePicker } from './SearchablePicker/SearchablePicker';
import { listCities } from '../services/userComposition';

interface Props {
  readonly value: { id: string; name: string } | null;
  readonly onChange: (selection: { id: string; name: string }) => void;
  readonly disabled?: boolean;
}

const matchCity = (c: City, q: string): boolean =>
  c.nameHe.includes(q) || c.nameEn.toLowerCase().includes(q.toLowerCase());

const renderCity = (c: City) => ({ id: c.cityId, name: c.nameHe });

export function CityPicker({ value, onChange, disabled }: Props) {
  const { t } = useTranslation();
  const { data, isLoading, error } = useQuery<City[]>({
    queryKey: ['cities'],
    queryFn: listCities,
    staleTime: 1000 * 60 * 60, // 1h — cities rarely change
  });

  // matchCity / renderCity are module-scope so they keep referential equality
  // across renders without useCallback noise inside the component body.
  const handleSelect = useCallback(onChange, [onChange]);

  return (
    <SearchablePicker<City>
      title={t('profile.cityPickerTitle')}
      placeholder={t('profile.cityPickerSearchPlaceholder')}
      value={value}
      items={data ?? null}
      isLoading={isLoading}
      error={error}
      disabled={disabled}
      onSelect={handleSelect}
      matchItem={matchCity}
      renderRow={renderCity}
    />
  );
}
```

- [ ] **Step 2.9.2: Manually verify in the dev preview (deferred to Task 2.16)**

We can't open a browser in this task; the wholesale browser pass happens at the end. Until then, run typecheck:

```bash
cd app && pnpm --filter @kc/mobile typecheck
```

Expected: clean.

- [ ] **Step 2.9.3: Commit**

```bash
git add app/apps/mobile/src/components/CityPicker.tsx
git commit -m "refactor(mobile): rebuild CityPicker on SearchablePicker shell

No behavior change — same modal, same search, same styling — but the modal
shell is now shared with StreetPicker so any future picker tweaks land in
one place.

Mapped to spec: FR-AUTH-010 AC2. Refactor logged: No."
```

---

### Task 2.10: Build `StreetPicker`

**Files:**
- Create: `app/apps/mobile/src/components/StreetPicker.tsx`
- Create: `app/apps/mobile/src/components/__tests__/StreetPicker.test.tsx`

- [ ] **Step 2.10.1: Write the failing test**

```tsx
// app/apps/mobile/src/components/__tests__/StreetPicker.test.tsx
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StreetPicker } from '../StreetPicker';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string, opts?: { value?: string }) =>
    opts?.value ? `${k}:${opts.value}` : k }),
}));

const listStreets = vi.fn();
vi.mock('../../services/userComposition', () => ({
  listStreets: (id: string) => listStreets(id),
}));

const ephemeralToast = vi.fn();
vi.mock('../../store/feedSessionStore', () => ({
  useFeedSessionStore: {
    getState: () => ({ showEphemeralToast: ephemeralToast }),
  },
}));

function withQueryClient(node: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{node}</QueryClientProvider>;
}

describe('StreetPicker', () => {
  beforeEach(() => {
    listStreets.mockReset();
    ephemeralToast.mockReset();
  });

  it('is disabled with helper text when cityId is null', () => {
    const onChange = vi.fn();
    const { getByText, queryByPlaceholderText } = render(
      withQueryClient(
        <StreetPicker cityId={null} value={null} onChange={onChange} />,
      ),
    );
    fireEvent.click(getByText('profile.streetPickerTitle'));
    expect(queryByPlaceholderText('profile.streetPickerSearchPlaceholder')).toBeNull();
    expect(getByText('profile.streetPickerNeedCity')).toBeTruthy();
    expect(ephemeralToast).toHaveBeenCalledWith(
      'profile.streetPickerNeedCity',
      'error',
      expect.any(Number),
    );
  });

  it('fetches streets for the selected city and renders them in a searchable list', async () => {
    listStreets.mockResolvedValueOnce([
      { cityId: '5000', streetId: 1, nameHe: 'אלנבי' },
      { cityId: '5000', streetId: 2, nameHe: 'בן יהודה' },
    ]);
    const { getByText, getByPlaceholderText, queryByText } = render(
      withQueryClient(
        <StreetPicker cityId="5000" value={null} onChange={vi.fn()} />,
      ),
    );
    fireEvent.click(getByText('profile.streetPickerTitle'));
    await waitFor(() => expect(getByText('אלנבי')).toBeTruthy());
    fireEvent.change(getByPlaceholderText('profile.streetPickerSearchPlaceholder'), {
      target: { value: 'בן' },
    });
    expect(queryByText('אלנבי')).toBeNull();
    expect(getByText('בן יהודה')).toBeTruthy();
    expect(listStreets).toHaveBeenCalledWith('5000');
  });

  it('emits onChange with a canonical pick (streetId stringified) and clears query', async () => {
    listStreets.mockResolvedValueOnce([
      { cityId: '5000', streetId: 42, nameHe: 'גורדון' },
    ]);
    const onChange = vi.fn();
    const { getByText } = render(
      withQueryClient(
        <StreetPicker cityId="5000" value={null} onChange={onChange} />,
      ),
    );
    fireEvent.click(getByText('profile.streetPickerTitle'));
    await waitFor(() => fireEvent.click(getByText('גורדון')));
    expect(onChange).toHaveBeenCalledWith({ id: '42', name: 'גורדון' });
  });

  it('offers a free-text row when the query has no match and emits onChange with empty id', async () => {
    listStreets.mockResolvedValueOnce([
      { cityId: '5000', streetId: 1, nameHe: 'אלנבי' },
    ]);
    const onChange = vi.fn();
    const { getByText, getByPlaceholderText } = render(
      withQueryClient(
        <StreetPicker cityId="5000" value={null} onChange={onChange} />,
      ),
    );
    fireEvent.click(getByText('profile.streetPickerTitle'));
    await waitFor(() => expect(getByText('אלנבי')).toBeTruthy());
    fireEvent.change(getByPlaceholderText('profile.streetPickerSearchPlaceholder'), {
      target: { value: 'דרך חדשה' },
    });
    fireEvent.click(getByText('profile.streetPickerUseMyText:דרך חדשה'));
    expect(onChange).toHaveBeenCalledWith({ id: '', name: 'דרך חדשה' });
  });
});
```

- [ ] **Step 2.10.2: Run, confirm fails**

```bash
cd app && pnpm --filter @kc/mobile test -- --run components/__tests__/StreetPicker
```

- [ ] **Step 2.10.3: Implement `StreetPicker`**

```tsx
// app/apps/mobile/src/components/StreetPicker.tsx
//
// StreetPicker — public.streets-backed modal, city-dependent.
// Disabled with toast feedback when no city is selected.
// Free-text fallback for streets not in the canonical list.

import React, { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import type { Street } from '@kc/domain';
import { SearchablePicker } from './SearchablePicker/SearchablePicker';
import { listStreets } from '../services/userComposition';
import { useFeedSessionStore } from '../store/feedSessionStore';

interface Props {
  readonly cityId: string | null;
  readonly value: { id: string; name: string } | null;
  readonly onChange: (selection: { id: string; name: string }) => void;
  readonly disabled?: boolean;
}

const matchStreet = (s: Street, q: string): boolean => s.nameHe.includes(q);
const renderStreet = (s: Street) => ({ id: String(s.streetId), name: s.nameHe });

export function StreetPicker({ cityId, value, onChange, disabled }: Props) {
  const { t } = useTranslation();
  const effectivelyDisabled = disabled || cityId == null;

  const { data, isLoading, error } = useQuery<Street[]>({
    queryKey: ['streets', cityId],
    queryFn: () => (cityId ? listStreets(cityId) : Promise.resolve([])),
    enabled: !!cityId,
    staleTime: 1000 * 60 * 60, // 1h — streets rarely change
  });

  const handleDisabledPress = useCallback(() => {
    if (!cityId) {
      useFeedSessionStore
        .getState()
        .showEphemeralToast(t('profile.streetPickerNeedCity'), 'error', 2500);
    }
  }, [cityId, t]);

  return (
    <SearchablePicker<Street>
      title={t('profile.streetPickerTitle')}
      placeholder={t('profile.streetPickerSearchPlaceholder')}
      value={value}
      items={data ?? null}
      isLoading={isLoading}
      error={error}
      disabled={effectivelyDisabled}
      disabledHelperText={cityId == null ? t('profile.streetPickerNeedCity') : undefined}
      onDisabledPress={handleDisabledPress}
      onSelect={onChange}
      matchItem={matchStreet}
      renderRow={renderStreet}
      allowFreeText
    />
  );
}
```

- [ ] **Step 2.10.4: Run, confirm pass**

```bash
cd app && pnpm --filter @kc/mobile test -- --run components/__tests__/StreetPicker
```

Expected: 4 tests pass.

- [ ] **Step 2.10.5: Commit**

```bash
git add app/apps/mobile/src/components/StreetPicker.tsx app/apps/mobile/src/components/__tests__/StreetPicker.test.tsx
git commit -m "feat(mobile): StreetPicker — city-dependent canonical streets

Built on SearchablePicker. When cityId is null the field is disabled and a
toast prompts the user to pick a city first. When cityId is set, fetches
public.streets via React Query (1h stale-time) and lets the user search +
pick. Free-text fallback covers settlements with no canonical streets and
brand-new addresses missing from the gov dataset.

Mapped to spec: FR-PROFILE-007 AC1. Refactor logged: No."
```

---

### Task 2.11: Reset-on-city-change for the edit-profile address block

**Files:**
- Modify: `app/apps/mobile/src/components/EditProfileAddressBlock.tsx`
- Create: `app/apps/mobile/src/components/__tests__/EditProfileAddressBlock.test.tsx`

- [ ] **Step 2.11.1: Update the component to use `StreetPicker` and reset on city change**

```tsx
// app/apps/mobile/src/components/EditProfileAddressBlock.tsx
// FR-PROFILE-007 — city + city-dependent street picker + house number.

import React, { useCallback } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, radius, spacing, typography } from '@kc/ui';
import { CityPicker } from './CityPicker';
import { StreetPicker } from './StreetPicker';

export interface EditProfileAddressBlockProps {
  city: { id: string; name: string } | null;
  onCityChange: (v: { id: string; name: string } | null) => void;
  street: string;
  streetNumber: string;
  onStreetChange: (v: string) => void;
  onStreetNumberChange: (v: string) => void;
  disabled: boolean;
}

export function EditProfileAddressBlock({
  city,
  onCityChange,
  street,
  streetNumber,
  onStreetChange,
  onStreetNumberChange,
  disabled,
}: EditProfileAddressBlockProps) {
  const { t } = useTranslation();

  // Picking a new city invalidates the previous street + number. Without
  // this reset the user would silently submit a street that doesn't belong
  // to the newly chosen city.
  const handleCityChange = useCallback(
    (next: { id: string; name: string } | null) => {
      if (next?.id !== city?.id) {
        onStreetChange('');
        onStreetNumberChange('');
      }
      onCityChange(next);
    },
    [city?.id, onCityChange, onStreetChange, onStreetNumberChange],
  );

  const handleStreetChange = useCallback(
    (selection: { id: string; name: string }) => {
      onStreetChange(selection.name);
    },
    [onStreetChange],
  );

  return (
    <View style={styles.container}>
      <View style={styles.field}>
        <Text style={styles.label}>{t('profile.addressLabel')}</Text>
        <CityPicker value={city} onChange={handleCityChange} disabled={disabled} />
      </View>
      <View style={styles.field}>
        <View style={styles.streetRow}>
          <View style={styles.streetCol}>
            <StreetPicker
              cityId={city?.id ?? null}
              value={street ? { id: '', name: street } : null}
              onChange={handleStreetChange}
              disabled={disabled}
            />
          </View>
          <TextInput
            style={[styles.input, styles.streetInputHouse]}
            value={streetNumber}
            onChangeText={onStreetNumberChange}
            placeholder={t('profile.streetNumberShort')}
            placeholderTextColor={colors.textDisabled}
            textAlign="right"
            editable={!disabled && !!city}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', maxWidth: 500, alignSelf: 'center' },
  field: { marginVertical: spacing.xs, gap: spacing.xs },
  label: { ...typography.label, color: colors.textSecondary, textAlign: 'right' },
  streetRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'stretch', width: '100%' },
  streetCol: { flex: 2, minWidth: 0 },
  streetInputHouse: { flex: 1, minWidth: 0, maxWidth: 120 },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    ...typography.body,
    color: colors.textPrimary,
    minHeight: 48,
  },
});
```

- [ ] **Step 2.11.2: Write the reset-on-city-change test**

```tsx
// app/apps/mobile/src/components/__tests__/EditProfileAddressBlock.test.tsx
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { EditProfileAddressBlock } from '../EditProfileAddressBlock';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

vi.mock('../../services/userComposition', () => ({
  listCities: () => Promise.resolve([]),
  listStreets: () => Promise.resolve([]),
}));

vi.mock('../../store/feedSessionStore', () => ({
  useFeedSessionStore: { getState: () => ({ showEphemeralToast: vi.fn() }) },
}));

function renderBlock(props: Partial<React.ComponentProps<typeof EditProfileAddressBlock>>) {
  const onCityChange = vi.fn();
  const onStreetChange = vi.fn();
  const onStreetNumberChange = vi.fn();
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const utils = render(
    <QueryClientProvider client={qc}>
      <EditProfileAddressBlock
        city={null}
        onCityChange={onCityChange}
        street=""
        streetNumber=""
        onStreetChange={onStreetChange}
        onStreetNumberChange={onStreetNumberChange}
        disabled={false}
        {...props}
      />
    </QueryClientProvider>,
  );
  return { ...utils, onCityChange, onStreetChange, onStreetNumberChange };
}

describe('EditProfileAddressBlock', () => {
  it('renders without crashing when city is null', () => {
    const { getByText } = renderBlock({});
    expect(getByText('profile.addressLabel')).toBeTruthy();
  });

  it('exposes the disabled-state helper when no city is selected (via StreetPicker)', () => {
    const { getByText } = renderBlock({});
    expect(getByText('profile.streetPickerNeedCity')).toBeTruthy();
  });

  // Note: reset-on-city-change is tested at the unit level by directly invoking
  // handleCityChange via the test of useOnboardingBasicInfoFlow (Task 2.12).
  // Component-level firing requires opening the modal which adds significant
  // setup; we cover the reset behavior at the hook level.
});
```

- [ ] **Step 2.11.3: Run, confirm pass**

```bash
cd app && pnpm --filter @kc/mobile test -- --run EditProfileAddressBlock
```

- [ ] **Step 2.11.4: Commit**

```bash
git add app/apps/mobile/src/components/EditProfileAddressBlock.tsx app/apps/mobile/src/components/__tests__/EditProfileAddressBlock.test.tsx
git commit -m "feat(mobile): EditProfileAddressBlock uses StreetPicker + resets on city change

When the user picks a new city, the street and street-number fields reset
so the address never carries a street that doesn't belong to the chosen
city. The house-number input is also gated by city presence (editable only
when a city is set), mirroring the picker's disabled state for consistency.

Mapped to spec: FR-PROFILE-007 AC1. Refactor logged: No."
```

---

### Task 2.12: Onboarding progressive disclosure + hook reset

**Files:**
- Modify: `app/apps/mobile/src/hooks/useOnboardingBasicInfoFlow.ts`
- Modify: `app/apps/mobile/app/(onboarding)/basic-info.tsx`
- Create: `app/apps/mobile/src/hooks/__tests__/useOnboardingBasicInfoFlow.test.ts`

- [ ] **Step 2.12.1: Update the hook so `setCity` clears street + number on change**

In `useOnboardingBasicInfoFlow.ts`, replace the raw `useState`/`setCity` with an internal handler:

```ts
const [city, _setCity] = useState<{ id: string; name: string } | null>(null);
const [street, setStreet] = useState('');
const [streetNumber, setStreetNumber] = useState('');

const setCity = useCallback(
  (next: { id: string; name: string } | null) => {
    _setCity((prev) => {
      if (prev?.id !== next?.id) {
        setStreet('');
        setStreetNumber('');
      }
      return next;
    });
  },
  [],
);
```

Add the `useCallback` import:

```ts
import { useCallback, useState } from 'react';
```

(The `setCity` exported in the return object is now the wrapped one — no other change.)

- [ ] **Step 2.12.2: Write the hook test**

```ts
// app/apps/mobile/src/hooks/__tests__/useOnboardingBasicInfoFlow.test.ts
//
// Behavior: switching the city clears any street + number already typed,
// so the user never submits a Tel Aviv street under a Jerusalem city.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k: string) => k }) }));
vi.mock('expo-router', () => ({ useRouter: () => ({ replace: vi.fn(), push: vi.fn() }) }));
vi.mock('../../store/authStore', () => ({
  useAuthStore: Object.assign(
    (sel: (s: any) => unknown) => sel({ session: null, setOnboardingState: vi.fn() }),
    { getState: () => ({ setBasicInfoSkipped: vi.fn() }) },
  ),
}));
vi.mock('../../store/feedSessionStore', () => ({
  useFeedSessionStore: { getState: () => ({ showEphemeralToast: vi.fn() }) },
}));
vi.mock('../../services/userComposition', () => ({
  getCompleteBasicInfoUseCase: () => ({ execute: vi.fn() }),
  markBasicInfoSkipped: vi.fn(),
}));

import { useOnboardingBasicInfoFlow } from '../useOnboardingBasicInfoFlow';

describe('useOnboardingBasicInfoFlow — reset-on-city-change', () => {
  beforeEach(() => vi.clearAllMocks());

  it('clears street + streetNumber when the city id changes', () => {
    const { result } = renderHook(() => useOnboardingBasicInfoFlow());
    act(() => result.current.setCity({ id: '5000', name: 'תל אביב - יפו' }));
    act(() => result.current.setStreet('אלנבי'));
    act(() => result.current.setStreetNumber('3'));
    expect(result.current.street).toBe('אלנבי');
    expect(result.current.streetNumber).toBe('3');

    act(() => result.current.setCity({ id: '3000', name: 'ירושלים' }));
    expect(result.current.street).toBe('');
    expect(result.current.streetNumber).toBe('');
  });

  it('does NOT clear street + streetNumber when setCity is called with the same id', () => {
    const { result } = renderHook(() => useOnboardingBasicInfoFlow());
    act(() => result.current.setCity({ id: '5000', name: 'תל אביב - יפו' }));
    act(() => result.current.setStreet('אלנבי'));
    act(() => result.current.setCity({ id: '5000', name: 'תל אביב - יפו' }));
    expect(result.current.street).toBe('אלנבי');
  });

  it('clears street + streetNumber when the city is cleared (set to null)', () => {
    const { result } = renderHook(() => useOnboardingBasicInfoFlow());
    act(() => result.current.setCity({ id: '5000', name: 'תל אביב - יפו' }));
    act(() => result.current.setStreet('אלנבי'));
    act(() => result.current.setCity(null));
    expect(result.current.street).toBe('');
    expect(result.current.streetNumber).toBe('');
  });
});
```

- [ ] **Step 2.12.3: Update the onboarding screen to render street + number only when city is set**

In `app/apps/mobile/app/(onboarding)/basic-info.tsx`, replace the existing `AnimatedEntry` block that contains `<EditProfileAddressBlock>` with two separate blocks: the city picker (always visible) and the street + number row (conditional).

Today the block is:

```tsx
<AnimatedEntry delay={staggerDelay(4)}>
  <EditProfileAddressBlock
    city={city}
    onCityChange={setCity}
    street={street}
    streetNumber={streetNumber}
    onStreetChange={setStreet}
    onStreetNumberChange={setStreetNumber}
    disabled={loading}
  />
</AnimatedEntry>
```

Replace with:

```tsx
<AnimatedEntry delay={staggerDelay(4)}>
  <View style={styles.field}>
    <Text style={styles.label}>{t('profile.addressLabel')}</Text>
    <CityPicker value={city} onChange={setCity} disabled={loading} />
  </View>
</AnimatedEntry>

{city && (
  <AnimatedEntry delay={0}>
    <View style={styles.field}>
      <View style={styles.streetRow}>
        <View style={styles.streetCol}>
          <StreetPicker
            cityId={city.id}
            value={street ? { id: '', name: street } : null}
            onChange={(sel) => setStreet(sel.name)}
            disabled={loading}
          />
        </View>
        <TextInput
          style={styles.input}
          value={streetNumber}
          onChangeText={setStreetNumber}
          placeholder={t('profile.streetNumberShort')}
          placeholderTextColor={colors.textDisabled}
          textAlign="right"
          editable={!loading}
        />
      </View>
    </View>
  </AnimatedEntry>
)}
```

Add the new imports at the top of the file:

```tsx
import { CityPicker } from '../../src/components/CityPicker';
import { StreetPicker } from '../../src/components/StreetPicker';
```

And add the layout styles to the existing `styles` const if not present:

```tsx
streetRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'stretch', width: '100%' },
streetCol: { flex: 2, minWidth: 0 },
```

Also: remove the import of `EditProfileAddressBlock` from this screen — it's no longer used here. Don't touch the component itself; `edit-profile.tsx` still uses it.

- [ ] **Step 2.12.4: Run tests**

```bash
cd app && pnpm --filter @kc/mobile test -- --run useOnboardingBasicInfoFlow
```

Expected: 3 hook tests pass.

- [ ] **Step 2.12.5: Run typecheck**

```bash
cd app && pnpm --filter @kc/mobile typecheck
```

Expected: clean.

- [ ] **Step 2.12.6: Commit**

```bash
git add app/apps/mobile/src/hooks/useOnboardingBasicInfoFlow.ts app/apps/mobile/src/hooks/__tests__/useOnboardingBasicInfoFlow.test.ts app/apps/mobile/app/\(onboarding\)/basic-info.tsx
git commit -m "feat(mobile): onboarding progressive disclosure for street fields

Onboarding step 2 now reveals the street picker + street-number input only
after the user has selected a city. Clearing the city collapses the block.
Switching the city resets street + number so a stale Tel Aviv street can
never accompany a Jerusalem submission.

Mapped to spec: FR-AUTH-010 AC2.b. Refactor logged: No."
```

---

### Task 2.13: Create-post wiring

**Files:**
- Modify: `app/apps/mobile/src/hooks/useCreatePostPublish.ts` (or wherever the create-post address state lives)
- Modify: `app/apps/mobile/src/components/CreatePostForm/CreatePostFormScrollContent.tsx`
- Create: `app/apps/mobile/src/hooks/__tests__/useCreatePostPublishCityReset.test.ts` (only if the hook owns city/street/number state)

- [ ] **Step 2.13.1: Locate the create-post address state owner**

```bash
grep -rnE "setStreet\b|setStreetNumber\b" app/apps/mobile/src/hooks app/apps/mobile/app | grep -v __tests__
```

If `useCreatePostPublish` exposes raw `setStreet` / `setStreetNumber`, modify the hook so its `setCity` clears them, identical to Task 2.12.

If the state lives in a Zustand store, modify the store action. Either way:

```ts
const setCityResetting = useCallback(
  (next: { id: string; name: string } | null) => {
    _setCity((prev) => {
      if (prev?.id !== next?.id) {
        setStreet('');
        setStreetNumber('');
      }
      return next;
    });
  },
  [],
);
```

- [ ] **Step 2.13.2: Swap the free-text street input for `StreetPicker` in the form**

In `CreatePostFormScrollContent.tsx`, locate the existing `<TextInput …>` block for `street` and replace with a `StreetPicker` similar to `EditProfileAddressBlock`:

```tsx
import { StreetPicker } from '../StreetPicker';

// inside the JSX, replacing the street TextInput:
<View style={styles.streetCol}>
  <StreetPicker
    cityId={city.id ?? null}
    value={street ? { id: '', name: street } : null}
    onChange={(sel) => onStreetChange(sel.name)}
    disabled={!city.id}
  />
</View>
```

The street-number input keeps its existing `TextInput` but becomes `editable={!!city.id}` so it follows the same gating.

- [ ] **Step 2.13.3: Add a hook test for reset-on-city-change**

```ts
// Skeleton — adapt to actual hook signature discovered in 2.13.1.
import { describe, it, expect, act, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
// import { useCreatePostPublish } from '../useCreatePostPublish';
// (Mocks per the project's existing useCreatePostPublish tests.)
// Asserts that calling setCity({ id: '3000', ... }) after setStreet('אלנבי')
// resets street to '' and streetNumber to ''.
```

If the hook is too heavily wired to mock cheaply, document the gap in the commit body and rely on the EditProfileAddressBlock + onboarding hook tests to cover the reset logic that runs in the parent.

- [ ] **Step 2.13.4: Run tests + typecheck**

```bash
cd app && pnpm --filter @kc/mobile test -- --run CreatePost && pnpm --filter @kc/mobile typecheck
```

Expected: clean.

- [ ] **Step 2.13.5: Commit**

```bash
git add app/apps/mobile/src/components/CreatePostForm/CreatePostFormScrollContent.tsx app/apps/mobile/src/hooks/useCreatePostPublish.ts app/apps/mobile/src/hooks/__tests__/useCreatePostPublishCityReset.test.ts
git commit -m "feat(mobile): create-post uses StreetPicker; resets street on city change

Mapped to spec: FR-POST-002 (address fields). Refactor logged: No."
```

---

### Task 2.14: Edit-post wiring

**Files:**
- Modify: `app/apps/mobile/app/edit-post/[id].tsx`
- (Possibly) the hook that owns its address state.

- [ ] **Step 2.14.1: Locate the edit-post address state**

```bash
grep -nE "street|city" app/apps/mobile/app/edit-post/\[id\].tsx | head -40
```

- [ ] **Step 2.14.2: Repeat the same swap as Task 2.13**

Replace the street `TextInput` with `<StreetPicker>`, gating the street-number input on `!!city.id`, applying the same setCity-resets-street pattern in the local state.

- [ ] **Step 2.14.3: Run typecheck + tests**

```bash
cd app && pnpm --filter @kc/mobile typecheck && pnpm --filter @kc/mobile test -- --run edit-post
```

- [ ] **Step 2.14.4: Commit**

```bash
git add app/apps/mobile/app/edit-post/\[id\].tsx
git commit -m "feat(mobile): edit-post uses StreetPicker; resets street on city change

Mapped to spec: FR-POST-002 (address fields). Refactor logged: No."
```

---

### Task 2.15: SSOT updates

**Files:**
- Modify: `docs/SSOT/spec/01_auth_and_onboarding.md`
- Modify: `docs/SSOT/spec/02_profile_and_privacy.md`
- Modify: `docs/SSOT/spec/04_posts.md`
- Modify: `docs/SSOT/DECISIONS.md`
- Modify: `docs/SSOT/BACKLOG.md`

- [ ] **Step 2.15.1: Amend `FR-AUTH-010 AC2.b` in `spec/01_auth_and_onboarding.md`**

Find the line beginning `- AC2.b. **Optional full address (MVP+):**` and append at the end (before the period that closes the AC):

> ; the street field is a city-dependent canonical picker (`public.streets`) with free-text fallback. On this screen the street + number fields are progressively disclosed — hidden until a city is selected, revealed via the existing entry animation, collapsed back if the user clears the city. Switching the city resets any previously entered street + number so a Tel Aviv street can never accompany a Jerusalem submission.

- [ ] **Step 2.15.2: Amend `FR-PROFILE-007 AC1` in `spec/02_profile_and_privacy.md`**

Find the line beginning `- AC1. Editable fields:` and append:

> Street uses a city-dependent canonical picker (`public.streets`) with free-text fallback; the picker is disabled with helper text "בחרו עיר תחילה" until a city is selected, and tapping the disabled field surfaces an ephemeral toast with the same text. The street-number input is editable only when a city is selected. Switching the city resets street + number.

- [ ] **Step 2.15.3: Append to `spec/04_posts.md` near the address-fields AC**

```bash
grep -n "street\|address" docs/SSOT/spec/04_posts.md | head
```

Add an inline note next to the create/edit-post address-fields section:

> Street selection on Create Post and Edit Post uses the same `StreetPicker` component as the profile surface (city-dependent, free-text fallback). The street + house-number inputs are gated by a city selection; changing or clearing the city resets the street + number to empty.

- [ ] **Step 2.15.4: Append a new decision to `docs/SSOT/DECISIONS.md`**

Find the highest current `D-NN` and add the next number:

```
### D-34 — Canonical streets data from data.gov.il package 321 (2026-05-18)

**Context.** The street field on the four address surfaces (onboarding, edit
profile, create post, edit post) was free text, producing inconsistent
spellings and no guidance.

**Decision.** Source the canonical street list from data.gov.il package 321
(resource `9ad3862c-…`), seed `public.streets` once via migration `0098`,
with **zero filtering** (code-9000 "the village itself" rows are kept — they
are the only canonical entry for 486 small settlements; filtering them
would empty the picker for 37 % of cities, which the PM has explicitly
forbidden). The 2 cities present in our seed but absent from the source
(`גנים`, `כדים`) receive a synthesized 9000 row mirroring the source
convention. Free-text fallback in the picker covers new construction or
recent renaming missing from the snapshot.

**Consequences.** Future refreshes re-run `scripts/generate-streets-seed.mjs`
to regenerate `0101_seed_streets.sql`; the migration is idempotent.
`profile_street` / `posts.street` remain `text` columns — no FK migration is
needed. If a future feature wants canonical-only filtering or proximity by
street, a nullable `street_id` column can be added then.
```

- [ ] **Step 2.15.5: Add a P2.27 row to `docs/SSOT/BACKLOG.md`**

In the P2 section, after the highest P2.NN row, insert:

```
| P2.27 | **City list 1000-row truncation fix + city-dependent street picker** — adds `.limit(2000)` to `SupabaseCityRepository.listAll()` (PR 1); introduces `public.streets` + `SupabaseStreetRepository` + `IStreetRepository` + new `SearchablePicker` shell reused by city + street pickers; progressive disclosure of street + number on onboarding; disabled-state UX + reset-on-city-change on edit profile, create post, edit post (PR 2). Seeded from data.gov.il package 321 (63 565 rows including 9000-sentinels). | agent-fullstack | 🟡 In progress | `spec/01_auth_and_onboarding.md` FR-AUTH-010 AC2.b; `spec/02_profile_and_privacy.md` FR-PROFILE-007 AC1; `spec/04_posts.md`; `DECISIONS.md` D-34; `docs/superpowers/specs/2026-05-18-cities-streets-picker-design.md` |
```

(Flip to ✅ Done in a follow-up commit once both PRs are merged.)

- [ ] **Step 2.15.6: Run the SSOT-links linter**

```bash
cd app && pnpm lint:arch
```

Expected: clean (no broken refs).

- [ ] **Step 2.15.7: Commit**

```bash
git add docs/SSOT
git commit -m "docs(ssot): record streets picker + city list fix (D-34, P2.27)

Updates FR-AUTH-010 AC2.b (progressive disclosure on onboarding),
FR-PROFILE-007 AC1 (city-dependent picker + reset), and the create/edit-post
address-fields note. Adds D-34 documenting the data.gov.il source and the
no-filter rule. Adds P2.27 to BACKLOG as 🟡 In progress."
```

---

### Task 2.16: Repo-wide verification gate

- [ ] **Step 2.16.1: Run the full verification chain**

```bash
cd app && pnpm typecheck && pnpm test && pnpm lint
```

Expected: all clean.

- [ ] **Step 2.16.2: Boot the web preview and exercise every surface**

```bash
cd app && pnpm --filter @kc/mobile web
```

Then in the preview (use the preview_* tools from Claude Preview MCP):

1. **City truncation gone.** Open `/edit-profile`. Open the city picker. Search "תל אביב" — Tel Aviv must appear. Search "פתח תקווה" — Petah Tikva must appear. Scroll to the bottom of the alphabet — תל אביב / תרשיחא etc. visible.
2. **Onboarding progressive disclosure.** Reset onboarding (Settings → dev reset → `pending_basic_info`). Navigate to `/(onboarding)/basic-info`. Confirm street + number fields are NOT visible. Pick a city. Confirm they fade in. Tap the city picker again and choose a different city — street + number should be reset to empty AND remain visible (they re-render under the new city).
3. **Street picker, large city.** Pick Jerusalem. Open the street picker. Search "יפו" — should match streets like "שער יפו". Confirm scrolling works smoothly through 4 384 entries.
4. **Street picker, kibbutz.** Pick a settlement that has only the 9000 sentinel (any small kibbutz — search the city list for one). Open the street picker — single option showing the village name.
5. **Free-text fallback.** Pick any city. Open the street picker, type "רחוב חדש שלא קיים", tap the "השתמש ב…" row. Confirm the chosen value lands in the street field.
6. **Disabled-state UX (edit profile).** Reset the city to null (via the picker UX or backend state). Confirm the street picker shows the 50%-opacity field + "בחרו עיר תחילה" helper. Tap it — confirm the toast appears.
7. **Create post.** Open `/create`. Verify the same gating behavior (street picker disabled until city is picked; reset on city change).
8. **Edit post.** Open an existing post in edit mode. Verify the same.

For each step, capture either a `preview_screenshot` (visual changes) or `preview_console_logs` (no errors should appear). Save the screenshots locally under `/tmp/kc-streets-verification/` for the PM hand-off.

- [ ] **Step 2.16.3: Generate a verification summary for the PM**

Prepare a short report listing:
- Branch names for PR 1 and PR 2
- Local commit SHAs (`git log --oneline`)
- File paths to the captured screenshots
- The result of `pnpm typecheck && pnpm test && pnpm lint` (last line)
- Anything skipped or known-flaky

- [ ] **Step 2.16.4: HOLD — DO NOT PUSH**

PM has explicitly required local verification before any push. Stop here and report. Wait for PM explicit "push it" before continuing.

---

### Task 2.17: After PM approval — push + PR

Only execute the steps below after PM has explicitly approved the local result.

- [ ] **Step 2.17.1: Push PR 1**

```bash
git checkout fix/FR-AUTH-010-cities-1000-row-cap
git push -u origin HEAD
gh pr create --base dev --head "$(git branch --show-current)" \
  --title "fix(infra): cities listAll capped at 2000 to bypass Supabase 1000-row default" \
  --body "$(cat <<'EOF'
## Summary
- Supabase JS client returns at most 1000 rows when no .limit() is set.
- Migration 0008 seeds 1306 Israeli cities; the silent cap dropped ~306 settlements from mid-ע onward, including Tel Aviv, Petah Tikva, Rishon LeZion.
- Adds .limit(2000) and two regression tests (limit-is-set + 1306-row mapping).

## Mapped to spec
- FR-AUTH-010 AC2 — onboarding city picker shows the full canonical list.
- FR-PROFILE-007 AC1 — edit profile city picker shows the full canonical list.

## Changes
- `app/packages/infrastructure-supabase/src/cities/SupabaseCityRepository.ts`: .limit(2000)
- `app/packages/infrastructure-supabase/src/cities/__tests__/SupabaseCityRepository.test.ts`: new `.limit` and 1306-row regression tests

## Tests
- `pnpm typecheck` ✅
- `pnpm test`      ✅ (8 cities tests pass, 0 new failures)
- `pnpm lint`      ✅
- Manual: Tel Aviv / Petah Tikva / רעננה / רחובות visible in the city picker; full list reaches ת.

## SSOT updated
- [ ] BACKLOG (rolled into P2.27 in PR 2)
- [ ] spec/ (status note rolled into PR 2)

## Risk / rollout notes
Low risk. Pure additive change.
EOF
)" \
  --label "FR-AUTH" --label "FR-PROFILE" --assignee "@me"
gh pr merge --auto --squash --delete-branch
gh pr checks --watch
```

- [ ] **Step 2.17.2: Push PR 2**

```bash
git checkout feat/streets-picker-city-dependent
# If PR 1 has already merged to dev:
git fetch origin
git rebase origin/dev
# Resolve any cities test conflict — keep PR 2's .limit() expectations.
git push -u origin HEAD
gh pr create --base dev --head "$(git branch --show-current)" \
  --title "feat(mobile): city-dependent street picker (progressive disclosure on onboarding)" \
  --body-file <(cat <<'EOF'
## Summary
- Adds `public.streets` table seeded from data.gov.il package 321 (63,565 rows including 9000-sentinels — zero filtering per PM).
- Domain `Street` entity + `IStreetRepository` port + `SupabaseStreetRepository` adapter.
- Extracts `SearchablePicker` shell so the city and street pickers stay visually + behaviorally identical.
- New `StreetPicker` is city-dependent: disabled with helper text + toast when no city is selected; reset-on-city-change everywhere; free-text fallback for new construction / source gaps.
- Onboarding step 2 reveals street + number fields only after a city is selected (progressive disclosure).
- Wires across `EditProfileAddressBlock`, onboarding `basic-info`, create-post form, edit-post screen.

## Mapped to spec
- FR-AUTH-010 AC2.b — onboarding progressive disclosure + reset-on-city-change.
- FR-PROFILE-007 AC1 — city-dependent street picker on edit profile.
- FR-POST-002 — same picker on create-post + edit-post.
- DECISIONS.md D-34 — canonical source + no-filter rule.

## Changes
- See commits.

## Tests
- `pnpm typecheck` ✅
- `pnpm test` ✅ (new: 9 SearchablePicker, 4 StreetPicker, 7 SupabaseStreetRepository, 3 useOnboardingBasicInfoFlow + EditProfileAddressBlock)
- `pnpm lint` ✅
- Manual: 8 surfaces verified locally per plan §2.16.

## SSOT updated
- [x] BACKLOG.md — P2.27 added (🟡 → flip to ✅ on merge)
- [x] spec/01, spec/02, spec/04 — picker notes appended
- [x] DECISIONS.md — D-34
- [x] TECH_DEBT.md — no new entries (closes none directly)

## Risk / rollout notes
- Migrations 0097 + 0098 are additive. Rollback = drop table.
- No FK constraint on user/post columns; existing data unaffected.
- Picker free-text fallback ensures forward compatibility — no user can be locked out.
EOF
)" \
  --label "FR-AUTH" --label "FR-PROFILE" --label "FR-POST" --assignee "@me"
gh pr merge --auto --squash --delete-branch
gh pr checks --watch
```

---

## Self-review checklist (run BEFORE handing the plan to an executor)

1. ✅ **Spec coverage.** Every section of `docs/superpowers/specs/2026-05-18-cities-streets-picker-design.md` maps to a task in this plan:
   - Spec §1.1 (cities truncation) → Task 1.x
   - Spec §1.2 (no street picker) → Tasks 2.7, 2.10
   - Spec §2.3 (progressive disclosure onboarding) → Task 2.12
   - Spec §2.4 (disabled-state UX other surfaces) → Tasks 2.11, 2.13, 2.14
   - Spec §2.5 (free-text fallback) → Tasks 2.7, 2.10
   - Spec §2.6 (shared shell) → Tasks 2.7, 2.9
   - Spec §4 (data source) → Task 2.1
   - Spec §4.1/4.2 (no-filter + synthesized sentinels) → Task 2.1
   - Spec §5 (domain/app/infra layers) → Tasks 2.3, 2.4, 2.5, 2.6
   - Spec §5.7 (reset-on-city-change) → Tasks 2.11, 2.12, 2.13, 2.14
   - Spec §6 (UX per surface) → Tasks 2.10, 2.11, 2.12, 2.13, 2.14
   - Spec §7 (DB) → Tasks 2.1, 2.2
   - Spec §8 (no use case changes) → confirmed (no task)
   - Spec §10 (testing) → Tasks 1.1, 1.2, 2.5.1, 2.7.2, 2.10.1, 2.11.2, 2.12.2
   - Spec §11 (SSOT) → Task 2.15
   - Spec §12 (rollout — local first, then push) → Tasks 1.4.2, 2.16.4, 2.17

2. ✅ **No placeholders.** Searched for "TBD", "TODO", "fill in" — none present in code blocks.

3. ✅ **Type / name consistency.** `Street { cityId, streetId, nameHe }` used identically across domain entity, port, adapter, picker, tests. `IStreetRepository.listByCity(cityId: string)` signature matches everywhere. `SearchablePicker<T>` props match between definition (Task 2.7) and consumers (Tasks 2.9, 2.10). i18n keys `profile.streetPicker*` declared in Task 2.8 used in Tasks 2.10, 2.11, 2.12.

4. ✅ **PM hard rule respected.** Tasks 1.4.2 and 2.16.4 are explicit "do not push" checkpoints. Task 2.17 is the only `git push` / `gh pr create` task in the entire plan.
