-- 0035_admin_restore_target | P2.2 / FR-ADMIN-002
-- Reverses auto-removal performed by reports_after_insert_apply_effects:
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
