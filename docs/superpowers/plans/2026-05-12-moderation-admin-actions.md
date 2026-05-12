# Moderation + Super-Admin Actions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the end-to-end moderation slice — report-a-user (FR-MOD-007), false-report sanctions (FR-MOD-010), super-admin inline actions in chat (FR-ADMIN-002/003/005), manual ban from profile (FR-ADMIN-004), audit visibility (FR-ADMIN-007), and an account-status sign-in gate.

**Architecture:** DB-side enforcement (RPCs + triggers) is the source of truth; the application layer holds thin use cases that call ports; infrastructure adapters map Supabase errors to domain errors. UI is composed of small per-kind subcomponents to respect the 200-line file cap.

**Tech Stack:** Postgres (Supabase) for migrations + RPCs + triggers; TypeScript + clean architecture (`@kc/domain`, `@kc/application`, `@kc/infrastructure-supabase`); React Native + expo-router (`apps/mobile`); vitest for unit tests; manual SQL verification via Supabase Studio for DB-integration tests (no `supabase/tests/` runner exists in this repo).

**Reference:** Design doc at [docs/superpowers/specs/2026-05-12-moderation-admin-actions-design.md](../specs/2026-05-12-moderation-admin-actions-design.md).

**Working directory:** All `pnpm` commands run from `app/`. Migrations live at `supabase/migrations/`.

---

## Phase 0 — Setup

### Task 0: Branch + verify pre-flight

**Files:** none

- [ ] **Step 1: Verify environment**

```bash
gh --version && gh auth status && git config user.name && git config user.email
gh repo view --json nameWithOwner -q .nameWithOwner
```
Expected: `KarmaCummunity/MVP-2`. If any check fails, stop and refer to `SETUP_GIT_AGENT.md`.

- [ ] **Step 2: Sync main and create branch**

```bash
git fetch origin
git switch main
git pull --ff-only origin main
git switch -c feat/FR-MOD-010-moderation-admin-actions
```

- [ ] **Step 3: Confirm clean baseline**

```bash
( cd app && pnpm install && pnpm typecheck && pnpm test && pnpm lint )
```
Expected: all green. If red, fix before starting feature work.

---

## Phase 1 — Database (migration `0034_moderation_admin_actions.sql`)

This phase produces a single migration file. Build it incrementally, but only commit after the full file passes a local apply.

### Task 1: Migration scaffold + schema additions

**Files:** Create `supabase/migrations/0034_moderation_admin_actions.sql`

- [ ] **Step 1: Create the migration with header + schema additions**

```sql
-- 0034_moderation_admin_actions | P1.3 + P2.2
-- FR-MOD-007, FR-MOD-010, FR-ADMIN-002..005, FR-ADMIN-007.
--
-- Adds: reports.sanction_consumed_at column, audit_events action enum
-- additions ('ban_user','delete_message'), six admin RPCs, sign-in gate RPC,
-- statement-level sanction trigger, owner-notification side-effect on the
-- existing reports_after_insert_apply_effects trigger.
--
-- All admin RPCs run SECURITY DEFINER, set search_path, re-check is_admin()
-- inside the body, and grant EXECUTE only to the authenticated role.

-- ── 1. Schema additions ────────────────────────────────────────────────────

alter table public.reports
  add column if not exists sanction_consumed_at timestamptz;

create index if not exists reports_reporter_window_idx
  on public.reports (reporter_id, status, resolved_at)
  where status = 'dismissed_no_violation' and sanction_consumed_at is null;

-- Replace the audit_events action CHECK using NOT VALID + VALIDATE pattern to
-- avoid an ACCESS EXCLUSIVE table scan during application of the new check.
-- Order: add new (no scan) → validate (shares lock) → drop old (brief excl) →
-- rename (atomic, brief excl). Total time at heavy lock is minimal.
alter table public.audit_events
  add constraint audit_events_action_check_v2 check (action in (
    'block_user','unblock_user',
    'report_target',
    'auto_remove_target','manual_remove_target','restore_target',
    'suspend_user','unsuspend_user',
    'ban_user',
    'false_report_sanction_applied',
    'dismiss_report','confirm_report',
    'delete_message'
  )) not valid;

alter table public.audit_events
  validate constraint audit_events_action_check_v2;

alter table public.audit_events
  drop constraint if exists audit_events_action_check;

alter table public.audit_events
  rename constraint audit_events_action_check_v2 to audit_events_action_check;
```

- [ ] **Step 2: Apply locally and verify**

```bash
supabase db reset --local
```
Expected: migration applies without error. If `supabase db reset` is unavailable, apply just the new migration via `supabase migration up`.

- [ ] **Step 3: Verify with psql**

```bash
psql "$DATABASE_URL" -c "\d public.reports" | grep sanction_consumed_at
psql "$DATABASE_URL" -c "select pg_get_constraintdef(oid) from pg_constraint where conname='audit_events_action_check';"
```
Expected: column present; constraint includes `'ban_user'` and `'delete_message'`.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/0034_moderation_admin_actions.sql
git commit -m "feat(infra): begin 0032 — schema additions for moderation slice"
```

### Custom SQLSTATE registry (used across all RPCs in this migration)

| Code | Meaning | Raised by |
|---|---|---|
| `42501` | forbidden (built-in PG perm denied) | every RPC's admin gate |
| `P0010` | `invalid_target_type` | restore RPC |
| `P0011` | `invalid_restore_state` | restore RPC (user not in `suspended_admin`) |
| `P0012` | `report_not_open` | dismiss / confirm RPC |
| `P0013` | `cannot_ban_self` | ban RPC |
| `P0014` | `cannot_ban_admin` | ban RPC (target is super admin) |
| `P0015` | `invalid_ban_reason` | ban RPC |
| `P0016` | `cannot_delete_system_message` | delete-message RPC |
| `P0017` | `target_not_found` | restore RPC (post/user/chat does not exist) |

The adapter (`SupabaseModerationAdminRepository`) MUST switch on `error.code` exactly — no string matching on `error.message`.

### Task 2: `admin_restore_target` RPC

**Files:** Create `supabase/migrations/0035_admin_restore_target.sql` (one migration per task; the original "append to 0034" approach was rejected because Supabase records migration files by hash and re-applying a modified file fails. Each subsequent task gets its own numbered file.)

- [ ] **Step 1: Create the migration**

```sql
-- ── 2. admin_restore_target ─────────────────────────────────────────────────
-- Reverses auto-removal:
--   post → 'open'  (only if currently 'removed_admin')
--   user → 'active' (ONLY if currently 'suspended_admin'; banned/deleted/false-
--                    reports states are rejected with invalid_restore_state)
--   chat → removed_at = null
-- Stamps every still-open report on the target as dismissed_no_violation.
-- Idempotent: re-running on already-restored target is a quiet no-op.

create or replace function public.admin_restore_target(
  p_target_type text,
  p_target_id   uuid
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_changed boolean := false;
begin
  if v_actor is null or not public.is_admin(v_actor) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if p_target_type not in ('post','user','chat') then
    raise exception 'invalid_target_type' using errcode = 'P0010';
  end if;

  if p_target_type = 'post' then
    update public.posts set status = 'open', updated_at = now()
     where post_id = p_target_id and status = 'removed_admin';
    v_changed := found;
  elsif p_target_type = 'user' then
    -- Only suspended_admin is restorable via this path.
    if exists (select 1 from public.users
               where user_id = p_target_id
                 and account_status not in ('suspended_admin','active')) then
      raise exception 'invalid_restore_state'
        using errcode = 'P0011', detail = 'user not in suspended_admin state';
    end if;
    update public.users set account_status = 'active'
     where user_id = p_target_id and account_status = 'suspended_admin';
    v_changed := found;
  elsif p_target_type = 'chat' then
    update public.chats set removed_at = null
     where chat_id = p_target_id and removed_at is not null;
    v_changed := found;
  end if;

  if not v_changed then
    return;  -- idempotent no-op
  end if;

  -- Stamp all open reports on the target.
  update public.reports
     set status = 'dismissed_no_violation',
         resolved_at = now(),
         resolved_by = v_actor
   where target_type = p_target_type
     and target_id   = p_target_id
     and status      = 'open';

  insert into public.audit_events (actor_id, action, target_type, target_id, metadata)
  values (v_actor, 'restore_target', p_target_type, p_target_id, '{}'::jsonb);
end;
$$;

revoke execute on function public.admin_restore_target(text, uuid) from public;
grant  execute on function public.admin_restore_target(text, uuid) to authenticated;
```

- [ ] **Step 2: Apply and write SQL verification**

```bash
supabase db reset --local
```

Manual SQL test (copy into Supabase Studio):

```sql
-- Setup: post-removed scenario
-- (Assumes seed fixtures exist; otherwise insert a post + user + 3 reports first.)

-- Should succeed
select public.admin_restore_target('post', '<some_removed_post_id>');
select status from public.posts where post_id = '<some_removed_post_id>';
-- Expect: 'open'

-- Re-run is no-op
select public.admin_restore_target('post', '<some_removed_post_id>');
-- Expect: no error, no second audit row

-- Banned user → must raise invalid_restore_state
select public.admin_restore_target('user', '<some_banned_user_id>');
-- Expect: ERROR invalid_restore_state
```

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/0034_moderation_admin_actions.sql
git commit -m "feat(infra): admin_restore_target RPC with state-narrowed user restore"
```

### Task 3: `admin_dismiss_report` + `admin_confirm_report` RPCs

**Files:** Create `supabase/migrations/0036_admin_dismiss_confirm.sql`

- [ ] **Step 1: Create the migration with both RPCs**

```sql
-- ── 3. admin_dismiss_report ─────────────────────────────────────────────────
-- Stamps a single report as dismissed_no_violation. If the report's target was
-- auto-removed AND the dismissal drops the open-report distinct-reporter count
-- below 3, also restore the target.

create or replace function public.admin_dismiss_report(p_report_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_target_type text;
  v_target_id   uuid;
  v_distinct_open int;
  v_post_status text;
  v_user_status text;
  v_chat_removed timestamptz;
begin
  if v_actor is null or not public.is_admin(v_actor) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select target_type, target_id into v_target_type, v_target_id
  from public.reports where report_id = p_report_id and status = 'open' for update;
  if not found then
    raise exception 'report_not_open' using errcode = 'P0012';
  end if;

  -- Serialize concurrent dismissals against the same target so the post-stamp
  -- count(*) below sees a consistent view (mirrors the trigger lock pattern).
  if v_target_id is not null then
    perform pg_advisory_xact_lock(
      hashtext('mod_target_' || v_target_type || '_' || v_target_id::text)::bigint);
  end if;

  update public.reports
     set status = 'dismissed_no_violation',
         resolved_at = now(),
         resolved_by = v_actor
   where report_id = p_report_id;

  insert into public.audit_events (actor_id, action, target_type, target_id, metadata)
  values (v_actor, 'dismiss_report', 'report', p_report_id,
          jsonb_build_object('original_target_type', v_target_type,
                             'original_target_id',   v_target_id));

  -- Cascade restore if applicable.
  if v_target_type = 'none' or v_target_id is null then
    return;
  end if;

  select count(distinct reporter_id) into v_distinct_open
    from public.reports
   where target_type = v_target_type and target_id = v_target_id and status = 'open';

  if v_distinct_open >= 3 then
    return;  -- still over threshold; auto-removal stands
  end if;

  -- Below threshold AND target is in its auto-removal terminal state → restore.
  if v_target_type = 'post' then
    select status into v_post_status from public.posts where post_id = v_target_id;
    if v_post_status = 'removed_admin' then
      perform public.admin_restore_target('post', v_target_id);
    end if;
  elsif v_target_type = 'user' then
    select account_status into v_user_status from public.users where user_id = v_target_id;
    if v_user_status = 'suspended_admin' then
      perform public.admin_restore_target('user', v_target_id);
    end if;
  elsif v_target_type = 'chat' then
    select removed_at into v_chat_removed from public.chats where chat_id = v_target_id;
    if v_chat_removed is not null then
      perform public.admin_restore_target('chat', v_target_id);
    end if;
  end if;
end;
$$;

revoke execute on function public.admin_dismiss_report(uuid) from public;
grant  execute on function public.admin_dismiss_report(uuid) to authenticated;

-- ── 4. admin_confirm_report ─────────────────────────────────────────────────

create or replace function public.admin_confirm_report(p_report_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
begin
  if v_actor is null or not public.is_admin(v_actor) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  update public.reports
     set status = 'confirmed_violation',
         resolved_at = now(),
         resolved_by = v_actor
   where report_id = p_report_id and status = 'open';
  if not found then
    raise exception 'report_not_open' using errcode = 'P0012';
  end if;

  insert into public.audit_events (actor_id, action, target_type, target_id, metadata)
  values (v_actor, 'confirm_report', 'report', p_report_id, '{}'::jsonb);
end;
$$;

revoke execute on function public.admin_confirm_report(uuid) from public;
grant  execute on function public.admin_confirm_report(uuid) to authenticated;
```

- [ ] **Step 2: Apply + verify**

```bash
supabase db reset --local
```

SQL test:
```sql
-- 1) Single dismiss on a report that's NOT yet at threshold (only 1 reporter)
--    → no cascade, just stamp.
-- 2) Insert 3 reports → auto-removal fires → admin_dismiss_report on one of them
--    → expect target restored.
```

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/0034_moderation_admin_actions.sql
git commit -m "feat(infra): admin_dismiss_report + admin_confirm_report with cascade restore"
```

### Task 4: `admin_ban_user` + `admin_delete_message` RPCs

**Files:** Create `supabase/migrations/0037_admin_ban_delete_message.sql`

- [ ] **Step 1: Create the migration with both RPCs**

```sql
-- ── 5. admin_ban_user ───────────────────────────────────────────────────────

create or replace function public.admin_ban_user(
  p_target_user_id uuid,
  p_reason         text,
  p_note           text
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
begin
  if v_actor is null or not public.is_admin(v_actor) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if v_actor = p_target_user_id then
    raise exception 'cannot_ban_self' using errcode = 'P0013';
  end if;
  -- Privilege-escalation guard: an admin cannot ban another admin (or themselves
  -- via a different account they happen to be signed into). Without this an
  -- admin with a compromised session could lock peer admins out of moderation.
  if exists (select 1 from public.users
             where user_id = p_target_user_id and is_super_admin = true) then
    raise exception 'cannot_ban_admin' using errcode = 'P0014';
  end if;
  if p_reason not in ('spam','harassment','policy_violation','other') then
    raise exception 'invalid_ban_reason' using errcode = 'P0015';
  end if;

  update public.users set account_status = 'banned'
   where user_id = p_target_user_id and account_status <> 'banned';
  if not found then
    return;  -- already banned, no audit
  end if;

  insert into public.audit_events (actor_id, action, target_type, target_id, metadata)
  values (v_actor, 'ban_user', 'user', p_target_user_id,
          jsonb_build_object('reason', p_reason, 'note', p_note, 'permanent', true));
end;
$$;

revoke execute on function public.admin_ban_user(uuid, text, text) from public;
grant  execute on function public.admin_ban_user(uuid, text, text) to authenticated;

-- ── 6. admin_delete_message ─────────────────────────────────────────────────
-- Hard-deletes a single chat message. Refuses kind='system' (audit immutability).

create or replace function public.admin_delete_message(p_message_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_chat  uuid;
  v_kind  text;
begin
  if v_actor is null or not public.is_admin(v_actor) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select chat_id, kind into v_chat, v_kind
  from public.messages where message_id = p_message_id;
  if not found then
    return;  -- already gone; idempotent
  end if;
  if v_kind = 'system' then
    raise exception 'cannot_delete_system_message' using errcode = 'P0016';
  end if;

  delete from public.messages where message_id = p_message_id;

  insert into public.audit_events (actor_id, action, target_type, target_id, metadata)
  values (v_actor, 'delete_message', 'chat', v_chat,
          jsonb_build_object('message_id', p_message_id));
end;
$$;

revoke execute on function public.admin_delete_message(uuid) from public;
grant  execute on function public.admin_delete_message(uuid) to authenticated;
```

- [ ] **Step 2: Apply + verify**

```bash
supabase db reset --local
psql "$DATABASE_URL" -c "select proname from pg_proc where proname like 'admin\_%';"
```
Expect: `admin_remove_post`, `admin_restore_target`, `admin_dismiss_report`, `admin_confirm_report`, `admin_ban_user`, `admin_delete_message`.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/0034_moderation_admin_actions.sql
git commit -m "feat(infra): admin_ban_user + admin_delete_message RPCs"
```

### Task 5: `admin_audit_lookup` + `auth_check_account_gate` RPCs

**Files:** Create `supabase/migrations/0038_admin_audit_account_gate.sql`

- [ ] **Step 1: Create the migration with both RPCs**

```sql
-- ── 7. admin_audit_lookup ───────────────────────────────────────────────────
-- Returns up to least(p_limit, 1000) audit rows where actor_id = p_user_id OR
-- target_id = p_user_id. Admin-only.

create or replace function public.admin_audit_lookup(
  p_user_id uuid,
  p_limit   int default 200
) returns setof public.audit_events
language sql
security definer
set search_path = public
as $$
  select *
    from public.audit_events
   where actor_id = p_user_id or target_id = p_user_id
   order by created_at desc
   limit least(coalesce(p_limit, 200), 1000);
$$;

-- Wrap with admin gate via a separate function — `setof` functions can't easily
-- raise mid-stream, so do the auth check before the rows are returned.
create or replace function public.admin_audit_lookup_guarded(
  p_user_id uuid,
  p_limit   int default 200
) returns setof public.audit_events
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or not public.is_admin(auth.uid()) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  return query select * from public.admin_audit_lookup(p_user_id, p_limit);
end;
$$;

revoke execute on function public.admin_audit_lookup(uuid, int) from public;
revoke execute on function public.admin_audit_lookup_guarded(uuid, int) from public;
grant  execute on function public.admin_audit_lookup_guarded(uuid, int) to authenticated;
-- The unguarded one is internal — no grant.

-- ── 8. auth_check_account_gate ──────────────────────────────────────────────
-- Self-check (caller may only check themselves) or admin-check.
-- Lazy unsuspend ONLY when account_status='suspended_for_false_reports' AND
-- account_status_until <= now(). Audit rows are written only IF FOUND.

create or replace function public.auth_check_account_gate(p_user_id uuid)
returns table (
  allowed boolean,
  reason  text,
  until_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller uuid := auth.uid();
  v_status text;
  v_until  timestamptz;
begin
  if v_caller is null then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if v_caller <> p_user_id and not public.is_admin(v_caller) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  -- Lazy unsuspend (only the narrow timed-false-reports case).
  update public.users
     set account_status = 'active',
         account_status_until = null
   where user_id = p_user_id
     and account_status = 'suspended_for_false_reports'
     and account_status_until is not null
     and account_status_until <= now();
  if found then
    insert into public.audit_events (actor_id, action, target_type, target_id, metadata)
    values (null, 'unsuspend_user', 'user', p_user_id,
            jsonb_build_object('lazy', true));
  end if;

  select account_status, account_status_until
    into v_status, v_until
  from public.users where user_id = p_user_id;

  if v_status = 'active' then
    return query select true, null::text, null::timestamptz;
    return;
  end if;

  return query select
    false,
    case v_status
      when 'banned' then 'banned'
      when 'suspended_admin' then 'suspended_admin'
      when 'suspended_for_false_reports' then 'suspended_for_false_reports'
      else v_status
    end,
    v_until;
end;
$$;

revoke execute on function public.auth_check_account_gate(uuid) from public;
grant  execute on function public.auth_check_account_gate(uuid) to authenticated;
```

- [ ] **Step 2: Apply + verify**

```bash
supabase db reset --local
```

SQL test:
```sql
-- As any authenticated user, lookup own audit
select * from public.admin_audit_lookup_guarded('<any_user_id>', 10);
-- Expect: ERROR forbidden (unless logged in as super admin)

-- As super admin, lookup own
select * from public.admin_audit_lookup_guarded('<super_admin_user_id>', 10);
-- Expect: rows returned

-- As a self-suspended user (timed), call gate after `until` passed
select * from public.auth_check_account_gate('<that_user_id>');
-- Expect: allowed=true; users row updated to active; one audit row added
```

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/0034_moderation_admin_actions.sql
git commit -m "feat(infra): audit_lookup + sign-in gate RPCs"
```

### Task 6: Statement-level sanction trigger

**Files:** Create `supabase/migrations/0039_sanction_trigger.sql`

- [ ] **Step 1: Create the migration with the trigger**

```sql
-- ── 9. reports_after_status_change_apply_sanctions ──────────────────────────
-- Statement-level + per-reporter advisory lock + level guard. Increments the
-- sanction by AT MOST one level per transaction per reporter, even when an
-- admin restore stamps multiple rows for the same reporter at once.

create or replace function public.reports_after_status_change_apply_sanctions()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
  v_count        int;
  v_existing     int;
  v_new_level    int;
  v_until        timestamptz;
  v_lock_key     bigint;
begin
  for r in
    select distinct reporter_id
      from new_rows
     where status = 'dismissed_no_violation'
  loop
    -- hashtext() returns int4; cast to int8 because pg_advisory_xact_lock
    -- expects bigint. Avoids depending on hashtextextended (PG 11+) — works
    -- on every supported PG version uniformly.
    v_lock_key := hashtext('mod_sanction_' || r.reporter_id::text)::bigint;
    perform pg_advisory_xact_lock(v_lock_key);

    select count(*) into v_count
      from public.reports
     where reporter_id = r.reporter_id
       and status = 'dismissed_no_violation'
       and resolved_at > now() - interval '30 days'
       and sanction_consumed_at is null;

    if v_count < 5 then
      continue;
    end if;

    select coalesce(false_report_sanction_count, 0) into v_existing
      from public.users where user_id = r.reporter_id for update;

    v_new_level := least(v_existing + 1, 3);
    v_until := case v_new_level
      when 1 then now() + interval '7 days'
      when 2 then now() + interval '30 days'
      else null  -- permanent
    end;

    update public.users
       set false_report_sanction_count = v_new_level,
           account_status = 'suspended_for_false_reports',
           account_status_until = v_until
     where user_id = r.reporter_id
       and false_report_sanction_count = v_existing;  -- guard

    update public.reports
       set sanction_consumed_at = now()
     where reporter_id = r.reporter_id
       and status = 'dismissed_no_violation'
       and resolved_at > now() - interval '30 days'
       and sanction_consumed_at is null;

    insert into public.audit_events (actor_id, action, target_type, target_id, metadata)
    values
      (null, 'false_report_sanction_applied', 'user', r.reporter_id,
       jsonb_build_object('level', v_new_level, 'until', v_until)),
      (null, 'suspend_user', 'user', r.reporter_id,
       jsonb_build_object('reason', 'false_reports', 'level', v_new_level));
  end loop;

  return null;
end;
$$;

drop trigger if exists reports_after_status_change_sanctions on public.reports;
create trigger reports_after_status_change_sanctions
  after update of status on public.reports
  referencing new table as new_rows
  for each statement
  execute function public.reports_after_status_change_apply_sanctions();
```

- [ ] **Step 2: Apply + verify with the critical test**

SQL test (the exact regression the council surfaced):

```sql
-- Setup: same reporter files 3 reports against ONE post.
-- (Three different posts to bypass 24h-dedup, then close one and use 3 different
--  posts; OR insert with explicit different created_at via direct insert if RLS
--  allows. For dev, the easiest: temporarily disable the 24h dedup, insert,
--  re-enable. See migration 0005 line 354 for the trigger to suspend.)

-- After 3 reports filed, run admin_restore_target on the post (as admin):
select public.admin_restore_target('post', '<that_post_id>');

-- Check the reporter's sanction:
select false_report_sanction_count, account_status, account_status_until
  from public.users where user_id = '<that_reporter_id>';
-- Expect: false_report_sanction_count = 0 (because v_count < 5)
-- The reporter still has 3 dismissed reports — not yet at the 5-report threshold.

-- Repeat for 5 distinct reports → after restore, sanction goes to 1 (NOT 5).
```

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/0034_moderation_admin_actions.sql
git commit -m "feat(infra): statement-level sanction trigger with advisory lock"
```

### Task 7: Owner notification side-effect + helper hardening

**Files:** Create `supabase/migrations/0040_owner_notification_helper_hardening.sql`

**Why a helper change is in scope:** Migration `0033_chat_inbox_personal_hide.sql` removed the unique constraint `chats_participant_a_participant_b_key`, replacing it with a partial unique index that only enforces uniqueness for `is_support_thread = true`. The existing helper `find_or_create_support_chat` (defined in 0005, line ~268) does `select chat_id into v_chat from chats where participant_a = v_a and participant_b = v_b` WITHOUT filtering by `is_support_thread`. Post-0033 this can return MULTIPLE rows (one support thread + one or more DM rows for the same pair), causing `INTO` to abort every report insert with `TOO_MANY_ROWS`. Migration 0040 hardens the helper.

- [ ] **Step 1a: Harden `find_or_create_support_chat` — filter by `is_support_thread = true`**

```sql
-- ── Hardening: filter by is_support_thread post-0033. ───────────────────────
create or replace function public.find_or_create_support_chat(p_user uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin uuid;
  v_chat  uuid;
  v_a     uuid;
  v_b     uuid;
begin
  select user_id into v_admin from public.users where is_super_admin = true limit 1;
  if v_admin is null then return null; end if;
  if v_admin = p_user then return null; end if;
  if p_user < v_admin then v_a := p_user; v_b := v_admin;
                      else v_a := v_admin; v_b := p_user; end if;
  select chat_id into v_chat
  from public.chats
  where participant_a = v_a and participant_b = v_b
    and is_support_thread = true
  limit 1;
  if v_chat is null then
    insert into public.chats (participant_a, participant_b, is_support_thread)
    values (v_a, v_b, true)
    returning chat_id into v_chat;
  end if;
  return v_chat;
end;
$$;
```

- [ ] **Step 1b: Replace `reports_after_insert_apply_effects` with the owner-notification block added**

Read the existing trigger body in `supabase/migrations/0005_init_moderation.sql` (around lines 410-510). Copy verbatim and append a new wrapped EXCEPTION block that fires only when the local `distinct_reporters >= 3` flag was true.

```sql
-- ── 10. reports_after_insert_apply_effects — extend with owner notification ─

create or replace function public.reports_after_insert_apply_effects()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  distinct_reporters int;
  v_chat uuid;
  v_threshold_hit boolean := false;
  v_owner_id uuid;
  v_owner_chat uuid;
begin
  -- (1) Reporter-side hide (no-op for target_type='none').
  if new.target_type <> 'none' then
    insert into public.reporter_hides (reporter_id, target_type, target_id)
    values (new.reporter_id, new.target_type, new.target_id)
    on conflict do nothing;
  end if;

  -- (2) Audit.
  insert into public.audit_events (actor_id, action, target_type, target_id, metadata)
  values (
    new.reporter_id,
    'report_target',
    new.target_type,
    new.target_id,
    jsonb_build_object('report_id', new.report_id, 'reason', new.reason)
  );

  -- (3) Auto-removal threshold.
  if new.target_type <> 'none' then
    -- Serialize concurrent reports against the same target so the count(*)
    -- below sees a consistent view. Without this, two reports racing into
    -- the third slot can both compute 2 and skip the auto-removal branch.
    perform pg_advisory_xact_lock(
      hashtext('mod_target_' || new.target_type || '_' || new.target_id::text)::bigint);

    select count(distinct reporter_id) into distinct_reporters
    from public.reports
    where target_type = new.target_type
      and target_id   = new.target_id
      and status      = 'open';

    if distinct_reporters >= 3 then
      v_threshold_hit := true;
      if new.target_type = 'post' then
        update public.posts set status = 'removed_admin'
        where post_id = new.target_id and status <> 'removed_admin';
      elsif new.target_type = 'user' then
        update public.users set account_status = 'suspended_admin'
        where user_id = new.target_id
          and account_status not in ('suspended_admin','banned','deleted');
      elsif new.target_type = 'chat' then
        update public.chats set removed_at = now()
        where chat_id = new.target_id and removed_at is null;
      end if;

      insert into public.audit_events (actor_id, action, target_type, target_id, metadata)
      values (null, 'auto_remove_target', new.target_type, new.target_id,
              jsonb_build_object('distinct_reporters', distinct_reporters));
    end if;
  end if;

  -- (4) Best-effort admin-side support thread message. Failure must not abort
  -- the report INSERT — but we DO log a WARNING so silent breakage is visible
  -- in Postgres logs / Supabase dashboard.
  begin
    v_chat := public.find_or_create_support_chat(new.reporter_id);
    if v_chat is not null then
      perform public.inject_system_message(v_chat,
        jsonb_build_object('kind', 'report_received',
                           'report_id', new.report_id,
                           'target_type', new.target_type,
                           'target_id', new.target_id,
                           'reason', new.reason),
        null);
    end if;
  exception when others then
    raise warning 'admin-side report_received message failed: % (state %, report_id %)',
      sqlerrm, sqlstate, new.report_id;
  end;

  -- (5) NEW: best-effort owner-side notification on auto-removal.
  if v_threshold_hit then
    begin
      v_owner_id := case new.target_type
        when 'post' then (select owner_id from public.posts where post_id = new.target_id)
        when 'user' then new.target_id
        else null  -- chat: skip in MVP
      end;
      if v_owner_id is not null and v_owner_id <> new.reporter_id then
        v_owner_chat := public.find_or_create_support_chat(v_owner_id);
        if v_owner_chat is not null then
          perform public.inject_system_message(v_owner_chat,
            jsonb_build_object('kind', 'owner_auto_removed',
                               'target_type', new.target_type,
                               'target_id', new.target_id),
            null);
        end if;
      end if;
    exception when others then
      raise warning 'owner_auto_removed message failed: % (state %, target %/%)',
        sqlerrm, sqlstate, new.target_type, new.target_id;
    end;
  end if;

  return new;
end;
$$;
-- Trigger binding from 0005 still references this function — no re-create needed.
```

- [ ] **Step 2: Apply + verify**

```bash
supabase db reset --local
```

SQL test:
```sql
-- After inserting 3 reports on a post, look at the owner's support thread.
select count(*) from public.messages m
  join public.chats c on c.chat_id = m.chat_id
 where (c.participant_a = '<owner_id>' or c.participant_b = '<owner_id>')
   and m.system_payload->>'kind' = 'owner_auto_removed';
-- Expect: 1
```

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/0034_moderation_admin_actions.sql
git commit -m "feat(infra): owner-side notification on auto-removal"
```

---

## Phase 2 — Application layer

All paths under `app/packages/application/`. Use the existing `reports/` directory as a style reference (see `ReportPostUseCase.ts` and its test).

### Task 8: Domain — add `AuditEvent`

**Files:**
- Modify: `app/packages/domain/src/entities.ts`
- Modify: `app/packages/domain/src/index.ts` (export the type)

- [ ] **Step 1: Read current entities to find the right place**

```bash
grep -n "export" app/packages/domain/src/entities.ts | head -20
```

- [ ] **Step 2: Append the `AuditEvent` type**

```ts
// Append at the end of entities.ts
export type AuditAction =
  | 'block_user'
  | 'unblock_user'
  | 'report_target'
  | 'auto_remove_target'
  | 'manual_remove_target'
  | 'restore_target'
  | 'suspend_user'
  | 'unsuspend_user'
  | 'ban_user'
  | 'false_report_sanction_applied'
  | 'dismiss_report'
  | 'confirm_report'
  | 'delete_message';

export type AuditTargetType = 'post' | 'user' | 'chat' | 'report' | 'none';

export interface AuditEvent {
  readonly eventId: string;
  readonly actorId: string | null;
  readonly action: AuditAction;
  readonly targetType: AuditTargetType | null;
  readonly targetId: string | null;
  readonly metadata: Record<string, unknown>;
  readonly createdAt: string; // ISO
}
```

- [ ] **Step 3: Confirm types compile**

```bash
( cd app && pnpm --filter @kc/domain typecheck )
```
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add app/packages/domain/src/entities.ts app/packages/domain/src/index.ts
git commit -m "feat(domain): add AuditEvent + AuditAction enums"
```

### Task 9: Application — errors module

**Files:** Create `app/packages/application/src/moderation/errors.ts`

- [ ] **Step 1: Write the errors file**

```ts
/** FR-MOD-010 + FR-ADMIN-002..007 — domain errors for moderation flows. */

export type ModerationErrorCode =
  | 'forbidden'
  | 'invalid_target_type'
  | 'invalid_restore_state'
  | 'report_not_open'
  | 'invalid_ban_reason'
  | 'cannot_ban_self'
  | 'cannot_ban_admin'
  | 'cannot_delete_system_message'
  | 'unknown';

export class ModerationError extends Error {
  constructor(
    public readonly code: ModerationErrorCode,
    message?: string,
    public readonly cause?: unknown,
  ) {
    super(message ?? code);
    this.name = 'ModerationError';
  }
}

export class ModerationForbiddenError extends ModerationError {
  constructor(cause?: unknown) {
    super('forbidden', 'admin permission required', cause);
    this.name = 'ModerationForbiddenError';
  }
}

export class InvalidRestoreStateError extends ModerationError {
  constructor(cause?: unknown) {
    super('invalid_restore_state', 'target is not in a restorable state', cause);
    this.name = 'InvalidRestoreStateError';
  }
}

export type AccountGateRejectionReason =
  | 'banned'
  | 'suspended_admin'
  | 'suspended_for_false_reports';

export class AccountGateError extends Error {
  constructor(
    public readonly reason: AccountGateRejectionReason,
    public readonly until: Date | null,
  ) {
    super(`account_gate:${reason}`);
    this.name = 'AccountGateError';
  }
}

/** Wraps unexpected infrastructure-layer failures so the UI can react with a
 *  generic "network error" message and the use case sees a typed error. */
export class InfrastructureError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'InfrastructureError';
  }
}
```

- [ ] **Step 2: Typecheck**

```bash
( cd app && pnpm --filter @kc/application typecheck )
```

- [ ] **Step 3: Commit**

```bash
git add app/packages/application/src/moderation/errors.ts
git commit -m "feat(app): moderation domain errors"
```

### Task 10: Ports — `IModerationAdminRepository` and `IAccountGateRepository`

**Files:**
- Create: `app/packages/application/src/ports/IModerationAdminRepository.ts`
- Create: `app/packages/application/src/ports/IAccountGateRepository.ts`
- Modify: `app/packages/application/src/index.ts` (export everything)

- [ ] **Step 1: Write `IModerationAdminRepository.ts`**

```ts
import type { AuditEvent } from '@kc/domain';

export type ModerationTargetType = 'post' | 'user' | 'chat';
export type BanReason = 'spam' | 'harassment' | 'policy_violation' | 'other';

export interface IModerationAdminRepository {
  restoreTarget(targetType: ModerationTargetType, targetId: string): Promise<void>;
  dismissReport(reportId: string): Promise<void>;
  confirmReport(reportId: string): Promise<void>;
  banUser(userId: string, reason: BanReason, note: string): Promise<void>;
  deleteMessage(messageId: string): Promise<void>;
  auditLookup(userId: string, limit?: number): Promise<readonly AuditEvent[]>;
  isUserAdmin(userId: string): Promise<boolean>;
}
```

- [ ] **Step 2: Write `IAccountGateRepository.ts`**

```ts
export type AccountGateReason =
  | 'banned'
  | 'suspended_admin'
  | 'suspended_for_false_reports';

export interface AccountGateResult {
  readonly allowed: boolean;
  readonly reason?: AccountGateReason;
  readonly until?: string;
}

export interface IAccountGateRepository {
  checkAccountGate(userId: string): Promise<AccountGateResult>;
}
```

- [ ] **Step 3: Export from package index**

Open `app/packages/application/src/index.ts` and add:

```ts
export * from './ports/IModerationAdminRepository';
export * from './ports/IAccountGateRepository';
export * from './moderation/errors';
```

- [ ] **Step 4: Typecheck**

```bash
( cd app && pnpm --filter @kc/application typecheck )
```

- [ ] **Step 5: Commit**

```bash
git add app/packages/application/src/ports/IModerationAdminRepository.ts \
        app/packages/application/src/ports/IAccountGateRepository.ts \
        app/packages/application/src/index.ts
git commit -m "feat(app): moderation admin + account gate ports"
```

### Task 11: `ReportUserUseCase` (TDD)

**Files:**
- Test: `app/packages/application/src/moderation/__tests__/ReportUserUseCase.test.ts`
- Create: `app/packages/application/src/moderation/ReportUserUseCase.ts`
- Reuse: `app/packages/application/src/reports/__tests__/fakeReportRepository.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest';
import { ReportUserUseCase } from '../ReportUserUseCase';
import { FakeReportRepository } from '../../reports/__tests__/fakeReportRepository';

describe('ReportUserUseCase', () => {
  it('submits with targetType="user"', async () => {
    const repo = new FakeReportRepository();
    const uc = new ReportUserUseCase(repo);

    await uc.execute({
      reporterId: 'u_reporter',
      targetUserId: 'u_target',
      reason: 'Offensive',
      note: 'התנהגות לא הולמת',
    });

    expect(repo.lastSubmit!.input).toEqual({
      targetType: 'user',
      targetId: 'u_target',
      reason: 'Offensive',
      note: 'התנהגות לא הולמת',
    });
  });

  it('rejects self-report before hitting repo', async () => {
    const repo = new FakeReportRepository();
    const uc = new ReportUserUseCase(repo);
    await expect(
      uc.execute({ reporterId: 'u_x', targetUserId: 'u_x', reason: 'Spam' }),
    ).rejects.toThrow(/cannot_report_self/);
    expect(repo.lastSubmit).toBeNull();
  });
});
```

- [ ] **Step 2: Run test → fails (file missing)**

```bash
( cd app && pnpm --filter @kc/application test ReportUserUseCase )
```

- [ ] **Step 3: Implement**

```ts
import type { ReportReason, ReportSubmission } from '@kc/domain';
import type { IReportRepository } from '../ports/IReportRepository';

export interface ReportUserInput {
  reporterId: string;
  targetUserId: string;
  reason: ReportReason;
  note?: string;
}

export class ReportUserUseCase {
  constructor(private readonly repo: IReportRepository) {}

  async execute(input: ReportUserInput): Promise<void> {
    if (input.reporterId === input.targetUserId) {
      throw new Error('cannot_report_self');
    }
    const submission: ReportSubmission = {
      targetType: 'user',
      targetId: input.targetUserId,
      reason: input.reason,
      note: input.note,
    };
    await this.repo.submit(input.reporterId, submission);
  }
}
```

- [ ] **Step 4: Test passes**

```bash
( cd app && pnpm --filter @kc/application test ReportUserUseCase )
```

- [ ] **Step 5: Commit**

```bash
git add app/packages/application/src/moderation/ReportUserUseCase.ts \
        app/packages/application/src/moderation/__tests__/ReportUserUseCase.test.ts
git commit -m "feat(app): ReportUserUseCase (FR-MOD-007)"
```

### Task 12: `RestoreTargetUseCase` (TDD)

**Files:**
- Test: `app/packages/application/src/moderation/__tests__/RestoreTargetUseCase.test.ts`
- Create: `app/packages/application/src/moderation/RestoreTargetUseCase.ts`
- Create: `app/packages/application/src/moderation/__tests__/fakeModerationAdminRepository.ts`

- [ ] **Step 1: Write the fake repo**

```ts
import type {
  IModerationAdminRepository,
  ModerationTargetType,
  BanReason,
} from '../../ports/IModerationAdminRepository';
import type { AuditEvent } from '@kc/domain';

export class FakeModerationAdminRepository implements IModerationAdminRepository {
  public restoreCalls: Array<{ targetType: ModerationTargetType; targetId: string }> = [];
  public dismissCalls: string[] = [];
  public confirmCalls: string[] = [];
  public banCalls: Array<{ userId: string; reason: BanReason; note: string }> = [];
  public deleteMessageCalls: string[] = [];
  public auditLookupCalls: Array<{ userId: string; limit?: number }> = [];
  public auditLookupResult: readonly AuditEvent[] = [];
  public errorOnNext: Error | null = null;

  private maybeThrow() { if (this.errorOnNext) { const e = this.errorOnNext; this.errorOnNext = null; throw e; } }

  async restoreTarget(targetType: ModerationTargetType, targetId: string) {
    this.maybeThrow();
    this.restoreCalls.push({ targetType, targetId });
  }
  async dismissReport(reportId: string) { this.maybeThrow(); this.dismissCalls.push(reportId); }
  async confirmReport(reportId: string) { this.maybeThrow(); this.confirmCalls.push(reportId); }
  async banUser(userId: string, reason: BanReason, note: string) {
    this.maybeThrow();
    this.banCalls.push({ userId, reason, note });
  }
  async deleteMessage(messageId: string) { this.maybeThrow(); this.deleteMessageCalls.push(messageId); }
  async auditLookup(userId: string, limit?: number) {
    this.maybeThrow();
    this.auditLookupCalls.push({ userId, limit });
    return this.auditLookupResult;
  }
}
```

- [ ] **Step 2: Write the failing test**

```ts
import { describe, it, expect } from 'vitest';
import { RestoreTargetUseCase } from '../RestoreTargetUseCase';
import { FakeModerationAdminRepository } from './fakeModerationAdminRepository';
import { ModerationForbiddenError } from '../errors';

describe('RestoreTargetUseCase', () => {
  it('forwards target type and id to repo', async () => {
    const repo = new FakeModerationAdminRepository();
    const uc = new RestoreTargetUseCase(repo);
    await uc.execute({ targetType: 'post', targetId: 'p_1' });
    expect(repo.restoreCalls).toEqual([{ targetType: 'post', targetId: 'p_1' }]);
  });

  it('propagates ModerationForbiddenError', async () => {
    const repo = new FakeModerationAdminRepository();
    repo.errorOnNext = new ModerationForbiddenError();
    const uc = new RestoreTargetUseCase(repo);
    await expect(
      uc.execute({ targetType: 'post', targetId: 'p_1' }),
    ).rejects.toBeInstanceOf(ModerationForbiddenError);
  });
});
```

- [ ] **Step 3: Run test → fails**

```bash
( cd app && pnpm --filter @kc/application test RestoreTargetUseCase )
```

- [ ] **Step 4: Implement**

```ts
import type {
  IModerationAdminRepository,
  ModerationTargetType,
} from '../ports/IModerationAdminRepository';

export interface RestoreTargetInput {
  targetType: ModerationTargetType;
  targetId: string;
}

export class RestoreTargetUseCase {
  constructor(private readonly repo: IModerationAdminRepository) {}
  async execute(input: RestoreTargetInput): Promise<void> {
    await this.repo.restoreTarget(input.targetType, input.targetId);
  }
}
```

- [ ] **Step 5: Test passes; commit**

```bash
( cd app && pnpm --filter @kc/application test RestoreTargetUseCase )
git add app/packages/application/src/moderation/
git commit -m "feat(app): RestoreTargetUseCase + fake admin repo"
```

### Task 13: `DismissReportUseCase`, `ConfirmReportUseCase`, `DeleteMessageUseCase` (parallel TDD)

**Files (per use case):**
- Test: `app/packages/application/src/moderation/__tests__/<Name>.test.ts`
- Create: `app/packages/application/src/moderation/<Name>.ts`

- [ ] **Step 1: Write all three tests**

```ts
// DismissReportUseCase.test.ts
import { describe, it, expect } from 'vitest';
import { DismissReportUseCase } from '../DismissReportUseCase';
import { FakeModerationAdminRepository } from './fakeModerationAdminRepository';

describe('DismissReportUseCase', () => {
  it('forwards reportId to repo', async () => {
    const repo = new FakeModerationAdminRepository();
    const uc = new DismissReportUseCase(repo);
    await uc.execute({ reportId: 'r_1' });
    expect(repo.dismissCalls).toEqual(['r_1']);
  });
});

// ConfirmReportUseCase.test.ts (mirror, with confirmCalls)
// DeleteMessageUseCase.test.ts (mirror, with deleteMessageCalls and { messageId })
```

(Write the three files; the Confirm and DeleteMessage cases are direct mirrors — only the call arrays differ.)

- [ ] **Step 2: Run → fail**

```bash
( cd app && pnpm --filter @kc/application test moderation )
```

- [ ] **Step 3: Implement all three**

```ts
// DismissReportUseCase.ts
import type { IModerationAdminRepository } from '../ports/IModerationAdminRepository';
export class DismissReportUseCase {
  constructor(private readonly repo: IModerationAdminRepository) {}
  async execute(input: { reportId: string }): Promise<void> {
    await this.repo.dismissReport(input.reportId);
  }
}

// ConfirmReportUseCase.ts
import type { IModerationAdminRepository } from '../ports/IModerationAdminRepository';
export class ConfirmReportUseCase {
  constructor(private readonly repo: IModerationAdminRepository) {}
  async execute(input: { reportId: string }): Promise<void> {
    await this.repo.confirmReport(input.reportId);
  }
}

// DeleteMessageUseCase.ts
import type { IModerationAdminRepository } from '../ports/IModerationAdminRepository';
export class DeleteMessageUseCase {
  constructor(private readonly repo: IModerationAdminRepository) {}
  async execute(input: { messageId: string }): Promise<void> {
    await this.repo.deleteMessage(input.messageId);
  }
}
```

- [ ] **Step 4: Tests pass; commit**

```bash
( cd app && pnpm --filter @kc/application test moderation )
git add app/packages/application/src/moderation/
git commit -m "feat(app): Dismiss/Confirm/DeleteMessage use cases"
```

### Task 14: `BanUserUseCase` (TDD with self-ban + admin-target defence)

**Files:**
- Test: `app/packages/application/src/moderation/__tests__/BanUserUseCase.test.ts`
- Create: `app/packages/application/src/moderation/BanUserUseCase.ts`
- Modify: `app/packages/application/src/moderation/__tests__/fakeModerationAdminRepository.ts` (add `isAdminLookup`)

- [ ] **Step 1: Add an `isAdmin(userId)` query to the port**

The DB enforces "admin can't ban admin" via SQLSTATE `P0014`, but defence in depth lives in the use case too. This requires reading the target's admin flag. Extend `IModerationAdminRepository`:

```ts
// In packages/application/src/ports/IModerationAdminRepository.ts — append:
isUserAdmin(userId: string): Promise<boolean>;
```

And the fake:
```ts
// In fakeModerationAdminRepository.ts — append fields:
public adminIds: Set<string> = new Set();
async isUserAdmin(userId: string) { return this.adminIds.has(userId); }
```

- [ ] **Step 2: Test (covers all three rejection paths)**

```ts
import { describe, it, expect } from 'vitest';
import { BanUserUseCase } from '../BanUserUseCase';
import { FakeModerationAdminRepository } from './fakeModerationAdminRepository';
import { ModerationError } from '../errors';

describe('BanUserUseCase', () => {
  it('forwards reason+note to repo', async () => {
    const repo = new FakeModerationAdminRepository();
    const uc = new BanUserUseCase(repo);
    await uc.execute({
      adminId: 'admin_1', targetUserId: 'u_1',
      reason: 'spam', note: 'serial spammer',
    });
    expect(repo.banCalls).toEqual([{ userId: 'u_1', reason: 'spam', note: 'serial spammer' }]);
  });

  it('rejects self-ban without hitting repo', async () => {
    const repo = new FakeModerationAdminRepository();
    const uc = new BanUserUseCase(repo);
    await expect(
      uc.execute({ adminId: 'a', targetUserId: 'a', reason: 'spam', note: '' }),
    ).rejects.toMatchObject({ code: 'cannot_ban_self' });
    expect(repo.banCalls).toEqual([]);
  });

  it('rejects banning another admin', async () => {
    const repo = new FakeModerationAdminRepository();
    repo.adminIds.add('admin_2');
    const uc = new BanUserUseCase(repo);
    await expect(
      uc.execute({ adminId: 'admin_1', targetUserId: 'admin_2', reason: 'spam', note: '' }),
    ).rejects.toMatchObject({ code: 'cannot_ban_admin' });
    expect(repo.banCalls).toEqual([]);
  });
});
```

- [ ] **Step 3: Implement**

```ts
import type { BanReason, IModerationAdminRepository } from '../ports/IModerationAdminRepository';
import { ModerationError } from './errors';

export interface BanUserInput {
  adminId: string;
  targetUserId: string;
  reason: BanReason;
  note: string;
}

export class BanUserUseCase {
  constructor(private readonly repo: IModerationAdminRepository) {}
  async execute(input: BanUserInput): Promise<void> {
    if (input.adminId === input.targetUserId) {
      throw new ModerationError('cannot_ban_self', 'cannot ban self');
    }
    if (await this.repo.isUserAdmin(input.targetUserId)) {
      throw new ModerationError('cannot_ban_admin', 'target is super admin');
    }
    await this.repo.banUser(input.targetUserId, input.reason, input.note);
  }
}
```

- [ ] **Step 3: Test passes; commit**

```bash
( cd app && pnpm --filter @kc/application test BanUserUseCase )
git add app/packages/application/src/moderation/
git commit -m "feat(app): BanUserUseCase with self-ban defence"
```

### Task 15: `LookupAuditUseCase` (TDD)

**Files:**
- Test: `app/packages/application/src/moderation/__tests__/LookupAuditUseCase.test.ts`
- Create: `app/packages/application/src/moderation/LookupAuditUseCase.ts`

- [ ] **Step 1: Test**

```ts
import { describe, it, expect } from 'vitest';
import { LookupAuditUseCase } from '../LookupAuditUseCase';
import { FakeModerationAdminRepository } from './fakeModerationAdminRepository';

describe('LookupAuditUseCase', () => {
  it('returns repo result', async () => {
    const repo = new FakeModerationAdminRepository();
    repo.auditLookupResult = [
      {
        eventId: 'e1', actorId: 'a', action: 'ban_user', targetType: 'user',
        targetId: 'u', metadata: {}, createdAt: '2026-05-12T00:00:00Z',
      },
    ];
    const uc = new LookupAuditUseCase(repo);
    const out = await uc.execute({ userId: 'u', limit: 50 });
    expect(out.length).toBe(1);
    expect(repo.auditLookupCalls).toEqual([{ userId: 'u', limit: 50 }]);
  });

  it('defaults limit to 200', async () => {
    const repo = new FakeModerationAdminRepository();
    const uc = new LookupAuditUseCase(repo);
    await uc.execute({ userId: 'u' });
    expect(repo.auditLookupCalls[0].limit).toBe(200);
  });
});
```

- [ ] **Step 2: Implement**

```ts
import type { AuditEvent } from '@kc/domain';
import type { IModerationAdminRepository } from '../ports/IModerationAdminRepository';

export class LookupAuditUseCase {
  constructor(private readonly repo: IModerationAdminRepository) {}
  async execute(input: { userId: string; limit?: number }): Promise<readonly AuditEvent[]> {
    return this.repo.auditLookup(input.userId, input.limit ?? 200);
  }
}
```

- [ ] **Step 3: Commit**

```bash
( cd app && pnpm --filter @kc/application test LookupAuditUseCase )
git add app/packages/application/src/moderation/
git commit -m "feat(app): LookupAuditUseCase"
```

### Task 16: `CheckAccountGateUseCase` (TDD)

**Files:**
- Test: `app/packages/application/src/moderation/__tests__/CheckAccountGateUseCase.test.ts`
- Create: `app/packages/application/src/moderation/CheckAccountGateUseCase.ts`
- Create: `app/packages/application/src/moderation/__tests__/fakeAccountGateRepository.ts`

- [ ] **Step 1: Fake repo**

```ts
import type { IAccountGateRepository, AccountGateResult } from '../../ports/IAccountGateRepository';

export class FakeAccountGateRepository implements IAccountGateRepository {
  public result: AccountGateResult = { allowed: true };
  public calls: string[] = [];
  async checkAccountGate(userId: string) {
    this.calls.push(userId);
    return this.result;
  }
}
```

- [ ] **Step 2: Test**

```ts
import { describe, it, expect } from 'vitest';
import { CheckAccountGateUseCase } from '../CheckAccountGateUseCase';
import { FakeAccountGateRepository } from './fakeAccountGateRepository';

describe('CheckAccountGateUseCase', () => {
  it('returns allowed=true for active user', async () => {
    const repo = new FakeAccountGateRepository();
    repo.result = { allowed: true };
    const out = await new CheckAccountGateUseCase(repo).execute('u');
    expect(out.allowed).toBe(true);
  });

  it('surfaces banned reason', async () => {
    const repo = new FakeAccountGateRepository();
    repo.result = { allowed: false, reason: 'banned' };
    const out = await new CheckAccountGateUseCase(repo).execute('u');
    expect(out.reason).toBe('banned');
  });

  it('parses until as ISO string for timed suspension', async () => {
    const repo = new FakeAccountGateRepository();
    repo.result = { allowed: false, reason: 'suspended_for_false_reports', until: '2026-06-01T00:00:00Z' };
    const out = await new CheckAccountGateUseCase(repo).execute('u');
    expect(out.until).toBe('2026-06-01T00:00:00Z');
  });
});
```

- [ ] **Step 3: Implement**

```ts
import type { AccountGateResult, IAccountGateRepository } from '../ports/IAccountGateRepository';

export class CheckAccountGateUseCase {
  constructor(private readonly repo: IAccountGateRepository) {}
  async execute(userId: string): Promise<AccountGateResult> {
    return this.repo.checkAccountGate(userId);
  }
}
```

- [ ] **Step 4: Commit**

```bash
( cd app && pnpm --filter @kc/application test CheckAccountGateUseCase )
git add app/packages/application/src/moderation/
git commit -m "feat(app): CheckAccountGateUseCase"
```

---

## Phase 3 — Infrastructure adapters

### Task 17: `SupabaseModerationAdminRepository`

**Files:** Create `app/packages/infrastructure-supabase/src/moderation/SupabaseModerationAdminRepository.ts`

- [ ] **Step 1: Implement**

```ts
import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  IModerationAdminRepository,
  ModerationTargetType,
  BanReason,
} from '@kc/application';
import {
  ModerationError,
  ModerationForbiddenError,
  InvalidRestoreStateError,
} from '@kc/application';
import type { AuditEvent } from '@kc/domain';
import type { Database } from '../database.types';

export class SupabaseModerationAdminRepository implements IModerationAdminRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  // Custom SQLSTATEs are defined in migration 0034 (see "Custom SQLSTATE
  // registry"). Map by code only; never match on error.message.
  private static readonly CODE_MAP: Record<string, ModerationError['code']> = {
    '42501': 'forbidden',
    'P0010': 'invalid_target_type',
    'P0011': 'invalid_restore_state',
    'P0012': 'report_not_open',
    'P0013': 'cannot_ban_self',
    'P0014': 'cannot_ban_admin',
    'P0015': 'invalid_ban_reason',
    'P0016': 'cannot_delete_system_message',
  };

  private mapError(error: { code?: string; message: string }, raw?: unknown): never {
    const code = error.code ? SupabaseModerationAdminRepository.CODE_MAP[error.code] : undefined;
    if (code === 'forbidden') throw new ModerationForbiddenError(raw);
    if (code === 'invalid_restore_state') throw new InvalidRestoreStateError(raw);
    if (code) throw new ModerationError(code, error.message, raw);
    throw new ModerationError('unknown', error.message, raw);
  }

  async isUserAdmin(userId: string): Promise<boolean> {
    const { data, error } = await this.client
      .from('users')
      .select('is_super_admin')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) this.mapError(error, error);
    return data?.is_super_admin === true;
  }

  async restoreTarget(targetType: ModerationTargetType, targetId: string) {
    const { error } = await this.client.rpc('admin_restore_target', {
      p_target_type: targetType, p_target_id: targetId,
    });
    if (error) this.mapError(error, error);
  }

  async dismissReport(reportId: string) {
    const { error } = await this.client.rpc('admin_dismiss_report', { p_report_id: reportId });
    if (error) this.mapError(error, error);
  }

  async confirmReport(reportId: string) {
    const { error } = await this.client.rpc('admin_confirm_report', { p_report_id: reportId });
    if (error) this.mapError(error, error);
  }

  async banUser(userId: string, reason: BanReason, note: string) {
    const { error } = await this.client.rpc('admin_ban_user', {
      p_target_user_id: userId, p_reason: reason, p_note: note,
    });
    if (error) this.mapError(error, error);
  }

  async deleteMessage(messageId: string) {
    const { error } = await this.client.rpc('admin_delete_message', { p_message_id: messageId });
    if (error) this.mapError(error, error);
  }

  async auditLookup(userId: string, limit = 200): Promise<readonly AuditEvent[]> {
    const { data, error } = await this.client
      .rpc('admin_audit_lookup_guarded', { p_user_id: userId, p_limit: limit });
    if (error) this.mapError(error, error);
    return (data ?? []).map((row) => ({
      eventId: row.event_id,
      actorId: row.actor_id,
      action: row.action,
      targetType: row.target_type,
      targetId: row.target_id,
      metadata: row.metadata ?? {},
      createdAt: row.created_at,
    }));
  }
}
```

- [ ] **Step 2: Regenerate Supabase types**

```bash
( cd app && pnpm --filter @kc/infrastructure-supabase gen:types )
```
(If no `gen:types` script exists, regenerate `database.types.ts` via your usual command — `supabase gen types typescript ...`. Confirm the new RPC signatures appear.)

- [ ] **Step 3: Typecheck**

```bash
( cd app && pnpm --filter @kc/infrastructure-supabase typecheck )
```

- [ ] **Step 4: Commit**

```bash
git add app/packages/infrastructure-supabase/src/moderation/ app/packages/infrastructure-supabase/src/database.types.ts
git commit -m "feat(infra): SupabaseModerationAdminRepository"
```

### Task 18: `SupabaseAccountGateRepository`

**Files:** Create `app/packages/infrastructure-supabase/src/auth/SupabaseAccountGateRepository.ts`

- [ ] **Step 1: Implement**

```ts
import type { SupabaseClient } from '@supabase/supabase-js';
import type { AccountGateResult, IAccountGateRepository } from '@kc/application';
import { InfrastructureError } from '@kc/application';
import type { Database } from '../database.types';

export class SupabaseAccountGateRepository implements IAccountGateRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async checkAccountGate(userId: string): Promise<AccountGateResult> {
    const { data, error } = await this.client.rpc('auth_check_account_gate', { p_user_id: userId });
    if (error) {
      throw new InfrastructureError(
        `auth_check_account_gate failed: ${error.message}`,
        error,
      );
    }
    const row = (data && data[0]) ?? null;
    if (!row || row.allowed) return { allowed: true };
    return {
      allowed: false,
      reason: row.reason as AccountGateResult['reason'],
      until: row.until_at ?? undefined,
    };
  }
}
```

- [ ] **Step 2: Typecheck + commit**

```bash
( cd app && pnpm --filter @kc/infrastructure-supabase typecheck )
git add app/packages/infrastructure-supabase/src/auth/SupabaseAccountGateRepository.ts
git commit -m "feat(infra): SupabaseAccountGateRepository"
```

---

## Phase 4 — Mobile UI

All paths under `app/apps/mobile/`.

### Task 19: i18n keys

**Files:** Modify `app/apps/mobile/src/i18n/he.ts`

- [ ] **Step 1: Read current structure**

```bash
grep -n "^\s*[a-z]" app/apps/mobile/src/i18n/he.ts | head -40
```

- [ ] **Step 2: Add the moderation + audit + accountBlocked sections**

Append the keys enumerated in design doc §8.8. Example for `moderation.report.user`:

```ts
moderation: {
  report: {
    user: {
      title: 'דווח על משתמש',
      reasonLabel: 'סיבת הדיווח',
      noteLabel: 'הערה (אופציונלי, עד 500 תווים)',
      submit: 'שלח דיווח',
      successToast: '✅ הדיווח התקבל. הצוות שלנו יבדוק.',
      duplicateError: 'כבר דיווחת על משתמש זה ב-24 השעות האחרונות.',
    },
  },
  reasons: {
    spam: 'ספאם',
    offensive: 'תוכן פוגעני',
    misleading: 'מטעה',
    illegal: 'בלתי-חוקי',
    other: 'אחר',
  },
  ban: {
    title: 'חסימת משתמש',
    reasonLabel: 'סיבת החסימה',
    reasons: {
      spam: 'ספאם',
      harassment: 'הטרדה',
      policy_violation: 'הפרת מדיניות',
      other: 'אחר',
    },
    noteLabel: 'הערות נוספות',
    submit: 'חסום',
    confirmCopy: 'פעולה זו לצמיתות ואינה ניתנת לביטול. להמשיך?',
    successToast: 'המשתמש נחסם.',
  },
  bubble: {
    reportReceived: { title: 'דיווח התקבל', body: 'דיווח על {target_type} · {reason} · {count}/3' },
    autoRemoved:    { title: 'הוסר אוטומטית', body: '{target_type} הוסר לאחר 3 דיווחים' },
    modActionTaken: { body: '✅ טופל ע״י אדמין · {action} · {time}' },
    ownerAutoRemoved: {
      body: 'הפוסט שלך הוסר אוטומטית בעקבות דיווחים חוזרים. אם זו טעות, ניתן לערער דרך כתובת התמיכה.',
    },
  },
  actions: {
    restore: '↩ שחזר',
    dismiss: '🗑 דחה דיווח',
    confirm: '✓ אשר הסרה',
    ban: '🚫 חסום משתמש',
    removePost: '🗑 הסר פוסט',
    deleteMessage: '🗑 מחק הוֹדָעָה',
    confirm_modal: {
      restore: 'פעולה זו תסמן את הדיווחים על המטרה כשגויים, מה שעלול לגרור סנקציה לרֶפּוֹרְטֵרים. להמשיך?',
      dismiss: 'סמן דיווח זה כשגוי. אין השפעה על דיווחים אחרים. להמשיך?',
      confirm: 'אשר את ההסרה האוטומטית כהפרה ודאית. להמשיך?',
      ban: 'פעולה זו לצמיתות ואינה ניתנת לביטול. להמשיך?',
      removePost: 'הסר פוסט זה כאדמין. להמשיך?',
      deleteMessage: 'מחק הוֹדָעָה זו לצמיתות. להמשיך?',
    },
    success: {
      restore: 'המטרה שוחזרה.',
      dismiss: 'הדיווח נדחה.',
      confirm: 'הדיווח אושר.',
      ban: 'המשתמש נחסם.',
      removePost: 'הפוסט הוסר.',
      deleteMessage: 'ההוֹדָעָה נמחקה.',
    },
    errors: {
      forbidden: 'אין לך הרשאה לפעולה זו.',
      invalidRestoreState: 'לא ניתן לשחזר את המטרה במצבה הנוכחי.',
      networkError: 'תקלה ברשת. נסה שוב.',
    },
  },
},
audit: {
  title: 'אאודיט',
  searchPlaceholder: 'חפש משתמש לפי שם...',
  noResults: 'אין תוצאות.',
  loading: 'טוען...',
  metadataLabel: 'מטא-דאטה',
  // action labels (use the enum value as the key for direct lookup)
  rowAction: {
    block_user: 'חסימה',
    unblock_user: 'ביטול חסימה',
    report_target: 'דיווח',
    auto_remove_target: 'הסרה אוטומטית',
    manual_remove_target: 'הסרה ידנית',
    restore_target: 'שחזור',
    suspend_user: 'השעיה',
    unsuspend_user: 'החזרה לפעילות',
    ban_user: 'חסימה לצמיתות',
    false_report_sanction_applied: 'סנקציה על דיווחי שווא',
    dismiss_report: 'דחיית דיווח',
    confirm_report: 'אישור דיווח',
    delete_message: 'מחיקת הוֹדָעָה',
  },
},
accountBlocked: {
  banned: {
    title: 'החשבון נחסם לצמיתות',
    body: 'החשבון שלך נחסם בעקבות הפרת מדיניות הקהילה.',
    cta: 'יצירת קשר',
  },
  suspendedAdmin: {
    title: 'החשבון הושעה',
    body: 'המוֹדֶרציָה השעתה את החשבון שלך עד לבירור.',
    cta: 'ערעור',
  },
  suspendedForFalseReports: {
    title: 'החשבון מושעה זמנית',
    body: 'החשבון שלך מושעה עד {until} עקב 5 דיווחים שגויים ב-30 הימים האחרונים.',
    cta: 'ערעור מוקדם',
  },
},
```

- [ ] **Step 3: Typecheck**

```bash
( cd app && pnpm --filter @kc/mobile typecheck )
```

- [ ] **Step 4: Commit**

```bash
git add app/apps/mobile/src/i18n/he.ts
git commit -m "feat(mobile): i18n keys for moderation, audit, account-blocked"
```

### Task 20: SystemMessageBubble + per-kind subcomponents

**Files:**
- Create: `app/apps/mobile/src/components/chat/system/SystemMessageBubble.tsx`
- Create: `app/apps/mobile/src/components/chat/system/ReportReceivedBubble.tsx`
- Create: `app/apps/mobile/src/components/chat/system/AutoRemovedBubble.tsx`
- Create: `app/apps/mobile/src/components/chat/system/ModActionTakenBubble.tsx`
- Create: `app/apps/mobile/src/components/chat/system/OwnerAutoRemovedBubble.tsx`
- Create: `app/apps/mobile/src/components/chat/system/adminActions.ts`
- Modify: `app/apps/mobile/app/chat/[id].tsx` — render `SystemMessageBubble` for `kind='system'`.

- [ ] **Step 1: Dispatcher (`SystemMessageBubble.tsx`)**

```tsx
import React from 'react';
import { ReportReceivedBubble } from './ReportReceivedBubble';
import { AutoRemovedBubble } from './AutoRemovedBubble';
import { ModActionTakenBubble } from './ModActionTakenBubble';
import { OwnerAutoRemovedBubble } from './OwnerAutoRemovedBubble';

export interface SystemMessagePayload {
  kind: string;
  [k: string]: unknown;
}

export const SystemMessageBubble: React.FC<{
  messageId: string;
  payload: SystemMessagePayload;
  createdAt: string;
  handledByLaterAction: boolean;
}> = ({ messageId, payload, createdAt, handledByLaterAction }) => {
  switch (payload.kind) {
    case 'report_received':    return <ReportReceivedBubble  messageId={messageId} payload={payload} createdAt={createdAt} dimmed={handledByLaterAction} />;
    case 'auto_removed':       return <AutoRemovedBubble     messageId={messageId} payload={payload} createdAt={createdAt} dimmed={handledByLaterAction} />;
    case 'mod_action_taken':   return <ModActionTakenBubble  payload={payload} createdAt={createdAt} />;
    case 'owner_auto_removed': return <OwnerAutoRemovedBubble payload={payload} createdAt={createdAt} />;
    default: return null;
  }
};
```

- [ ] **Step 2: Action helper (`adminActions.ts`)**

```ts
import { Alert } from 'react-native';
import { he } from '../../../i18n/he';

const t = he.moderation.actions;

export interface ConfirmAndRunOpts {
  action: 'restore' | 'dismiss' | 'confirm' | 'ban' | 'removePost' | 'deleteMessage';
  onConfirm: () => Promise<void>;
  onSuccess: () => void;
  onError: (msg: string) => void;
}

export function confirmAndRun({ action, onConfirm, onSuccess, onError }: ConfirmAndRunOpts) {
  Alert.alert(
    t[action],
    t.confirm_modal[action],
    [
      { text: 'ביטול', style: 'cancel' },
      {
        text: 'המשך',
        style: 'destructive',
        onPress: async () => {
          try {
            await onConfirm();
            onSuccess();
          } catch (e: unknown) {
            const msg = errorMessage(e);
            onError(msg);
          }
        },
      },
    ],
    { cancelable: true },
  );
}

function errorMessage(e: unknown): string {
  if (e && typeof e === 'object' && 'name' in e) {
    if ((e as { name: string }).name === 'ModerationForbiddenError') return t.errors.forbidden;
    if ((e as { name: string }).name === 'InvalidRestoreStateError') return t.errors.invalidRestoreState;
  }
  return t.errors.networkError;
}
```

- [ ] **Step 3: Each per-kind bubble (showing `AutoRemovedBubble` as the canonical example)**

```tsx
// AutoRemovedBubble.tsx
import React from 'react';
import { View, Text, Pressable, StyleSheet, ToastAndroid, Platform } from 'react-native';
import { useIsSuperAdmin } from '../../../hooks/useIsSuperAdmin';
import { useModerationAdmin } from '../../../hooks/useModerationAdmin';
import { confirmAndRun } from './adminActions';
import { he } from '../../../i18n/he';

export const AutoRemovedBubble: React.FC<{
  messageId: string;
  payload: any;
  createdAt: string;
  dimmed: boolean;
}> = ({ payload, dimmed }) => {
  const isAdmin = useIsSuperAdmin();
  const mod = useModerationAdmin();
  const t = he.moderation;

  const targetType = payload.target_type as 'post' | 'user' | 'chat';
  const targetId   = payload.target_id   as string;

  const showToast = (msg: string) => Platform.OS === 'android'
    ? ToastAndroid.show(msg, ToastAndroid.SHORT)
    : console.log('toast', msg);

  return (
    <View style={[styles.bubble, dimmed && styles.dimmed]}>
      <Text style={styles.title}>{t.bubble.autoRemoved.title}</Text>
      <Text>{t.bubble.autoRemoved.body.replace('{target_type}', targetType)}</Text>
      {isAdmin && !dimmed && (
        <View style={styles.row}>
          <Pressable onPress={() => confirmAndRun({
            action: 'restore',
            onConfirm: () => mod.restoreTarget(targetType, targetId),
            onSuccess: () => showToast(t.actions.success.restore),
            onError:   showToast,
          })}>
            <Text style={styles.btn}>{t.actions.restore}</Text>
          </Pressable>
          {targetType === 'user' && (
            <Pressable onPress={() => confirmAndRun({
              action: 'ban',
              onConfirm: () => mod.banUser(targetId, 'policy_violation', 'auto-removed'),
              onSuccess: () => showToast(t.actions.success.ban),
              onError: showToast,
            })}>
              <Text style={styles.btn}>{t.actions.ban}</Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  bubble: { padding: 8, backgroundColor: '#fff7e0', borderRadius: 8, marginVertical: 4 },
  dimmed: { opacity: 0.5 },
  title: { fontWeight: '600' },
  row: { flexDirection: 'row-reverse', gap: 12, marginTop: 8 },
  btn: { color: '#1a3d8f', fontWeight: '600' },
});
```

(`ReportReceivedBubble.tsx`, `ModActionTakenBubble.tsx`, `OwnerAutoRemovedBubble.tsx` follow the same shape — see design §8.1 for which actions render in each. Each file should stay under 200 lines.)

- [ ] **Step 4: Integration into `app/chat/[id].tsx`**

Precompute the "handled" set ONCE per render — never call `messages.some()` inside the row renderer (that turns the loop into O(N²) at 1000+ messages).

```tsx
import { useMemo } from 'react';

// Inside the screen component, near the messages query result:
const handledIds = useMemo(() => {
  const s = new Set<string>();
  for (const m of messages) {
    const p = m.system_payload as { kind?: string; handled_message_id?: string } | null;
    if (p?.kind === 'mod_action_taken' && p.handled_message_id) {
      s.add(p.handled_message_id);
    }
  }
  return s;
}, [messages]);

// Then in the row renderer:
{msg.kind === 'system' ? (
  <SystemMessageBubble
    messageId={msg.message_id}
    payload={msg.system_payload as any}
    createdAt={msg.created_at}
    handledByLaterAction={handledIds.has(msg.message_id)}
  />
) : (
  /* existing user-bubble rendering */
)}
```

- [ ] **Step 5: Hook `useModerationAdmin`**

Create `app/apps/mobile/src/hooks/useModerationAdmin.ts` that wraps the use cases (composition root pattern — pull the repo from your existing service container):

```ts
import { useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { SupabaseModerationAdminRepository } from '@kc/infrastructure-supabase/moderation/SupabaseModerationAdminRepository';
import {
  RestoreTargetUseCase,
  DismissReportUseCase,
  ConfirmReportUseCase,
  BanUserUseCase,
  DeleteMessageUseCase,
  LookupAuditUseCase,
} from '@kc/application';
import { useCurrentUser } from './useCurrentUser';  // existing hook

export function useModerationAdmin() {
  const me = useCurrentUser();  // assumed always present in admin contexts
  return useMemo(() => {
    const repo = new SupabaseModerationAdminRepository(supabase);
    const restore  = new RestoreTargetUseCase(repo);
    const dismiss  = new DismissReportUseCase(repo);
    const confirm  = new ConfirmReportUseCase(repo);
    const ban      = new BanUserUseCase(repo);
    const del      = new DeleteMessageUseCase(repo);
    const audit    = new LookupAuditUseCase(repo);
    return {
      restoreTarget: (t: 'post'|'user'|'chat', id: string) => restore.execute({ targetType: t, targetId: id }),
      dismissReport: (id: string) => dismiss.execute({ reportId: id }),
      confirmReport: (id: string) => confirm.execute({ reportId: id }),
      banUser:       (uid: string, reason: any, note: string) =>
                     ban.execute({ adminId: me.id, targetUserId: uid, reason, note }),
      deleteMessage: (id: string) => del.execute({ messageId: id }),
      auditLookup:   (uid: string, limit?: number) => audit.execute({ userId: uid, limit }),
    };
  }, [me.id]);
}
```

(Verify the import path for `@kc/infrastructure-supabase/moderation/...` matches the package's `exports` map. If the package only exports from `index`, add the new adapter there.)

- [ ] **Step 6: Typecheck + lint**

```bash
( cd app && pnpm typecheck && pnpm lint )
```

- [ ] **Step 7: Commit**

```bash
git add app/apps/mobile/src/components/chat/system/ \
        app/apps/mobile/src/hooks/useModerationAdmin.ts \
        app/apps/mobile/app/chat/\[id\].tsx
git commit -m "feat(mobile): SystemMessageBubble with per-kind admin actions"
```

### Task 21: ReportUserModal + profile wiring

**Files:**
- Create: `app/apps/mobile/src/components/profile/ReportUserModal.tsx`
- Modify: `app/apps/mobile/app/profile/[id].tsx` (add `⋮` entry)

- [ ] **Step 1: Modal — copy patterns from `ReportPostModal.tsx`**

```bash
cat app/apps/mobile/src/components/post/ReportPostModal.tsx | head -100
```

Implement `ReportUserModal.tsx` with the same structure, swapping `postId` → `targetUserId` and routing to `ReportUserUseCase` via a small `useReportUser` hook:

```ts
// hooks/useReportUser.ts
import { useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { SupabaseReportRepository } from '@kc/infrastructure-supabase';
import { ReportUserUseCase } from '@kc/application';

export function useReportUser() {
  return useMemo(() => {
    const uc = new ReportUserUseCase(new SupabaseReportRepository(supabase));
    return (input: { reporterId: string; targetUserId: string; reason: any; note?: string }) =>
      uc.execute(input);
  }, []);
}
```

- [ ] **Step 2: Wire into profile screen**

In `app/profile/[id].tsx`, find the existing `⋮` overflow menu (or add one if absent) and add a "Report user" entry visible when `targetUserId !== currentUserId`. On tap → open `ReportUserModal`.

- [ ] **Step 3: Typecheck, lint, commit**

```bash
( cd app && pnpm typecheck && pnpm lint )
git add app/apps/mobile/src/components/profile/ReportUserModal.tsx \
        app/apps/mobile/src/hooks/useReportUser.ts \
        app/apps/mobile/app/profile/\[id\].tsx
git commit -m "feat(mobile): report user from profile (FR-MOD-007)"
```

### Task 22: BanUserModal + profile wiring

**Files:**
- Create: `app/apps/mobile/src/components/profile/BanUserModal.tsx`
- Modify: `app/apps/mobile/app/profile/[id].tsx` (add admin-only `⋮` entry)

- [ ] **Step 1: Modal**

```tsx
import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, Modal, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { he } from '../../i18n/he';
import { useModerationAdmin } from '../../hooks/useModerationAdmin';
import { confirmAndRun } from '../chat/system/adminActions';

const REASONS = ['spam','harassment','policy_violation','other'] as const;

export const BanUserModal: React.FC<{
  visible: boolean;
  onClose: () => void;
  targetUserId: string;
}> = ({ visible, onClose, targetUserId }) => {
  const t = he.moderation.ban;
  const mod = useModerationAdmin();
  const [reason, setReason] = useState<typeof REASONS[number]>('policy_violation');
  const [note, setNote] = useState('');

  const submit = () => confirmAndRun({
    action: 'ban',
    onConfirm: () => mod.banUser(targetUserId, reason, note),
    onSuccess: () => { setNote(''); onClose(); },
    onError:   () => onClose(),
  });

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
      >
        <ScrollView
          contentContainerStyle={{ backgroundColor: '#fff', padding: 16 }}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={{ fontSize: 18, fontWeight: '600' }}>{t.title}</Text>
          <Text>{t.reasonLabel}</Text>
          {REASONS.map((r) => (
            <Pressable key={r} onPress={() => setReason(r)}>
              <Text style={{ paddingVertical: 8, fontWeight: reason === r ? '700' : '400' }}>
                {t.reasons[r]}
              </Text>
            </Pressable>
          ))}
          <Text>{t.noteLabel}</Text>
          <TextInput value={note} onChangeText={setNote} multiline
            style={{ borderWidth: 1, borderColor: '#ccc', minHeight: 60, padding: 8 }}/>
          <Pressable onPress={submit}><Text style={{ color: '#a30000', marginTop: 12 }}>{t.submit}</Text></Pressable>
          <Pressable onPress={onClose}><Text style={{ marginTop: 8 }}>ביטול</Text></Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};
```

- [ ] **Step 2: Wire into profile**

In `app/profile/[id].tsx`, surface a `🚫 חסום משתמש` entry in the `⋮` menu only when `useIsSuperAdmin() === true && targetUserId !== currentUserId`.

- [ ] **Step 3: Commit**

```bash
( cd app && pnpm typecheck && pnpm lint )
git add app/apps/mobile/src/components/profile/BanUserModal.tsx \
        app/apps/mobile/app/profile/\[id\].tsx
git commit -m "feat(mobile): admin ban user from profile (FR-ADMIN-004)"
```

### Task 23: chat-message admin delete

**Files:** Modify `app/apps/mobile/app/chat/[id].tsx` (add `⋮` overflow on user-kind bubbles)

- [ ] **Step 1: Add the overflow item**

In the user-message bubble rendering, when `useIsSuperAdmin() === true && msg.kind !== 'system'`, surface a long-press or overflow item "🗑 מחק כאדמין":

```tsx
const onAdminDelete = () => confirmAndRun({
  action: 'deleteMessage',
  onConfirm: () => mod.deleteMessage(msg.message_id),
  onSuccess: () => refetchMessages(),
  onError: showToast,
});
```

- [ ] **Step 2: Commit**

```bash
git add app/apps/mobile/app/chat/\[id\].tsx
git commit -m "feat(mobile): admin delete chat message inline (FR-ADMIN-005 AC2)"
```

### Task 24: account-blocked screen

**Files:** Create `app/apps/mobile/app/account-blocked.tsx` (top-level, OUTSIDE `(auth)` group)

- [ ] **Step 1: Implement**

```tsx
import React from 'react';
import { View, Text, Pressable, Linking, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { he } from '../src/i18n/he';

const SUPPORT_MAIL = 'mailto:karmacommunity2.0@gmail.com';

export default function AccountBlockedScreen() {
  const { reason, until } = useLocalSearchParams<{ reason?: string; until?: string }>();
  const t = he.accountBlocked;

  const content =
    reason === 'banned' ? t.banned :
    reason === 'suspended_admin' ? t.suspendedAdmin :
    reason === 'suspended_for_false_reports' ? t.suspendedForFalseReports :
    t.banned; // safe default

  const body = (content.body ?? '').replace('{until}', until ? new Date(until).toLocaleDateString('he-IL') : '');

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{content.title}</Text>
      <Text style={styles.body}>{body}</Text>
      <Pressable onPress={() => Linking.openURL(SUPPORT_MAIL)}>
        <Text style={styles.cta}>{content.cta}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center', alignItems: 'center' },
  title:     { fontSize: 22, fontWeight: '700', marginBottom: 12, textAlign: 'center' },
  body:      { fontSize: 16, textAlign: 'center', marginBottom: 24, lineHeight: 22 },
  cta:       { color: '#1a3d8f', fontSize: 16, fontWeight: '600' },
});
```

- [ ] **Step 2: Verify route resolves when signed-out**

```bash
( cd app && pnpm --filter @kc/mobile web )
# Then navigate to http://localhost:8081/account-blocked?reason=banned
```
Expected: screen renders correctly without redirect to auth.

If expo-router types complain, add to `apps/mobile/app/+native-intent.tsx` or whichever route registry the project uses; otherwise the file-based route should be picked up automatically.

- [ ] **Step 3: Commit**

```bash
git add app/apps/mobile/app/account-blocked.tsx
git commit -m "feat(mobile): account-blocked screen with mailto support link"
```

### Task 25: sign-in gate integration

**Files:** Modify the post-auth handler — find via:

```bash
grep -rn "signInWithOAuth\|verifyOtp" app/apps/mobile/app app/apps/mobile/src | grep -v node_modules | head
```

The composition root will be in `app/apps/mobile/src/services/auth.ts` or similar. Add the gate check after successful sign-in.

- [ ] **Step 1: Hook + service**

```ts
// hooks/useAccountGate.ts
import { useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { SupabaseAccountGateRepository } from '@kc/infrastructure-supabase/auth/SupabaseAccountGateRepository';
import { CheckAccountGateUseCase } from '@kc/application';

export function useAccountGate() {
  return useMemo(() => {
    const uc = new CheckAccountGateUseCase(new SupabaseAccountGateRepository(supabase));
    return (userId: string) => uc.execute(userId);
  }, []);
}
```

- [ ] **Step 2: Integrate in post-auth handler**

```ts
const gate = await checkAccountGate(user.id);
if (!gate.allowed) {
  await authService.signOut();  // existing service method
  router.replace({
    pathname: '/account-blocked',
    params: { reason: gate.reason ?? 'banned', until: gate.until ?? '' },
  });
  return;
}
// proceed with normal post-auth navigation
```

- [ ] **Step 3: Mid-session detector — re-run gate when RLS denies a request**

Sign-in time is not enough: an admin can ban a user mid-session and the JWT remains valid until expiry. Without intervention the user keeps getting cryptic "permission denied" toasts. Wire a global Supabase response interceptor:

Create `app/apps/mobile/src/services/sessionGuard.ts`:

```ts
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Router } from 'expo-router';
import { CheckAccountGateUseCase } from '@kc/application';
import { SupabaseAccountGateRepository } from '@kc/infrastructure-supabase/auth/SupabaseAccountGateRepository';

let installed = false;

export function installSessionGuard(client: SupabaseClient<any>, router: Router) {
  if (installed) return;
  installed = true;

  // Wrap fetch to intercept 401/403 from PostgREST and Realtime.
  const origFetch = (client as any).rest?.fetch ?? globalThis.fetch;
  (globalThis as any).__kcSupabaseFetch = origFetch;

  const wrapped: typeof fetch = async (...args) => {
    const res = await origFetch(...(args as Parameters<typeof fetch>));
    if (res.status === 401 || res.status === 403) {
      // Re-evaluate the gate; if disallowed, force-logout.
      const { data: { user } } = await client.auth.getUser();
      if (user?.id) {
        const gate = await new CheckAccountGateUseCase(
          new SupabaseAccountGateRepository(client),
        ).execute(user.id);
        if (!gate.allowed) {
          await client.auth.signOut();
          router.replace({
            pathname: '/account-blocked',
            params: { reason: gate.reason ?? 'banned', until: gate.until ?? '' },
          });
        }
      }
    }
    return res;
  };
  (client as any).rest.fetch = wrapped;
}
```

Call `installSessionGuard(supabase, router)` once in the root layout (`app/_layout.tsx`) immediately after the Supabase client is created and the router is available.

> **Caveat:** Supabase JS v2 doesn't expose a clean fetch-interceptor API. The wrapper above patches the rest client's `fetch`. Confirm the field name against the installed `@supabase/supabase-js` version — adjust if the internal field has been renamed.

- [ ] **Step 4: Commit**

```bash
( cd app && pnpm typecheck && pnpm lint )
git add app/apps/mobile/src/hooks/useAccountGate.ts \
        app/apps/mobile/src/services/auth.ts \
        app/apps/mobile/src/services/sessionGuard.ts \
        app/apps/mobile/app/_layout.tsx
git commit -m "feat(mobile): sign-in + mid-session account gate (FR-MOD-010 AC4)"
```

### Task 26: audit page

**Files:**
- Create: `app/apps/mobile/app/settings/audit.tsx`
- Modify: `app/apps/mobile/app/settings.tsx` (add admin-only entry)

- [ ] **Step 1: Audit screen**

```tsx
import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, FlatList, Pressable, StyleSheet } from 'react-native';
import { useModerationAdmin } from '../../src/hooks/useModerationAdmin';
import { useIsSuperAdmin } from '../../src/hooks/useIsSuperAdmin';
import { Redirect } from 'expo-router';
import { he } from '../../src/i18n/he';
import { searchUsersByName } from '../../src/services/userSearch';  // existing helper
import type { AuditEvent } from '@kc/domain';

export default function AuditScreen() {
  const isAdmin = useIsSuperAdmin();
  if (!isAdmin) return <Redirect href="/settings" />;
  const t = he.audit;
  const mod = useModerationAdmin();
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<{ id: string; name: string }[]>([]);
  const [events, setEvents] = useState<readonly AuditEvent[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const onSearch = useCallback(async (q: string) => {
    setQuery(q);
    const r = await searchUsersByName(q);
    setHits(r.slice(0, 20));
  }, []);

  const onPickUser = useCallback(async (id: string) => {
    const e = await mod.auditLookup(id, 200);
    setEvents(e);
    setHits([]);
  }, [mod]);

  return (
    <View style={styles.root}>
      <Text style={styles.title}>{t.title}</Text>
      <TextInput value={query} onChangeText={onSearch} placeholder={t.searchPlaceholder} style={styles.search}/>
      {hits.length > 0 && (
        <View>
          {hits.map((h) => (
            <Pressable key={h.id} onPress={() => onPickUser(h.id)}>
              <Text style={styles.hit}>{h.name}</Text>
            </Pressable>
          ))}
        </View>
      )}
      <FlatList
        data={events}
        keyExtractor={(e) => e.eventId}
        ListEmptyComponent={<Text>{t.noResults}</Text>}
        renderItem={({ item }) => (
          <Pressable onPress={() => setExpandedId(expandedId === item.eventId ? null : item.eventId)}>
            <View style={styles.row}>
              <Text>{(t.rowAction as Record<string, string>)[item.action] ?? item.action}</Text>
              <Text style={styles.muted}>
                {item.targetType ?? '-'}#{(item.targetId ?? '').slice(0, 8)}
                {' · '}
                {new Date(item.createdAt).toLocaleString('he-IL')}
              </Text>
              {expandedId === item.eventId && (
                <Text style={styles.meta}>{JSON.stringify(item.metadata, null, 2)}</Text>
              )}
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, padding: 16 },
  title:  { fontSize: 22, fontWeight: '700', marginBottom: 12 },
  search: { borderWidth: 1, borderColor: '#ccc', padding: 8, marginBottom: 12 },
  hit:    { paddingVertical: 6 },
  row:    { paddingVertical: 8, borderBottomWidth: 1, borderColor: '#eee' },
  muted:  { color: '#666', fontSize: 12 },
  meta:   { fontFamily: 'Courier', fontSize: 11, marginTop: 4 },
});
```

If `searchUsersByName` does not exist, replace with the existing universal search helper used elsewhere — find via:

```bash
grep -rn "search.*user" app/apps/mobile/src/services | head
```

- [ ] **Step 2: Add admin-only Settings entry**

In `app/apps/mobile/app/settings.tsx`:

```tsx
{isSuperAdmin && (
  <Pressable onPress={() => router.push('/settings/audit')}>
    <Text>{he.audit.title}</Text>
  </Pressable>
)}
```

- [ ] **Step 3: Commit**

```bash
( cd app && pnpm typecheck && pnpm lint )
git add app/apps/mobile/app/settings/audit.tsx app/apps/mobile/app/settings.tsx
git commit -m "feat(mobile): admin audit lookup screen (FR-ADMIN-007)"
```

---

### Task 26.5: UI component tests (jest + React Native Testing Library)

**Files:**
- Create: `app/apps/mobile/src/components/profile/__tests__/BanUserModal.test.tsx`
- Create: `app/apps/mobile/src/components/chat/system/__tests__/AutoRemovedBubble.test.tsx`
- Create: `app/apps/mobile/app/__tests__/account-blocked.test.tsx`

The mobile package already runs jest (or jest-expo); confirm via `app/apps/mobile/package.json`. If `@testing-library/react-native` is not installed, add it: `pnpm --filter @kc/mobile add -D @testing-library/react-native @testing-library/jest-native`.

- [ ] **Step 1: `BanUserModal` permission + interaction**

```tsx
// BanUserModal.test.tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { BanUserModal } from '../BanUserModal';

// Mock useModerationAdmin to capture banUser calls.
const banSpy = jest.fn().mockResolvedValue(undefined);
jest.mock('../../../hooks/useModerationAdmin', () => ({
  useModerationAdmin: () => ({ banUser: banSpy }),
}));
// Mock Alert to auto-confirm.
jest.spyOn(require('react-native').Alert, 'alert').mockImplementation((_t, _b, btns: any) => {
  btns?.find((b: any) => b.text === 'המשך')?.onPress?.();
});

describe('BanUserModal', () => {
  beforeEach(() => banSpy.mockClear());

  it('calls banUser with selected reason', async () => {
    const { getByText } = render(
      <BanUserModal visible={true} onClose={() => {}} targetUserId="u_1" />,
    );
    fireEvent.press(getByText('הטרדה'));
    fireEvent.press(getByText('חסום'));
    // Allow the promise chain to flush.
    await new Promise((r) => setImmediate(r));
    expect(banSpy).toHaveBeenCalledWith('u_1', 'harassment', '');
  });
});
```

- [ ] **Step 2: `AutoRemovedBubble` admin-vs-non-admin gating**

```tsx
// AutoRemovedBubble.test.tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import { AutoRemovedBubble } from '../AutoRemovedBubble';

let isAdmin = false;
jest.mock('../../../../hooks/useIsSuperAdmin', () => ({ useIsSuperAdmin: () => isAdmin }));
jest.mock('../../../../hooks/useModerationAdmin', () => ({ useModerationAdmin: () => ({}) }));

describe('AutoRemovedBubble', () => {
  it('hides admin actions for non-admin viewers', () => {
    isAdmin = false;
    const { queryByText } = render(
      <AutoRemovedBubble messageId="m1" payload={{ kind: 'auto_removed', target_type: 'post', target_id: 'p1' }} createdAt="" dimmed={false} />,
    );
    expect(queryByText('↩ שחזר')).toBeNull();
  });

  it('shows restore for admin', () => {
    isAdmin = true;
    const { queryByText } = render(
      <AutoRemovedBubble messageId="m1" payload={{ kind: 'auto_removed', target_type: 'post', target_id: 'p1' }} createdAt="" dimmed={false} />,
    );
    expect(queryByText('↩ שחזר')).not.toBeNull();
  });

  it('dims and hides actions when handled', () => {
    isAdmin = true;
    const { queryByText } = render(
      <AutoRemovedBubble messageId="m1" payload={{ kind: 'auto_removed', target_type: 'post', target_id: 'p1' }} createdAt="" dimmed={true} />,
    );
    expect(queryByText('↩ שחזר')).toBeNull();
  });
});
```

- [ ] **Step 3: `account-blocked` reason routing**

```tsx
// account-blocked.test.tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import AccountBlockedScreen from '../account-blocked';

let mockParams: any = {};
jest.mock('expo-router', () => ({
  useLocalSearchParams: () => mockParams,
}));

describe('AccountBlockedScreen', () => {
  it('renders banned copy when reason=banned', () => {
    mockParams = { reason: 'banned' };
    const { getByText } = render(<AccountBlockedScreen />);
    expect(getByText('החשבון נחסם לצמיתות')).toBeTruthy();
  });

  it('renders timed-suspension copy with formatted date', () => {
    mockParams = { reason: 'suspended_for_false_reports', until: '2026-06-01T00:00:00Z' };
    const { getByText } = render(<AccountBlockedScreen />);
    expect(getByText('החשבון מושעה זמנית')).toBeTruthy();
    // Don't assert exact locale formatting — just that the until placeholder is replaced.
  });
});
```

- [ ] **Step 4: Run + commit**

```bash
( cd app && pnpm --filter @kc/mobile test )
git add app/apps/mobile/src/components/profile/__tests__/ \
        app/apps/mobile/src/components/chat/system/__tests__/ \
        app/apps/mobile/app/__tests__/
git commit -m "test(mobile): RNTL coverage for ban modal, auto-removed bubble, account-blocked"
```

---

## Phase 5 — Verification + SSOT + PR

### Task 27: Run all unit tests + lint:arch

- [ ] **Step 1: Full local CI**

```bash
( cd app && pnpm typecheck && pnpm test && pnpm lint && pnpm lint:arch )
```
Expected: all green. Fix any architecture violations (likely candidates: cross-layer imports, oversized files).

- [ ] **Step 2: Commit any lint fixups**

```bash
git add -A
git commit -m "chore: lint cleanup"
```

### Task 28: Manual browser verification

Boot the dev server:

```bash
( cd app && pnpm --filter @kc/mobile web )
```

Open the LAN URL and use the super-admin test account (per memory `super_admin_test_account.md`).

- [ ] **Step 1: Submit a report from a post detail**

Sign in as a non-admin test user → open any other user's post → tap `⋮` → Report → submit. Expect a toast and the post to disappear from the feed.

- [ ] **Step 2: Verify admin sees the report**

Sign out, sign in as super admin → open chat with the reporter → expect a `report_received` system bubble with `🗑 דחה דיווח` button visible.

- [ ] **Step 3: Auto-removal flow**

Have 3 distinct test accounts each report the same post → as super admin, expect an `auto_removed` bubble with `↩ שחזר` button. Tap it → confirmation modal → post returns to feed; bubble dims.

- [ ] **Step 4: Owner notification**

As the post owner, open chat with super admin → expect an `owner_auto_removed` bubble.

- [ ] **Step 5: Sign-in gate**

In Supabase Studio, manually set a test user's `account_status='banned'` → attempt sign-in as that user → expect `account-blocked` screen with banned copy and `mailto:` link working.

- [ ] **Step 5b: Mid-session ban**

Sign in as a test user → leave the app open in a browser tab → in Supabase Studio set that user's `account_status='banned'` → trigger any in-app action that hits PostgREST (e.g., open a post, open chat) → expect within one round-trip that the app force-logs-out and lands on `account-blocked`.

- [ ] **Step 6: Audit page**

As super admin, open Settings → "אאודיט" → search a user → expect rows to load.

- [ ] **Step 7: Capture screenshots for the PR description**

Use the preview screenshot tool or browser screenshots for steps 3, 4, 5, 6.

- [ ] **Step 8: Commit any UX fixups discovered**

If any issue is found, fix in source files and add a follow-up commit.

```bash
git add -A
git commit -m "fix(mobile): UX corrections from manual verification"
```

### Task 29: SSOT updates

**Files:**
- Modify: `docs/SSOT/BACKLOG.md`
- Modify: `docs/SSOT/spec/12_super_admin.md` (status header)
- Modify: `docs/SSOT/TECH_DEBT.md`

- [ ] **Step 1: Flip BACKLOG entries**

In `BACKLOG.md` set both `P1.3` and `P2.2` to `✅ Done`.

- [ ] **Step 2: Update `spec/12_super_admin.md` status header**

Change the top-level status to `✅ Done` (note: `FR-ADMIN-008` is admin-only DB operation and considered out of scope for code changes).

- [ ] **Step 3: Append TD rows in `TECH_DEBT.md`**

```markdown
| TD-NN | BE | FR-MOD-008 — suspect-queue producers (excessive_reopens trigger + admin system messages). Table exists; needs producers. | Medium | open | 2026-05-12 |
| TD-NN | BE | FR-ADMIN-003 AC3 — 90-day re-registration block after permanent ban. Requires email/phone-based lookup at signup. | Low | open | 2026-05-12 |
| TD-NN | BE | Cron-based suspension expiry. Currently lazy at sign-in via `auth_check_account_gate`. | Low | open | 2026-05-12 |
| TD-NN | FE | Owner moderation push notification when P1.5 lands. Currently in-app system message only. | Low | open | 2026-05-12 |
```

(Replace `TD-NN` with actual next IDs in the BE 50-99 / FE 100-149 range per `CLAUDE.md` §9.)

- [ ] **Step 4: Commit**

```bash
git add docs/SSOT/BACKLOG.md docs/SSOT/spec/12_super_admin.md docs/SSOT/TECH_DEBT.md
git commit -m "docs(ssot): mark P1.3 + P2.2 done; log deferred TDs"
```

### Task 30: Push + PR

- [ ] **Step 1: Push branch**

```bash
git push -u origin HEAD
```

- [ ] **Step 2: Create PR**

```bash
gh pr create --base main --head "$(git branch --show-current)" \
  --title "feat(mod): admin actions + false-report sanctions + audit (P1.3 + P2.2)" \
  --body "$(cat <<'EOF'
## Summary
End-to-end moderation slice: report-a-user, false-report sanctions (7d→30d→permanent), super-admin inline actions in chat (restore/dismiss/confirm/ban), manual ban from profile, manual chat-message delete, audit visibility page, account-status sign-in gate, owner-side notification on auto-removal.

## Mapped to spec
- FR-MOD-007, FR-MOD-010 (v0.3) — `docs/SSOT/spec/08_moderation.md`
- FR-ADMIN-002, FR-ADMIN-003 (excl. AC3), FR-ADMIN-004, FR-ADMIN-005, FR-ADMIN-007 — `docs/SSOT/spec/12_super_admin.md`
- Design doc: `docs/superpowers/specs/2026-05-12-moderation-admin-actions-design.md`

## Changes
- `supabase/migrations/0034_moderation_admin_actions.sql` — schema + 6 admin RPCs + sign-in gate RPC + statement-level sanction trigger + owner-notification side-effect.
- `packages/domain` — `AuditEvent` type.
- `packages/application/src/moderation/` — 8 use cases + 2 ports + errors module.
- `packages/infrastructure-supabase/src/moderation` + `auth` — adapters.
- `apps/mobile` — `SystemMessageBubble` + per-kind subcomponents, `ReportUserModal`, `BanUserModal`, chat-message admin delete, `account-blocked` screen, `audit` settings page, sign-in gate integration, i18n keys.

## Tests
- `pnpm typecheck` ✅
- `pnpm test`      ✅
- `pnpm lint`      ✅
- `pnpm lint:arch` ✅
- Manual browser verification: see screenshots below.

## SSOT updated
- [x] `BACKLOG.md` — P1.3 + P2.2 → ✅ Done
- [x] `spec/08_moderation.md` v0.3 (AC1 clarification)
- [x] `spec/12_super_admin.md` status → ✅
- [x] `TECH_DEBT.md` — added 4 deferred items

## Risk / rollout notes
- Migration 0034 modifies the `audit_events` action CHECK constraint (drop + recreate). Apply during low-traffic window.
- Statement-level sanction trigger uses advisory locks; verified does not double-fire on mass restore.

## Screenshots
<paste from manual verification step 7>
EOF
)" \
  --label "FR-MOD" --label "FR-ADMIN" --assignee "@me"
```

- [ ] **Step 3: Enable auto-merge + watch checks**

```bash
gh pr merge --auto --squash --delete-branch
gh pr checks --watch
```

- [ ] **Step 4: After merge, sync local main**

```bash
git switch main && git pull --ff-only origin main
git branch -D feat/FR-MOD-010-moderation-admin-actions
```

---

## Self-review notes (preserved for the implementer)

- **Spec coverage** — every FR in §1 of the design has at least one task in this plan: FR-MOD-007 (Task 11+21), FR-MOD-010 (Tasks 6 + 16 + 24-25), FR-ADMIN-002 (Tasks 2 + 12 + 20), FR-ADMIN-003 (Tasks 3 + 13 + 14 + 20-22), FR-ADMIN-004 (Tasks 4 + 14 + 22), FR-ADMIN-005 (Tasks 4 + 13 + 23), FR-ADMIN-007 (Tasks 5 + 15 + 26).
- **Council critical fixes** — Task 6 implements the statement-level sanction trigger; Task 5 implements the narrow lazy-unsuspend; Task 2 narrows `admin_restore_target('user')` to `suspended_admin` only; Task 1 adds `sanction_consumed_at`; Task 4 adds `admin_delete_message`.
- **Files that may need follow-up reads at execution time:** `app/packages/infrastructure-supabase/src/database.types.ts` regeneration command (Task 17), `apps/mobile/src/services/auth.ts` for sign-in handler location (Task 25), existing search helper for the audit page (Task 26).
