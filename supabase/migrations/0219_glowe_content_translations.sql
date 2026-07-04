-- 0219_glowe_content_translations — FR-TRANSLATE-005 (GLOWE UGC translation cache).
--
-- GLOWE-isolated mirror of public.content_translations. Differences from the KC
-- cache (0208):
--   • content_id is TEXT (GLOWE PKs are text, e.g. 'post-<uuid>'); profiles use
--     the auth uid cast to text.
--   • anon MAY read (GLOWE serves anonymous readers — FR-TRANSLATE-005 AC8). All
--     GLOWE source content is already anon-public ("glowe public read"), so the
--     translation cache carries no additional visibility surface.
--   • Writes remain service-role-only (populated by the glowe-translate function).
-- All statements additive / idempotent. KC's content_translations is untouched.
--
-- Mapped to spec: FR-TRANSLATE-005 (spec/18_translation.md).

set search_path = public;

create table if not exists public.glowe_content_translations (
  id              uuid primary key default gen_random_uuid(),
  content_type    text not null,
  content_id      text not null,
  field           text not null,
  target_language text not null,
  source_language text,
  translated_text text not null,
  model           text,
  confidence      real,
  created_at      timestamptz not null default now()
);

comment on table public.glowe_content_translations is
  'FR-TRANSLATE-005 demand-driven translation cache for GLOWE UGC. One row per (content_type, content_id, target_language, field). Service-role writes only; anon+authenticated read.';

alter table public.glowe_content_translations drop constraint if exists glowe_ct_type_chk;
alter table public.glowe_content_translations
  add constraint glowe_ct_type_chk check (
    content_type in ('glowe_post','glowe_opportunity','glowe_project','glowe_profile')
  );

alter table public.glowe_content_translations drop constraint if exists glowe_ct_field_chk;
alter table public.glowe_content_translations
  add constraint glowe_ct_field_chk check (
    field in ('title','text','description','about','focus','needs')
  );

alter table public.glowe_content_translations drop constraint if exists glowe_ct_conf_chk;
alter table public.glowe_content_translations
  add constraint glowe_ct_conf_chk check (confidence is null or confidence between 0 and 1);

create unique index if not exists glowe_content_translations_key_uidx
  on public.glowe_content_translations (content_type, content_id, target_language, field);

-- Grants: anon + authenticated may read (deliberate — anon readers). Writes are
-- service-role only (bypasses grants + RLS).
revoke all on public.glowe_content_translations from anon, authenticated;
grant select on public.glowe_content_translations to anon, authenticated;

alter table public.glowe_content_translations enable row level security;

-- All GLOWE content is anon-public, so the translation cache is readable by all.
drop policy if exists glowe_ct_public_read on public.glowe_content_translations;
create policy glowe_ct_public_read
  on public.glowe_content_translations
  for select
  to anon, authenticated
  using (true);

-- ── Purge on source delete / edit (stale translations must not survive) ──────
-- glowe_posts: purge on delete + when title/text change.
create or replace function public.glowe_ct_purge_post()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  delete from public.glowe_content_translations
   where content_type = 'glowe_post' and content_id = old.id;
  return old;
end;
$$;
drop trigger if exists trg_glowe_ct_purge_post_del on public.glowe_posts;
create trigger trg_glowe_ct_purge_post_del
  before delete on public.glowe_posts
  for each row execute function public.glowe_ct_purge_post();

create or replace function public.glowe_ct_purge_post_edit()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.title is distinct from old.title or new.text is distinct from old.text then
    delete from public.glowe_content_translations
     where content_type = 'glowe_post' and content_id = new.id;
  end if;
  return new;
end;
$$;
drop trigger if exists trg_glowe_ct_purge_post_edit on public.glowe_posts;
create trigger trg_glowe_ct_purge_post_edit
  after update of title, text on public.glowe_posts
  for each row execute function public.glowe_ct_purge_post_edit();

-- glowe_opportunities: purge on delete + when title/description change.
create or replace function public.glowe_ct_purge_opportunity()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  delete from public.glowe_content_translations
   where content_type = 'glowe_opportunity' and content_id = old.id;
  return old;
end;
$$;
drop trigger if exists trg_glowe_ct_purge_opp_del on public.glowe_opportunities;
create trigger trg_glowe_ct_purge_opp_del
  before delete on public.glowe_opportunities
  for each row execute function public.glowe_ct_purge_opportunity();

create or replace function public.glowe_ct_purge_opportunity_edit()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.title is distinct from old.title
     or new.description is distinct from old.description then
    delete from public.glowe_content_translations
     where content_type = 'glowe_opportunity' and content_id = new.id;
  end if;
  return new;
end;
$$;
drop trigger if exists trg_glowe_ct_purge_opp_edit on public.glowe_opportunities;
create trigger trg_glowe_ct_purge_opp_edit
  after update of title, description on public.glowe_opportunities
  for each row execute function public.glowe_ct_purge_opportunity_edit();

-- glowe_projects: purge on delete + when title/description change.
create or replace function public.glowe_ct_purge_project()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  delete from public.glowe_content_translations
   where content_type = 'glowe_project' and content_id = old.id;
  return old;
end;
$$;
drop trigger if exists trg_glowe_ct_purge_proj_del on public.glowe_projects;
create trigger trg_glowe_ct_purge_proj_del
  before delete on public.glowe_projects
  for each row execute function public.glowe_ct_purge_project();

create or replace function public.glowe_ct_purge_project_edit()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.title is distinct from old.title
     or new.description is distinct from old.description then
    delete from public.glowe_content_translations
     where content_type = 'glowe_project' and content_id = new.id;
  end if;
  return new;
end;
$$;
drop trigger if exists trg_glowe_ct_purge_proj_edit on public.glowe_projects;
create trigger trg_glowe_ct_purge_proj_edit
  after update of title, description on public.glowe_projects
  for each row execute function public.glowe_ct_purge_project_edit();

-- glowe_profiles: PK is uuid; store content_id as id::text. Purge on delete +
-- when about/focus/needs change.
create or replace function public.glowe_ct_purge_profile()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  delete from public.glowe_content_translations
   where content_type = 'glowe_profile' and content_id = old.id::text;
  return old;
end;
$$;
drop trigger if exists trg_glowe_ct_purge_profile_del on public.glowe_profiles;
create trigger trg_glowe_ct_purge_profile_del
  before delete on public.glowe_profiles
  for each row execute function public.glowe_ct_purge_profile();

create or replace function public.glowe_ct_purge_profile_edit()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.about is distinct from old.about
     or new.focus is distinct from old.focus
     or new.needs is distinct from old.needs then
    delete from public.glowe_content_translations
     where content_type = 'glowe_profile' and content_id = new.id::text;
  end if;
  return new;
end;
$$;
drop trigger if exists trg_glowe_ct_purge_profile_edit on public.glowe_profiles;
create trigger trg_glowe_ct_purge_profile_edit
  after update of about, focus, needs on public.glowe_profiles
  for each row execute function public.glowe_ct_purge_profile_edit();
