-- 0184_support_chat_atomic_upsert.sql — TD-83.
--
-- find_or_create_support_chat (0033) used a read-then-insert that races under
-- concurrent callers (rpc_submit_support_issue 0074 + the report-trigger paths),
-- which can produce a duplicate support thread (or a unique violation on
-- chats_unique_support_pair). Port the atomic on-conflict upsert that 0070 §15.3
-- already applies to the public rpc_get_or_create_support_thread — identical
-- INSERT … ON CONFLICT clause, returning the chat_id instead of the row.

BEGIN;

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
  if v_admin is null then
    return null;
  end if;
  if v_admin = p_user then
    return null;
  end if;
  if p_user < v_admin then v_a := p_user; v_b := v_admin;
                      else v_a := v_admin; v_b := p_user; end if;
  -- Atomic upsert (TD-83): mirrors 0070 §15.3 on rpc_get_or_create_support_thread.
  -- The no-op `do update` returns the existing row on conflict (unlike DO NOTHING),
  -- so concurrent callers converge on the single chats_unique_support_pair row.
  insert into public.chats (participant_a, participant_b, is_support_thread)
  values (v_a, v_b, true)
  on conflict (participant_a, participant_b) do update
    set participant_a = excluded.participant_a
  returning chat_id into v_chat;
  return v_chat;
end;
$$;

COMMIT;
