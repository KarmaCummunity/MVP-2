-- 0220_glowe_list_applications_for_opportunity — opportunity owner applicants inbox.
--
-- FR-GLOWE-012 AC1 (Phase B "My Inbox"). A SECURITY DEFINER read RPC that lets
-- the owner of a volunteer opportunity see everyone who applied to it, enriched
-- with the applicant's GloWe display name + avatar. Mirrors the owner-gated
-- pattern of `glowe_list_event_registrations` (migration 0213), but returns the
-- volunteer application fields (availability / skills / motivation) rather than
-- the event-registration contact fields.
--
-- Only the opportunity owner (glowe_opportunities.user_id = auth.uid()) may call
-- it. Applications are RLS-private to their author, so without this RPC the owner
-- could not read them; running as the function owner bypasses that safely because
-- the owner check is enforced in-function.
--
-- Ordering: Pending → Accepted → Waitlisted → Declined → Cancelled, then
-- oldest-first (so the owner triages the newest un-decided applicants at the top
-- of each status group by applied date).
--
-- Mapped to spec: FR-GLOWE-012 AC1.

set search_path = public;

create or replace function public.glowe_list_applications_for_opportunity(p_opportunity_id text)
returns table (
  id               uuid,
  user_id          uuid,
  status           text,
  availability     text,
  skills           text,
  motivation       text,
  created_at       timestamptz,
  applicant_name   text,
  applicant_avatar text,
  applicant_email  text
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid   uuid := auth.uid();
  v_owner uuid;
begin
  if v_uid is null then
    raise exception 'forbidden: sign in' using errcode = '42501';
  end if;

  select o.user_id into v_owner from public.glowe_opportunities o where o.id = p_opportunity_id;
  if not found then
    raise exception 'not found: opportunity % does not exist', p_opportunity_id using errcode = 'P0002';
  end if;
  if v_owner is distinct from v_uid then
    raise exception 'forbidden: not the opportunity owner' using errcode = '42501';
  end if;

  return query
    select a.id, a.user_id, a.status, a.availability, a.skills, a.motivation, a.created_at,
           coalesce(p.display_name, u.display_name) as applicant_name,
           p.avatar_url as applicant_avatar,
           p.email      as applicant_email
      from public.glowe_applications a
      left join public.glowe_profiles p on p.id = a.user_id
      left join public.users u on u.user_id = a.user_id
     where a.opportunity_id = p_opportunity_id
     order by
       case a.status
         when 'Pending'    then 0
         when 'Accepted'   then 1
         when 'Waitlisted' then 2
         when 'Declined'   then 3
         when 'Cancelled'  then 4
         else 5
       end,
       a.created_at asc;
end $$;

revoke all on function public.glowe_list_applications_for_opportunity(text) from public;
grant execute on function public.glowe_list_applications_for_opportunity(text) to authenticated;
