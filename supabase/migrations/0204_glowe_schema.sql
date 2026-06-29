-- 0204_glowe_schema — GloWe frontend on shared KC infrastructure (Phase A).
--
-- The GloWe static frontend (app/apps/glowe-web) is wired to the SAME Supabase
-- project as the KC mobile app, so a single Supabase Auth identity (auth.users)
-- is shared across both frontends ("log in once, same account in both").
--
-- GloWe owns a small data model of its own (volunteering opportunities,
-- applications, forum posts, etc.). To avoid colliding with KC's native tables
-- (public.posts, public.users, ...), every GloWe-owned table is namespaced with
-- the `glowe_` prefix. The frontend adapter (app/apps/glowe-web/js/backend.js)
-- applies this prefix at the Supabase boundary. These tables are intentionally
-- isolated so they can be migrated entity-by-entity onto KC's native tables (and
-- dropped) as the two products converge — see DECISIONS.md D-61.
--
-- Mapped to spec: FR-GLOWE-001 (shared-auth GloWe frontend),
--   docs/SSOT/spec/17_glowe_frontend.md. Decision: D-61.

set search_path = public;

-- ── 1. profiles ─────────────────────────────────────────────────────────────
create table if not exists public.glowe_profiles (
  id             uuid primary key references auth.users(id) on delete cascade,
  display_name   text not null default '',
  email          text,
  profile_type   text,
  country        text,
  public_link    text,
  focus          text,
  about          text,
  needs          text,
  location       text,
  languages      text[] not null default '{}',
  availability   text,
  skills         text[] not null default '{}',
  avatar_url     text,
  profile_status text not null default 'Draft',
  raw_profile    jsonb not null default '{}'::jsonb,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- ── 2. projects ─────────────────────────────────────────────────────────────
create table if not exists public.glowe_projects (
  id          text primary key default ('project-' || gen_random_uuid()::text),
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null,
  status      text not null default 'Draft',
  description text,
  created_at  timestamptz not null default now()
);

-- ── 3. opportunities ────────────────────────────────────────────────────────
create table if not exists public.glowe_opportunities (
  id               text primary key default ('opportunity-' || gen_random_uuid()::text),
  user_id          uuid references auth.users(id) on delete set null,
  title            text not null,
  organization     text not null,
  org_icon         text,
  location         text,
  commitment       text,
  duration         text,
  field            text,
  description      text,
  skills           text[] not null default '{}',
  requirements     text[] not null default '{}',
  responsibilities text[] not null default '{}',
  featured         boolean not null default false,
  created_at       timestamptz not null default now()
);

-- ── 4. posts (GloWe forum posts — distinct from public.posts) ────────────────
create table if not exists public.glowe_posts (
  id          text primary key default ('post-' || gen_random_uuid()::text),
  user_id     uuid references auth.users(id) on delete set null,
  author_id   text,
  author_name text,
  title       text not null,
  category    text,
  text        text,
  tags        text[] not null default '{}',
  audience    text,
  language    text,
  link        text,
  created_at  timestamptz not null default now()
);

-- ── 5. comments ─────────────────────────────────────────────────────────────
create table if not exists public.glowe_comments (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete set null,
  post_id     text not null,
  author_name text,
  text        text not null,
  created_at  timestamptz not null default now()
);

-- ── 6. saved_items (private to owner) ───────────────────────────────────────
create table if not exists public.glowe_saved_items (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  item_type  text not null,
  item_id    text not null,
  title      text not null,
  meta       text,
  href       text,
  created_at timestamptz not null default now(),
  unique (user_id, item_type, item_id)
);

-- ── 7. applications (private to owner) ──────────────────────────────────────
create table if not exists public.glowe_applications (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  opportunity_id text not null,
  availability   text,
  skills         text,
  motivation     text,
  status         text not null default 'Pending',
  created_at     timestamptz not null default now()
);

-- ── RLS ─────────────────────────────────────────────────────────────────────
alter table public.glowe_profiles     enable row level security;
alter table public.glowe_projects     enable row level security;
alter table public.glowe_opportunities enable row level security;
alter table public.glowe_posts        enable row level security;
alter table public.glowe_comments     enable row level security;
alter table public.glowe_saved_items  enable row level security;
alter table public.glowe_applications enable row level security;

-- Public-readable catalog tables: anyone may read; only the owner may write.
do $$
declare
  t text;
begin
  foreach t in array array[
    'glowe_profiles', 'glowe_projects', 'glowe_opportunities',
    'glowe_posts', 'glowe_comments'
  ] loop
    execute format('drop policy if exists "glowe public read" on public.%I', t);
    execute format(
      'create policy "glowe public read" on public.%I for select to anon, authenticated using (true)', t
    );
  end loop;
end $$;

-- profiles: the row id IS the owner (id = auth.users.id).
drop policy if exists "glowe owner write profiles" on public.glowe_profiles;
create policy "glowe owner write profiles" on public.glowe_profiles
  for all to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- owner-scoped write via user_id for the remaining catalog tables.
do $$
declare
  t text;
begin
  foreach t in array array[
    'glowe_projects', 'glowe_opportunities', 'glowe_posts', 'glowe_comments'
  ] loop
    execute format('drop policy if exists "glowe owner write" on public.%I', t);
    execute format(
      'create policy "glowe owner write" on public.%I for all to authenticated '
      || 'using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)',
      t
    );
  end loop;
end $$;

-- Fully private tables: owner-only for every operation, no public read.
do $$
declare
  t text;
begin
  foreach t in array array['glowe_saved_items', 'glowe_applications'] loop
    execute format('drop policy if exists "glowe owner only" on public.%I', t);
    execute format(
      'create policy "glowe owner only" on public.%I for all to authenticated '
      || 'using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)',
      t
    );
  end loop;
end $$;

-- ── Grants (RLS still governs row visibility) ───────────────────────────────
grant select on
  public.glowe_profiles, public.glowe_projects, public.glowe_opportunities,
  public.glowe_posts, public.glowe_comments
  to anon, authenticated;

grant insert, update, delete on
  public.glowe_profiles, public.glowe_projects, public.glowe_opportunities,
  public.glowe_posts, public.glowe_comments,
  public.glowe_saved_items, public.glowe_applications
  to authenticated;

grant select on public.glowe_saved_items, public.glowe_applications to authenticated;
