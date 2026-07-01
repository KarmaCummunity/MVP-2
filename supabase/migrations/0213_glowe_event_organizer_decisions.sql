-- 0213_glowe_event_organizer_decisions — organizer portal read + decide (additive model).
--
-- Slice 4 of FR-GLOWE-007 events (FR-GLOWE-007-E organizer portal). Two
-- SECURITY DEFINER RPCs, both scoped to the event owner:
--   • glowe_list_event_registrations(opportunity) — the organizer's registrant
--     list, enriched with the registrant's GloWe display name + avatar, ordered
--     Pending → Waitlisted → Accepted → Declined → Cancelled then oldest-first.
--   • glowe_decide_event_registration(registration, decision, note) —
--     accept / decline a Pending or Waitlisted registration. Decline requires a
--     reason (≤ 500 chars). Accept applies capacity routing: if the event has a
--     capacity and it is already full of Accepted registrants, the registrant is
--     Waitlisted (FIFO position) instead of Accepted.
--
-- Both run as the function owner, so current_user is neither 'authenticated' nor
-- 'anon' and the 0211 status guard's privileged path lets the server-managed
-- writes (status, decided_at/by, waitlist_position, rejection_note) through.
-- Only the event owner (glowe_opportunities.user_id = auth.uid()) may call them.
--
-- Mapped to spec: FR-GLOWE-007-E (organizer portal), FR-GLOWE-012 AC7. Design:
--   docs/superpowers/specs/2026-06-29-glowe-event-rsvp-org-portal-design.md §FR-GLOWE-007-E.

set search_path = public;

-- ── Read: the organizer's registrant list ──
create or replace function public.glowe_list_event_registrations(p_opportunity_id text)
returns table (
  id                uuid,
  user_id           uuid,
  status            text,
  submitted_email   text,
  submitted_phone   text,
  submitted_comment text,
  waitlist_position int,
  rejection_note    text,
  decided_at        timestamptz,
  created_at        timestamptz,
  registrant_name   text,
  registrant_avatar text
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
    raise exception 'not found: event % does not exist', p_opportunity_id using errcode = 'P0002';
  end if;
  if v_owner is distinct from v_uid then
    raise exception 'forbidden: not the event organizer' using errcode = '42501';
  end if;

  return query
    select a.id, a.user_id, a.status, a.submitted_email, a.submitted_phone, a.submitted_comment,
           a.waitlist_position, a.rejection_note, a.decided_at, a.created_at,
           coalesce(p.display_name, u.display_name) as registrant_name,
           p.avatar_url as registrant_avatar
      from public.glowe_applications a
      left join public.glowe_profiles p on p.id = a.user_id
      left join public.users u on u.user_id = a.user_id
     where a.opportunity_id = p_opportunity_id
     order by
       case a.status
         when 'Pending'    then 0
         when 'Waitlisted' then 1
         when 'Accepted'   then 2
         when 'Declined'   then 3
         when 'Cancelled'  then 4
         else 5
       end,
       a.created_at asc;
end $$;

-- ── Write: accept / decline a registration ──
create or replace function public.glowe_decide_event_registration(
  p_registration_id uuid,
  p_decision        text,
  p_note            text default null
)
returns public.glowe_applications
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid            uuid := auth.uid();
  v_app            public.glowe_applications;
  v_event          public.glowe_opportunities;
  v_accepted_count int;
  v_next_pos       int;
  v_new_status     text;
  v_row            public.glowe_applications;
begin
  if v_uid is null then
    raise exception 'forbidden: sign in' using errcode = '42501';
  end if;
  if p_decision not in ('accept', 'decline') then
    raise exception 'invalid: decision must be accept or decline' using errcode = '22023';
  end if;

  select * into v_app from public.glowe_applications where id = p_registration_id;
  if not found then
    raise exception 'not found: registration does not exist' using errcode = 'P0002';
  end if;

  select * into v_event from public.glowe_opportunities where id = v_app.opportunity_id;
  if v_event.user_id is distinct from v_uid then
    raise exception 'forbidden: not the event organizer' using errcode = '42501';
  end if;

  if v_app.status not in ('Pending', 'Waitlisted') then
    raise exception 'invalid: registration is not awaiting a decision (status %)', v_app.status using errcode = '22023';
  end if;

  -- Decline: requires a reason.
  if p_decision = 'decline' then
    if nullif(btrim(coalesce(p_note, '')), '') is null then
      raise exception 'invalid: a rejection reason is required' using errcode = '22023';
    end if;
    if char_length(p_note) > 500 then
      raise exception 'invalid: rejection reason too long (max 500)' using errcode = '22023';
    end if;
    update public.glowe_applications
       set status = 'Declined', rejection_note = btrim(p_note),
           decided_at = now(), decided_by = v_uid, waitlist_position = null
     where id = p_registration_id
     returning * into v_row;
    return v_row;
  end if;

  -- Accept: route to Waitlisted when the event is already at capacity.
  select count(*) into v_accepted_count
    from public.glowe_applications
   where opportunity_id = v_app.opportunity_id and status = 'Accepted';

  if v_event.capacity is not null and v_accepted_count >= v_event.capacity then
    select coalesce(max(waitlist_position), 0) + 1 into v_next_pos
      from public.glowe_applications
     where opportunity_id = v_app.opportunity_id and status = 'Waitlisted';
    v_new_status := 'Waitlisted';
  else
    v_new_status := 'Accepted';
    v_next_pos   := null;
  end if;

  update public.glowe_applications
     set status = v_new_status, waitlist_position = v_next_pos, rejection_note = null,
         decided_at = now(), decided_by = v_uid
   where id = p_registration_id
   returning * into v_row;
  return v_row;
end $$;

revoke all on function public.glowe_list_event_registrations(text) from public;
grant execute on function public.glowe_list_event_registrations(text) to authenticated;
revoke all on function public.glowe_decide_event_registration(uuid, text, text) from public;
grant execute on function public.glowe_decide_event_registration(uuid, text, text) to authenticated;
