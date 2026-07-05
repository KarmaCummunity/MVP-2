-- 0221_glowe_update_application_status — opportunity owner accept/decline.
--
-- FR-GLOWE-012 AC2 (Phase B "My Inbox"). A SECURITY DEFINER write RPC that lets
-- the owner of a volunteer opportunity accept or decline an application. Mirrors
-- the decision half of `glowe_decide_event_registration` (migration 0213) but
-- simpler: plain volunteer applications have no capacity routing and no required
-- rejection reason, so the owner just moves status to 'Accepted' or 'Declined'.
--
-- Only the opportunity owner (glowe_opportunities.user_id = auth.uid()) may call
-- it. Applications are RLS-private to their author and the 0211 status guard
-- blocks clients from self-deciding; running as the function owner bypasses that
-- safely because the owner check is enforced in-function.
--
-- Mapped to spec: FR-GLOWE-012 AC2.

set search_path = public;

create or replace function public.glowe_update_application_status(
  p_application_id uuid,
  p_decision       text
)
returns public.glowe_applications
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid   uuid := auth.uid();
  v_app   public.glowe_applications;
  v_owner uuid;
  v_row   public.glowe_applications;
begin
  if v_uid is null then
    raise exception 'forbidden: sign in' using errcode = '42501';
  end if;
  if p_decision not in ('Accepted', 'Declined') then
    raise exception 'invalid: decision must be Accepted or Declined' using errcode = '22023';
  end if;

  select * into v_app from public.glowe_applications where id = p_application_id;
  if not found then
    raise exception 'not found: application does not exist' using errcode = 'P0002';
  end if;

  select o.user_id into v_owner from public.glowe_opportunities o where o.id = v_app.opportunity_id;
  if v_owner is distinct from v_uid then
    raise exception 'forbidden: not the opportunity owner' using errcode = '42501';
  end if;

  update public.glowe_applications
     set status = p_decision
   where id = p_application_id
   returning * into v_row;
  return v_row;
end $$;

revoke all on function public.glowe_update_application_status(uuid, text) from public;
grant execute on function public.glowe_update_application_status(uuid, text) to authenticated;
