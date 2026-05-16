# Hebrew → i18n migration (production code)

**Status:** Draft (approved in brainstorming 2026-05-16)
**Mapped to:** R-MVP-Core-4 (Hebrew-only MVP via `react-i18next`), CLAUDE.md §5 (Clean Architecture invariants)
**Related TD:** (to be appended once `TECH_DEBT.md` is updated)
**Source report:** `scripts/hebrew-text-report.md` (175 files scanned; ~30 production-code files in scope)

---

## 1. Problem & Goal

Production code currently embeds Hebrew string literals inline across the mobile UI, the domain layer, the application layer, and the Supabase infrastructure layer. This:

- Bypasses the existing `react-i18next` infrastructure (`apps/mobile/src/i18n/locales/he/`) that ~84 mobile files already use.
- Violates the Clean Architecture invariant (CLAUDE.md §5): `domain` and `application` must not contain user-visible display strings; `infrastructure-supabase` must not synthesize UI fallbacks.
- Makes future multi-language support impossible without a second migration pass.

**Goal:** Migrate all Hebrew strings in production code to `react-i18next` keys, and push display-string responsibilities out of `domain` / `application` / `infrastructure-supabase` to the mobile composition root. Tests, archived docs, and `searchConstants.ts` parser vocabulary are explicitly out of scope.

## 2. Decisions (from brainstorming 2026-05-16)

1. **Scope = production code only.** Tests may continue to use Hebrew fixture data. `docs/SSOT/archive/**` and `PRD_V2_NOT_FOR_MVP/**` are legacy and out of scope. `CLAUDE.md`'s embedded Hebrew error template is agent-facing, out of scope. `Info.plist` is deferred to an optional follow-up PR.
2. **`searchConstants.ts` stays.** Its Hebrew↔slug map is query-parsing vocabulary, not display text.
3. **Domain enum labels move out.** `CATEGORY_LABELS` and `ITEM_CONDITION_LABELS_HE` are deleted from `packages/domain/src/value-objects.ts`. Enum keys (`'Furniture'`, `'New'`, …) stay; mobile callers look up labels via `t('post.category.${cat}')` and `t('post.condition.${cond}')`.
4. **Deleted-user placeholder moves out.** `mapPostRow`, `SupabaseChatRepository`, and `getMyChats` return `ownerName: string | null` / `peerDisplayName: string | null`. The mobile UI renders `t('common.deletedUser')` when the field is `null`. The Hebrew comment in `domain/src/entities.ts` is translated to English.
5. **`BuildAutoMessageUseCase` is deleted.** The use case is one line of trivial string interpolation with a single mobile caller (`apps/mobile/src/lib/contactPoster.ts`). It does not justify an application-layer abstraction. The caller invokes `t('chat.autoMessage.initial', { title })` directly. Its test file is deleted (the surviving behavior is a pure i18n template).
6. **PR split by architectural pattern, not by screen.** Six PRs (one deferred): infra-only keys first, then each architectural cleanup, then the bulk UI sweep. Avoids re-touching the same files multiple times.

## 3. Architecture (target state)

```
packages/domain/src/value-objects.ts
  └── ITEM_CONDITIONS[], ALL_CATEGORIES[]        // enums only, zero Hebrew
  └── (CATEGORY_LABELS, ITEM_CONDITION_LABELS_HE)  // DELETED

packages/application/src/chat/
  └── BuildAutoMessageUseCase.ts                // DELETED
  └── __tests__/BuildAutoMessageUseCase.test.ts // DELETED

packages/infrastructure-supabase/src/
  ├── posts/mapPostRow.ts          → ownerName: string | null
  ├── chat/SupabaseChatRepository  → peerDisplayName: string | null
  └── chat/getMyChats              → peerDisplayName: string | null

apps/mobile/
  ├── src/i18n/locales/he/modules/
  │   ├── common.ts        (NEW)   → deletedUser
  │   ├── post.ts          (EXT)   → category.*, condition.*
  │   └── chat.ts          (EXT)   → autoMessage.initial
  ├── src/lib/contactPoster.ts    → uses t() directly (no use case dep)
  ├── src/lib/container.ts        → BuildAutoMessageUseCase removed
  └── app/**, src/components/**   → useTranslation() everywhere a literal was
```

## 4. Patterns in scope (taxonomy)

| # | Pattern | Files | Treatment |
|---|---------|-------|-----------|
| 1 | Inline UI literals | ~27 screens in `apps/mobile/app/**` + `src/components/chat/ChatNotFoundView.tsx` | `useTranslation()` + `t('…')` |
| 2 | Domain label maps | `domain/value-objects.ts` + 7 consumers (`PostCard*.tsx`, `FiltersSection.tsx`, `post/[id].tsx`, `create.tsx`, `edit-post/[id].tsx`) | Delete maps from domain; callers use `t(\`post.category.${cat}\`)` |
| 3 | `'משתמש שנמחק'` placeholder | `entities.ts` (comment), `getMyChats.ts`, `SupabaseChatRepository.ts` (×2), `mapPostRow.ts` | Infra returns `null`; UI renders `t('common.deletedUser')`. The Hebrew comment in `entities.ts` is translated to English. The privacy-text occurrence in `locales/he/modules/settings.ts` interpolates the label via `{{deletedUserLabel}}` instead of hardcoding the same Hebrew string twice — a single source of truth for the label, even when it appears quoted inside another translation string. |
| 4 | Auto chat-message template | `application/chat/BuildAutoMessageUseCase.ts` + test + container + caller | Delete use case; caller uses `t('chat.autoMessage.initial', { title })` |
| 5 | iOS permission strings | `Info.plist` | **Deferred** to optional PR6 (native iOS `InfoPlist.strings` mechanism) |
| 6 | Hebrew↔slug parser vocabulary | `infrastructure-supabase/src/search/searchConstants.ts` | **Out of scope** — this is data, not display |

## 5. PR plan

All PRs target `dev`. Each runs `pnpm typecheck && pnpm test && pnpm lint` from `app/` before push.

### PR1 — i18n keys + module split (infra-only, no behavior change)

- Add `apps/mobile/src/i18n/locales/he/modules/common.ts` with `{ deletedUser: 'משתמש שנמחק' }`.
- Extend `apps/mobile/src/i18n/locales/he/modules/post.ts` with `category: { Furniture: 'רהיטים', … }` and `condition: { New: 'חדש', … }`.
- Extend `apps/mobile/src/i18n/locales/he/modules/chat.ts` with `autoMessage: { initial: 'היי! ראיתי את הפוסט שלך על {{title}}. אשמח לדעת עוד.' }`.
- Update `locales/he/index.ts` to wire `common` into the root tree.
- Update `locales/he/modules/settings.ts` so the privacy-text occurrence of `"משתמש שנמחק"` is sourced via interpolation `{{deletedUserLabel}}` (caller passes `t('common.deletedUser')`).
- **No consumer changes.** All new keys are unused until later PRs. Verify with `pnpm typecheck && pnpm test`.
- **Blocks:** PR2, PR3, PR4, PR5.

### PR2 — Remove domain label maps (Pattern #2)

- Delete `CATEGORY_LABELS` and `ITEM_CONDITION_LABELS_HE` exports from `packages/domain/src/value-objects.ts`.
- Update consumers:
  - `apps/mobile/src/components/PostCard.tsx`, `PostCardGrid.tsx`, `PostCardProfile.tsx` → `t(\`post.category.${post.category}\`)`.
  - `apps/mobile/src/components/PostFilterSheet/FiltersSection.tsx` → same.
  - `apps/mobile/app/post/[id].tsx`, `app/(tabs)/create.tsx`, `app/edit-post/[id].tsx` → both maps replaced.
- Audit `__tests__` for any test that imports the deleted exports; update or remove.
- **Risk:** test files may snapshot the old labels. Mitigation: typecheck will flag every consumer.
- **Depends on:** PR1.

### PR3 — Deleted-user placeholder (Pattern #3)

- Change return types in `packages/infrastructure-supabase`:
  - `posts/mapPostRow.ts`: `ownerName: string | null` (no longer defaults to Hebrew).
  - `chat/SupabaseChatRepository.ts`: `peerDisplayName: string | null` (both occurrences).
  - `chat/getMyChats.ts`: same.
- Translate the Hebrew comment in `packages/domain/src/entities.ts` (line ~100) to English.
- Update UI consumers to render `t('common.deletedUser')` when the field is `null`. Use `??` at the render site; do not push the fallback back into infra.
- Verify `mapPostRow.test.ts` and chat rowMappers tests with the new `null` contract.
- **Risk:** changing the return-type contract is a small breaking change inside the monorepo. Mitigation: TypeScript catches every caller.
- **Depends on:** PR1.

### PR4 — Delete `BuildAutoMessageUseCase` (Pattern #4)

- Delete `packages/application/src/chat/BuildAutoMessageUseCase.ts` and its test.
- Remove the export from `packages/application/src/index.ts`.
- Remove the `buildAutoMessage` field and its construction from `apps/mobile/src/lib/container.ts`.
- Update `apps/mobile/src/lib/contactPoster.ts`:
  - Remove `container.buildAutoMessage.execute(...)`.
  - Replace with `t('chat.autoMessage.initial', { title: post.title.trim() })` (use `useTranslation` if it is a hook context, or `i18n.t` from `apps/mobile/src/i18n/index.ts` if it is a non-React module).
- **Depends on:** PR1.

### PR5 — UI sweep (Pattern #1)

Convert all inline Hebrew literals in `apps/mobile/app/**` and `apps/mobile/src/components/**` to `t('…')` calls. Add keys to the appropriate `modules/*.ts` file as you go (reuse existing groupings: `auth`, `onboarding`, `chat`, `post`, `profile`, `settings`, `feed`, `notifications`, `moderation`, `errors`, `ui`, `general`).

Split into sub-PRs if the diff exceeds ~600 LOC of churn:

- **PR5a** — auth + onboarding screens (`app/(auth)/**`, `app/(onboarding)/**`, `app/auth/**`).
- **PR5b** — chat + post + edit-post (`app/chat/**`, `app/post/**`, `app/edit-post/**`, `ChatNotFoundView.tsx`).
- **PR5c** — profile + settings + user (`app/(tabs)/profile/**`, `app/settings/**`, `app/user/**`, `app/edit-profile.tsx`).
- **PR5d** — tabs + create + layout (`app/(tabs)/create.tsx`, `app/(tabs)/donations/**`, `app/_layout.tsx`).

Each sub-PR is independently mergeable.

**Depends on:** PR1 (always), PR2 (if the sub-PR touches files that consumed the label maps), PR3 (if it touches deleted-user fallback sites), PR4 (if it touches `contactPoster.ts`).

### PR6 — `Info.plist` (deferred, optional)

Move iOS permission strings from `Info.plist` to `InfoPlist.strings` under `he.lproj/`. Not blocking. Open as a separate INFRA ticket if/when iOS localization is rationalized.

## 6. Verification

Per-PR gates (CLAUDE.md §6 pre-push):

```bash
cd app
pnpm typecheck
pnpm test
pnpm lint
```

Regression scanning after each PR:

```bash
# Re-run the same scanner that produced scripts/hebrew-text-report.md.
# After PR5d, app/apps/mobile/app/**, app/apps/mobile/src/components/**,
# app/packages/domain/**, app/packages/application/** (non-test),
# and app/packages/infrastructure-supabase/** (non-test) should contain
# zero Hebrew lines.
```

**Manual smoke** after PR5 sub-PRs: open each touched screen in the running mobile app, verify no key strings like `auth.signIn` are rendered raw (would indicate a missing translation).

**Out-of-scope, deferred to a follow-up TD:** an automated lint rule that flags inline Hebrew literals outside `locales/`. Tracked as a new TD in `TECH_DEBT.md` (see §8).

## 7. Edge cases & risks

- **Test fixtures using deleted enum labels.** Mitigation: PR2 runs `pnpm test` before push; failing tests get inline updates.
- **Non-React contexts that need translation** (e.g., `contactPoster.ts` if it is not a hook). Mitigation: use `import i18n from '@/i18n'; i18n.t(...)` (the singleton already exists at `apps/mobile/src/i18n/index.ts`).
- **Interpolation placeholder mismatches.** Mitigation: `react-i18next` will surface missing-variable warnings in dev; verify at smoke time.
- **Privacy text in `settings.ts` referencing "משתמש שנמחק".** Treated as user-visible content that intentionally quotes the placeholder label. PR1 sources the quoted label via interpolation so a future label rename ripples once.
- **`null` ownerName in feed/profile/post detail.** Every UI consumer must handle `null` — the typechecker enforces this. A `null` value renders as `t('common.deletedUser')` at the call site.
- **iOS `Info.plist` strings remain Hebrew** after PR6 is deferred. Acceptable for Hebrew-only MVP per R-MVP-Core-4.

## 8. SSOT updates (ship with the PRs)

- **`docs/SSOT/BACKLOG.md`** — add INFRA row:
  ```
  | INFRA-I18N-PROD-CODE | Migrate inline Hebrew in production code to react-i18next; remove display strings from domain/application/infrastructure-supabase | infra | 🟡 In progress | docs/superpowers/specs/2026-05-16-hebrew-to-i18n-design.md |
  ```
  Flip to ✅ Done after PR5d (or PR5 if not split) merges. PR6 is tracked independently.
- **`docs/SSOT/DECISIONS.md`** — append:
  ```
  ## D-23 — Display strings live in the mobile composition root, not in domain/application/infrastructure (2026-05-16)
  ```
  Rationale: clean-architecture compliance + future-language readiness. Records the deletion of `CATEGORY_LABELS`, `ITEM_CONDITION_LABELS_HE`, `BuildAutoMessageUseCase`, and the `ownerName: string | null` infra contract.
- **`docs/SSOT/TECH_DEBT.md`** — close any pre-existing TD referencing "hardcoded Hebrew" or "labels in domain". Add new TD (FE lane, next free `TD-1xx`): "Automated lint rule that flags inline Hebrew literals outside `apps/mobile/src/i18n/locales/`".

## 9. Out of scope

- Tests (`__tests__/**`) — Hebrew fixture data stays.
- `docs/SSOT/archive/**`, `PRD_V2_NOT_FOR_MVP/**` — legacy/non-MVP docs.
- `CLAUDE.md` Hebrew agent template — agent-facing, not user-facing.
- `infrastructure-supabase/src/search/searchConstants.ts` — query-parser vocabulary.
- iOS `Info.plist` — deferred to optional PR6.
- Adding a second language. Migration unblocks it, but no `en/` bundle is built here.
- Automated lint rule for Hebrew-literal detection. Tracked as new TD (§8); not in this scope.

## 10. Success criteria

1. The Hebrew-scanner report contains **zero** entries under `app/apps/mobile/app/**`, `app/apps/mobile/src/components/**`, `app/packages/domain/src/**` (non-test), `app/packages/application/src/**` (non-test), and `app/packages/infrastructure-supabase/src/**` (non-test).
2. `CATEGORY_LABELS`, `ITEM_CONDITION_LABELS_HE`, and `BuildAutoMessageUseCase` no longer exist in the repo.
3. `pnpm typecheck && pnpm test && pnpm lint` are green on `dev` after every PR.
4. A manual smoke pass of every touched mobile screen renders translated text (no raw `auth.signIn`-style keys).
5. `BACKLOG.md`, `DECISIONS.md`, and `TECH_DEBT.md` reflect the work as specified in §8.
