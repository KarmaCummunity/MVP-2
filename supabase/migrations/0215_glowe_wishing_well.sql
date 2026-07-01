-- 0215_glowe_wishing_well — Wishing Well live-content foundation (FR-GLOWE-006).
--
-- Phase B, slice 1. Adds the wish discriminator + lifecycle to glowe_posts and a
-- new glowe_offers table for "Offer Support" submissions.
--   • glowe_posts gains: post_type ('wish' | 'community'), wish_type, impact_area,
--     status ('open' | 'fulfilled'). Existing rows default to a community post
--     that is open, so the additive columns are backward-compatible.
--   • glowe_offers is owner-only (like glowe_applications): a member can create and
--     read their own offers. The wish-owner "offers inbox" (FR-GLOWE-012) will be a
--     later SECURITY DEFINER RPC, mirroring the event organizer portal.
--
-- Mapped to spec: FR-GLOWE-006 (spec/17_glowe_frontend.md).

set search_path = public;

-- ── glowe_posts: wish discriminator + lifecycle ──
alter table public.glowe_posts
  add column if not exists post_type   text not null default 'community',
  add column if not exists wish_type   text,
  add column if not exists impact_area text,
  add column if not exists status      text not null default 'open';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'glowe_posts_post_type_chk') then
    alter table public.glowe_posts
      add constraint glowe_posts_post_type_chk check (post_type in ('wish', 'community'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'glowe_posts_status_chk') then
    alter table public.glowe_posts
      add constraint glowe_posts_status_chk check (status in ('open', 'fulfilled'));
  end if;
end $$;

-- Open wishes are the hot read path for the board.
create index if not exists glowe_posts_wish_open_idx
  on public.glowe_posts (created_at desc)
  where post_type = 'wish' and status = 'open';

-- ── glowe_offers: "Offer Support" submissions (owner-only) ──
create table if not exists public.glowe_offers (
  id                 text primary key default ('offer-' || gen_random_uuid()::text),
  post_id            text not null references public.glowe_posts(id) on delete cascade,
  user_id            uuid not null default auth.uid(),
  offer_text         text,
  availability       text,
  contact_preference text,
  created_at         timestamptz not null default now()
);

create index if not exists glowe_offers_post_idx on public.glowe_offers (post_id);

alter table public.glowe_offers enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'glowe_offers' and policyname = 'glowe owner only'
  ) then
    create policy "glowe owner only" on public.glowe_offers
      for all to authenticated
      using ((select auth.uid()) = user_id)
      with check ((select auth.uid()) = user_id);
  end if;
end $$;

grant select, insert, update, delete on public.glowe_offers to authenticated;
