# SQL migrations → i18n hardening

**Status:** Draft (approved in brainstorming 2026-05-16; chose option "א" — minimal scope)
**Mapped to:** R-MVP-Core-4 (Hebrew-only MVP via `react-i18next`); follow-up to `INFRA-I18N-PROD-CODE` (`docs/superpowers/specs/2026-05-16-hebrew-to-i18n-design.md`)
**Related TD:** to be appended on PR merge

---

## 1. Problem & goal

The previous i18n pass (`INFRA-I18N-PROD-CODE`, ✅ Done) pushed all user-visible Hebrew out of TS production code, but **left Hebrew literals in SQL migrations untouched**. A scan of `supabase/migrations/*.sql` found Hebrew in 15 files, falling into four categories:

| Category | Files | Treatment |
|---|---|---|
| (A) System message `body` fallback | 0013, 0026, 0031, 0033 | **Out of scope** — documented graceful-degradation fallback; mobile FE already renders from `system_payload` |
| (B) Hardcoded user-row defaults | **0068** (`handle_new_user`) | **In scope** — only path that emits Hebrew the UI may render |
| (C) Seed data (cities, donation_categories) | 0001, 0008, 0014, 0023, 0024 | **Out of scope** — Hebrew is the data, not display text |
| (D) SQL comments | 0012, 0019, 0024, 0051, 0069, 0081 | **Out of scope** — non-user-facing |

**Goal:** eliminate (B) — the only path through which an SQL migration can put untranslatable Hebrew into the UI. After this work, no user-visible string in the database originates from a migration default.

## 2. Scope decisions

1. **(B) is the only target.** Categories (A), (C), (D) stay as they are; rationale per category is in §6 (Out of scope).
2. **Make columns nullable** rather than swap one literal for another. The "right" representation of *no display name yet* is `NULL`, with the UI applying a translated fallback at render time. This is the same pattern PR3 of `INFRA-I18N-PROD-CODE` used for deleted-user placeholders.
3. **No new "default-language" column.** Adding `display_name_en` etc. would expand schema for no benefit; the fallback is a UI concern.
4. **Onboarding remains the contract.** `onboarding_state='pending_basic_info'` already forces the user to set `display_name` and `city` before they're considered onboarded. After this PR, NULL is the legitimate transient state during that window.

## 3. Architecture (target state)

```
supabase/migrations/0084_user_basic_info_nullable.sql       (NEW)
  └── alter table users alter column display_name drop not null;
      alter table users alter column city          drop not null;
      alter table users alter column city_name     drop not null;
      -- relax CHECK to allow null OR (1..50 chars)
      replace handle_new_user() to write NULL where no signal exists

packages/domain/src/entities.ts
  └── User.displayName: string | null
  └── User.city:        string | null
  └── User.cityName:    string | null

packages/infrastructure-supabase/src/users/mapUserRow.ts
  └── pass through NULL unchanged

packages/application/src/auth/CompleteBasicInfoUseCase.ts
  └── unchanged — onboarding flow writes non-null values

apps/mobile/src/i18n/locales/he/modules/profile.ts
  └── unnamedUser: 'משתמש'
  └── cityNotSet:  '—' (or similar neutral marker)

apps/mobile/src/**           (render sites)
  └── display: user.displayName ?? t('profile.unnamedUser')
  └── city:    user.cityName    ?? t('profile.cityNotSet')
```

## 4. PR plan

Single PR (no functional split needed; all changes are tightly coupled and TypeScript-checkable).

### PR — `feat(infra,domain,mobile): allow null display_name/city; remove Hebrew DB defaults`

**Branch:** `feat/migrations-i18n-fe-be-relax-user-defaults`

#### 4.1 New migration `supabase/migrations/0084_user_basic_info_nullable.sql`

- `alter table public.users alter column display_name drop not null;`
- `alter table public.users alter column city         drop not null;` (FK to `cities` already allows NULL)
- `alter table public.users alter column city_name    drop not null;`
- Drop and re-add the existing CHECK on `display_name` so it permits NULL:
  `check (display_name is null or char_length(display_name) between 1 and 50)`
- Replace `public.handle_new_user()` (last replaced in 0068) so the INSERT writes:
  - `display_name = nullif(coalesce(picked_name, email_local), '')` — drop the `'משתמש'` tail.
  - `city = null`, `city_name = null` — drop the `'5000'`/`'תל אביב - יפו'` defaults.

#### 4.2 Domain & infra type changes

- `packages/domain/src/entities.ts`: `User.displayName: string | null`, `User.city: string | null`, `User.cityName: string | null`.
- `packages/infrastructure-supabase/src/users/mapUserRow.ts`: pass NULL through.
- `packages/infrastructure-supabase/src/users/editableProfileSupabase.ts`: read & write tolerate NULL.
- `packages/infrastructure-supabase/src/users/onboardingSupabase.ts`: still writes non-null on onboarding completion (unchanged contract).
- `packages/infrastructure-supabase/src/database.types.ts`: regenerate (or hand-edit) so `display_name`, `city`, `city_name` are `string | null`.
- `packages/infrastructure-supabase/src/posts/closureMethods.ts:154` and `mapPostRow.ts:51`: already handle `city_name?` → keep null pass-through.
- `packages/application/src/ports/IPostRepository.ts` (already `cityName: string | null`) — no change required.
- `packages/application/src/auth/UpdateProfileUseCase.ts`: accept `displayName: string | null` (or keep `string | undefined` and rely on UI to send `''` → translates to NULL in repo layer).

#### 4.3 FE i18n keys

- Add to `apps/mobile/src/i18n/locales/he/modules/profile.ts`:
  - `unnamedUser: 'משתמש'`
  - `cityNotSet:  '—'`
- Wire at every render site that displays a user's `displayName` or `cityName`:
  - Profile header, post cards, chat inbox rows, search results, closure picker, recipient callout, etc.
  - Use `??` at the render site (do not push fallback into infra — same rule as PR3 of `INFRA-I18N-PROD-CODE`).

#### 4.4 RPC compatibility audit

Hebrew defaults from 0068 are written **once at signup**. After this migration, NULL values flow through:
- `personal_activity_timeline_rpc` (0030/0044) — selects user fields; check it doesn't COALESCE the Hebrew default.
- `universal_search` (0019) — returns user rows; verify NULL-safe.
- `chat counterpart` selects (0012, 0042) — verify NULL-safe.
- `delete_account_rpc` (0029) — does not read display_name as text.
- Reports payload enrichment (0047) — verify NULL-safe.

Any RPC that previously assumed non-null is updated to return `null` through unchanged — the FE applies the fallback at render. The audit produces concrete edits in the implementation plan.

#### 4.5 Tests

- Update `mapUserRow.test.ts` to assert NULL pass-through.
- Update `onboardingSupabase` tests to assert that completion writes non-null values (existing behaviour).
- Add a unit test for `handle_new_user` covering: phone-only OTP (no email, no name in meta) → row has `display_name = null`, `city = null`, `city_name = null`.
- Update any rendering-component snapshot/unit tests to assert the fallback i18n key is used when display_name is null.
- `pnpm typecheck && pnpm test && pnpm lint` green before push.

## 5. Risks & mitigations

| Risk | Mitigation |
|---|---|
| RPC returns NULL where caller assumed non-null | TypeScript narrows; CI catches. Audit list in §4.4. |
| Existing rows in dev DB still have `'משתמש'` / `'תל אביב - יפו'` | Include a one-time backfill: `update users set display_name=null where display_name='משתמש'` etc. — gated by check that account is still `pending_basic_info` so we don't clobber legitimately-named users. |
| FE missing a render site (raw "null" shows) | Manual smoke pass on every screen that shows a user name or city. List in test plan. |
| Realtime event arrives with NULL display_name before subscriber updates | Already null-tolerant after this change; FE applies fallback. |
| Search/sort by display_name surfaces nulls last | Accept current Postgres NULLS-LAST behavior for ascending sorts; document in DECISIONS if relevant. |

## 6. Out of scope

- **System message `body` fallbacks** (0013, 0026, 0031, 0033). These are explicitly documented as graceful-degradation fallback (e.g., 0013:9-12). The mobile FE never renders them — `MessageBubble.tsx:35` routes through `system_payload.kind` to `SystemMessageBubble` which uses i18n. Touching them risks regression in clients that *do* depend on body for older payloads; reward is zero.
- **City seed data** (0001, 0008, 0023, 0024). `cities` already has `name_he` + `name_en`; backfilling `name_en` for all 1400 cities is a separate INFRA effort.
- **Donation category seed Hebrew** (0014, `label_he` column). The mobile FE does not read this column at all — it goes through `t.donationCategories` (i18n) and a `SLUG_TO_LABEL_HE` map kept as parser vocabulary. Column is effectively dead data; leave for a separate cleanup TD.
- **SQL comments in Hebrew.** Non-user-facing.
- **`categoryLabelHe` field in `searchTypes.ts`.** Surface as a new TD (FE lane): the field is UI text in the domain layer, populated from a hardcoded TS map, rendered by `LinkResultCard.tsx`. Same anti-pattern as the labels removed in `INFRA-I18N-PROD-CODE` PR2 but missed in that pass. Not in this scope.

## 7. SSOT updates (ship in the same PR)

- **`docs/SSOT/BACKLOG.md`** — add INFRA row:
  ```
  | INFRA-I18N-MIGRATIONS | Remove Hebrew literals from SQL migrations (relax NOT NULL on users.display_name/city/city_name; UI applies translated fallback) | infra | 🟡 In progress | docs/superpowers/specs/2026-05-16-migrations-i18n-hardening-design.md |
  ```
  Flip to ✅ Done on merge.
- **`docs/SSOT/DECISIONS.md`** — append:
  ```
  ## D-24 — `display_name` / `city` / `city_name` are nullable; UI applies translated fallback (2026-05-16)
  ```
  Rationale: the only way to keep an SQL migration free of user-visible Hebrew without breaking the schema's signup contract is to admit that the columns are legitimately unknown during the `pending_basic_info` window. Onboarding remains the contract that fills them.
- **`docs/SSOT/TECH_DEBT.md`** — add new TD (FE lane, next free `TD-1xx`):
  > `categoryLabelHe` (UI text) leaks into `packages/domain/src/searchTypes.ts` from a hardcoded TS map. Same anti-pattern as TD's closed by INFRA-I18N-PROD-CODE PR2 — overlooked. Replace with `categoryLabel` populated at the FE from `t.donationCategories`.

## 8. Success criteria

1. `grep -nE '[א-ת]' supabase/migrations/0068_*.sql` returns nothing inside `handle_new_user` (Hebrew only remains in comments if any).
2. `pnpm typecheck && pnpm test && pnpm lint` green on `dev`.
3. A user created via phone-only OTP has `display_name = null`, `city = null`, `city_name = null` until onboarding completes.
4. Every UI render site that previously assumed non-null now renders an i18n fallback when the value is null. Manual smoke pass green.
5. BACKLOG/DECISIONS/TECH_DEBT entries from §7 are in the merged PR.
