# Home Feed Filter Search & Compact Sheet — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add debounced free-text post search to the Home Feed filter sheet, remove Apply, auto-commit all controls, compact the sheet layout, and update SSOT.

**Architecture:** Extend `PostFeedFilter.searchQuery` and apply the same `ilike` OR clause as `searchPosts` in both feed SQL paths (`buildFeedQuery` + `feed_ranked_ids` RPC). Mobile: `filterStore` owns `searchQuery` (persisted); `PostFilterSheet` writes the store directly (no draft); `useDebouncedValue(300)` for the text field only.

**Tech Stack:** Supabase Postgres RPC, `@kc/application`, `@kc/infrastructure-supabase`, Expo RN, Zustand persist, TanStack Query.

**Design spec:** `docs/superpowers/specs/2026-05-26-home-feed-filter-search-and-compact-sheet-design.md` (PM approved 2026-05-26)

**Mapped FR-IDs:** FR-FEED-003 (revive), FR-FEED-004, FR-FEED-005, FR-FEED-008

---

## File map

| Layer | Create | Modify |
|-------|--------|--------|
| SSOT | — | `docs/SSOT/spec/06_feed_and_search.md`, `docs/SSOT/BACKLOG.md` (if tracked) |
| DB | `supabase/migrations/0126_feed_ranked_ids_search_query.sql` | — |
| Application | — | `packages/application/src/ports/IPostRepository.ts`, `packages/application/src/feed/GetFeedUseCase.ts`, `packages/application/src/feed/__tests__/GetFeedUseCase.test.ts` |
| Infra | `packages/infrastructure-supabase/src/posts/applyFeedTextSearch.ts`, `packages/infrastructure-supabase/src/posts/__tests__/applyFeedTextSearch.test.ts` | `packages/infrastructure-supabase/src/posts/feedQuery.ts`, `feedQueryRanked.ts`, `database.types.ts` (regen after migration) |
| Mobile | `apps/mobile/src/hooks/useDebouncedValue.ts`, `apps/mobile/src/hooks/__tests__/useDebouncedValue.test.ts`, `apps/mobile/src/components/PostFilterSheet/SearchSection.tsx` | `filterStore.ts`, `filterStore.test.ts`, `PostFilterSheet/index.tsx`, `Chip.tsx`, section style files, `(tabs)/index.tsx`, `i18n/locales/he/modules/filters.ts` |

**PR:** Single PR to `dev` — `feat/FR-FEED-003-home-feed-text-search`

---

### Task 1: SSOT — revive FR-FEED-003, amend FR-FEED-004/005/008

**Files:**
- Modify: `docs/SSOT/spec/06_feed_and_search.md`

- [ ] **Step 1: Update `FR-FEED-003`**

Change status from DEPRECATED to **Active (Home Feed filter sheet)**. ACs:
- 300 ms debounce; query runs only when trimmed length ≥ 2
- While length &lt; 2, text filter inactive (feed uses shape filters only; badge does not count search)
- Fields: `title`, `description`, `category` (`ilike`, same as Universal Search posts)
- AND-composes with `FR-FEED-004` filters; visibility via existing feed predicate

- [ ] **Step 2: Amend `FR-FEED-004`**

- AC1: add Search field at top of sheet
- AC3: replace Apply with auto-commit (chips immediate; text debounced). Clear all immediate.
- Note compact sheet `maxHeight` ~55–60%

- [ ] **Step 3: Amend `FR-FEED-005`**

- `searchQuery` persisted in `filterStore`; bump schema version

- [ ] **Step 4: Amend `FR-FEED-008`**

- `activeCount > 0` includes active text search (≥ 2 chars)

- [ ] **Step 5: Commit**

```bash
git add docs/SSOT/spec/06_feed_and_search.md
git commit -m "docs(ssot): revive home feed text search FR-FEED-003"
```

---

### Task 2: Contract — `PostFeedFilter.searchQuery`

**Files:**
- Modify: `app/packages/application/src/ports/IPostRepository.ts`
- Modify: `app/packages/application/src/feed/GetFeedUseCase.ts`
- Modify: `app/packages/application/src/feed/__tests__/GetFeedUseCase.test.ts`

- [ ] **Step 1: Add field to interface**

In `PostFeedFilter`:

```typescript
  /** Trimmed free-text filter; only applied when length >= 2 after normalize. FR-FEED-003 */
  searchQuery?: string;
```

Update the file header comment (remove "searchQuery … dropped").

- [ ] **Step 2: Normalize in `GetFeedUseCase`**

In `normalizeFilter`:

```typescript
  if (typeof out.searchQuery === 'string') {
    const q = out.searchQuery.trim();
    if (q.length < 2) delete out.searchQuery;
    else out.searchQuery = q;
  }
```

- [ ] **Step 3: Write failing test**

```typescript
  it('drops searchQuery shorter than 2 chars and trims longer', async () => {
    const repo = new FakePostRepository();
    const uc = new GetFeedUseCase(repo);

    await uc.execute({ viewerId: null, filter: { searchQuery: ' a ' }, limit: 20 });
    expect(repo.lastGetFeedArgs?.filter.searchQuery).toBeUndefined();

    await uc.execute({ viewerId: null, filter: { searchQuery: '  ספר  ' }, limit: 20 });
    expect(repo.lastGetFeedArgs?.filter.searchQuery).toBe('ספר');
  });
```

- [ ] **Step 4: Run test**

```bash
cd app && pnpm --filter @kc/application test -- GetFeedUseCase
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/packages/application/src/ports/IPostRepository.ts \
  app/packages/application/src/feed/GetFeedUseCase.ts \
  app/packages/application/src/feed/__tests__/GetFeedUseCase.test.ts
git commit -m "feat(contract): add PostFeedFilter.searchQuery FR-FEED-003"
```

---

### Task 3: Infra helper — shared text OR clause

**Files:**
- Create: `app/packages/infrastructure-supabase/src/posts/applyFeedTextSearch.ts`
- Create: `app/packages/infrastructure-supabase/src/posts/__tests__/applyFeedTextSearch.test.ts`

- [ ] **Step 1: Write failing unit test**

```typescript
import { describe, it, expect } from 'vitest';
import { feedTextSearchOrClause } from '../applyFeedTextSearch';

describe('feedTextSearchOrClause', () => {
  it('escapes ilike wildcards and builds OR on title/description/category', () => {
    expect(feedTextSearchOrClause('100%')).toBe(
      'title.ilike.%100\\%%,description.ilike.%100\\%%,category.ilike.%100\\%%',
    );
  });
});
```

- [ ] **Step 2: Implement**

```typescript
import { escapeIlike } from '../search/searchUtils';

/** FR-FEED-003 — same fields as searchPosts */
export function feedTextSearchOrClause(query: string): string {
  const esc = escapeIlike(query);
  return `title.ilike.%${esc}%,description.ilike.%${esc}%,category.ilike.%${esc}%`;
}
```

- [ ] **Step 3: Run test**

```bash
cd app && pnpm --filter @kc/infrastructure-supabase test -- applyFeedTextSearch
```

- [ ] **Step 4: Commit**

```bash
git add app/packages/infrastructure-supabase/src/posts/applyFeedTextSearch.ts \
  app/packages/infrastructure-supabase/src/posts/__tests__/applyFeedTextSearch.test.ts
git commit -m "feat(infra): feed text search OR helper FR-FEED-003"
```

---

### Task 4: Simple feed path — `buildFeedQuery`

**Files:**
- Modify: `app/packages/infrastructure-supabase/src/posts/feedQuery.ts`
- Modify: `app/packages/infrastructure-supabase/src/posts/__tests__/feedQuery*.test.ts` (add or extend nearest existing test file)

- [ ] **Step 1: Apply filter when `searchQuery` present**

After status/type/category filters:

```typescript
  if (filter.searchQuery) {
    q = q.or(feedTextSearchOrClause(filter.searchQuery));
  }
```

Import `feedTextSearchOrClause` from `./applyFeedTextSearch`.

- [ ] **Step 2: Add test** asserting `.or(` is called when `searchQuery: 'ספר'` is set (mock client or snapshot on builder if project pattern exists; otherwise integration test in existing feed repo test).

- [ ] **Step 3: Run infra tests**

```bash
cd app && pnpm --filter @kc/infrastructure-supabase test
```

- [ ] **Step 4: Commit**

```bash
git add app/packages/infrastructure-supabase/src/posts/feedQuery.ts
git commit -m "feat(infra): apply text search on simple feed query FR-FEED-003"
```

---

### Task 5: Ranked feed path — migration + RPC wire-up

**Files:**
- Create: `supabase/migrations/0126_feed_ranked_ids_search_query.sql`
- Modify: `app/packages/infrastructure-supabase/src/posts/feedQueryRanked.ts`

- [ ] **Step 1: Migration — add parameter**

`create or replace function public.feed_ranked_ids(..., p_filter_search_query text default null)` — copy body from `0025_feed_ranked_ids_followers.sql` and inside the `where` clause of the CTE add:

```sql
      and (
        p_filter_search_query is null
        or p.title ilike '%' || replace(replace(replace(p_filter_search_query, '\', '\\'), '%', '\%'), '_', '\_') || '%'
        or p.description ilike ...
        or p.category ilike ...
      )
```

Prefer a small SQL helper `escape_ilike(text)` if one exists in migrations; otherwise inline escape matching `escapeIlike` semantics.

Re-`grant execute` with full signature list (match `0025` pattern).

- [ ] **Step 2: Pass param from TS**

In `fetchRankedFeedPage` RPC call:

```typescript
    p_filter_search_query: filter.searchQuery ?? undefined,
```

- [ ] **Step 3: Regen types** (if repo uses generated Database types)

```bash
# from repo root, project-specific command — or hand-add Rpc args if regen is manual
```

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/0126_feed_ranked_ids_search_query.sql \
  app/packages/infrastructure-supabase/src/posts/feedQueryRanked.ts
git commit -m "feat(infra): feed_ranked_ids text search param FR-FEED-003"
```

---

### Task 6: Mobile store — `searchQuery` + `activeCount`

**Files:**
- Modify: `app/apps/mobile/src/store/filterStore.ts`
- Modify: `app/apps/mobile/src/store/__tests__/filterStore.test.ts`

- [ ] **Step 1: Extend state**

```typescript
  searchQuery: string; // default ''
  setSearchQuery: (q: string) => void;
```

In `DEFAULT_STATE`: `searchQuery: ''`.

`clearAll`: resets `searchQuery` to `''`.

`activeCount`:

```typescript
        if (s.searchQuery.trim().length >= 2) count++;
```

`partialize`: include `searchQuery`.

Bump persist `version` to `4` (migrate returns defaults — acceptable per existing pattern).

- [ ] **Step 2: Tests**

```typescript
  it('activeCount includes searchQuery when trimmed length >= 2', () => {
    useFilterStore.getState().setSearchQuery('ab');
    expect(useFilterStore.getState().activeCount()).toBe(1);
    useFilterStore.getState().setSearchQuery('a');
    expect(useFilterStore.getState().activeCount()).toBe(0);
  });

  it('clearAll resets searchQuery', () => {
    useFilterStore.getState().setSearchQuery('ספרים');
    useFilterStore.getState().clearAll();
    expect(useFilterStore.getState().searchQuery).toBe('');
  });
```

- [ ] **Step 3: Run**

```bash
cd app && pnpm --filter @kc/mobile test -- filterStore
```

- [ ] **Step 4: Commit**

```bash
git add app/apps/mobile/src/store/filterStore.ts \
  app/apps/mobile/src/store/__tests__/filterStore.test.ts
git commit -m "feat(mobile): persist feed searchQuery in filterStore FR-FEED-005"
```

---

### Task 7: `useDebouncedValue` hook

**Files:**
- Create: `app/apps/mobile/src/hooks/useDebouncedValue.ts`
- Create: `app/apps/mobile/src/hooks/__tests__/useDebouncedValue.test.ts`

- [ ] **Step 1: Implement** (mirror `search.tsx` timer cleanup)

```typescript
import { useEffect, useState } from 'react';

export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}
```

- [ ] **Step 2: Test with fake timers** (`vi.useFakeTimers`)

- [ ] **Step 3: Commit**

```bash
git add app/apps/mobile/src/hooks/useDebouncedValue.ts \
  app/apps/mobile/src/hooks/__tests__/useDebouncedValue.test.ts
git commit -m "feat(mobile): add useDebouncedValue hook"
```

---

### Task 8: `PostFilterSheet` — search UI, auto-apply, compact, no Apply

**Files:**
- Create: `app/apps/mobile/src/components/PostFilterSheet/SearchSection.tsx`
- Modify: `app/apps/mobile/src/components/PostFilterSheet/index.tsx`
- Modify: `app/apps/mobile/src/components/PostFilterSheet/Chip.tsx`, `SortSection.tsx`, `FiltersSection.tsx`, `LocationFilterSection.tsx` (compact spacing)
- Modify: `app/apps/mobile/src/i18n/locales/he/modules/filters.ts`

- [ ] **Step 1: i18n**

```typescript
  searchPlaceholder: 'חיפוש בכותרת, תיאור או קטגוריה…',
```

- [ ] **Step 2: `SearchSection`**

Controlled `TextInput` RTL, clear button when non-empty, `accessibilityLabel` from i18n.

- [ ] **Step 3: Refactor `PostFilterSheet` props**

Replace `initial` / `onApply` with store-driven callbacks, e.g.:

```typescript
interface PostFilterSheetProps {
  visible: boolean;
  value: PostFilterValue; // includes searchQuery
  onChange: (patch: Partial<PostFilterValue>) => void;
  onClear: () => void;
  onClose: () => void;
}
```

Remove `draft` state and `handleApply`. Each section calls `onChange` directly.

For search: local `inputText` state + `useDebouncedValue(inputText, 300)` + `useEffect` that calls `onChange({ searchQuery: debounced.trim() })` when debounced changes.

- [ ] **Step 4: Compact styles**

- `sheet.maxHeight`: `'58%'` (was `'85%'`)
- Section `title`: `typography.label` or `body` semibold instead of `h3`
- `section.marginBottom`: `spacing.md` (was `lg`)
- `Chip`: reduce `paddingVertical` to `spacing.xs`, `paddingHorizontal` to `spacing.sm`
- Remove `applyBtn` / `applyText` styles and JSX

- [ ] **Step 5: Manual smoke** (dev build): open sheet, type 3 chars, see feed refetch behind sheet; no Apply button.

- [ ] **Step 6: Commit**

```bash
git add app/apps/mobile/src/components/PostFilterSheet \
  app/apps/mobile/src/i18n/locales/he/modules/filters.ts
git commit -m "feat(mobile): compact PostFilterSheet with search FR-FEED-004"
```

---

### Task 9: Home screen wire-up

**Files:**
- Modify: `app/apps/mobile/app/(tabs)/index.tsx`

- [ ] **Step 1: Include `searchQuery` in `feedFilter` memo and query key**

```typescript
      searchQuery:
        filter.searchQuery.trim().length >= 2 ? filter.searchQuery.trim() : undefined,
```

Add `filter.searchQuery` to dependency array.

- [ ] **Step 2: Replace sheet handlers**

```typescript
  const handleFilterChange = (patch: Partial<PostFilterValue>) => {
    if ('type' in patch) filter.setType(patch.type ?? null);
    // … map each key, or single merge helper on store
    if ('searchQuery' in patch) filter.setSearchQuery(patch.searchQuery ?? '');
  };
```

Pass `value={{ ...filter fields including searchQuery }}` and `onChange={handleFilterChange}`.

Remove `handleApply`.

- [ ] **Step 3: Verify gates**

```bash
cd app && pnpm typecheck && pnpm test && pnpm lint
```

- [ ] **Step 4: Commit**

```bash
git add app/apps/mobile/app/(tabs)/index.tsx
git commit -m "feat(mobile): wire home feed searchQuery to GetFeed FR-FEED-003"
```

---

### Task 10: Manual QA checklist

- [ ] Chip toggle updates feed with sheet still open
- [ ] Type 1 char → no badge +1; feed ignores text
- [ ] Type 2+ chars after pause → badge +1, filtered posts
- [ ] Distance sort + text search together returns sensible results
- [ ] `נקה הכל` clears text and chips
- [ ] Kill app → reopen → filters + text restored
- [ ] Empty state when no matches with active filters

---

## Self-review (plan vs spec)

| Spec requirement | Task |
|------------------|------|
| Text search FR-FEED-003 | 2, 3, 4, 5, 8, 9 |
| Auto-apply, no Apply | 8 |
| Persist search | 6 |
| Badge +1 | 6, 9 |
| Compact sheet | 8 |
| Ranked + text combo | 5 |
| SSOT | 1 |

No TBD placeholders. Search tab `SearchFilterSheet` Apply left unchanged (out of scope).

---

## Execution handoff

Plan saved. Choose:

1. **Subagent-Driven** — fresh subagent per task, review between tasks  
2. **Inline Execution** — implement in this session with checkpoints  

Which approach?
