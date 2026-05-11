-- 0040_owner_notification_helper_hardening | P2.2 / FR-MOD-005 AC5 + FR-CHAT helper fix
-- Two changes wrapped in one migration because both touch the report-trigger pipeline:
--   1. Harden find_or_create_support_chat to filter by is_support_thread = true.
--      Required because 0033_chat_inbox_personal_hide removed the unique
--      constraint on (participant_a, participant_b) and replaced it with a
--      partial unique index keyed on is_support_thread = true. The existing
--      helper's SELECT INTO can now hit TOO_MANY_ROWS when a pair has both a
--      support thread and a DM, aborting every report insert.
--   2. Replace reports_after_insert_apply_effects with a body that:
--        - serialises threshold counting via pg_advisory_xact_lock per target
--        - captures threshold-hit into a local var
--        - on threshold hit, sends owner an 'owner_auto_removed' system message
--          in their own support thread (best-effort, RAISE WARNING on failure)
--      Also tightens the admin-side message block so failures emit RAISE
--      WARNING instead of silently swallowing.

-- ── 1. find_or_create_support_chat — filter by is_support_thread = true ────

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

  -- Canonical pair ordering matches chats CHECK constraint.
  if p_user < v_admin then v_a := p_user; v_b := v_admin;
                      else v_a := v_admin; v_b := p_user; end if;

  select chat_id into v_chat
    from public.chats
   where participant_a = v_a
     and participant_b = v_b
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

-- ── 2. reports_after_insert_apply_effects — owner notification + lock + warn ─

create or replace function public.reports_after_insert_apply_effects()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  distinct_reporters int;
  v_chat        uuid;
  v_threshold_hit boolean := false;
  v_owner_id    uuid;
  v_owner_chat  uuid;
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

  -- (3) Auto-removal threshold (skipped for target_type='none').
  if new.target_type <> 'none' then
    -- Serialize concurrent reports against the same target so the count below
    -- sees a consistent view. Without this, two reports racing into the third
    -- slot can both compute 2 and skip the auto-removal branch.
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

  -- (4) Best-effort admin-side support-thread message. Failure must not abort
  -- the report INSERT — but RAISE WARNING surfaces silent breakage in logs.
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

  -- (5) Best-effort owner-side notification on auto-removal.
  -- Owner = post.owner_id (post target) or the suspended user themselves
  -- (user target). Chats are skipped for MVP — both parties already know.
  if v_threshold_hit then
    begin
      v_owner_id := case new.target_type
        when 'post' then (select owner_id from public.posts where post_id = new.target_id)
        when 'user' then new.target_id
        else null
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
