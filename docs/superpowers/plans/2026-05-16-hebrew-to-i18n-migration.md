# Hebrew → i18n Production-Code Migration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate all Hebrew string literals out of production code (`apps/mobile/app/**`, `apps/mobile/src/components/**`, `packages/domain`, `packages/application`, `packages/infrastructure-supabase`) into the existing `react-i18next` infrastructure under `apps/mobile/src/i18n/locales/he/`, and remove display-string responsibilities from `domain`/`application`/`infrastructure-*` (CLAUDE.md §5).

**Architecture:** Display strings live only in `apps/mobile/src/i18n/locales/he/`. The domain layer owns enum *keys* (`'Furniture'`, `'New'`, …) but no labels. Infrastructure returns `null` for absent counterparts; the UI renders `t('common.deletedUser')`. Chat-auto-message generation moves from a one-line use case to a direct `i18n.t(…)` call in the mobile composition root.

**Tech Stack:** `react-i18next` v15 (`apps/mobile/src/i18n/index.ts`), pnpm + turbo monorepo, TypeScript strict, `vitest` for tests.

**Spec:** `docs/superpowers/specs/2026-05-16-hebrew-to-i18n-design.md`

---

## File structure

```
NEW
  app/apps/mobile/src/i18n/locales/he/modules/common.ts

MODIFY (i18n bundles)
  app/apps/mobile/src/i18n/locales/he/index.ts                 + common wiring
  app/apps/mobile/src/i18n/locales/he/modules/post.ts          + category, condition
  app/apps/mobile/src/i18n/locales/he/modules/chat.ts          + autoMessage.initial
  app/apps/mobile/src/i18n/locales/he/modules/settings.ts      privacy text → interpolated

MODIFY (domain — label removal)
  app/packages/domain/src/value-objects.ts                     remove CATEGORY_LABELS, ITEM_CONDITION_LABELS_HE
  app/packages/domain/src/entities.ts                          translate Hebrew comment

MODIFY (application port + use-case deletion)
  app/packages/application/src/ports/IPostRepository.ts        ownerName: string → string | null
  app/packages/application/src/ports/IChatRepository.ts        otherParticipant.displayName + getCounterpart return: string → string | null
  app/packages/application/src/index.ts                        remove BuildAutoMessageUseCase export
  DELETE: app/packages/application/src/chat/BuildAutoMessageUseCase.ts
  DELETE: app/packages/application/src/chat/__tests__/BuildAutoMessageUseCase.test.ts

MODIFY (infrastructure — return null for deleted user)
  app/packages/infrastructure-supabase/src/posts/mapPostRow.ts        ownerName: 'משתמש שנמחק' → null; English comment
  app/packages/infrastructure-supabase/src/chat/SupabaseChatRepository.ts   2× displayName: 'משתמש שנמחק' → null; remove Hebrew type literal
  app/packages/infrastructure-supabase/src/chat/getMyChats.ts         displayName: 'משתמש שנמחק' → null

MODIFY (mobile composition + consumers)
  app/apps/mobile/src/lib/container.ts                         remove buildAutoMessage
  app/apps/mobile/src/lib/contactPoster.ts                     inline i18n.t call
  app/apps/mobile/src/components/PostCard.tsx                  CATEGORY_LABELS → t(); ownerName ?? t()
  app/apps/mobile/src/components/PostCardGrid.tsx              CATEGORY_LABELS → t(); ownerName ?? t()
  app/apps/mobile/src/components/PostCardProfile.tsx           CATEGORY_LABELS → t()
  app/apps/mobile/src/components/PostFilterSheet/FiltersSection.tsx  CATEGORY_LABELS → t()
  app/apps/mobile/src/components/search/PostResultCard.tsx     ownerName ?? t()
  app/apps/mobile/app/post/[id].tsx                            CATEGORY/CONDITION → t(); ownerName ?? t()
  app/apps/mobile/app/(tabs)/create.tsx                        CATEGORY/CONDITION → t()
  app/apps/mobile/app/edit-post/[id].tsx                       CATEGORY/CONDITION → t()

MODIFY (UI sweep — Pattern #1, PR5)
  ~27 files under app/apps/mobile/app/** + ChatNotFoundView.tsx
  (full per-file list in Tasks 5-8)

MODIFY (test fixtures touched by contract changes)
  app/packages/infrastructure-supabase/src/chat/__tests__/rowMappers.test.ts (if it asserts on Hebrew)
  app/packages/infrastructure-supabase/src/posts/__tests__/mapPostRow.test.ts (assert null instead of Hebrew)
```

---

## Working conventions (apply to every task)

- **Branch off latest `origin/dev`** for every task:
  ```bash
  git fetch origin && git switch dev && git pull --ff-only origin dev
  git switch -c <branch-name>
  ```
- **Pre-push gates** (from `app/`):
  ```bash
  cd app && pnpm typecheck && pnpm test && pnpm lint
  ```
  All three must be green. Investigate failures rather than push red.
- **Open PR** with `gh pr create --base dev` using the body template from CLAUDE.md §6, then enable auto-merge:
  ```bash
  gh pr merge --auto --squash --delete-branch
  ```
- **After merge**, sync local dev:
  ```bash
  git switch dev && git pull --ff-only origin dev
  ```
- **i18n key references for non-React modules** (e.g., `contactPoster.ts`) use `import i18n from '@/i18n'; i18n.t('…', { vars })` — the singleton lives at `apps/mobile/src/i18n/index.ts`.
- **i18n key references inside components/hooks** use `const { t } = useTranslation();`.
- The Hebrew-scanner that produced `scripts/hebrew-text-report.md` is the regression check — re-run after each PR by re-reading the relevant file slice.

---

## Task 1 — PR1: i18n keys + module split (infra-only, no behavior change)

**Branch:** `chore/i18n-keys-foundation`

**Files:**
- Create: `app/apps/mobile/src/i18n/locales/he/modules/common.ts`
- Modify: `app/apps/mobile/src/i18n/locales/he/index.ts`
- Modify: `app/apps/mobile/src/i18n/locales/he/modules/post.ts`
- Modify: `app/apps/mobile/src/i18n/locales/he/modules/chat.ts`
- Modify: `app/apps/mobile/src/i18n/locales/he/modules/settings.ts`

### Step 1.1 — Branch from latest dev

```bash
git fetch origin && git switch dev && git pull --ff-only origin dev
git switch -c chore/i18n-keys-foundation
```

### Step 1.2 — Create `common.ts`

Create `app/apps/mobile/src/i18n/locales/he/modules/common.ts`:

```ts
// Cross-cutting placeholder labels used by both UI components and other
// translation modules via interpolation. Kept tiny and dependency-free.
export const commonHe = {
  deletedUser: 'משתמש שנמחק',
} as const;
```

### Step 1.3 — Wire `common` into the root bundle

In `app/apps/mobile/src/i18n/locales/he/index.ts`, add the import and the field. Locate the existing imports block (around line 8-22) and add:

```ts
import { commonHe } from './modules/common';
```

In the `const he = {` object, add a `common: commonHe,` field. Put it next to `general` for symmetry. The literal edit:

- After the line `  errorBoundary: errorBoundaryHe,` add `  common: commonHe,` (or any sensible position before `general`).

### Step 1.4 — Extend `post.ts` with `category` + `condition`

In `app/apps/mobile/src/i18n/locales/he/modules/post.ts`, after the closing `}` of the menu block but still inside `postHe`, append:

```ts
  // Category labels (Pattern #2 — moved out of domain/value-objects.ts).
  // Keys match the `Category` enum so callers do `t(\`post.category.${cat}\`)`.
  category: {
    Furniture: 'רהיטים',
    Clothing: 'בגדים',
    Books: 'ספרים',
    Toys: 'משחקים',
    BabyGear: 'ציוד תינוקות',
    Kitchen: 'מטבח',
    Sports: 'ספורט',
    Electronics: 'חשמל',
    Tools: 'כלי עבודה',
    Other: 'אחר',
  },

  // Item-condition labels (Pattern #2 — moved out of domain/value-objects.ts).
  // Keys match the `ItemCondition` enum.
  condition: {
    New: 'חדש',
    LikeNew: 'כמו חדש',
    Good: 'טוב',
    Fair: 'בינוני',
    Damaged: 'שבור/תקול',
  },
```

The existing flat keys `conditionNew` / `conditionLikeNew` / `conditionGood` / `conditionFair` stay (they may be referenced elsewhere); do **not** delete them in this PR. Reconciliation is tracked as a follow-up.

### Step 1.5 — Add `autoMessage.initial` to `chat.ts`

In `app/apps/mobile/src/i18n/locales/he/modules/chat.ts`, before the closing `} as const;`, add:

```ts
  // Auto chat-message template (Pattern #4 — moved out of
  // application/chat/BuildAutoMessageUseCase). The wording must match the
  // template the use case produced before deletion, because contactPoster.ts
  // dedupes against this exact string in the last 50 messages.
  autoMessage: {
    initial: 'היי! ראיתי את הפוסט שלך על {{title}}. אשמח לדעת עוד.',
  },
```

The existing `defaultFirstMessage` key (line 9) is a separate, near-identical template used elsewhere. Do **not** delete it. Add a TD-line in TECH_DEBT.md (Step 1.7) to reconcile the two templates later.

### Step 1.6 — Interpolate the deleted-user label in `settings.ts`

In `app/apps/mobile/src/i18n/locales/he/modules/settings.ts`, locate `chatsRetention` (line ~27-28). Replace the literal `"משתמש שנמחק"` inside the string with `{{deletedUserLabel}}`:

```ts
    chatsRetention:
      'שיחות שניהלת יישארו אצל האנשים שדיברת איתם. הם יראו את ההודעות שכתבת, אבל לא את שמך, התמונה או הפרופיל — רק "{{deletedUserLabel}}".',
```

Callers of `t('settings.deleteAccountModal.chatsRetention')` must pass the variable. The single caller will be updated in a later task (UI sweep). For this PR, grep the consumer and fix it now to keep the build green:

```bash
grep -rn "chatsRetention" app/apps/mobile/app app/apps/mobile/src
```

Update each call site to pass `{ deletedUserLabel: t('common.deletedUser') }` as the second argument.

### Step 1.7 — Run gates

From `app/`:

```bash
cd app && pnpm typecheck && pnpm test && pnpm lint
```

Expected: all green. No new tests are needed (this PR is pure data; existing tests must still pass).

If `pnpm typecheck` complains that `chatsRetention` callers are missing the variable, that's the case Step 1.6 covered — fix and re-run.

### Step 1.8 — Update SSOT

Add the BACKLOG row. In `docs/SSOT/BACKLOG.md`, append to the INFRA table:

```
| INFRA-I18N-PROD-CODE | Migrate inline Hebrew in production code to react-i18next; remove display strings from domain/application/infrastructure-supabase | infra | 🟡 In progress | `docs/superpowers/specs/2026-05-16-hebrew-to-i18n-design.md` |
```

Add a TD row in `docs/SSOT/TECH_DEBT.md` (FE lane, next free `TD-1xx`): "Reconcile `chat.defaultFirstMessage` and `chat.autoMessage.initial` — two near-identical first-contact templates. Decide on one and remove the other."

Add a second TD row: "Automated lint rule that flags inline Hebrew literals outside `apps/mobile/src/i18n/locales/`."

### Step 1.9 — Commit, push, open PR, auto-merge

```bash
git add app/apps/mobile/src/i18n/ docs/SSOT/BACKLOG.md docs/SSOT/TECH_DEBT.md
git status   # verify no stray files

git commit -m "$(cat <<'EOF'
chore(i18n): add category/condition/autoMessage/common keys (PR1)

Foundation for the Hebrew→i18n migration (spec
docs/superpowers/specs/2026-05-16-hebrew-to-i18n-design.md). No
behavior change; new keys unused until PR2-PR5.

- common.ts: deletedUser placeholder (Pattern #3 destination)
- post.ts:   category.*, condition.* nested objects (Pattern #2)
- chat.ts:   autoMessage.initial (Pattern #4)
- settings.ts: chatsRetention interpolates deletedUserLabel

Mapped to R-MVP-Core-4, CLAUDE.md §5.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"

git push -u origin chore/i18n-keys-foundation

gh pr create --base dev --head chore/i18n-keys-foundation \
  --title "chore(i18n): add category/condition/autoMessage/common keys (PR1)" \
  --body "$(cat <<'EOF'
## Summary
Pure-additive i18n key foundation for the Hebrew→i18n production-code migration (PR1 of 5, per spec). New keys are unused at this point; PR2-PR5 will switch consumers.

## Mapped to spec
- R-MVP-Core-4 (Hebrew-only MVP via react-i18next)
- CLAUDE.md §5 (Clean Architecture)
- Spec: docs/superpowers/specs/2026-05-16-hebrew-to-i18n-design.md

## Changes
- New: locales/he/modules/common.ts (`deletedUser`)
- locales/he/modules/post.ts: nested `category.*`, `condition.*`
- locales/he/modules/chat.ts: `autoMessage.initial` (matches the BuildAutoMessageUseCase template exactly for dedupe safety)
- locales/he/modules/settings.ts: `chatsRetention` interpolates `{{deletedUserLabel}}`; consumer updated to pass the var
- locales/he/index.ts: wires `common` into root bundle

## Tests
- `pnpm typecheck` ✅
- `pnpm test`      ✅
- `pnpm lint`      ✅
- Manual: N/A (no UI change)

## SSOT updated
- [x] BACKLOG.md — added `INFRA-I18N-PROD-CODE` 🟡 In progress
- [ ] spec/{domain}.md — N/A
- [x] TECH_DEBT.md — added 2 FE TDs (reconcile templates; lint rule)

## Risk / rollout notes
Low. Pure-additive keys + one interpolation refactor whose single consumer is updated in the same PR.
EOF
)"

gh pr merge --auto --squash --delete-branch
gh pr checks --watch
```

### Step 1.10 — Sync local dev

```bash
git switch dev && git pull --ff-only origin dev
```

---

## Task 2 — PR2: Remove domain label maps (Pattern #2)

**Branch:** `refactor/i18n-remove-domain-labels`

**Depends on:** Task 1 merged.

**Files:**
- Modify: `app/packages/domain/src/value-objects.ts` (delete two maps)
- Modify: `app/apps/mobile/src/components/PostCard.tsx`
- Modify: `app/apps/mobile/src/components/PostCardGrid.tsx`
- Modify: `app/apps/mobile/src/components/PostCardProfile.tsx`
- Modify: `app/apps/mobile/src/components/PostFilterSheet/FiltersSection.tsx`
- Modify: `app/apps/mobile/app/post/[id].tsx`
- Modify: `app/apps/mobile/app/(tabs)/create.tsx`
- Modify: `app/apps/mobile/app/edit-post/[id].tsx`

### Step 2.1 — Branch

```bash
git fetch origin && git switch dev && git pull --ff-only origin dev
git switch -c refactor/i18n-remove-domain-labels
```

### Step 2.2 — Delete maps from `value-objects.ts`

In `app/packages/domain/src/value-objects.ts`, delete lines 53-59 (`ITEM_CONDITION_LABELS_HE`) and lines 73-85 (`CATEGORY_LABELS` block including the `// Hebrew labels for UI` comment). Keep `ITEM_CONDITIONS`, `Category` type, and `ALL_CATEGORIES`.

If `app/packages/domain/src/index.ts` (or barrel file) re-exports these names, delete those lines too:

```bash
grep -rn "CATEGORY_LABELS\|ITEM_CONDITION_LABELS_HE" app/packages/domain
```

### Step 2.3 — Update component consumers (pattern)

For every consumer, the replacement pattern is:

```tsx
// Before
import { CATEGORY_LABELS, ITEM_CONDITION_LABELS_HE } from '@kc/domain';
// …
<Text>{CATEGORY_LABELS[post.category]}</Text>
<Text>{ITEM_CONDITION_LABELS_HE[post.itemCondition]}</Text>

// After
import { useTranslation } from 'react-i18next';
// …
const { t } = useTranslation();
// …
<Text>{t(`post.category.${post.category}`)}</Text>
<Text>{post.itemCondition ? t(`post.condition.${post.itemCondition}`) : null}</Text>
```

Notes:
- If `useTranslation` is already imported, reuse it.
- If the consumer is a non-hook context (data prep outside JSX), use `i18n.t(...)` via the singleton.
- `itemCondition` may be `null` (Give-only field) — guard before interpolating.

Apply this pattern in each file below.

### Step 2.4 — `PostCard.tsx`

`app/apps/mobile/src/components/PostCard.tsx:79` — replace `{CATEGORY_LABELS[post.category]}` with `{t(\`post.category.${post.category}\`)}`. Remove the now-unused `CATEGORY_LABELS` import (line 8). Ensure `useTranslation()` is present.

### Step 2.5 — `PostCardGrid.tsx`

`app/apps/mobile/src/components/PostCardGrid.tsx:80` — same replacement. Remove unused import on line 11. Ensure `useTranslation()`.

### Step 2.6 — `PostCardProfile.tsx`

`app/apps/mobile/src/components/PostCardProfile.tsx:84` — same replacement. Remove unused import on line 12. Ensure `useTranslation()`.

### Step 2.7 — `FiltersSection.tsx`

`app/apps/mobile/src/components/PostFilterSheet/FiltersSection.tsx:83` — `label={CATEGORY_LABELS[c]}` → `label={t(\`post.category.${c}\`)}`. Remove unused import on line 6. Ensure `useTranslation()`.

### Step 2.8 — `post/[id].tsx`

`app/apps/mobile/app/post/[id].tsx` — line 96 (`CATEGORY_LABELS`) and line 101 (`ITEM_CONDITION_LABELS_HE`). Remove imports on line 12. Add `useTranslation()` if missing.

### Step 2.9 — `(tabs)/create.tsx`

`app/apps/mobile/app/(tabs)/create.tsx` — lines 297 and 315. Remove `CATEGORY_LABELS, ITEM_CONDITION_LABELS_HE` from the import on line 17 (keep `ALL_CATEGORIES`, `ITEM_CONDITIONS`). Add `useTranslation()` if missing.

### Step 2.10 — `edit-post/[id].tsx`

`app/apps/mobile/app/edit-post/[id].tsx` — lines 343 and 361. Remove `CATEGORY_LABELS` from line 15 and `ITEM_CONDITION_LABELS_HE` from line 16. Add `useTranslation()` if missing.

### Step 2.11 — Search for any other consumers

```bash
grep -rn "CATEGORY_LABELS\|ITEM_CONDITION_LABELS_HE" app/
```

Expected: only `__tests__/` results, if any. Fix or delete test assertions that imported the labels. Production code result-count must be zero.

### Step 2.12 — Run gates

```bash
cd app && pnpm typecheck && pnpm test && pnpm lint
```

Expected green. TypeScript will catch any missed consumer.

### Step 2.13 — Commit, push, PR, auto-merge

```bash
git add app/packages/domain/ app/apps/mobile/
git commit -m "$(cat <<'EOF'
refactor(domain): remove Hebrew label maps; consumers use i18n (PR2)

Deletes CATEGORY_LABELS and ITEM_CONDITION_LABELS_HE from
packages/domain/src/value-objects.ts. Seven mobile consumers now
call t(`post.category.${cat}`) / t(`post.condition.${cond}`).
Restores the Clean Architecture invariant (CLAUDE.md §5) that
domain holds no UI strings.

Spec: docs/superpowers/specs/2026-05-16-hebrew-to-i18n-design.md
PR2 of 5.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"

git push -u origin refactor/i18n-remove-domain-labels

gh pr create --base dev --head refactor/i18n-remove-domain-labels \
  --title "refactor(domain): remove Hebrew label maps; consumers use i18n (PR2)" \
  --body "$(cat <<'EOF'
## Summary
Removes display-string responsibilities from the domain layer per the migration spec. PR2 of 5.

## Mapped to spec
- R-MVP-Core-4 + CLAUDE.md §5
- Spec: docs/superpowers/specs/2026-05-16-hebrew-to-i18n-design.md

## Changes
- domain/value-objects.ts: deleted CATEGORY_LABELS and ITEM_CONDITION_LABELS_HE
- 7 mobile consumers updated to use t(`post.category.${cat}`) / t(`post.condition.${cond}`)

## Tests
- `pnpm typecheck` ✅ (TS enforces every consumer is updated)
- `pnpm test`      ✅
- `pnpm lint`      ✅
- Manual: visual-check post detail, create, edit-post, filter sheet, post cards render correct Hebrew

## SSOT updated
- [ ] BACKLOG.md — keep `INFRA-I18N-PROD-CODE` 🟡 (still in progress)
- [ ] spec/{domain}.md — N/A
- [ ] TECH_DEBT.md — N/A this PR

## Risk / rollout notes
Medium: changes a domain export. Pure rename of label lookup; TS catches every miss.
EOF
)"

gh pr merge --auto --squash --delete-branch
gh pr checks --watch
```

### Step 2.14 — Sync local dev

```bash
git switch dev && git pull --ff-only origin dev
```

---

## Task 3 — PR3: deleted-user placeholder (Pattern #3)

**Branch:** `refactor/i18n-deleted-user-null`

**Depends on:** Task 1 merged.

**Files:**
- Modify: `app/packages/application/src/ports/IPostRepository.ts` (`ownerName: string | null`)
- Modify: `app/packages/application/src/ports/IChatRepository.ts` (2 places: `otherParticipant.displayName` and `getCounterpart` return)
- Modify: `app/packages/domain/src/entities.ts` (translate Hebrew comment)
- Modify: `app/packages/infrastructure-supabase/src/posts/mapPostRow.ts` (null + English comment)
- Modify: `app/packages/infrastructure-supabase/src/chat/SupabaseChatRepository.ts` (local `Counterpart` type + 2 fallback returns)
- Modify: `app/packages/infrastructure-supabase/src/chat/getMyChats.ts` (1 fallback return)
- Modify: UI consumers of `ownerName` and `otherParticipant.displayName`
- Modify: tests that assert on the Hebrew literal

### Step 3.1 — Branch

```bash
git fetch origin && git switch dev && git pull --ff-only origin dev
git switch -c refactor/i18n-deleted-user-null
```

### Step 3.2 — Application port types

`app/packages/application/src/ports/IPostRepository.ts:44` — change `ownerName: string;` to `ownerName: string | null;`.

`app/packages/application/src/ports/IChatRepository.ts:6` (inside `otherParticipant`) — change `displayName: string;` to `displayName: string | null;`. Update the `// null when …` comment to: `// null when counterpart hard-deleted; UI renders t('common.deletedUser')`.

`app/packages/application/src/ports/IChatRepository.ts:50` (inside `getCounterpart` return literal) — same: `displayName: string | null;`.

### Step 3.3 — Translate the Hebrew comment in `entities.ts`

`app/packages/domain/src/entities.ts:100` — locate the comment containing `"משתמש שנמחק"` and rewrite the whole sentence in English. For example:

```ts
// Display layer renders null participants as the localized
// `common.deletedUser` placeholder (FR-CHAT-013).
```

### Step 3.4 — Infrastructure: return null

`app/packages/infrastructure-supabase/src/posts/mapPostRow.ts`:
- Line 110 — change `ownerName: 'משתמש שנמחק',` to `ownerName: null,`.
- Lines 99-105 — rewrite the Hebrew sentence in the comment block in English. Suggestion:
  ```ts
  // Owner can be null when the user_id is orphaned in public.users
  // (the FK posts_owner_id_fkey is ON DELETE cascade, but defensive
  // coding still handles a stale join). Per D-21, users RLS no longer
  // hides Private profiles from non-followers, so privacy mode is no
  // longer a reason for a null owner. Return ownerName: null so the
  // UI renders the localized placeholder (FR-CHAT-013 convention);
  // one orphan post must not crash the feed.
  ```
- Also rewrite the Hebrew-quoting comment on line 130 in English (e.g., `// "delivered to X" / "given by X"`).

`app/packages/infrastructure-supabase/src/chat/SupabaseChatRepository.ts`:
- Line 17 — change `Counterpart.displayName: string;` to `displayName: string | null;`.
- Line 163 — `displayName: 'משתמש שנמחק',` → `displayName: null,`.
- Line 178 — same.

`app/packages/infrastructure-supabase/src/chat/getMyChats.ts:122` — `displayName: 'משתמש שנמחק',` → `displayName: null,`.

### Step 3.5 — UI consumers of `ownerName`

Run:

```bash
grep -rn "ownerName" app/apps/mobile | grep -v __tests__
```

Expected hits (update each to `post.ownerName ?? t('common.deletedUser')` at the JSX render site):

- `app/apps/mobile/src/components/PostCard.tsx:49` (passed as `name=` prop — preserve null-fallback inside `AvatarInitials` if it doesn't already handle null, otherwise fall back here) and `:54`.
- `app/apps/mobile/src/components/PostCardGrid.tsx:85`.
- `app/apps/mobile/src/components/search/PostResultCard.tsx:53`.
- `app/apps/mobile/app/post/[id].tsx:131` (avatar `name=` prop) and `:133`.

Verify `AvatarInitials` accepts `string | null` for `name`; if it does not, pass `post.ownerName ?? t('common.deletedUser')`.

If `useTranslation` is missing in any of these components, add it.

### Step 3.6 — UI consumers of `otherParticipant.displayName`

```bash
grep -rn "otherParticipant\.\|otherParticipant\b" app/apps/mobile | grep -v __tests__
```

For each render site that displays `chat.otherParticipant.displayName`, fall back to `t('common.deletedUser')`. Typical site: `app/apps/mobile/app/chat/index.tsx` (inbox row) and `app/apps/mobile/app/chat/[id].tsx` (header).

### Step 3.7 — UI consumer of `getCounterpart`

```bash
grep -rn "getCounterpart\|counterpart\.displayName" app/apps/mobile | grep -v __tests__
```

Apply the same null-fallback at render sites.

### Step 3.8 — Update tests

```bash
grep -rln "משתמש שנמחק" app/packages
```

Update assertions in `app/packages/infrastructure-supabase/src/posts/__tests__/mapPostRow.test.ts` and `app/packages/infrastructure-supabase/src/chat/__tests__/rowMappers.test.ts` (and any other hit) to expect `null` instead of the Hebrew literal.

### Step 3.9 — Run gates

```bash
cd app && pnpm typecheck && pnpm test && pnpm lint
```

Expected green. TS will flag every UI consumer that didn't add a fallback.

### Step 3.10 — Commit, push, PR, auto-merge

```bash
git add app/packages/ app/apps/mobile/
git commit -m "$(cat <<'EOF'
refactor(infra): return null for deleted user; UI renders placeholder (PR3)

mapPostRow, SupabaseChatRepository, and getMyChats now return null
for ownerName / displayName when the counterpart is hard-deleted,
instead of synthesizing the Hebrew "משתמש שנמחק" literal. UI
consumers render `… ?? t('common.deletedUser')` at the JSX site.
Removes display-string responsibility from infra (CLAUDE.md §5)
and unblocks future localization.

Application port types updated: PostWithOwner.ownerName and the
chat Counterpart/otherParticipant.displayName fields are now
`string | null`.

Spec: docs/superpowers/specs/2026-05-16-hebrew-to-i18n-design.md
PR3 of 5.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"

git push -u origin refactor/i18n-deleted-user-null

gh pr create --base dev --head refactor/i18n-deleted-user-null \
  --title "refactor(infra): return null for deleted user; UI renders placeholder (PR3)" \
  --body "$(cat <<'EOF'
## Summary
Infra layers stop synthesizing UI strings for deleted-counterpart cases. Application ports widen to `string | null`. UI renders the localized placeholder. PR3 of 5.

## Mapped to spec
- R-MVP-Core-4 + CLAUDE.md §5 + FR-CHAT-013 (deleted-user placeholder convention)
- Spec: docs/superpowers/specs/2026-05-16-hebrew-to-i18n-design.md

## Changes
- IPostRepository.ts, IChatRepository.ts: ownerName / displayName now `string | null`
- mapPostRow.ts, SupabaseChatRepository.ts, getMyChats.ts: return null; English-only comments
- entities.ts: Hebrew comment translated
- 5+ UI consumers fall back to t('common.deletedUser')
- Test assertions updated

## Tests
- `pnpm typecheck` ✅
- `pnpm test`      ✅
- `pnpm lint`      ✅
- Manual: simulate a chat / post whose owner is null — placeholder renders

## SSOT updated
- [ ] BACKLOG.md — INFRA-I18N-PROD-CODE stays 🟡
- [ ] spec/{domain}.md — N/A
- [ ] TECH_DEBT.md — N/A

## Risk / rollout notes
Medium. Contract change (`string → string | null`) at the application-port layer; TypeScript enforces every consumer is updated.
EOF
)"

gh pr merge --auto --squash --delete-branch
gh pr checks --watch
git switch dev && git pull --ff-only origin dev
```

---

## Task 4 — PR4: Delete `BuildAutoMessageUseCase` (Pattern #4)

**Branch:** `refactor/i18n-delete-build-auto-message`

**Depends on:** Task 1 merged.

**Files:**
- Delete: `app/packages/application/src/chat/BuildAutoMessageUseCase.ts`
- Delete: `app/packages/application/src/chat/__tests__/BuildAutoMessageUseCase.test.ts`
- Modify: `app/packages/application/src/index.ts` (remove export)
- Modify: `app/apps/mobile/src/lib/container.ts` (remove construction)
- Modify: `app/apps/mobile/src/lib/contactPoster.ts` (call `i18n.t` directly)

### Step 4.1 — Branch

```bash
git fetch origin && git switch dev && git pull --ff-only origin dev
git switch -c refactor/i18n-delete-build-auto-message
```

### Step 4.2 — Delete the use-case files

```bash
git rm app/packages/application/src/chat/BuildAutoMessageUseCase.ts
git rm app/packages/application/src/chat/__tests__/BuildAutoMessageUseCase.test.ts
```

### Step 4.3 — Remove export

`app/packages/application/src/index.ts:54` — delete the line `export { BuildAutoMessageUseCase } from './chat/BuildAutoMessageUseCase';`.

### Step 4.4 — Remove from `container.ts`

`app/apps/mobile/src/lib/container.ts`:
- Line 29 — remove `BuildAutoMessageUseCase,` from the `@kc/application` import.
- Line 91 — remove the line `buildAutoMessage: new BuildAutoMessageUseCase(),`.

Inspect the surrounding object to make sure trailing-comma placement is still valid.

### Step 4.5 — Update `contactPoster.ts`

Rewrite `app/apps/mobile/src/lib/contactPoster.ts` (current file is 32 lines). Target shape:

```ts
// FR-CHAT-004 + FR-CHAT-005 AC4 — open/create chat anchored on the post and
// prefill the auto-message only if the viewer hasn't sent it within the last
// 50 messages.
import type { Post } from '@kc/domain';
import type { useRouter } from 'expo-router';
import i18n from '../i18n';
import { container } from './container';
import { consumePreferNewThread } from './chatNavigationPrefs';

type Router = ReturnType<typeof useRouter>;

export async function contactPoster(
  viewerId: string | null,
  post: Post,
  router: Router,
): Promise<void> {
  if (!viewerId) return;
  const preferNewThread = consumePreferNewThread(post.ownerId);
  const chat = await container.openOrCreateChat.execute({
    viewerId,
    otherUserId: post.ownerId,
    anchorPostId: post.postId,
    preferNewThread,
  });
  const recent = await container.chatRepo.getMessages(chat.chatId, 50);
  const template = i18n.t('chat.autoMessage.initial', { title: post.title.trim() });
  const sentBefore = recent.some((m) => m.senderId === viewerId && m.body === template);
  router.push({
    pathname: '/chat/[id]',
    params: sentBefore ? { id: chat.chatId } : { id: chat.chatId, prefill: template },
  });
}
```

Note: the import `import i18n from '../i18n';` resolves to `apps/mobile/src/i18n/index.ts` (the singleton).

### Step 4.6 — Run gates

```bash
cd app && pnpm typecheck && pnpm test && pnpm lint
```

Expected green. The `__tests__/BuildAutoMessageUseCase.test.ts` file no longer exists, so vitest will simply discover fewer tests.

### Step 4.7 — Commit, push, PR, auto-merge

```bash
git add -A
git commit -m "$(cat <<'EOF'
refactor(chat): delete BuildAutoMessageUseCase; inline i18n.t (PR4)

The use case was a single-line string interpolation with one mobile
caller (contactPoster.ts). It did not justify an application-layer
abstraction. contactPoster now calls i18n.t('chat.autoMessage.initial',
{ title }) directly. Eliminates Hebrew from the application layer
(CLAUDE.md §5).

Spec: docs/superpowers/specs/2026-05-16-hebrew-to-i18n-design.md
PR4 of 5.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"

git push -u origin refactor/i18n-delete-build-auto-message

gh pr create --base dev --head refactor/i18n-delete-build-auto-message \
  --title "refactor(chat): delete BuildAutoMessageUseCase; inline i18n.t (PR4)" \
  --body "$(cat <<'EOF'
## Summary
Removes the single-line BuildAutoMessageUseCase abstraction and inlines the i18n call in the only caller. PR4 of 5.

## Mapped to spec
- CLAUDE.md §5 (application layer is pure; no I/O, no display strings)
- Spec: docs/superpowers/specs/2026-05-16-hebrew-to-i18n-design.md

## Changes
- Deleted: BuildAutoMessageUseCase.ts + test
- Removed export from packages/application/src/index.ts
- container.ts: dropped buildAutoMessage construction
- contactPoster.ts: uses i18n.t('chat.autoMessage.initial', { title })

## Tests
- `pnpm typecheck` ✅
- `pnpm test`      ✅
- `pnpm lint`      ✅
- Manual: tap "Contact poster" on a post; verify prefill matches before/after

## SSOT updated
- [ ] BACKLOG.md — stays 🟡
- [ ] spec/{domain}.md — N/A
- [ ] TECH_DEBT.md — N/A

## Risk / rollout notes
Low. Template string is byte-identical (verified at PR1) so chat dedupe behavior is preserved.
EOF
)"

gh pr merge --auto --squash --delete-branch
gh pr checks --watch
git switch dev && git pull --ff-only origin dev
```

---

## Tasks 5-8 — PR5a-d: UI sweep (Pattern #1)

These four tasks share a recipe but touch different files. The recipe runs once per task.

### Shared recipe — per file

For each file in the task's list:

1. Open the file. Add `import { useTranslation } from 'react-i18next';` if missing.
2. Inside the component, add `const { t } = useTranslation();` near the top.
3. For each Hebrew literal (find via `grep -nP '[\x{0590}-\x{05FF}]' <file>` or by referring to `scripts/hebrew-text-report.md`):
   - Decide its translation-module home (`auth`, `onboarding`, `chat`, `post`, `profile`, `settings`, `feed`, `notifications`, `moderation`, `errors`, `ui`, `general`, `common`, or `tabs`).
   - If a key already covers the literal, reuse it. Otherwise add the key to the appropriate `apps/mobile/src/i18n/locales/he/modules/<module>.ts`.
   - Replace the literal in the source file with `t('<module>.<key>')` (or nested form for grouped keys).
4. Re-grep the file to confirm zero remaining Hebrew characters in source positions (string literals, JSX text).
5. Move on to the next file.

### Key-naming convention (follow this for new keys)

- Group by feature, not by screen — but check for existing collisions before nesting. Some existing keys (e.g., `auth.signIn = 'כניסה'`) are flat strings; use a sibling key like `auth.signInScreenTitle` rather than promoting the existing string to an object (that would be a breaking rename across many call sites).
- Mirror existing nested shape where one already exists (`settings.deleteAccountModal.buttons.cancel`).
- For accessibility labels: suffix `A11y` (e.g., `chat.hideChatA11y` — existing style).
- For modal copies: use `Title` / `Body` / `Cta` suffixes if siblings already use that style; use nested `.title` / `.body` / `.cta` if siblings already use nested objects. Match what's there.
- For error messages tied to a use case: place in `errors.*` if the existing module already groups by use case; otherwise put with the feature.

### When `useTranslation` is unavailable (non-React modules)

Some files (e.g., `app/apps/mobile/app/_layout.tsx`'s `document.title` assignment at line 21) execute outside a hook context. Use the singleton:

```ts
import i18n from '../src/i18n';
// …
document.title = i18n.t('appName');
```

### Per-task verification (before commit, in every sub-PR)

```bash
cd app && pnpm typecheck && pnpm test && pnpm lint

# Hebrew presence check, scoped to this task's files:
for f in <list-of-files-this-task>; do
  if grep -lP '[\x{0590}-\x{05FF}]' "$f" >/dev/null 2>&1; then
    echo "REMAINING: $f"; grep -nP '[\x{0590}-\x{05FF}]' "$f";
  fi
done
```

Expected: zero `REMAINING:` lines except where the only Hebrew is in a comment that documents an i18n key's Hebrew text (acceptable).

### Manual smoke (mandatory per sub-PR)

Start the dev server (`cd app && pnpm --filter @kc/mobile web` or `pnpm ios`), navigate to every screen the sub-PR touched, and verify:
- No raw key like `auth.signIn.title` shows up (means key is missing).
- Hebrew text reads the same as before. Diff against the source values added to `locales/he/modules/*.ts`.

### Sub-PR commit + PR template

```bash
git add -A
git commit -m "$(cat <<'EOF'
refactor(mobile): migrate <SUB-PR SCOPE> screens to react-i18next (PR5<X>)

Pattern #1 of the Hebrew→i18n migration: replaces inline Hebrew
literals with t(...) calls. New keys added to
apps/mobile/src/i18n/locales/he/modules/*.

Spec: docs/superpowers/specs/2026-05-16-hebrew-to-i18n-design.md
PR5<X> of 5.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
git push -u origin refactor/i18n-ui-sweep-<scope>
gh pr create --base dev --head refactor/i18n-ui-sweep-<scope> --title "…" --body "…"
gh pr merge --auto --squash --delete-branch
gh pr checks --watch
git switch dev && git pull --ff-only origin dev
```

---

## Task 5 — PR5a: auth + onboarding UI sweep

**Branch:** `refactor/i18n-ui-sweep-auth-onboarding`

**Depends on:** Task 1 merged. (Independent of Tasks 2-4 — none of these files touch deleted-user / category-labels / contactPoster.)

**Files:**
- `app/apps/mobile/app/(auth)/index.tsx`
- `app/apps/mobile/app/(auth)/sign-in.tsx`
- `app/apps/mobile/app/(auth)/sign-up.tsx`
- `app/apps/mobile/app/(onboarding)/about-intro.tsx`
- `app/apps/mobile/app/(onboarding)/basic-info.tsx`
- `app/apps/mobile/app/(onboarding)/photo.tsx`
- `app/apps/mobile/app/(onboarding)/tour.tsx`
- `app/apps/mobile/app/auth/callback.tsx`
- `app/apps/mobile/app/auth/verify.tsx`

Run the shared recipe. New keys go under existing `auth.*` and `onboarding.*` blocks in `locales/he/index.ts` (these are still inline in the root file, not yet a module — extending the root file is fine for this task).

---

## Task 6 — PR5b: chat + post + edit-post UI sweep

**Branch:** `refactor/i18n-ui-sweep-chat-post`

**Depends on:** Task 1 merged. **Should land after Task 2** (some of these files were already partially edited there for category/condition labels — wait so the diff stays focused on the i18n sweep, not on conflict resolution). **Depends on Task 4** if the file `edit-post/[id].tsx` ever consumed `BuildAutoMessageUseCase` (it does not, but verify with `grep BuildAutoMessage app/apps/mobile/app/`).

**Files:**
- `app/apps/mobile/app/chat/[id].tsx`
- `app/apps/mobile/app/chat/index.tsx`
- `app/apps/mobile/app/post/[id].tsx`
- `app/apps/mobile/app/edit-post/[id].tsx`
- `app/apps/mobile/src/components/chat/ChatNotFoundView.tsx`

Run the shared recipe. New keys go under `chat.*`, `post.*` modules.

---

## Task 7 — PR5c: profile + settings + user UI sweep

**Branch:** `refactor/i18n-ui-sweep-profile-settings`

**Depends on:** Task 1 merged.

**Files:**
- `app/apps/mobile/app/(tabs)/profile/index.tsx`
- `app/apps/mobile/app/(tabs)/profile/closed.tsx`
- `app/apps/mobile/app/(tabs)/profile/removed.tsx`
- `app/apps/mobile/app/edit-profile.tsx`
- `app/apps/mobile/app/settings/follow-requests.tsx`
- `app/apps/mobile/app/settings/privacy.tsx`
- `app/apps/mobile/app/settings/report-issue.tsx`
- `app/apps/mobile/app/user/[handle]/index.tsx`
- `app/apps/mobile/app/user/[handle]/followers.tsx`
- `app/apps/mobile/app/user/[handle]/following.tsx`

Run the shared recipe. New keys go under `profile.*`, `settings.*` modules.

---

## Task 8 — PR5d: tabs + create + layout UI sweep

**Branch:** `refactor/i18n-ui-sweep-tabs-create-layout`

**Depends on:** Task 1 merged. **Should land after Task 2** (`(tabs)/create.tsx` was edited there for category/condition labels — keep the diff focused).

**Files:**
- `app/apps/mobile/app/_layout.tsx` (header titles + `document.title` — uses singleton)
- `app/apps/mobile/app/(tabs)/create.tsx`
- `app/apps/mobile/app/(tabs)/donations/_layout.tsx`
- `app/apps/mobile/app/(tabs)/donations/time.tsx`

Run the shared recipe. Header titles in `_layout.tsx` use `t('post.detailTitle')` / `t('settings.editProfileTitle')` style keys (add under `post.*` / `settings.*` if not present). `document.title` (web only) uses `i18n.t('appName')`.

---

## Task 9 — SSOT close-out

**Branch:** `chore/i18n-prod-migration-close`

**Depends on:** all Tasks 1-8 merged.

### Step 9.1 — Branch

```bash
git fetch origin && git switch dev && git pull --ff-only origin dev
git switch -c chore/i18n-prod-migration-close
```

### Step 9.2 — Final regression scan

```bash
cd app && pnpm typecheck && pnpm test && pnpm lint

# Production-code Hebrew check
grep -rlP '[\x{0590}-\x{05FF}]' \
  app/apps/mobile/app \
  app/apps/mobile/src/components \
  app/packages/domain/src \
  app/packages/application/src \
  app/packages/infrastructure-supabase/src \
  --exclude-dir=__tests__ \
  --exclude-dir=node_modules \
  | grep -v searchConstants.ts
```

Expected: zero output (or only acceptable cases — comments that quote i18n key Hebrew values, `searchConstants.ts` which is intentionally out of scope).

If lines remain that should have been migrated, fix in a follow-up PR rather than expand this close-out PR.

### Step 9.3 — Flip BACKLOG status

In `docs/SSOT/BACKLOG.md`, change the `INFRA-I18N-PROD-CODE` row Status from `🟡 In progress` to `✅ Done`.

### Step 9.4 — Add DECISIONS entry

In `docs/SSOT/DECISIONS.md`, append:

```markdown
## D-23 — Display strings live in the mobile composition root, not in domain/application/infrastructure (2026-05-16)

**Context:** The codebase had accumulated Hebrew display strings inside `packages/domain` (`CATEGORY_LABELS`, `ITEM_CONDITION_LABELS_HE`), `packages/application` (`BuildAutoMessageUseCase`), and `packages/infrastructure-supabase` (`'משתמש שנמחק'` placeholders in `mapPostRow`, `SupabaseChatRepository`, `getMyChats`). These violated CLAUDE.md §5 — domain must be pure, application has no I/O, infra must not synthesize UI strings.

**Decision:** All user-visible strings live in `apps/mobile/src/i18n/locales/he/`. Domain holds enum *keys* only (`'Furniture'`, `'New'`, …); the mobile UI looks up labels via `t(\`post.category.${cat}\`)`. Infrastructure returns `null` for absent counterparts; UI renders `t('common.deletedUser')`. The chat-auto-message template is inlined at the mobile call site via `i18n.t(...)` on the `react-i18next` singleton.

**Rationale:** Restores the Clean Architecture invariant; unblocks a future second-language bundle without re-touching the same files; reduces application surface area (deletion of `BuildAutoMessageUseCase`).

**Rollout:** 5 PRs split by architectural pattern (see `docs/superpowers/specs/2026-05-16-hebrew-to-i18n-design.md`).
```

### Step 9.5 — Sweep TECH_DEBT

In `docs/SSOT/TECH_DEBT.md`, move to "Resolved" any TD whose description mentions "hardcoded Hebrew", "labels in domain", or "display strings in infra". (Skim FE and BE Active sections.)

### Step 9.6 — Commit, push, PR, auto-merge

```bash
git add docs/SSOT/
git commit -m "$(cat <<'EOF'
docs(ssot): close Hebrew→i18n migration (BACKLOG/DECISIONS/TD)

- BACKLOG: INFRA-I18N-PROD-CODE flipped to ✅ Done
- DECISIONS: new D-23 (display strings live in mobile composition root)
- TECH_DEBT: resolved entries about hardcoded Hebrew

Spec: docs/superpowers/specs/2026-05-16-hebrew-to-i18n-design.md
Final step of 5-PR series (PR1-PR5d).

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"

git push -u origin chore/i18n-prod-migration-close

gh pr create --base dev --head chore/i18n-prod-migration-close \
  --title "docs(ssot): close Hebrew→i18n migration (BACKLOG/DECISIONS/TD)" \
  --body "$(cat <<'EOF'
## Summary
Finalizes the Hebrew→i18n production-code migration in SSOT after PR1-PR5d merged.

## Mapped to spec
- Spec: docs/superpowers/specs/2026-05-16-hebrew-to-i18n-design.md

## Changes
- BACKLOG.md: INFRA-I18N-PROD-CODE ✅
- DECISIONS.md: new D-23
- TECH_DEBT.md: resolved entries about hardcoded Hebrew

## Tests
- N/A (docs only)

## SSOT updated
- [x] BACKLOG.md
- [ ] spec/{domain}.md — N/A
- [x] TECH_DEBT.md

## Risk / rollout notes
Docs-only. Low risk.
EOF
)"

gh pr merge --auto --squash --delete-branch
gh pr checks --watch
```

---

## Parallelization notes

Once **Task 1 (PR1) is merged**, Tasks 2, 3, 4 are independent and can run in parallel — they touch disjoint files (Task 2 = domain + 7 UI consumers; Task 3 = infra + ports + null-aware UI; Task 4 = chat use case + container + contactPoster).

Tasks 5-8 (UI sweep) **should serialize after Task 2** (and Task 3 if their files overlap on `post/[id].tsx`, `(tabs)/create.tsx`, `edit-post/[id].tsx`, or the chat UI). Inside Tasks 5-8 they touch disjoint files and can also run in parallel.

If using `subagent-driven-development`, a sensible parallel batch is:
- After PR1 merges → dispatch PR2 + PR3 + PR4 in three subagents simultaneously.
- After PR2 + PR3 merge → dispatch PR5a + PR5c (no overlap with PR2/3 files) in parallel; serialize PR5b + PR5d if their files were also touched in PR2/3.

If executing inline, run PR1 → PR2 → PR3 → PR4 → PR5a/b/c/d → Task 9 sequentially; total wall time roughly 8 PR cycles.
