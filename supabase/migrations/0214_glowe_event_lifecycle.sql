-- 0214_glowe_event_lifecycle — waitlist auto-advance, link reveal, event cancel.
--
-- Slice 5 (final) of FR-GLOWE-007 events. Three additive pieces:
--   • glowe_advance_waitlist — an AFTER UPDATE trigger (SECURITY DEFINER) that
--     promotes the next Waitlisted registrant to Accepted when a confirmed
--     (Accepted) registrant leaves (Cancelled / Declined). FIFO by
--     waitlist_position then created_at. Running as the owner lets the
--     promotion bypass the 0211 client status guard.
--   • glowe_get_event_link(opportunity) — reveals a digital event's link only to
--     the owner or an Accepted registrant, honouring link_visibility:
--     'immediate' → always; 'before_event' → only within link_reveal_hours of
--     the start. Returns null when not entitled / not yet revealed.
--   • glowe_cancel_event(opportunity) — owner-only; marks the event cancelled.
--
-- Mapped to spec: FR-GLOWE-007-C AC4/AC6 (capacity/waitlist), FR-GLOWE-007-D AC4
-- (link reveal), FR-GLOWE-007-E AC5 (event cancel). Design:
--   docs/superpowers/specs/2026-06-29-glowe-event-rsvp-org-portal-design.md.

set search_path = public;

-- ── Waitlist auto-advance ──
create or replace function public.glowe_advance_waitlist()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_next uuid;
begin
  -- Only when a confirmed spot is vacated.
  if old.status = 'Accepted' and new.status in ('Cancelled', 'Declined') then
    select id into v_next
      from public.glowe_applications
     where opportunity_id = new.opportunity_id and status = 'Waitlisted'
     order by waitlist_position asc nulls last, created_at asc
     limit 1;
    if v_next is not null then
      update public.glowe_applications
         set status = 'Accepted', waitlist_position = null, decided_at = now()
       where id = v_next;
    end if;
  end if;
  return null;
end $$;

drop trigger if exists glowe_applications_advance_waitlist on public.glowe_applications;
create trigger glowe_applications_advance_waitlist
  after update on public.glowe_applications
  for each row
  when (old.status is distinct from new.status)
  execute function public.glowe_advance_waitlist();

-- ── Digital event link reveal ──
create or replace function public.glowe_get_event_link(p_opportunity_id text)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid       uuid := auth.uid();
  v_event     public.glowe_opportunities;
  v_is_owner  boolean;
  v_accepted  boolean;
  v_reveal_at timestamptz;
begin
  if v_uid is null then return null; end if;

  select * into v_event from public.glowe_opportunities where id = p_opportunity_id;
  if not found or v_event.start_at is null then return null; end if;
  if v_event.event_type <> 'digital' or nullif(btrim(coalesce(v_event.event_link, '')), '') is null then
    return null;
  end if;

  v_is_owner := v_event.user_id = v_uid;
  select exists(
    select 1 from public.glowe_applications
     where opportunity_id = p_opportunity_id and user_id = v_uid and status = 'Accepted'
  ) into v_accepted;
  if not v_is_owner and not v_accepted then return null; end if;
  if v_is_owner then return v_event.event_link; end if;

  if coalesce(v_event.link_visibility, 'immediate') = 'immediate' then
    return v_event.event_link;
  end if;

  -- before_event: reveal only within link_reveal_hours of the start.
  v_reveal_at := v_event.start_at - make_interval(hours => coalesce(v_event.link_reveal_hours, 0));
  if now() >= v_reveal_at then return v_event.event_link; end if;
  return null;
end $$;

-- ── Organizer event cancellation ──
create or replace function public.glowe_cancel_event(p_opportunity_id text)
returns public.glowe_opportunities
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid   uuid := auth.uid();
  v_event public.glowe_opportunities;
  v_row   public.glowe_opportunities;
begin
  if v_uid is null then
    raise exception 'forbidden: sign in' using errcode = '42501';
  end if;
  select * into v_event from public.glowe_opportunities where id = p_opportunity_id;
  if not found then
    raise exception 'not found: event % does not exist', p_opportunity_id using errcode = 'P0002';
  end if;
  if v_event.user_id is distinct from v_uid then
    raise exception 'forbidden: not the event organizer' using errcode = '42501';
  end if;
  if v_event.start_at is null then
    raise exception 'invalid: opportunity % is not an event', p_opportunity_id using errcode = '22023';
  end if;

  update public.glowe_opportunities set status = 'cancelled'
   where id = p_opportunity_id
   returning * into v_row;
  return v_row;
end $$;

revoke all on function public.glowe_get_event_link(text) from public;
grant execute on function public.glowe_get_event_link(text) to authenticated;
revoke all on function public.glowe_cancel_event(text) from public;
grant execute on function public.glowe_cancel_event(text) to authenticated;
