-- 0212_glowe_event_registration — server-side RSVP entry point (additive model).
--
-- Slice 3 of FR-GLOWE-007 events. Individuals register for an event through one
-- SECURITY DEFINER RPC instead of writing glowe_applications directly. The RPC:
--   • requires an authenticated caller (auth.uid());
--   • validates the target opportunity is an Event (start_at set), is 'active',
--     and has not already ended;
--   • routes by registration_mode: 'open' → instant 'Accepted'; 'gated' → 'Pending';
--   • stores the submitted contact fields and (for open mode) stamps decided_at.
--
-- Running as the function owner means current_user is neither 'authenticated' nor
-- 'anon', so the 0211 status guard's privileged path lets the 'Accepted' insert
-- through. Gated mode still produces a plain 'Pending' row, identical to what a
-- client could insert directly under RLS — the RPC just unifies both paths and
-- enforces event-state validation a client cannot be trusted to do.
--
-- Mapped to spec: FR-GLOWE-007-C (registration flow). Design:
--   docs/superpowers/specs/2026-06-29-glowe-event-rsvp-org-portal-design.md §4 FR-GLOWE-007-C.

set search_path = public;

create or replace function public.glowe_register_for_event(
  p_opportunity_id text,
  p_email          text default null,
  p_phone          text default null,
  p_comment        text default null
)
returns public.glowe_applications
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid    uuid := auth.uid();
  v_event  public.glowe_opportunities;
  v_status text;
  v_row    public.glowe_applications;
begin
  if v_uid is null then
    raise exception 'forbidden: sign in to register' using errcode = '42501';
  end if;

  select * into v_event from public.glowe_opportunities where id = p_opportunity_id;
  if not found then
    raise exception 'not found: event % does not exist', p_opportunity_id using errcode = 'P0002';
  end if;
  if v_event.start_at is null then
    raise exception 'invalid: opportunity % is not an event', p_opportunity_id using errcode = '22023';
  end if;
  if v_event.status <> 'active' then
    raise exception 'closed: event is not open for registration' using errcode = '22023';
  end if;
  if coalesce(v_event.end_at, v_event.start_at) < now() then
    raise exception 'closed: event has already ended' using errcode = '22023';
  end if;

  v_status := case when v_event.registration_mode = 'open' then 'Accepted' else 'Pending' end;

  begin
    insert into public.glowe_applications (
      user_id, opportunity_id, status,
      submitted_email, submitted_phone, submitted_comment,
      decided_at
    ) values (
      v_uid, p_opportunity_id, v_status,
      nullif(btrim(p_email), ''), nullif(btrim(p_phone), ''), nullif(btrim(p_comment), ''),
      case when v_status = 'Accepted' then now() else null end
    )
    returning * into v_row;
  exception when unique_violation then
    raise exception 'duplicate: you already have an active registration for this event'
      using errcode = '23505';
  end;

  return v_row;
end $$;

revoke all on function public.glowe_register_for_event(text, text, text, text) from public;
grant execute on function public.glowe_register_for_event(text, text, text, text) to authenticated;
