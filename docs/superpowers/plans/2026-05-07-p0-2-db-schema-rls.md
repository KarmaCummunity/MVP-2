# Plan — P0.2 · Database schema, RLS policies, migrations

| Field | Value |
| ----- | ----- |
| Date | 2026-05-07 |
| Branch | `feat/p0-2-db-schema-rls` |
| Status | Plan: this doc. Execution: incremental (slice-by-slice commits). |
| Mapped to SRS | Cross-cutting — every `FR-*` that mentions persistence depends on this |
| Driving constraint | The schema must be a faithful projection of `app/packages/domain/src/entities.ts` so that `@kc/infrastructure-supabase` adapters can simply map row → entity. |

---

## 1. Why decompose

The SRS has **3,343 lines** across 12 functional-requirement files and `entities.ts` defines **14 aggregates**. A single "do P0.2 in one go" change-set would be:

- impossible to review in one PR,
- impossible to verify slice-by-slice (RLS bugs in one cluster would cascade),
- a long pre-deployment freeze of every other P0/P1 stream.

The right decomposition follows the **entity-cluster** boundaries — groups of tables that share an aggregate root and a coherent RLS policy:

| Slice | Entities | RLS theme | Unblocks | Status |
| ----- | -------- | --------- | -------- | ------ |
| **P0.2.a — Foundation & Identity** | `cities` (ref), `users`, `auth_identities`, `devices`, `notification_preferences` (jsonb on `users`) | Users see all `Public`-mode rows + their own row in full; `Private`-mode rows are minimal projection unless approved follower (FR-PROFILE-003). Self-only RW on `auth_identities` and `devices`. | P0.3 (onboarding writes a real user row); also resolves TD-10 for free | ✅ applied |
| **P0.2.b — Posts core** | `posts`, `media_assets`, `recipients` | Visibility rules from PostVisibility (Public / FollowersOnly / OnlyMe). `OnlyMe` posts visible only to `owner_id = auth.uid()`. `FollowersOnly` posts require approved `follow_edges` row. | P0.4 (post CRUD) | 🟡 written, awaiting apply |
| **P0.2.c — Following & Blocking** | `follow_edges`, `follow_requests`, `blocks` | Self-write only. Blocks are bilateral — visibility predicates everywhere include `NOT EXISTS (block from row.user to viewer OR viewer to row.user)`. | P1.1, P1.4 | 🟡 written, awaiting apply |
| **P0.2.d — Chat & Messaging** | `chats`, `messages` | Both participants RW; non-participants 0 visibility. `support_thread` flag uses an admin role join. | P0.5 | 🟡 written, awaiting apply |
| **P0.2.e — Moderation** | `reports`, `moderation_queue_entries` | Reporters see own reports; admin role sees all. Queue entries admin-only. | P1.3, P2.5 | ⏳ pending |
| **P0.2.f — Stats projections + bg jobs** | counter triggers (denormalized columns on `users`), `community_stats` materialized view, scheduled job for `bg-job-soft-delete-cleanup` | Read-only for everyone on aggregates; trigger logic runs as `SECURITY DEFINER`. | P1.6, FR-CLOSURE-008 | ⏳ pending |

**Cross-cutting per slice:**
- Each slice produces a `supabase/migrations/NNNN_<slice>.sql` file.
- Each slice runs `supabase gen types typescript` and commits the regenerated `database.types.ts` (resolves TD-1 incrementally).
- Each slice updates `PROJECT_STATUS.md` §3 sprint board + §4 log.
- Each slice has its own focused PR (or commit on this branch) so review stays tractable.

## 2. Operational shape

- **No local Supabase**: the project uses the hosted Supabase project (URL + keys in `.env`). Migrations are written as plain SQL files under `supabase/migrations/`. The user applies them via:
  1. `supabase db push` (CLI, preferred — already installed at `/opt/homebrew/bin/supabase`), or
  2. The Supabase Dashboard SQL editor, pasting the migration body.
- **Type generation**: after each migration is applied, run
  `supabase gen types typescript --project-id <id> > app/packages/infrastructure-supabase/src/database.types.ts`
  and commit the result.
- **Naming**: `snake_case` for all SQL identifiers; the application-layer mapper (or repository adapters in `@kc/infrastructure-supabase`) converts to `camelCase` for the domain.
- **Time**: every table has `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`; mutable rows also `updated_at TIMESTAMPTZ` driven by a trigger.
- **Soft delete**: not used at the row level (the SRS uses status enums for "soft delete", e.g. `account_status = 'deleted'`).

## 3. P0.2.a — Foundation & Identity (this commit)

### 3.1 Files added

- `supabase/config.toml` — minimal config so `supabase` CLI can recognise the project.
- `supabase/migrations/0001_init_users.sql` — schema for `cities`, `users`, `auth_identities`, `devices`, plus indexes and RLS.
- `supabase/seed.sql` — inserts the canonical Israeli `cities` reference rows used by the city dropdown.

### 3.2 Tables

```text
cities (ref, public read)
  city_id    TEXT  PK            -- slug, e.g. 'tel-aviv'
  name_he    TEXT  NOT NULL
  name_en    TEXT  NOT NULL

users
  user_id                          UUID PK  REFERENCES auth.users(id) ON DELETE CASCADE
  auth_provider                    TEXT  NOT NULL  CHECK (auth_provider IN ('google','apple','phone','email'))
  share_handle                     TEXT  NOT NULL  UNIQUE
  display_name                     TEXT  NOT NULL  CHECK (char_length(display_name) BETWEEN 1 AND 50)
  city                             TEXT  NOT NULL  REFERENCES cities(city_id)
  city_name                        TEXT  NOT NULL                              -- denormalised for fast list rendering
  biography                        TEXT      NULL  CHECK (char_length(biography) <= 200)
  avatar_url                       TEXT      NULL
  privacy_mode                     TEXT  NOT NULL  CHECK (privacy_mode IN ('Public','Private'))  DEFAULT 'Public'
  privacy_changed_at               TIMESTAMPTZ NULL
  account_status                   TEXT  NOT NULL  CHECK (account_status IN ('pending_verification','active','suspended_for_false_reports','suspended_admin','banned','deleted')) DEFAULT 'pending_verification'
  onboarding_state                 TEXT  NOT NULL  CHECK (onboarding_state IN ('pending_basic_info','pending_avatar','completed')) DEFAULT 'pending_basic_info'
  notification_preferences         JSONB NOT NULL  DEFAULT jsonb_build_object('critical', true, 'social', true)
  is_super_admin                   BOOLEAN NOT NULL DEFAULT false
  closure_explainer_dismissed      BOOLEAN NOT NULL DEFAULT false
  first_post_nudge_dismissed       BOOLEAN NOT NULL DEFAULT false
  items_given_count                INT  NOT NULL DEFAULT 0
  items_received_count             INT  NOT NULL DEFAULT 0
  active_posts_count_internal      INT  NOT NULL DEFAULT 0
  followers_count                  INT  NOT NULL DEFAULT 0
  following_count                  INT  NOT NULL DEFAULT 0
  created_at                       TIMESTAMPTZ NOT NULL DEFAULT now()
  updated_at                       TIMESTAMPTZ NOT NULL DEFAULT now()

auth_identities
  auth_identity_id  UUID  PK DEFAULT gen_random_uuid()
  user_id           UUID  NOT NULL  REFERENCES users(user_id) ON DELETE CASCADE
  provider          TEXT  NOT NULL  CHECK (provider IN ('google','apple','phone','email'))
  provider_subject  TEXT  NOT NULL          -- the upstream `sub`
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
  UNIQUE (provider, provider_subject)

devices
  device_id     UUID  PK DEFAULT gen_random_uuid()
  user_id       UUID  NOT NULL  REFERENCES users(user_id) ON DELETE CASCADE
  platform      TEXT  NOT NULL  CHECK (platform IN ('ios','android','web'))
  push_token    TEXT  NOT NULL
  last_seen_at  TIMESTAMPTZ NOT NULL DEFAULT now()
  active        BOOLEAN NOT NULL DEFAULT true
  UNIQUE (push_token)
```

### 3.3 Triggers

- `set_updated_at()` on `users` — bumps `updated_at = now()` on every UPDATE.
- `users_default_share_handle()` on `users` BEFORE INSERT — if `share_handle` is NULL, generate `u_<short id>`.

### 3.4 RLS policies (this slice only)

- `cities`: `ENABLE RLS`; SELECT to `anon, authenticated`. No write policy → CLI / migrations only.
- `users`:
  - `ENABLE RLS`.
  - SELECT for everyone (`anon, authenticated`) of public columns when `privacy_mode = 'Public' AND account_status = 'active'`. (This is the "public profile" projection — followers list, post owner header, etc. Counters are public per FR-PROFILE-013.)
  - SELECT of own row (all columns) when `auth.uid() = user_id`.
  - SELECT for `Private` rows when `auth.uid() = user_id`. Approved-follower visibility is added in P0.2.c (it depends on `follow_edges`).
  - UPDATE on own row (all columns except `user_id`, `share_handle`, `auth_provider`, `is_super_admin`, counters).
  - INSERT: only via the `handle_new_user()` trigger from `auth.users` insert (see §3.5). No direct client INSERT.
  - DELETE: blocked at the policy layer; account deletion runs through `FR-AUTH-016` (status flip + 30-day cooldown), implemented in a later slice.
- `auth_identities`: `ENABLE RLS`; SELECT/INSERT/DELETE only when `auth.uid() = user_id`.
- `devices`: `ENABLE RLS`; SELECT/INSERT/UPDATE/DELETE only when `auth.uid() = user_id`.

### 3.5 Bridge to `auth.users`

The Supabase Auth flow creates rows in `auth.users`. We need a matching row in `public.users` so the rest of the app can join on it. This slice adds:

```sql
-- after-insert trigger on auth.users that seeds public.users with safe defaults
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER ...
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users ...
```

The trigger:
1. Reads `NEW.raw_user_meta_data` (Google's `full_name`, `avatar_url`) and `NEW.app_metadata` (provider).
2. INSERTs `public.users` with `display_name = COALESCE(meta.full_name, meta.name, split_part(email,'@',1), 'משתמש')`, `avatar_url = COALESCE(meta.avatar_url, meta.picture)`, `auth_provider = COALESCE(app_metadata.provider, 'email')`, default city `'tel-aviv'`, `onboarding_state = 'pending_basic_info'`.
3. INSERTs `public.auth_identities` with `provider, provider_subject = NEW.id`.

This means: from the moment a Google sign-in completes, there is a real `public.users` row reflecting the SSO identity — onboarding (P0.3) merely flips `onboarding_state` to `completed` after the user adjusts the prefilled fields.

### 3.6 Verification (manual steps for the operator)

After the migration is applied:

1. Sign in with a fresh Google account on the dev preview.
2. Inspect via the Supabase SQL editor: `SELECT user_id, display_name, avatar_url, auth_provider, onboarding_state FROM public.users ORDER BY created_at DESC LIMIT 1;` — there should be a row with the Google name + photo.
3. Inspect: `SELECT provider, provider_subject FROM public.auth_identities WHERE user_id = '<id>';` — one row.
4. Re-sign-in: no duplicate row in `public.users` (the trigger only fires on auth.users INSERT; subsequent sign-ins reuse the row).

### 3.7 Tech-debt resolutions in this slice

- TD-1 partially closed (real schema for users + identities → `database.types.ts` regenerates with non-`any` types for these tables).
- Sets up the foundation that lets TD-10 close in P0.2.b/c (once `Profile` columns are read end-to-end, the AuthSession fields demote to first-render fallback).

## 4. Subsequent slices — short outline

(Each gets its own design doc in `docs/superpowers/specs/` when started.)

- **P0.2.b — Posts core**: depends on §3 and on the cluster of FR-POST-* / FR-FEED-001…005. Will introduce `media_assets` storage bucket policies and the visibility predicate function `is_post_visible_to(post_id, viewer_id)` used by feed RLS.
- **P0.2.c — Following & Blocking**: introduces `is_blocked(a, b)` helper; updates `users` RLS to allow `Private` profile expansion when an approved follow edge exists.
- **P0.2.d — Chat & Messaging**: needs the post-anchor visibility rule (FR-CHAT-004); adds Realtime channel scoping.
- **P0.2.e — Moderation**: leverages `is_super_admin` already on `users`.
- **P0.2.f — Stats projections**: counter triggers tied to all post/follow/recipient mutations.

## 5. Out of scope (kept for future slices)

- Rate-limiting / throttling at the DB layer (will live in Edge Functions).
- Full-text search indexes (P1.2 territory).
- Storage bucket creation (lives in P0.2.b once `media_assets` arrives).
- Backfill of `share_handle` collision resolution beyond the trigger's first attempt — handled in onboarding wizard (FR-AUTH-010) via "rename if collides".

## 6. Exit criteria for this commit

- `supabase/migrations/0001_init_users.sql` written and reviewed for SQL correctness.
- `supabase/seed.sql` written with a starter set of Israeli cities.
- `supabase/config.toml` present so `supabase` CLI can run.
- Plan + design entries in `docs/superpowers/`.
- `PROJECT_STATUS.md` §3 reflects "P0.2.a in progress" and §4 logs an entry.
- `database.types.ts` regeneration is documented but **deferred to the operator** (requires CLI auth against the live project — cannot be done from here without credentials).
