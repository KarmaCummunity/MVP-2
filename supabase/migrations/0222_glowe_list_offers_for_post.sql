-- 0222_glowe_list_offers_for_post — wish owner offer inbox.
--
-- FR-GLOWE-012 AC3 (Phase B "My Inbox"). A SECURITY DEFINER read RPC that lets
-- the owner of a wish (glowe_posts row) see everyone who offered support on it,
-- enriched with the offerer's GloWe display name + avatar + email. Mirrors the
-- owner-gated pattern of `glowe_list_applications_for_opportunity` (migration
-- 0220), but returns the offer fields (offer_text / availability /
-- contact_preference) and gates on the post owner.
--
-- The glowe_offers table (migration 0215) is RLS-private to the offer author
-- ("glowe owner only": user_id = auth.uid()), so without this RPC the wish owner
-- could not read the offers left on their own post. Running as the function owner
-- bypasses that safely because the wish-owner check is enforced in-function.
--
-- Ordering: newest offers first, so the owner sees the most recent inbound
-- interest at the top.
--
-- Mapped to spec: FR-GLOWE-012 AC3.

set search_path = public;

create or replace function public.glowe_list_offers_for_post(p_post_id text)
returns table (
  id                 text,
  user_id            uuid,
  offer_text         text,
  availability       text,
  contact_preference text,
  created_at         timestamptz,
  offerer_name       text,
  offerer_avatar     text,
  offerer_email      text
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

  select w.user_id into v_owner from public.glowe_posts w where w.id = p_post_id;
  if not found then
    raise exception 'not found: post % does not exist', p_post_id using errcode = 'P0002';
  end if;
  if v_owner is distinct from v_uid then
    raise exception 'forbidden: not the post owner' using errcode = '42501';
  end if;

  return query
    select o.id, o.user_id, o.offer_text, o.availability, o.contact_preference, o.created_at,
           coalesce(p.display_name, u.display_name) as offerer_name,
           p.avatar_url as offerer_avatar,
           p.email      as offerer_email
      from public.glowe_offers o
      left join public.glowe_profiles p on p.id = o.user_id
      left join public.users u on u.user_id = o.user_id
     where o.post_id = p_post_id
     order by o.created_at desc;
end $$;

revoke all on function public.glowe_list_offers_for_post(text) from public;
grant execute on function public.glowe_list_offers_for_post(text) to authenticated;
