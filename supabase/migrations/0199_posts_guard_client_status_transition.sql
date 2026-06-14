-- 0199_posts_guard_client_status_transition | TD-172 (security audit 2026-06-14, finding M2)
--
-- Problem (live-verified on dev):
--   Supabase's default privileges grant `authenticated` a table-wide UPDATE on
--   `public.posts`, and `posts_update_self` is an ownership-only RLS policy with
--   no column or value guard. A post owner can therefore issue a raw PostgREST
--   UPDATE that bypasses the closure state-machine entirely:
--     • `status = 'closed_delivered'`  → the `karma_on_post_change` AFTER trigger
--        mints closure karma (giver +20 / receiver +15) with no real delivery;
--     • `status = 'removed_admin'`     → fakes a moderation removal;
--     • `status = 'expired'`           → fakes the day-300 expiry;
--     • `reopen_count = 0`             → resets the reopen ceiling.
--
-- Why a blanket column-grant revoke (the 0196 pattern) does NOT work here:
--   the legitimate close-WITHOUT-recipient flow writes `status`/`delete_after`
--   directly from the client (`closureMethods.ts` → open → deleted_no_recipient),
--   so `status` must stay client-writable. The value-level transition is what
--   needs guarding, which a grant cannot express.
--
-- Fix:
--   A BEFORE UPDATE trigger that enforces the legal status-transition graph for
--   CLIENT-originated updates only. Discriminator:
--     1. `current_user <> 'authenticated'/'anon'` → trusted server context. Every
--        privileged status writer is SECURITY DEFINER owned by `postgres`
--        (admin_remove_post, admin_restore_target, rpc_recipient_unmark_self,
--        the report-effects + expiry triggers/cron) and runs as `postgres`;
--        service_role / direct postgres are operators. They may transition freely.
--     2. The three legitimate closure/reopen RPCs are SECURITY INVOKER (they run
--        as `authenticated`), so they raise a transaction-local flag immediately
--        before their own UPDATE; the trigger honours it.
--     3. Any remaining authenticated UPDATE is a raw client write: the only legal
--        client-direct status change is `open → deleted_no_recipient`, and
--        `reopen_count` may not change at all.
--
-- Side effect: `reopen_post_deleted_no_recipient` (created in 0070, SECURITY
-- INVOKER) was found MISSING on the dev DB (catalog drift — its `create` body
-- never materialised though the ledger lists 0070 as applied). Recreating it
-- here with the flag heals that drift; grants are re-asserted.
--
-- Mapped to spec: FR-CLOSURE-001..005 (closure state machine), FR-KARMA-005
--   (closure karma is server-authoritative). NA for new ACs.

set search_path = public;

-- ──────────────────────────────────────────────────────────────────────────
-- 1. Guard trigger — runs as the CALLER (security invoker) so current_user
--    reflects the real role. Must NOT be security definer.
-- ──────────────────────────────────────────────────────────────────────────
create or replace function public.posts_guard_client_status_transition()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  -- 1. Trusted server contexts (SECURITY DEFINER RPCs/triggers, cron,
  --    service_role, direct postgres) bypass. Only PostgREST clients run as
  --    'authenticated'/'anon'.
  if current_user not in ('authenticated', 'anon') then
    return new;
  end if;

  -- 2. The legitimate INVOKER closure/reopen RPCs raise this transaction-local
  --    flag right before their UPDATE (they also run as 'authenticated').
  if current_setting('kc.allow_posts_status_write', true) = 'on' then
    return new;
  end if;

  -- === remaining: a raw client UPDATE by the post owner ===

  -- 3a. reopen_count is server-managed (bumped only by the reopen RPCs).
  if new.reopen_count is distinct from old.reopen_count then
    raise exception 'posts_reopen_count_is_server_managed'
      using errcode = 'check_violation';
  end if;

  -- 3b. Status: the only client-direct transition is open -> deleted_no_recipient
  --     (close-without-recipient). closed_delivered (mints karma), removed_admin
  --     (moderation), expired (cron) and every reopen transition must go through
  --     their privileged path.
  if new.status is distinct from old.status
     and not (old.status = 'open' and new.status = 'deleted_no_recipient') then
    raise exception 'posts_illegal_status_transition'
      using errcode = 'check_violation',
            detail  = format('client status change %s -> %s is not permitted',
                             old.status, new.status);
  end if;

  return new;
end;
$$;

drop trigger if exists posts_guard_client_status_transition on public.posts;
create trigger posts_guard_client_status_transition
  before update on public.posts
  for each row
  execute function public.posts_guard_client_status_transition();

-- ──────────────────────────────────────────────────────────────────────────
-- 2. Re-create the three SECURITY INVOKER closure/reopen RPCs so each raises
--    the bypass flag before its status UPDATE. Bodies are otherwise byte-for-byte
--    the current canonical definitions (0017 / 0015 / 0070).
-- ──────────────────────────────────────────────────────────────────────────

-- 2a. close_post_with_recipient (canonical: 0017) — open -> closed_delivered.
create or replace function public.close_post_with_recipient(p_post_id uuid, p_recipient_user_id uuid)
returns public.posts
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_owner   uuid;
  v_status  text;
  v_post    public.posts;
  v_user_ok boolean;
begin
  -- Lock the post row to serialize concurrent close attempts.
  select owner_id, status into v_owner, v_status
    from public.posts
   where post_id = p_post_id
   for update;

  if v_owner is null then
    raise exception 'closure_wrong_status' using errcode = 'P0001';
  end if;
  if v_owner <> auth.uid() then
    raise exception 'closure_not_owner' using errcode = 'P0001';
  end if;
  if v_status <> 'open' then
    raise exception 'closure_wrong_status' using errcode = 'P0001';
  end if;

  -- Reject self-recipient (owner cannot mark themselves).
  if v_owner = p_recipient_user_id then
    raise exception 'closure_recipient_not_in_chat' using errcode = 'P0001';
  end if;

  -- Validate the recipient user exists.
  select exists (select 1 from public.users where user_id = p_recipient_user_id)
    into v_user_ok;
  if not v_user_ok then
    raise exception 'closure_recipient_not_in_chat' using errcode = 'P0001';
  end if;

  -- Insert recipient first (trigger fires items_received +1).
  insert into public.recipients (post_id, recipient_user_id)
       values (p_post_id, p_recipient_user_id);

  -- Authorize the status write for the guard trigger (0199), then flip status
  -- (trigger fires items_given +1).
  perform set_config('kc.allow_posts_status_write', 'on', true);
  update public.posts
     set status = 'closed_delivered',
         delete_after = null,
         updated_at = now()
   where post_id = p_post_id
   returning * into v_post;

  return v_post;
end;
$$;

-- 2b. reopen_post_marked (canonical: 0015) — closed_delivered -> open.
create or replace function public.reopen_post_marked(p_post_id uuid)
returns public.posts
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_owner   uuid;
  v_status  text;
  v_post    public.posts;
begin
  select owner_id, status into v_owner, v_status
    from public.posts
   where post_id = p_post_id
   for update;

  if v_owner is null then
    raise exception 'closure_wrong_status' using errcode = 'P0001';
  end if;
  if v_owner <> auth.uid() then
    raise exception 'closure_not_owner' using errcode = 'P0001';
  end if;
  if v_status <> 'closed_delivered' then
    raise exception 'closure_wrong_status' using errcode = 'P0001';
  end if;

  -- Delete the recipient row (trigger fires items_received -1).
  delete from public.recipients where post_id = p_post_id;

  -- Authorize the status write for the guard trigger (0199), then flip status
  -- back to open + bump reopen_count (trigger fires items_given -1).
  perform set_config('kc.allow_posts_status_write', 'on', true);
  update public.posts
     set status = 'open',
         reopen_count = reopen_count + 1,
         delete_after = null,
         updated_at = now()
   where post_id = p_post_id
   returning * into v_post;

  return v_post;
end;
$$;

-- 2c. reopen_post_deleted_no_recipient (canonical: 0070; recreated to heal
--     dev-DB drift) — deleted_no_recipient -> open.
create or replace function public.reopen_post_deleted_no_recipient(p_post_id uuid)
returns public.posts
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_owner   uuid;
  v_status  text;
  v_post    public.posts;
begin
  select owner_id, status into v_owner, v_status
    from public.posts
   where post_id = p_post_id
   for update;

  if v_owner is null then
    raise exception 'closure_wrong_status' using errcode = 'P0001';
  end if;
  if v_owner <> auth.uid() then
    raise exception 'closure_not_owner' using errcode = 'P0001';
  end if;
  if v_status <> 'deleted_no_recipient' then
    raise exception 'closure_wrong_status' using errcode = 'P0001';
  end if;

  -- Authorize the status write for the guard trigger (0199), then flip status
  -- back to open + bump reopen_count (trigger fires items_given -1).
  perform set_config('kc.allow_posts_status_write', 'on', true);
  update public.posts
     set status = 'open',
         reopen_count = reopen_count + 1,
         delete_after = null,
         updated_at = now()
   where post_id = p_post_id
   returning * into v_post;

  return v_post;
end;
$$;

revoke execute on function public.reopen_post_deleted_no_recipient(uuid) from public;
grant  execute on function public.reopen_post_deleted_no_recipient(uuid) to authenticated;

comment on function public.posts_guard_client_status_transition() is
  'TD-172: rejects illegal client-direct posts.status transitions + reopen_count rewrites. Trusted server roles and the flagged closure/reopen RPCs bypass.';
