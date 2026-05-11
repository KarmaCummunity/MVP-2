> ⚠️ **Frozen historical plan** — written under the pre-2026-05-11 SSOT scheme. References to `PROJECT_STATUS.md` / `HISTORY.md` in the body below are obsolete; see [`CLAUDE.md`](../../../CLAUDE.md) for the current convention.

# Delete Account (V1) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the existing "Delete account" button in settings to a real, immediate, full-cleanup deletion flow that frees the user's email/Google identity for re-signup, retains chats on the counterpart side as "משתמש שנמחק", and blocks suspended/banned users from evading moderation.

**Architecture:** Two migrations (chats FK → SET NULL + RLS NULL-safe rewrites; `delete_account_data` SECURITY DEFINER RPC + audit CHECK extension), one Edge Function orchestrating RPC → storage → `auth.admin.deleteUser`, a single application use case + new error class, a new repository port method, one UI modal with five internal states (incl. non-dismissible error_critical), and a brief success overlay. No domain layer changes.

**Tech Stack:** TypeScript 5.5, vitest, `@supabase/supabase-js@^2.45`, Postgres + RLS, Supabase Edge Functions (Deno), React Native + expo-router, Zustand, react-i18next. No new runtime deps.

**Branch:** Continue on the existing worktree branch `claude/priceless-nightingale-bc8397`. The design spec is already committed there (`46ea986`).

**Spec:** [`docs/superpowers/specs/2026-05-11-delete-account-design.md`](../specs/2026-05-11-delete-account-design.md)

**SRS coverage:**
- FR-SETTINGS-012 — partial implementation (V1; AC2.c soft-delete + AC2.d cooldown + AC3 purge + AC4 email deferred to V1.1).
- AC1 satisfied via warning modal + typed confirmation ("מחק").
- New behavior (Q5): suspended/banned users cannot self-delete — documented as AC8 addition in SRS update.

**Out of scope** (logged as new TDs at end of plan):
- TD-50..99 (BE): orphan storage cleanup cron for `post-images` (V1.1 — public bucket → privacy leak risk).
- V1.1: DeletedIdentifier cooldown table (FR-AUTH-016), deletion confirmation email (FR-NOTIF-012), soft-delete + 30-day purge cron, recovery/undo window.

---

## File Structure

| Path | Purpose | Status |
| ---- | ------- | ------ |
| `supabase/migrations/00XX_chats_participant_set_null.sql` | Drop NOT NULL, change cascade → SET NULL, add CHECK, rewrite RLS functions/policies NULL-safe. Number assigned at PR time. | **Create** |
| `supabase/migrations/00XX_delete_account_rpc.sql` | Extend `audit_events.action` CHECK; create `delete_account_data()` RPC; revoke from public + grant authenticated. | **Create** |
| `supabase/functions/delete-account/cors.ts` | CORS headers + `jsonResponse` helper (lifted from `validate-donation-link`). | **Create** |
| `supabase/functions/delete-account/auth.ts` | `getAuthedUser(req)` helper — server-side JWT verification via `userClient.auth.getUser()`. | **Create** |
| `supabase/functions/delete-account/index.ts` | Main Edge Function. Orchestrates RPC → storage → `auth.admin.deleteUser`. | **Create** |
| `app/packages/application/src/auth/errors.ts` | Append `DeleteAccountError` class + `DeleteAccountErrorCode` type. | **Modify** |
| `app/packages/application/src/auth/DeleteAccountUseCase.ts` | Single-method use case. | **Create** |
| `app/packages/application/src/auth/__tests__/DeleteAccountUseCase.test.ts` | TDD coverage. | **Create** |
| `app/packages/application/src/auth/__tests__/fakeUserRepositoryForDeleteAccount.ts` | Minimal in-test fake covering `deleteAccountViaEdgeFunction`. | **Create** |
| `app/packages/application/src/ports/IUserRepository.ts` | Add `deleteAccountViaEdgeFunction(): Promise<void>` to interface; mark old `delete(userId)` as `@deprecated` (V1). | **Modify** |
| `app/packages/application/src/auth/index.ts` | Re-export `DeleteAccountUseCase`, `DeleteAccountError`. (Create if missing.) | **Modify/Create** |
| `app/packages/infrastructure-supabase/src/users/SupabaseUserRepository.ts` | Implement `deleteAccountViaEdgeFunction()` — invoke Edge Function, map errors. | **Modify** |
| `app/packages/infrastructure-supabase/src/chat/rowMappers.ts:13` | Loosen `participantIds` typing to `[string \| null, string \| null]`. | **Modify** |
| `app/packages/application/src/ports/IChatRepository.ts` | Update `Chat.participantIds` type to nullable; sync downstream signatures. | **Modify** |
| `app/apps/mobile/src/i18n/he.ts` | Add `settings.deleteAccountModal.*` key group. | **Modify** |
| `app/apps/mobile/src/components/DeleteAccountConfirmModal.styles.ts` | Stylesheet co-located with the modal. | **Create** |
| `app/apps/mobile/src/components/DeleteAccountConfirmModal.tsx` | Modal with five states (idle, ready, submitting, error_recoverable, error_critical, blocked_suspended). | **Create** |
| `app/apps/mobile/src/components/DeleteAccountSuccessOverlay.tsx` | Full-screen overlay shown 1.5s after success. | **Create** |
| `app/apps/mobile/app/settings.tsx:169` | Wire `onPress` + mount modal + handle result → signOut → router.replace. | **Modify** |
| `app/apps/mobile/src/services/userComposition.ts` | Add `getDeleteAccountUseCase()` singleton getter (mirrors `getUpdateProfileUseCase()`). | **Modify** |
| `docs/SSOT/SRS/02_functional_requirements/11_settings.md` | Append V1 note + AC8 (suspended block) to FR-SETTINGS-012. | **Modify** |
| `docs/SSOT/PROJECT_STATUS.md` | Last Updated date; sprint-board row. | **Modify** |
| `docs/SSOT/HISTORY.md` | Append top entry. | **Modify** |
| `docs/SSOT/TECH_DEBT.md` | Open TD entry for orphan storage cleanup + V1.1 items. | **Modify** |

---

## Pre-flight

- [ ] **Step 0.1: Verify worktree state**

```bash
git status
git branch --show-current
git log -1 --oneline
```

Expected: tree clean; branch is `claude/priceless-nightingale-bc8397`; latest commit is the revised spec `46ea986`.

- [ ] **Step 0.2: Install deps + sync with main**

```bash
git fetch origin main
git pull --rebase origin main
pnpm install
```

Expected: rebase succeeds (no conflicts on the spec commit); install completes.

- [ ] **Step 0.3: Baseline checks pass**

```bash
pnpm --filter @kc/application test --run
pnpm --filter @kc/mobile typecheck
```

Expected: all existing tests pass; typecheck clean.

- [ ] **Step 0.4: Identify next available migration number**

```bash
ls supabase/migrations/ | tail -5
```

Note the highest number `00XX` you see. The two new migrations will be `00YY` and `00ZZ` where YY = XX+1 and ZZ = YY+1. Use these consistently throughout the plan.

- [ ] **Step 0.5: Verify pre-implementation assumptions (Spec §3.0)**

Run each check and record the result:

```bash
# Check 1: handle_new_user trigger
grep -n "handle_new_user" supabase/migrations/*.sql
```

Expected: at least one CREATE TRIGGER or CREATE FUNCTION result. If missing → STOP and flag to user.

```bash
# Check 2: audit_events.action consumers (exhaustive switch could break)
grep -rn "action.*===.*'block_user'\|action.*===.*'report_target'" app/ 2>/dev/null
```

Expected: a small set of admin/dev-only screens. None should do `default: assertNever(action)` — if any does, we need to update it alongside our new value.

```bash
# Check 3: 401 interceptor in supabase client
grep -rn "401\|onAuthStateChange" app/apps/mobile/src/lib/supabase* 2>/dev/null
```

Expected: at least an `onAuthStateChange` listener that handles SIGNED_OUT. If nothing → not a blocker; log as future TD.

```bash
# Check 4: storage bucket names
grep -i "bucket\|storage.from" supabase/migrations/*.sql | head -10
grep -rn "storage.from(" app/packages/infrastructure-supabase/src/ | head -10
```

Expected: confirm `post-images` and `avatars` buckets exist and are referenced by the names used in the spec.

```bash
# Check 5: all RLS policies referencing chat participants
grep -rn "participant_a\|participant_b" supabase/migrations/*.sql | grep -iE "policy|using|with check|function|trigger" | head -40
```

Expected: a complete list — copy into the PR description so reviewers can verify M1 covers them all.

If any check produces a blocker, stop and discuss with the user before continuing.

---

## Phase A: SRS paper-trail (before any code)

### Task A.1: Append V1 note to FR-SETTINGS-012

**Files:**
- Modify: `docs/SSOT/SRS/02_functional_requirements/11_settings.md`

- [ ] **Step A.1.1: Insert V1 note**

Open the file and locate FR-SETTINGS-012. Right before the "Related" / "Change Log" trailer of FR-SETTINGS-012, append the following block:

```markdown
**V1 implementation note (P1.x portion of P2.2):**
V1 ships as **immediate hard-deletion** rather than soft-delete + cooldown. The user's `auth.users` row is removed so the email / Google identity is freed for re-signup as a **new** account. Chats are retained on the counterpart side via `chats.participant_a/b` → `on delete set null` (migration 00YY), with the deleted side rendered as "משתמש שנמחק". A typed confirmation step ("מחק") satisfies the spirit of AC1 without forcing display-name entry on RTL mobile.

The following AC items are **deferred to V1.1**:
- AC2.c (soft-delete + anonymization of `User` row)
- AC2.d (`DeletedIdentifier` cooldown — FR-AUTH-016)
- AC3 (30-day hard-purge cron)
- AC4 (deletion confirmation email — FR-NOTIF-012)

**New AC8 — Suspended/banned users cannot self-delete.**
If `account_status in ('suspended_for_false_reports','suspended_admin','banned')` the RPC returns `suspended` and the modal shows a blocked-state with copy directing the user to dispute through reports. Prevents moderation evasion until FR-AUTH-016 cooldown lands.
```

Then append a change-log line at the bottom of the file:

```markdown
| 0.3 | 2026-05-11 | FR-SETTINGS-012: V1 note + AC8 (suspended block). |
```

- [ ] **Step A.1.2: Commit**

```bash
git add docs/SSOT/SRS/02_functional_requirements/11_settings.md
git commit -m "$(cat <<'EOF'
docs(srs): FR-SETTINGS-012 V1 note + AC8 (suspended block)

Documents the V1 pragmatic deletion (immediate hard-delete + chat
retention via FK set-null) and the new AC8 blocking suspended /
banned users from self-deletion to prevent moderation evasion.
Cooldown / purge / email deferred to V1.1.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Phase B: Migration 1 — chats FK + RLS NULL-safe

### Task B.1: Write migration 1

**Files:**
- Create: `supabase/migrations/00YY_chats_participant_set_null.sql`

- [ ] **Step B.1.1: Create the migration file**

Replace `00YY` below with the actual number from Step 0.4.

```sql
-- 00YY_chats_participant_set_null | P2.2 — FR-SETTINGS-012 V1 prep
-- Make chats survive participant deletion by changing the FK action to
-- SET NULL, allow NULL columns, and rewrite every RLS predicate that
-- compares against (participant_a, participant_b) to be NULL-safe.
-- Without these RLS rewrites, the surviving participant loses access
-- to the chat once the other side is deleted (NULL poisons IN/NOT IN).

set search_path = public;

-- ── 1. Relax columns + change cascade action ────────────────────────────────
alter table public.chats alter column participant_a drop not null;
alter table public.chats alter column participant_b drop not null;

alter table public.chats drop constraint if exists chats_participant_a_fkey;
alter table public.chats drop constraint if exists chats_participant_b_fkey;
alter table public.chats
  add constraint chats_participant_a_fkey
  foreign key (participant_a) references public.users(user_id) on delete set null;
alter table public.chats
  add constraint chats_participant_b_fkey
  foreign key (participant_b) references public.users(user_id) on delete set null;

-- ── 2. CHECK: at least one side alive (no orphan rows) ──────────────────────
alter table public.chats
  add constraint chats_at_least_one_participant
  check (participant_a is not null or participant_b is not null);

-- ── 3. Update chats_canonical_order to be NULL-safe ────────────────────────-
alter table public.chats drop constraint if exists chats_canonical_order;
alter table public.chats
  add constraint chats_canonical_order
  check (participant_a is null or participant_b is null or participant_a < participant_b);

-- ── 4. NULL-safe rewrite of is_chat_visible_to (replaces 0005 version) ─────-
create or replace function public.is_chat_visible_to(p_chat public.chats, p_viewer uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case
    when p_viewer is null then false
    when p_viewer is distinct from p_chat.participant_a
     and p_viewer is distinct from p_chat.participant_b then false
    when p_chat.removed_at is not null then false
    when public.has_blocked(
      p_viewer,
      case
        when p_viewer = p_chat.participant_a then p_chat.participant_b
        else p_chat.participant_a
      end
    ) then false
    else true
  end;
$$;

-- ── 5. NULL-safe rewrite of messages_insert_user policy ─────────────────────
-- 0004:284 uses `auth.uid() in (c.participant_a, c.participant_b)` which is
-- NULL-poisoned. Rewrite via OR of equalities (NULL = uuid yields NULL,
-- the OR can still be TRUE on the live side).
drop policy if exists messages_insert_user on public.messages;
create policy messages_insert_user on public.messages
  for insert
  to authenticated
  with check (
    kind = 'user'
    and exists (
      select 1 from public.chats c
      where c.chat_id = messages.chat_id
        and c.removed_at is null
        and (auth.uid() = c.participant_a or auth.uid() = c.participant_b)
    )
    and sender_id = auth.uid()
  );

-- ── 6. NULL-safe rewrite of messages_update_status_recipient policy ────────-
drop policy if exists messages_update_status_recipient on public.messages;
create policy messages_update_status_recipient on public.messages
  for update
  to authenticated
  using (
    exists (
      select 1 from public.chats c
      where c.chat_id = messages.chat_id
        and (auth.uid() = c.participant_a or auth.uid() = c.participant_b)
    )
  )
  with check (
    exists (
      select 1 from public.chats c
      where c.chat_id = messages.chat_id
        and (auth.uid() = c.participant_a or auth.uid() = c.participant_b)
    )
  );

-- ── 7. NULL-safe rewrite of chats_insert_self policy ────────────────────────
drop policy if exists chats_insert_self on public.chats;
create policy chats_insert_self on public.chats
  for insert
  to authenticated
  with check (
    auth.uid() = participant_a or auth.uid() = participant_b
  );

-- ── 8. chats_select_visible already delegates to is_chat_visible_to (0004:247);
--      the function rewrite at step 4 makes it NULL-safe automatically. No-op.
--      Same for messages_select_visible (0004:265). No-op.

-- Migration is non-destructive: existing chat rows keep both participants
-- non-null until an account deletion sets one to NULL.
```

- [ ] **Step B.1.2: Sanity-check the SQL syntactically (no DB run yet)**

```bash
# A cheap check that the file parses — match against the supabase CLI lint
pnpm dlx supabase --version 2>/dev/null || true
# If supabase CLI is present, run a dry parse:
[ -x "$(command -v supabase)" ] && supabase db lint --file supabase/migrations/00YY_chats_participant_set_null.sql || echo "supabase CLI not present; skipping lint"
```

Expected: lint reports no errors (or skipped if CLI not installed).

- [ ] **Step B.1.3: Commit**

```bash
git add supabase/migrations/00YY_chats_participant_set_null.sql
git commit -m "$(cat <<'EOF'
feat(db): chats participant FK -> SET NULL + NULL-safe RLS (P2.2)

Prep for FR-SETTINGS-012 V1: chats survive participant deletion.
- drop NOT NULL on participant_a/b
- chats_*_fkey: on delete set null
- new CHECK: at least one participant non-null
- chats_canonical_order: NULL-tolerant
- is_chat_visible_to: rewrite to use IS DISTINCT FROM (NULL-safe)
- messages_insert_user, messages_update_status_recipient,
  chats_insert_self: rewrite IN -> OR equalities

Without the RLS rewrites the surviving participant loses access
to the chat once the other side is deleted (NULL poisons IN).

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

### Task B.2: Run migration locally + verify RLS behavior

**Files:**
- None (verification only).

- [ ] **Step B.2.1: Run migrations against a clean local supabase**

```bash
supabase db reset --no-seed 2>&1 | tail -20
```

Expected: all migrations apply cleanly, including the new one. Any error → fix the SQL.

- [ ] **Step B.2.2: Manual probe with two test users**

Open a `psql` connection to local supabase and run this scenario:

```sql
-- Setup: two users with an open chat
insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'a@test.dev'),
  ('22222222-2222-2222-2222-222222222222', 'b@test.dev');
-- handle_new_user trigger should auto-populate public.users; verify:
select user_id, display_name from public.users where user_id in (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222'
);
-- Create a chat manually:
insert into public.chats (chat_id, participant_a, participant_b)
  values (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222');

-- Now simulate deletion of user A — null out the participant:
update public.chats set participant_a = null
  where participant_a = '11111111-1111-1111-1111-111111111111';

-- Check 1: is_chat_visible_to returns TRUE for user B (the survivor):
select public.is_chat_visible_to(c.*, '22222222-2222-2222-2222-222222222222'::uuid) as visible
  from public.chats c
  where participant_b = '22222222-2222-2222-2222-222222222222';
-- Expected: visible = true

-- Check 2: is_chat_visible_to returns FALSE for user A's UUID (the deleted side):
select public.is_chat_visible_to(c.*, '11111111-1111-1111-1111-111111111111'::uuid) as visible
  from public.chats c
  where participant_b = '22222222-2222-2222-2222-222222222222';
-- Expected: visible = false

-- Check 3: CHECK constraint blocks fully-orphan rows:
update public.chats set participant_b = null where participant_b = '22222222-2222-2222-2222-222222222222';
-- Expected: ERROR 23514 chats_at_least_one_participant
```

If any expectation fails — debug and fix the SQL before proceeding.

- [ ] **Step B.2.3: Take notes**

Record the probe results in a scratch file (do not commit). If everything passes, proceed.

---

## Phase C: Migration 2 — RPC + audit CHECK

### Task C.1: Write migration 2

**Files:**
- Create: `supabase/migrations/00ZZ_delete_account_rpc.sql`

- [ ] **Step C.1.1: Identify the current audit_events CHECK name**

```bash
psql "$DATABASE_URL" -c "select conname from pg_constraint where conrelid='public.audit_events'::regclass and contype='c';" 2>/dev/null
```

(If running against local supabase: use the supabase CLI's database URL.)

Record the auto-generated constraint name (typically `audit_events_action_check`).

- [ ] **Step C.1.2: Create the migration file**

```sql
-- 00ZZ_delete_account_rpc | P2.2 — FR-SETTINGS-012 V1
-- Extend audit_events.action allowed set with 'delete_account', and define
-- the SECURITY DEFINER RPC that performs the DB portion of self-deletion.
-- The RPC takes no parameter (identity comes from auth.uid() only) and is
-- explicitly granted only to authenticated, never to public/anon.

set search_path = public;

-- ── 1. Extend audit_events.action CHECK ─────────────────────────────────────
alter table public.audit_events drop constraint audit_events_action_check;
alter table public.audit_events
  add constraint audit_events_action_check
  check (action in (
    'block_user','unblock_user',
    'report_target',
    'auto_remove_target','manual_remove_target','restore_target',
    'suspend_user','unsuspend_user',
    'false_report_sanction_applied',
    'dismiss_report','confirm_report',
    'delete_account'
  ));

-- ── 2. delete_account_data() RPC ────────────────────────────────────────────
create or replace function public.delete_account_data()
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id   uuid;
  v_status    text;
  v_avatar    text;
  v_paths     text[];
  v_audit_id  uuid;
  v_posts     int := 0;
  v_chats_a   int := 0;
  v_chats_d   int := 0;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'unauthenticated' using errcode = '42501';
  end if;

  -- Status gate (Q5): block suspended / banned to prevent moderation evasion.
  select account_status, avatar_url into v_status, v_avatar
    from public.users where user_id = v_user_id;
  if not found then
    -- Idempotency: user row already gone (retry of a partially-completed flow).
    return jsonb_build_object(
      'media_paths', '[]'::jsonb,
      'avatar_path', null,
      'counts',      jsonb_build_object('posts',0,'chats_anonymized',0,'chats_dropped',0)
    );
  end if;
  if v_status in ('suspended_for_false_reports','suspended_admin','banned') then
    raise exception 'suspended' using errcode = 'P0001';
  end if;

  -- 1. Snapshot media paths BEFORE post deletion cascades clear them.
  select coalesce(array_agg(path), '{}') into v_paths
    from public.media_assets
    where post_id in (select post_id from public.posts where owner_id = v_user_id);

  -- 2. Audit row. actor_id will be nulled by FK cascade at step 6 — snapshot
  --    the user_id into metadata so the audit trail retains it.
  insert into public.audit_events (actor_id, action, target_type, target_id, metadata)
    values (v_user_id, 'delete_account', 'user', v_user_id,
            jsonb_build_object('actor_id_snapshot', v_user_id::text))
    returning event_id into v_audit_id;

  -- 3. Explicit per-user cleanup (before users delete).
  delete from public.devices          where user_id      = v_user_id;
  delete from public.follow_edges     where follower_id  = v_user_id or followed_id = v_user_id;
  delete from public.follow_requests  where requester_id = v_user_id or target_id   = v_user_id;
  delete from public.blocks           where blocker_id   = v_user_id or blocked_id  = v_user_id;
  delete from public.reports          where reporter_id  = v_user_id or target_id   = v_user_id;
  delete from public.donation_links   where submitted_by = v_user_id;
  -- donation_links.hidden_by has no on-delete action — null it explicitly to
  -- avoid an FK violation later when auth.admin.deleteUser fires.
  update public.donation_links set hidden_by = null where hidden_by = v_user_id;
  delete from public.auth_identities  where user_id      = v_user_id;

  -- 4. Posts (cascades to recipients, media_assets — paths already captured).
  select count(*) into v_posts from public.posts where owner_id = v_user_id;
  delete from public.posts where owner_id = v_user_id;

  -- 5. Chats: drop orphans first (other side already NULL), then null-out the
  --    remaining ones. The CHECK constraint from migration 00YY prevents
  --    rows with both participants NULL from being created.
  select count(*) into v_chats_d from public.chats
    where (participant_a = v_user_id and participant_b is null)
       or (participant_b = v_user_id and participant_a is null);
  delete from public.chats
    where (participant_a = v_user_id and participant_b is null)
       or (participant_b = v_user_id and participant_a is null);

  update public.chats set participant_a = null where participant_a = v_user_id;
  get diagnostics v_chats_a = row_count;
  update public.chats set participant_b = null where participant_b = v_user_id;
  -- (row_count of the second update is not added to v_chats_a — each chat
  --  only has the deletee on one side; the union counts unique rows.)

  -- 6. Delete public.users. FK cascade to auth.users does NOT fire (FK is
  --    public->auth, not auth->public). The Edge Function calls
  --    auth.admin.deleteUser() next; that DOES cascade-delete public.users
  --    too but the row is already gone here.
  delete from public.users where user_id = v_user_id;

  -- 7. Finalize audit metadata with the counts gathered.
  update public.audit_events
    set metadata = jsonb_build_object(
      'actor_id_snapshot', v_user_id::text,
      'posts_deleted',     v_posts,
      'chats_anonymized',  v_chats_a,
      'chats_dropped',     v_chats_d
    )
    where event_id = v_audit_id;

  -- 8. Return paths to the caller (service-role Edge Function) for storage
  --    cleanup, plus counts for telemetry.
  return jsonb_build_object(
    'media_paths',  to_jsonb(v_paths),
    'avatar_path',  v_avatar,
    'counts', jsonb_build_object(
      'posts',            v_posts,
      'chats_anonymized', v_chats_a,
      'chats_dropped',    v_chats_d
    )
  );
end;
$$;

-- ── 3. Lock down execution ──────────────────────────────────────────────────
revoke execute on function public.delete_account_data() from public;
grant  execute on function public.delete_account_data() to authenticated;
```

- [ ] **Step C.1.3: Run + verify**

```bash
supabase db reset --no-seed 2>&1 | tail -10
```

Expected: no errors. Then in `psql`:

```sql
-- anon cannot call:
set role anon;
select public.delete_account_data();
-- Expected: ERROR permission denied for function delete_account_data
reset role;

-- authenticated without JWT (auth.uid() null) is blocked by the function body:
-- (test via a session-less authenticated role)
set role authenticated;
select public.delete_account_data();
-- Expected: ERROR 42501 unauthenticated
reset role;
```

- [ ] **Step C.1.4: Commit**

```bash
git add supabase/migrations/00ZZ_delete_account_rpc.sql
git commit -m "$(cat <<'EOF'
feat(db): delete_account_data RPC + audit action 'delete_account' (P2.2)

SECURITY DEFINER function with no parameter; uses auth.uid() only.
- revokes execute from public, grants only to authenticated
- explicit null-check on auth.uid() (defense-in-depth)
- blocks suspended_for_false_reports / suspended_admin / banned
- snapshots actor_id into metadata (FK cascade nulls actor_id later)
- handles donation_links.{submitted_by, hidden_by} explicitly
- early-return idempotent path for retries
- returns media_paths + avatar_path + counts for the Edge Function

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Phase D: Edge Function

### Task D.1: CORS + auth helpers

**Files:**
- Create: `supabase/functions/delete-account/cors.ts`
- Create: `supabase/functions/delete-account/auth.ts`

- [ ] **Step D.1.1: Write `cors.ts`**

```ts
// supabase/functions/delete-account/cors.ts
// Shared CORS + JSON response helper.

export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}
```

- [ ] **Step D.1.2: Write `auth.ts`**

```ts
// supabase/functions/delete-account/auth.ts
// Server-side JWT verification via userClient.auth.getUser().

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

export interface AuthedUser {
  id: string;
  authHeader: string;
}

export async function getAuthedUser(req: Request): Promise<AuthedUser | null> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });
  const { data, error } = await userClient.auth.getUser();
  if (error || !data?.user) return null;
  return { id: data.user.id, authHeader };
}
```

- [ ] **Step D.1.3: Commit**

```bash
git add supabase/functions/delete-account/cors.ts supabase/functions/delete-account/auth.ts
git commit -m "$(cat <<'EOF'
feat(edge): delete-account cors + auth helpers

Extracted to keep index.ts under the 200-line per-file cap.
auth.ts uses userClient.auth.getUser() to verify the JWT
server-side, matching the validate-donation-link pattern.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

### Task D.2: Edge Function `index.ts`

**Files:**
- Create: `supabase/functions/delete-account/index.ts`

- [ ] **Step D.2.1: Write the function**

```ts
// supabase/functions/delete-account/index.ts
// Edge Function for FR-SETTINGS-012 V1 — orchestrates the destructive flow:
//   1. verify JWT
//   2. call delete_account_data() RPC (DB cleanup, idempotent)
//   3. delete storage objects (post media + avatar)
//   4. auth.admin.deleteUser() — frees email / Google identity
//
// Order matters: DB → storage → auth. If DB fails nothing changes. If storage
// fails the user is half-cleaned (acceptable; orphan cleanup deferred to V1.1).
// If auth fails the client must retry — UI hard-locks the modal in that case.
//
// POST (no body) → 200 { ok: true, counts }
//                → 401 { ok: false, error: 'unauthenticated' }
//                → 403 { ok: false, error: 'suspended' }
//                → 500 { ok: false, error: 'db_failed' | 'auth_delete_failed', counts? }

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
import { CORS_HEADERS, jsonResponse } from './cors.ts';
import { getAuthedUser } from './auth.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface RpcResult {
  media_paths: string[];
  avatar_path: string | null;
  counts: { posts: number; chats_anonymized: number; chats_dropped: number };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS });
  if (req.method !== 'POST') return jsonResponse({ ok: false, error: 'invalid_method' }, 405);

  const user = await getAuthedUser(req);
  if (!user) return jsonResponse({ ok: false, error: 'unauthenticated' }, 401);

  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  // Step 1+2: DB cleanup via RPC (authenticated client so auth.uid() works).
  const userClient = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: user.authHeader } },
    auth: { persistSession: false },
  });
  const { data: rpcData, error: rpcErr } = await userClient.rpc('delete_account_data');
  if (rpcErr) {
    const msg = rpcErr.message ?? '';
    if (msg.includes('suspended')) return jsonResponse({ ok: false, error: 'suspended' }, 403);
    if (msg.includes('unauthenticated')) return jsonResponse({ ok: false, error: 'unauthenticated' }, 401);
    return jsonResponse({ ok: false, error: 'db_failed', detail: msg }, 500);
  }
  const rpc = rpcData as unknown as RpcResult;

  // Step 3: storage cleanup. Failures are logged, not fatal.
  try {
    if (rpc.media_paths.length > 0) {
      const { error: rmErr } = await adminClient.storage.from('post-images').remove(rpc.media_paths);
      if (rmErr) console.error('[delete-account] post-images cleanup failed', rmErr);
    }
    if (rpc.avatar_path) {
      const { error: avErr } = await adminClient.storage.from('avatars').remove([rpc.avatar_path]);
      if (avErr) console.error('[delete-account] avatar cleanup failed', avErr);
    }
  } catch (e) {
    console.error('[delete-account] storage cleanup threw', e);
  }

  // Step 4: free the auth identity. If this fails the user is in the
  // "DB clean, auth alive" state — client must retry from the modal.
  const { error: authErr } = await adminClient.auth.admin.deleteUser(user.id);
  if (authErr) {
    console.error('[delete-account] auth.admin.deleteUser failed', authErr);
    return jsonResponse({ ok: false, error: 'auth_delete_failed', counts: rpc.counts }, 500);
  }

  return jsonResponse({ ok: true, counts: rpc.counts }, 200);
});
```

- [ ] **Step D.2.2: Verify file is under the 200-line cap**

```bash
wc -l supabase/functions/delete-account/index.ts
```

Expected: < 200. If over, lift another piece into a helper file.

- [ ] **Step D.2.3: Commit**

```bash
git add supabase/functions/delete-account/index.ts
git commit -m "$(cat <<'EOF'
feat(edge): delete-account orchestrator (P2.2)

Order: verify JWT -> delete_account_data RPC -> storage cleanup
(post-images + avatars, non-fatal) -> auth.admin.deleteUser.
Returns auth_delete_failed status code so the client knows the
DB is already clean but auth survived (UI hard-locks the modal).

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

### Task D.3: Local Edge Function smoke test

**Files:**
- None.

- [ ] **Step D.3.1: Serve the function locally**

```bash
supabase functions serve delete-account --no-verify-jwt --env-file supabase/.env.local 2>&1 &
sleep 3
```

(Use the env-file path that matches your local setup. If `--no-verify-jwt` is not desired, omit it — the function does its own verification.)

- [ ] **Step D.3.2: Probe without JWT (expect 401)**

```bash
curl -s -X POST http://localhost:54321/functions/v1/delete-account -H 'Content-Type: application/json'
```

Expected: `{"ok":false,"error":"unauthenticated"}` (status 401).

- [ ] **Step D.3.3: Probe with seeded user JWT (expect 200)**

Seed a test user via the supabase studio, copy their JWT from a sign-in flow, then:

```bash
curl -s -X POST http://localhost:54321/functions/v1/delete-account \
  -H "Authorization: Bearer <USER_JWT>" \
  -H 'Content-Type: application/json'
```

Expected: `{"ok":true,"counts":{...}}` and the user no longer exists in `auth.users` / `public.users`.

- [ ] **Step D.3.4: Re-signup with the same email**

Via the seed flow, re-sign-up the same email. Expected: a fresh `auth.users` + `public.users` is created via the `handle_new_user` trigger.

- [ ] **Step D.3.5: Stop the local function**

```bash
pkill -f "functions serve delete-account" || true
```

- [ ] **Step D.3.6: No commit (verification only).**

---

## Phase E: Application layer (TDD)

### Task E.1: Add `DeleteAccountError`

**Files:**
- Modify: `app/packages/application/src/auth/errors.ts`

- [ ] **Step E.1.1: Append to errors.ts**

Open `app/packages/application/src/auth/errors.ts`. At the end of the file (after the existing `AuthError` export), append:

```ts
// ─────────────────────────────────────────────
// Delete-account domain error
// Mapped to SRS: FR-SETTINGS-012 V1
// ─────────────────────────────────────────────

export type DeleteAccountErrorCode =
  | 'unauthenticated'
  | 'suspended'
  | 'auth_delete_failed'
  | 'network'
  | 'server_error';

export class DeleteAccountError extends Error {
  readonly code: DeleteAccountErrorCode;
  readonly cause?: unknown;

  constructor(code: DeleteAccountErrorCode, message: string, cause?: unknown) {
    super(message);
    this.name = 'DeleteAccountError';
    this.code = code;
    this.cause = cause;
    Object.setPrototypeOf(this, DeleteAccountError.prototype);
  }
}

export function isDeleteAccountError(value: unknown): value is DeleteAccountError {
  return value instanceof DeleteAccountError;
}
```

- [ ] **Step E.1.2: Typecheck**

```bash
pnpm --filter @kc/application typecheck
```

Expected: PASS.

### Task E.2: Add port method `deleteAccountViaEdgeFunction`

**Files:**
- Modify: `app/packages/application/src/ports/IUserRepository.ts`

- [ ] **Step E.2.1: Update the interface**

Open the file. Locate the `delete(userId: string): Promise<void>;` line (around line 22). Replace it with:

```ts
  /**
   * @deprecated V1 uses `deleteAccountViaEdgeFunction()` (no arg, identity from JWT).
   * The original arg-taking shape was a stub; keep the method on the port for
   * potential future admin-driven delete (mirrors IPostRepository.delete vs adminRemove).
   */
  delete(userId: string): Promise<void>;

  /**
   * FR-SETTINGS-012 V1 — Self-delete the currently authenticated user. Identity
   * is read from the JWT server-side; no client-supplied userId. Throws
   * `DeleteAccountError` with one of the documented codes:
   * - `unauthenticated` — no valid session
   * - `suspended` — account_status blocks self-deletion
   * - `auth_delete_failed` — DB is already cleaned but auth.users survived
   * - `network` / `server_error` — generic failures
   */
  deleteAccountViaEdgeFunction(): Promise<void>;
```

- [ ] **Step E.2.2: Typecheck**

```bash
pnpm --filter @kc/application typecheck
```

Expected: TypeScript reports the existing `SupabaseUserRepository` is missing `deleteAccountViaEdgeFunction`. Defer the fix to Phase F.

### Task E.3: TDD — `DeleteAccountUseCase`

**Files:**
- Create: `app/packages/application/src/auth/__tests__/fakeUserRepositoryForDeleteAccount.ts`
- Create: `app/packages/application/src/auth/__tests__/DeleteAccountUseCase.test.ts`
- Create: `app/packages/application/src/auth/DeleteAccountUseCase.ts`

- [ ] **Step E.3.1: Write the fake repo**

```ts
// app/packages/application/src/auth/__tests__/fakeUserRepositoryForDeleteAccount.ts
// Minimal in-test fake covering only deleteAccountViaEdgeFunction.

import { DeleteAccountError } from '../errors';

export class FakeUserRepositoryForDeleteAccount {
  deleteAccountCallCount = 0;
  errorToThrow: DeleteAccountError | null = null;

  deleteAccountViaEdgeFunction = async (): Promise<void> => {
    this.deleteAccountCallCount += 1;
    if (this.errorToThrow) throw this.errorToThrow;
  };
}
```

- [ ] **Step E.3.2: Write the failing test**

```ts
// app/packages/application/src/auth/__tests__/DeleteAccountUseCase.test.ts
import { describe, it, expect } from 'vitest';
import { DeleteAccountUseCase } from '../DeleteAccountUseCase';
import { DeleteAccountError } from '../errors';
import { FakeUserRepositoryForDeleteAccount } from './fakeUserRepositoryForDeleteAccount';

describe('DeleteAccountUseCase', () => {
  it('invokes the repo once on success', async () => {
    const repo = new FakeUserRepositoryForDeleteAccount();
    const uc = new DeleteAccountUseCase(repo as any);
    await uc.execute();
    expect(repo.deleteAccountCallCount).toBe(1);
  });

  it('propagates DeleteAccountError unchanged', async () => {
    const repo = new FakeUserRepositoryForDeleteAccount();
    repo.errorToThrow = new DeleteAccountError('suspended', 'blocked');
    const uc = new DeleteAccountUseCase(repo as any);
    await expect(uc.execute()).rejects.toBeInstanceOf(DeleteAccountError);
    await expect(uc.execute()).rejects.toMatchObject({ code: 'suspended' });
  });

  it('does not retry or swallow auth_delete_failed', async () => {
    const repo = new FakeUserRepositoryForDeleteAccount();
    repo.errorToThrow = new DeleteAccountError('auth_delete_failed', 'half-deleted');
    const uc = new DeleteAccountUseCase(repo as any);
    await expect(uc.execute()).rejects.toMatchObject({ code: 'auth_delete_failed' });
    expect(repo.deleteAccountCallCount).toBe(1);
  });
});
```

- [ ] **Step E.3.3: Run — expect FAIL**

```bash
pnpm --filter @kc/application test --run DeleteAccountUseCase
```

Expected: FAIL (module not found).

- [ ] **Step E.3.4: Implement the use case**

```ts
// app/packages/application/src/auth/DeleteAccountUseCase.ts
// FR-SETTINGS-012 V1 — self-delete the currently authenticated user.

import type { IUserRepository } from '../ports/IUserRepository';

export class DeleteAccountUseCase {
  constructor(private readonly repo: IUserRepository) {}

  async execute(): Promise<void> {
    await this.repo.deleteAccountViaEdgeFunction();
  }
}
```

- [ ] **Step E.3.5: Run — expect PASS**

```bash
pnpm --filter @kc/application test --run DeleteAccountUseCase
```

Expected: 3 tests pass.

- [ ] **Step E.3.6: Re-export from auth index**

Open `app/packages/application/src/auth/index.ts` (create if it doesn't exist with the same pattern as `donations/index.ts`). Append:

```ts
export { DeleteAccountUseCase } from './DeleteAccountUseCase';
export { DeleteAccountError, isDeleteAccountError, type DeleteAccountErrorCode } from './errors';
```

(Keep any existing exports above.)

- [ ] **Step E.3.7: Commit**

```bash
git add app/packages/application/src/auth/ app/packages/application/src/ports/IUserRepository.ts
git commit -m "$(cat <<'EOF'
feat(application): DeleteAccountUseCase + DeleteAccountError (P2.2)

New use case wraps IUserRepository.deleteAccountViaEdgeFunction().
Error class follows the donations/auth error pattern with code +
message + cause. The original delete(userId) port method is marked
deprecated but kept for a future admin-driven delete pattern.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Phase F: Repository implementation

### Task F.1: Implement `SupabaseUserRepository.deleteAccountViaEdgeFunction`

**Files:**
- Modify: `app/packages/infrastructure-supabase/src/users/SupabaseUserRepository.ts`

- [ ] **Step F.1.1: Add the import**

Near the top of the file (around line 8 where `IUserRepository` is imported), add:

```ts
import { DeleteAccountError } from '@kc/application';
```

If the package's barrel doesn't re-export `DeleteAccountError` yet, verify Step E.3.6 was applied.

- [ ] **Step F.1.2: Replace the `delete` stub + add the new method**

Locate the existing stub (around line 165):

```ts
  async delete(_userId: string): Promise<void> {
    throw NOT_IMPL('delete', 'P2.2');
  }
```

Replace with:

```ts
  async delete(_userId: string): Promise<void> {
    // Deprecated in V1 — see deleteAccountViaEdgeFunction.
    throw NOT_IMPL('delete', 'reserved for future admin-driven delete');
  }

  async deleteAccountViaEdgeFunction(): Promise<void> {
    const { data, error } = await this.client.functions.invoke<{
      ok: boolean;
      error?: 'unauthenticated' | 'suspended' | 'auth_delete_failed' | 'db_failed';
      counts?: { posts: number; chats_anonymized: number; chats_dropped: number };
    }>('delete-account', { method: 'POST' });

    if (error) {
      // FunctionsHttpError carries the response; FunctionsFetchError is network.
      const status = (error as { context?: { status?: number } }).context?.status;
      if (status === 401) throw new DeleteAccountError('unauthenticated', 'no valid session', error);
      if (status === 403) throw new DeleteAccountError('suspended', 'account is suspended', error);
      if (status === 500 && data?.error === 'auth_delete_failed') {
        throw new DeleteAccountError('auth_delete_failed', 'DB cleaned but auth survived', error);
      }
      if (status == null) throw new DeleteAccountError('network', error.message, error);
      throw new DeleteAccountError('server_error', error.message, error);
    }
    if (data?.ok === true) return;
    if (data?.error === 'auth_delete_failed') {
      throw new DeleteAccountError('auth_delete_failed', 'DB cleaned but auth survived');
    }
    throw new DeleteAccountError('server_error', `unexpected response: ${JSON.stringify(data)}`);
  }
```

- [ ] **Step F.1.3: Typecheck**

```bash
pnpm --filter @kc/infrastructure-supabase typecheck
pnpm --filter @kc/application typecheck
```

Expected: PASS in both. If `@kc/infrastructure-supabase` isn't the package name, use `pnpm -r typecheck`.

- [ ] **Step F.1.4: Commit**

```bash
git add app/packages/infrastructure-supabase/src/users/SupabaseUserRepository.ts
git commit -m "$(cat <<'EOF'
feat(infra): SupabaseUserRepository.deleteAccountViaEdgeFunction (P2.2)

Invokes the delete-account Edge Function and maps status codes
to DeleteAccountError codes:
- 401 -> unauthenticated
- 403 -> suspended
- 500 + body.error=auth_delete_failed -> auth_delete_failed
- network -> network
- everything else -> server_error

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Phase G: i18n + UI

### Task G.1: i18n keys

**Files:**
- Modify: `app/apps/mobile/src/i18n/he.ts`

- [ ] **Step G.1.1: Locate the existing `settings` group**

```bash
grep -n "deleteAccount\|^  settings:" app/apps/mobile/src/i18n/he.ts | head -10
```

You should see an existing `settings:` block. The current `deleteAccount: 'מחק חשבון'` key sits inside it (line ~174).

- [ ] **Step G.1.2: Insert the new modal key group**

Inside the `settings:` object, alongside the existing `deleteAccount` key, add:

```ts
deleteAccountModal: {
  title: 'מחיקת חשבון לצמיתות',
  bullets: {
    posts:      'כל הפוסטים שלך יימחקו (כולל תמונות)',
    follows:    'כל העוקבים והנעקבים יוסרו',
    moderation: 'כל החסימות והדיווחים שהגשת יימחקו',
    donations:  'קישורי תרומה שהגדרת יימחקו',
    devices:    'כל המכשירים המחוברים שלך ינותקו',
  },
  chatsRetention:
    'שיחות שניהלת יישארו אצל האנשים שדיברת איתם. הם יראו את ההודעות שכתבת, אבל לא את שמך, התמונה או הפרופיל — רק "משתמש שנמחק".',
  warning:
    'הפעולה אינה הפיכה. הפוסטים, ההיסטוריה והקשרים שלך לא ניתנים לשחזור. אין חלון ביטול — המחיקה מיידית.',
  confirmInputLabel: 'הקלד "מחק" כדי לאשר',
  confirmInputPlaceholder: 'מחק',
  confirmKeyword: 'מחק',
  buttons: {
    cancel: 'ביטול',
    delete: 'מחק את החשבון לצמיתות',
    retry:  'נסה שוב',
    close:  'סגור',
  },
  errors: {
    recoverable: 'המחיקה נכשלה — נסה שוב',
    critical:
      'המחיקה לא הושלמה. הפוסטים והעוקבים שלך כבר נמחקו, אבל סגירת החשבון לא הסתיימה. חובה ללחוץ "נסה שוב" עכשיו — אם תסגור את האפליקציה ייווצר חשבון לא תקין.',
  },
  blocked: {
    title: 'לא ניתן למחוק חשבון מושעה',
    body:  'פנה לבירור דרך מסך הדיווחים.',
  },
  success: {
    title:    'חשבונך נמחק',
    subtitle: 'תודה שהיית חלק מקארמה.',
  },
},
```

- [ ] **Step G.1.3: Typecheck**

```bash
pnpm --filter @kc/mobile typecheck
```

Expected: PASS. (If the i18n types are strict, any consumer using these keys will type-resolve from the new shape.)

- [ ] **Step G.1.4: Commit**

```bash
git add app/apps/mobile/src/i18n/he.ts
git commit -m "$(cat <<'EOF'
feat(i18n): settings.deleteAccountModal.* keys (P2.2)

All UI strings for the new delete-account modal live in the i18n
SSOT, including bullets, chat-retention note, warning, typed-confirm
label, error states (recoverable + critical), blocked-suspended,
and success overlay.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

### Task G.2: Modal styles

**Files:**
- Create: `app/apps/mobile/src/components/DeleteAccountConfirmModal.styles.ts`

- [ ] **Step G.2.1: Pick a reference stylesheet**

```bash
cat app/apps/mobile/src/components/AddDonationLinkModal.styles.ts | head -40
```

Note the patterns: RN `StyleSheet.create`, `colors` from `@kc/ui` (or wherever), font sizing, padding.

- [ ] **Step G.2.2: Write the stylesheet**

```ts
// app/apps/mobile/src/components/DeleteAccountConfirmModal.styles.ts
import { StyleSheet, Platform } from 'react-native';

export const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    maxWidth: 480,
    width: '100%',
    direction: 'rtl',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#c8323a',
    textAlign: 'right',
    marginBottom: 14,
  },
  bulletList: {
    marginBottom: 12,
  },
  bullet: {
    fontSize: 15,
    lineHeight: 22,
    color: '#222',
    textAlign: 'right',
    marginBottom: 4,
  },
  chatsRetention: {
    fontSize: 15,
    fontWeight: '600',
    color: '#222',
    textAlign: 'right',
    marginBottom: 10,
    backgroundColor: '#fff7e6',
    padding: 10,
    borderRadius: 8,
  },
  warning: {
    fontSize: 13,
    lineHeight: 20,
    color: '#666',
    textAlign: 'right',
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    color: '#666',
    textAlign: 'right',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'web' ? 10 : 8,
    fontSize: 16,
    textAlign: 'right',
    marginBottom: 16,
    color: '#222',
  },
  buttonsRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    gap: 12,
  },
  buttonDelete: {
    flex: 1,
    backgroundColor: '#c8323a',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDeleteDisabled: {
    backgroundColor: '#dca1a4',
  },
  buttonDeleteText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  buttonCancel: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonCancelText: {
    color: '#222',
    fontSize: 16,
    fontWeight: '600',
  },
  errorBanner: {
    backgroundColor: '#fde6e8',
    borderColor: '#c8323a',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  errorBannerText: {
    color: '#9a1d24',
    fontSize: 14,
    textAlign: 'right',
  },
  errorBannerCritical: {
    backgroundColor: '#c8323a',
  },
  errorBannerCriticalText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  blockedTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#c8323a',
    textAlign: 'right',
    marginBottom: 8,
  },
  blockedBody: {
    fontSize: 15,
    color: '#222',
    textAlign: 'right',
    marginBottom: 16,
  },
});
```

(If `@kc/ui` exposes a `colors` token module, swap the hex literals for it during implementation — pick whichever exists. Hardcoded hex is acceptable in V1.)

- [ ] **Step G.2.3: Commit**

```bash
git add app/apps/mobile/src/components/DeleteAccountConfirmModal.styles.ts
git commit -m "style(settings): DeleteAccountConfirmModal styles (P2.2)

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

### Task G.3: Modal component

**Files:**
- Create: `app/apps/mobile/src/components/DeleteAccountConfirmModal.tsx`

- [ ] **Step G.3.1: Write the component**

```tsx
// app/apps/mobile/src/components/DeleteAccountConfirmModal.tsx
// FR-SETTINGS-012 V1 — delete-account confirmation modal.
// States: idle / ready / submitting / error_recoverable / error_critical / blocked_suspended.
// error_critical is non-dismissible (no tap-outside, no back, no X).

import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { DeleteAccountError } from '@kc/application';
import { styles } from './DeleteAccountConfirmModal.styles';

export type DeleteAccountModalErrorKind = 'recoverable' | 'critical';

export interface DeleteAccountConfirmModalProps {
  visible: boolean;
  /** Pass the user's current account_status for the blocked-state check. */
  accountStatus: 'pending_verification' | 'active' | 'suspended_for_false_reports' | 'suspended_admin' | 'banned' | 'deleted' | null;
  onCancel: () => void;
  /** Resolve normally on success; throw DeleteAccountError on failure. */
  onConfirm: () => Promise<void>;
}

type LocalState =
  | { kind: 'idle' }
  | { kind: 'submitting' }
  | { kind: 'error'; error: DeleteAccountModalErrorKind }
  | { kind: 'blocked' };

export function DeleteAccountConfirmModal(props: DeleteAccountConfirmModalProps) {
  const { t } = useTranslation();
  const { visible, accountStatus, onCancel, onConfirm } = props;
  const [typed, setTyped] = useState('');
  const [state, setState] = useState<LocalState>({ kind: 'idle' });
  const keyword = t('settings.deleteAccountModal.confirmKeyword');

  const isBlocked = useMemo(() => {
    return accountStatus === 'suspended_for_false_reports'
      || accountStatus === 'suspended_admin'
      || accountStatus === 'banned';
  }, [accountStatus]);

  // Sync blocked state when prop changes.
  React.useEffect(() => {
    if (visible && isBlocked) setState({ kind: 'blocked' });
    else if (visible) setState((s) => (s.kind === 'blocked' ? { kind: 'idle' } : s));
  }, [visible, isBlocked]);

  // Disable hardware back when in submitting / error_critical.
  React.useEffect(() => {
    if (Platform.OS !== 'android') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (state.kind === 'submitting') return true;
      if (state.kind === 'error' && state.error === 'critical') return true;
      return false;
    });
    return () => sub.remove();
  }, [state]);

  const ready = typed.trim() === keyword;

  const handleConfirm = useCallback(async () => {
    if (!ready) return;
    setState({ kind: 'submitting' });
    try {
      await onConfirm();
      // On success the parent navigates away; nothing to do here.
    } catch (e) {
      if (e instanceof DeleteAccountError) {
        if (e.code === 'suspended') {
          setState({ kind: 'blocked' });
          return;
        }
        if (e.code === 'auth_delete_failed') {
          setState({ kind: 'error', error: 'critical' });
          return;
        }
        setState({ kind: 'error', error: 'recoverable' });
        return;
      }
      setState({ kind: 'error', error: 'recoverable' });
    }
  }, [ready, onConfirm]);

  const allowDismiss
    = state.kind === 'idle'
    || (state.kind === 'error' && state.error === 'recoverable')
    || state.kind === 'blocked';

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => {
        if (allowDismiss) onCancel();
      }}
    >
      <Pressable
        style={styles.overlay}
        onPress={() => {
          if (allowDismiss) onCancel();
        }}
      >
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          {state.kind === 'blocked' ? (
            <>
              <Text style={styles.blockedTitle}>{t('settings.deleteAccountModal.blocked.title')}</Text>
              <Text style={styles.blockedBody}>{t('settings.deleteAccountModal.blocked.body')}</Text>
              <View style={styles.buttonsRow}>
                <TouchableOpacity style={styles.buttonCancel} onPress={onCancel}>
                  <Text style={styles.buttonCancelText}>{t('settings.deleteAccountModal.buttons.close')}</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.title}>{t('settings.deleteAccountModal.title')}</Text>

              <View style={styles.bulletList}>
                <Text style={styles.bullet}>{`• ${t('settings.deleteAccountModal.bullets.posts')}`}</Text>
                <Text style={styles.bullet}>{`• ${t('settings.deleteAccountModal.bullets.follows')}`}</Text>
                <Text style={styles.bullet}>{`• ${t('settings.deleteAccountModal.bullets.moderation')}`}</Text>
                <Text style={styles.bullet}>{`• ${t('settings.deleteAccountModal.bullets.donations')}`}</Text>
                <Text style={styles.bullet}>{`• ${t('settings.deleteAccountModal.bullets.devices')}`}</Text>
              </View>

              <Text style={styles.chatsRetention}>{t('settings.deleteAccountModal.chatsRetention')}</Text>
              <Text style={styles.warning}>{t('settings.deleteAccountModal.warning')}</Text>

              {state.kind === 'error' && (
                <View style={[styles.errorBanner, state.error === 'critical' && styles.errorBannerCritical]}>
                  <Text style={[styles.errorBannerText, state.error === 'critical' && styles.errorBannerCriticalText]}>
                    {state.error === 'critical'
                      ? t('settings.deleteAccountModal.errors.critical')
                      : t('settings.deleteAccountModal.errors.recoverable')}
                  </Text>
                </View>
              )}

              <Text style={styles.inputLabel}>{t('settings.deleteAccountModal.confirmInputLabel')}</Text>
              <TextInput
                value={typed}
                onChangeText={setTyped}
                placeholder={t('settings.deleteAccountModal.confirmInputPlaceholder')}
                placeholderTextColor="#aaa"
                editable={state.kind !== 'submitting'}
                style={styles.input}
                autoCapitalize="none"
                autoCorrect={false}
              />

              <View style={styles.buttonsRow}>
                <TouchableOpacity
                  style={[styles.buttonDelete, !ready && styles.buttonDeleteDisabled]}
                  disabled={!ready || state.kind === 'submitting'}
                  onPress={handleConfirm}
                >
                  {state.kind === 'submitting' ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text style={styles.buttonDeleteText}>
                      {state.kind === 'error' && state.error === 'critical'
                        ? t('settings.deleteAccountModal.buttons.retry')
                        : t('settings.deleteAccountModal.buttons.delete')}
                    </Text>
                  )}
                </TouchableOpacity>

                {!(state.kind === 'error' && state.error === 'critical') && (
                  <TouchableOpacity
                    style={styles.buttonCancel}
                    disabled={state.kind === 'submitting'}
                    onPress={onCancel}
                  >
                    <Text style={styles.buttonCancelText}>
                      {t('settings.deleteAccountModal.buttons.cancel')}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
```

- [ ] **Step G.3.2: File-size check**

```bash
wc -l app/apps/mobile/src/components/DeleteAccountConfirmModal.tsx
```

Expected: ≤ 200. If over, split state machine into a hook (`useDeleteAccountModalState.ts`).

- [ ] **Step G.3.3: Typecheck**

```bash
pnpm --filter @kc/mobile typecheck
```

Expected: PASS.

- [ ] **Step G.3.4: Commit**

```bash
git add app/apps/mobile/src/components/DeleteAccountConfirmModal.tsx
git commit -m "$(cat <<'EOF'
feat(ui): DeleteAccountConfirmModal with 5 states (P2.2)

States: idle, submitting, error_recoverable, error_critical
(non-dismissible), blocked_suspended. Typed confirmation ("מחק")
gates the destructive button. RTL throughout. All strings from i18n.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

### Task G.4: Success overlay

**Files:**
- Create: `app/apps/mobile/src/components/DeleteAccountSuccessOverlay.tsx`

- [ ] **Step G.4.1: Write the component**

```tsx
// app/apps/mobile/src/components/DeleteAccountSuccessOverlay.tsx
// 1.5s fullscreen overlay shown after successful self-deletion, before
// the parent navigates to the sign-in screen.

import React from 'react';
import { Modal, Text, View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

export interface DeleteAccountSuccessOverlayProps {
  visible: boolean;
}

export function DeleteAccountSuccessOverlay({ visible }: DeleteAccountSuccessOverlayProps) {
  const { t } = useTranslation();
  if (!visible) return null;
  return (
    <Modal visible transparent animationType="fade">
      <View style={overlayStyles.root}>
        <Text style={overlayStyles.title}>{t('settings.deleteAccountModal.success.title')}</Text>
        <Text style={overlayStyles.subtitle}>{t('settings.deleteAccountModal.success.subtitle')}</Text>
      </View>
    </Modal>
  );
}

const overlayStyles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  title: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    color: '#dddddd',
    fontSize: 16,
    textAlign: 'center',
  },
});
```

- [ ] **Step G.4.2: Commit**

```bash
git add app/apps/mobile/src/components/DeleteAccountSuccessOverlay.tsx
git commit -m "feat(ui): DeleteAccountSuccessOverlay (P2.2)

1.5s fullscreen 'תודה שהיית חלק מקארמה' before redirect to sign-in.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Phase H: DI wiring + Settings screen integration

### Task H.1: Wire the use case into the user composition

**Files:**
- Modify: `app/apps/mobile/src/services/userComposition.ts`

The composition root for user-repo-backed use cases is `userComposition.ts` (singleton-getter pattern). `authComposition.ts` is for `IAuthService` use cases — `DeleteAccountUseCase` depends on `IUserRepository`, so it lives in `userComposition.ts`.

- [ ] **Step H.1.1: Add the import + singleton slot**

In `userComposition.ts`, alongside the existing `import { ... } from '@kc/application';` block, add `DeleteAccountUseCase` to the list. Add a new singleton slot near the existing slots (e.g. `let _deleteAccount: DeleteAccountUseCase | null = null;`).

- [ ] **Step H.1.2: Add the getter**

Below the existing `getUpdateProfileUseCase()` / similar getter, add:

```ts
export function getDeleteAccountUseCase(): DeleteAccountUseCase {
  if (_deleteAccount) return _deleteAccount;
  _deleteAccount = new DeleteAccountUseCase(getUserRepository());
  return _deleteAccount;
}
```

(`getUserRepository()` exists in the same file — verify the exact name when implementing.)

- [ ] **Step H.1.3: Typecheck**

```bash
pnpm --filter @kc/mobile typecheck
```

Expected: PASS.

- [ ] **Step H.1.4: Commit**

```bash
git add app/apps/mobile/src/services/userComposition.ts
git commit -m "feat(di): wire DeleteAccountUseCase into userComposition (P2.2)

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

### Task H.2: Wire settings.tsx

**Files:**
- Modify: `app/apps/mobile/app/settings.tsx`

- [ ] **Step H.2.1: Read the current settings screen**

```bash
sed -n '1,30p;150,200p' app/apps/mobile/app/settings.tsx
```

Note the imports and the structure of the existing destructive section.

- [ ] **Step H.2.2: Add imports**

At the top of `settings.tsx`, alongside existing imports, add:

```tsx
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { DeleteAccountError } from '@kc/application';
import { DeleteAccountConfirmModal } from '../src/components/DeleteAccountConfirmModal';
import { DeleteAccountSuccessOverlay } from '../src/components/DeleteAccountSuccessOverlay';
import { getDeleteAccountUseCase } from '../src/services/userComposition';
import { getSignOutUseCase } from '../src/services/authComposition';
```

(Note: existing screens may already import auth user state via a hook — keep that import as-is.)

- [ ] **Step H.2.3: Add state + handler inside the component**

Inside the settings component body (above the existing rows):

```tsx
const router = useRouter();
// existing auth-user read (likely already in the file — DO NOT duplicate):
// const { authUser } = useAuthUser();   // or however the file reads it
const [deleteVisible, setDeleteVisible] = useState(false);
const [successVisible, setSuccessVisible] = useState(false);

const handleDeleteConfirm = async () => {
  // The modal catches DeleteAccountError internally for state transitions.
  // Re-throw any error so the modal can transition; ONLY proceed past the
  // try-catch on a clean resolve.
  await getDeleteAccountUseCase().execute();
  // success path:
  setDeleteVisible(false);
  setSuccessVisible(true);
  setTimeout(async () => {
    await getSignOutUseCase().execute();
    setSuccessVisible(false);
    router.replace('/(auth)/sign-in');
  }, 1500);
};
```

(Confirm the actual sign-in route during implementation by grepping for `replace('/(auth)` or similar.)

- [ ] **Step H.2.4: Replace the empty onPress stub at line 169**

Replace:

```tsx
<SettingsRow
  label={t('settings.deleteAccount')}
  icon="trash-outline"
  destructive
  onPress={() => {}}
/>
```

with:

```tsx
<SettingsRow
  label={t('settings.deleteAccount')}
  icon="trash-outline"
  destructive
  onPress={() => setDeleteVisible(true)}
/>
```

- [ ] **Step H.2.5: Mount the modal + overlay at the end of the JSX tree**

Just before the closing tag of the screen root view, add:

```tsx
<DeleteAccountConfirmModal
  visible={deleteVisible}
  accountStatus={authUser?.accountStatus ?? null}
  onCancel={() => setDeleteVisible(false)}
  onConfirm={handleDeleteConfirm}
/>
<DeleteAccountSuccessOverlay visible={successVisible} />
```

- [ ] **Step H.2.6: Typecheck**

```bash
pnpm --filter @kc/mobile typecheck
```

Expected: PASS.

- [ ] **Step H.2.7: Commit**

```bash
git add app/apps/mobile/app/settings.tsx
git commit -m "$(cat <<'EOF'
feat(settings): wire delete-account modal + success overlay (P2.2)

settings.tsx:169 onPress now opens the confirm modal. On success
(use case resolves), the success overlay shows 1.5s before signOut
+ router.replace to sign-in. Errors propagate to the modal's
internal state machine for retry / lock-up.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Phase I: Chat infra — nullable participants downstream

### Task I.1: Loosen `participantIds` typing in row mapper

**Files:**
- Modify: `app/packages/infrastructure-supabase/src/chat/rowMappers.ts`

- [ ] **Step I.1.1: Update the mapper**

Open the file. Locate line 13:

```ts
participantIds: [r.participant_a, r.participant_b] as [string, string],
```

Change to:

```ts
participantIds: [r.participant_a ?? null, r.participant_b ?? null] as [string | null, string | null],
```

- [ ] **Step I.1.2: Update the `Chat` shape in the application port**

```bash
grep -n "participantIds" app/packages/application/src/ports/IChatRepository.ts app/packages/domain/src/**/*.ts 2>/dev/null
```

Wherever `participantIds: [string, string]` appears in domain / port types, change to `[string | null, string | null]`.

- [ ] **Step I.1.3: Audit downstream consumers**

```bash
grep -rn "participantIds\[" app/packages/ app/apps/mobile/src/ 2>/dev/null
```

For each consumer:
- If it does `===` comparison → safe.
- If it does method call like `.toLowerCase()` → wrap in `?? ''` or guard.
- If it passes to a function expecting `string` → adjust call site (e.g. `?? ''` only when the value is purely cosmetic).

Make the minimum changes needed for typecheck to pass. The most common pattern is the otherId resolution in `getMyChats.ts:52,73` and `SupabaseChatRepository.ts:166-168`:

```ts
const otherId = c.participantIds[0] === userId ? c.participantIds[1] : c.participantIds[0];
// otherId is now string | null. The downstream getCounterpart handles null by returning "משתמש שנמחק".
```

If `otherId` is then passed to a function requiring `string`, change the parameter to `string | null` or skip the call when null.

- [ ] **Step I.1.4: Typecheck the whole monorepo**

```bash
pnpm -r typecheck
```

Expected: PASS. Fix any new errors.

- [ ] **Step I.1.5: Commit**

```bash
git add app/packages/infrastructure-supabase/src/chat/rowMappers.ts app/packages/application/src/ app/packages/domain/src/ app/apps/mobile/src/
git commit -m "$(cat <<'EOF'
chore(chat): participantIds is now [string | null, string | null] (P2.2)

After migration 00YY changed chats.participant_a/b to allow NULL on
account deletion, the row mapper had a TS lie (`as [string, string]`).
Loosen the type and adjust downstream consumers — the existing
SupabaseChatRepository.getCounterpart already handles null by
returning the "משתמש שנמחק" placeholder.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

### Task I.2: Verify realtime UPDATE handling

**Files:**
- Read-only verification, plus potential modify of `app/apps/mobile/src/store/` or `app/apps/mobile/src/services/realtime/`.

- [ ] **Step I.2.1: Locate the chats realtime subscriber**

```bash
grep -rn "channel('chats'\|on('postgres_changes'.*chats" app/apps/mobile/src/ 2>/dev/null | head -10
```

Identify which file handles realtime updates to `chats`.

- [ ] **Step I.2.2: Verify NULL-participant safety**

In the handler, follow what happens when an UPDATE event arrives with `participant_a` or `participant_b` equal to NULL. Specifically:
- The chat row in local state is updated.
- Any code that resolves the counterpart should re-fall-back to "משתמש שנמחק" (the cached profile resolver should return null → display falls back).

If the handler does `.toLowerCase()` or similar on participant ids, add a guard. Otherwise no change.

- [ ] **Step I.2.3: Commit (if any changes)**

```bash
# Only if changes were made:
git add <files>
git commit -m "fix(realtime): handle NULL participant in chats UPDATE handler (P2.2)

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

If no changes — skip commit, proceed.

---

## Phase J: Manual verification + browser smoke test

### Task J.1: Start the dev server

**Files:** none.

- [ ] **Step J.1.1: Start the web preview**

Use the `preview_start` tool with the mobile web variant:

```
preview_start({ command: 'pnpm --filter @kc/mobile web' })
```

Wait for it to log "Web Bundling complete".

- [ ] **Step J.1.2: Open the preview, sign in as the dev test user**

Use `preview_eval` to navigate to sign-in if needed, then sign in with the credentials from the user's auto-memory (`super_admin_test_account.md` — for testing flow only; do NOT actually delete that account on shared dev). Use a disposable test user.

- [ ] **Step J.1.3: Snapshot settings before**

```
preview_snapshot
```

Look for the "מחק חשבון" row.

### Task J.2: Walk through the modal states

- [ ] **Step J.2.1: Open the modal**

Click "מחק חשבון" via `preview_click`. Snapshot — expect the modal with title "מחיקת חשבון לצמיתות", bullets, retention note, warning, input field, and two buttons. The delete button should be visually muted (disabled).

- [ ] **Step J.2.2: Type one character — button stays disabled**

`preview_fill` the input with "מ". Snapshot. Delete button remains disabled.

- [ ] **Step J.2.3: Complete the keyword — button enables**

`preview_fill` the input with "מחק". Snapshot. Delete button is now active red.

- [ ] **Step J.2.4: Cancel — modal closes**

Click "ביטול". Snapshot — modal gone, settings screen as before.

### Task J.3: Walk through a successful deletion

- [ ] **Step J.3.1: Use a disposable test account**

Sign up a fresh test user (NOT the super-admin). Create one post, follow another user.

- [ ] **Step J.3.2: Open delete, confirm**

Open the modal, type "מחק", click "מחק את החשבון לצמיתות". Watch the spinner, then the success overlay (1.5s), then the sign-in screen.

- [ ] **Step J.3.3: Verify DB state**

In another terminal, query:

```sql
select user_id from public.users where user_id = '<test_user_id>';
-- Expected: 0 rows
select count(*) from public.posts where owner_id = '<test_user_id>';
-- Expected: 0
select event_id, action, metadata from public.audit_events where target_id = '<test_user_id>' order by created_at desc limit 1;
-- Expected: action = 'delete_account', metadata contains actor_id_snapshot + posts_deleted
```

- [ ] **Step J.3.4: Re-signup with same email**

From sign-in, attempt sign-up with the same email. Expected: new user created, fresh state.

- [ ] **Step J.3.5: Verify chat retention on counterpart side**

Sign in as the other-user account (the one the deletee was following / chatting with). Open the chat → verify it still shows messages with "משתמש שנמחק" placeholder + default avatar.

### Task J.4: Walk through the blocked + error states

- [ ] **Step J.4.1: Block-suspended path**

Use SQL to flip a disposable user's `account_status` to `suspended_admin`. Sign in as them, open settings → delete modal. Expected: blocked state UI ("לא ניתן למחוק חשבון מושעה").

- [ ] **Step J.4.2: error_recoverable path**

Simulate a 500 from the Edge Function (one option: drop the SUPABASE_SERVICE_ROLE_KEY env var locally). Trigger delete. Expected: red banner "המחיקה נכשלה — נסה שוב"; modal still dismissible. Restore the env, retry succeeds.

- [ ] **Step J.4.3: error_critical path**

Temporarily edit the Edge Function to force the `auth_delete_failed` branch (e.g., raise after the storage step). Trigger delete. Expected:
- Red banner with the long critical message.
- Modal cannot be dismissed by tap-outside.
- Hardware back is a no-op (on Android web variant this maps to the browser back button — verify it doesn't close the modal).
- Only "נסה שוב" button is shown.

Revert the temporary edit, retry — succeeds (RPC early-return + auth delete).

- [ ] **Step J.4.4: Take a screenshot for the PR**

```
preview_screenshot
```

Save the screenshot path for the PR description.

### Task J.5: Stop the dev server

- [ ] **Step J.5.1: Stop preview**

```
preview_stop
```

---

## Phase K: SSOT updates + PR

### Task K.1: Update PROJECT_STATUS.md

**Files:**
- Modify: `docs/SSOT/PROJECT_STATUS.md`

- [ ] **Step K.1.1: Add the sprint-board row**

Open the file, find §3 Sprint Board. Append a new row matching the existing format:

```markdown
| P1.x — Delete Account V1 | agent יחיד | FR-SETTINGS-012 (חלקי) | 🟢 Done |
```

(Replace `P1.x` with the next available slot ID per the existing table.)

- [ ] **Step K.1.2: Bump the "Last Updated" date**

Update the header date to `2026-05-11`.

### Task K.2: Update HISTORY.md

**Files:**
- Modify: `docs/SSOT/HISTORY.md`

- [ ] **Step K.2.1: Append top entry**

```markdown
### 2026-05-11 — P2.2 partial: Delete Account V1 (FR-SETTINGS-012)
Immediate hard-deletion flow with chat retention via FK SET NULL.
Adds `delete_account_data()` SECURITY DEFINER RPC, `delete-account`
Edge Function (RPC → storage → auth.admin.deleteUser), typed-confirm
modal with five states (incl. non-dismissible auth_delete_failed),
and SSOT updates. Blocks suspended / banned users.
Deferred to V1.1: cooldown, purge cron, deletion email, recovery
window, orphan storage cron.
```

### Task K.3: Update TECH_DEBT.md

**Files:**
- Modify: `docs/SSOT/TECH_DEBT.md`

- [ ] **Step K.3.1: Open a new BE TD entry**

Pick the next available `TD-XX` in the BE range (50..99). Add:

```markdown
### TD-XX — Orphan storage cleanup for deleted accounts
**Origin:** P2.2 V1 (Delete Account) — `delete-account` Edge Function logs but does not retry storage cleanup failures.
**Risk:** `post-images` bucket is `public: true`. Orphan files remain world-readable until cleaned.
**Mitigation:** V1.1 cron + retry queue. For V1, log-only.
**Status:** Open.
**Refs:** docs/superpowers/specs/2026-05-11-delete-account-design.md §5.3.
```

### Task K.4: Commit all SSOT updates

- [ ] **Step K.4.1: Commit**

```bash
git add docs/SSOT/PROJECT_STATUS.md docs/SSOT/HISTORY.md docs/SSOT/TECH_DEBT.md
git commit -m "$(cat <<'EOF'
docs(ssot): P2.2 Delete Account V1 — sprint board, history, tech debt

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

### Task K.5: Push + PR

- [ ] **Step K.5.1: Push**

```bash
git push -u origin claude/priceless-nightingale-bc8397
```

- [ ] **Step K.5.2: Open PR**

```bash
gh pr create --title "feat(P2.2): delete account V1 — FR-SETTINGS-012 (partial)" --body "$(cat <<'EOF'
## Summary

Wires the existing "מחק חשבון" button to a real deletion flow per FR-SETTINGS-012 V1:

- **DB:** `delete_account_data()` SECURITY DEFINER RPC (no parameter, identity from `auth.uid()`, revoked from public + granted authenticated, blocks suspended/banned).
- **Chats:** `chats.participant_a/b` → `on delete set null` + CHECK + NULL-safe rewrites of `is_chat_visible_to`, `messages_insert_user`, `messages_update_status_recipient`, `chats_insert_self`, `chats_canonical_order`.
- **Edge Function:** `delete-account` orchestrates RPC → storage (post-images + avatars) → `auth.admin.deleteUser`. Returns `auth_delete_failed` distinctly so the client knows DB is clean but auth survived.
- **Application:** `DeleteAccountUseCase` + `DeleteAccountError` (codes: `unauthenticated` / `suspended` / `auth_delete_failed` / `network` / `server_error`).
- **UI:** Modal with five states, typed-confirm ("מחק"), non-dismissible critical-error lock, blocked-suspended copy, 1.5s success overlay before sign-in.

**Council review applied:** anon-callable RPC closure, JWT verification via `auth.getUser()`, correct bucket names (`post-images` + `avatars`), audit `actor_id_snapshot` in metadata, fixed `donation_links.submitted_by/hidden_by` handling, chat retention via FK SET NULL + RLS rewrites.

## Test plan
- [ ] Migration runs cleanly on a fresh local supabase.
- [ ] Anon call to `delete_account_data()` is rejected (42501).
- [ ] Suspended user gets 403; DB unchanged.
- [ ] Active user with posts/follows/chats: full cleanup, chat preserved on counterpart side as "משתמש שנמחק".
- [ ] Re-signup with same email → fresh account.
- [ ] error_critical state: modal non-dismissible; retry completes flow.
- [ ] Screenshots in `preview_screenshot` output attached.

Spec: docs/superpowers/specs/2026-05-11-delete-account-design.md
Plan: docs/superpowers/plans/2026-05-11-delete-account.md

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step K.5.3: Watch CI**

```bash
gh pr checks --watch
```

Expected: all checks green. If anything fails, debug, fix, push.

---

## Notes for the executor

- **Migration numbers** (Step 0.4): every time you run `git pull --rebase` against main, recheck. Renumber the two files if main introduced a new migration in between.
- **The audit `event_id` capture pattern** (Step C.1.2 — `returning event_id into v_audit_id`): standard PL/pgSQL. Don't `select` it back — that's a race.
- **The CHECK constraint name** (Step C.1.1): if your DB has a different auto-generated name, update the migration's `alter table ... drop constraint` line accordingly. The lookup query is in Step C.1.1.
- **TypeScript widening for `participantIds`** (Phase I): touching the domain type ripples widely; pause at the first 5 typecheck errors, decide whether to fan out (more changes) or narrow at the consumer site (more guards). Either approach is acceptable.
- **Edge Function deploy:** when ready to ship, the supabase CLI command is `supabase functions deploy delete-account --no-verify-jwt=false`. Ensure the function is set to require JWT verification at the gateway (the function itself also verifies — defense-in-depth).
- **The browser preview** (Phase J) is the ONLY UI verification path documented here. Native iOS/Android probably need a separate manual pass per CLAUDE.md, but V1's web variant is sufficient for the PR sign-off.
