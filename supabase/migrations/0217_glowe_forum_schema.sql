-- 0217_glowe_forum_schema — Forums & Discussions live-thread foundation (FR-GLOWE-009).
--
-- Phase B, BE slice 1. Adds the three forum tables and seeds the four existing
-- discussion groups so the Forums page + discussion-group page can read live
-- data (frontend wiring lands in later FE slices).
--   • glowe_forum_groups — admin-managed catalog. Public read; writes are
--     restricted to GLOWE admins (is_glowe_admin). Seeded with the 4 groups
--     currently hardcoded in data.js/app.js discussionGroups[].
--   • glowe_forum_threads — member-authored threads in a group. Public read,
--     owner write (auth.uid() = user_id), mirroring glowe_posts.
--   • glowe_forum_replies — member replies on a thread. Public read, owner write.
--
-- Verified-member gating (FR-GLOWE-009 AC3/AC4) is enforced client-side by the
-- canCreateContent() gate, exactly like community posts; RLS here is the
-- owner-write floor. All statements are additive / idempotent.
--
-- Mapped to spec: FR-GLOWE-009 (spec/17_glowe_frontend.md).

set search_path = public;

-- ── 1. Tables ───────────────────────────────────────────────────────────────
create table if not exists public.glowe_forum_groups (
  id          text primary key,
  title       text not null,
  description text,
  tags        text[] not null default '{}',
  icon        text,
  created_at  timestamptz not null default now()
);

create table if not exists public.glowe_forum_threads (
  id         text primary key default ('thread-' || gen_random_uuid()::text),
  group_id   text not null references public.glowe_forum_groups(id) on delete cascade,
  user_id    uuid references auth.users(id) on delete set null,
  title      text not null,
  body       text,
  created_at timestamptz not null default now()
);

create table if not exists public.glowe_forum_replies (
  id         text primary key default ('reply-' || gen_random_uuid()::text),
  thread_id  text not null references public.glowe_forum_threads(id) on delete cascade,
  user_id    uuid references auth.users(id) on delete set null,
  body       text not null,
  created_at timestamptz not null default now()
);

-- Hot read paths: threads listed per group newest-first; replies per thread.
create index if not exists glowe_forum_threads_group_idx
  on public.glowe_forum_threads (group_id, created_at desc);
create index if not exists glowe_forum_replies_thread_idx
  on public.glowe_forum_replies (thread_id, created_at asc);

-- ── 2. RLS ──────────────────────────────────────────────────────────────────
alter table public.glowe_forum_groups   enable row level security;
alter table public.glowe_forum_threads  enable row level security;
alter table public.glowe_forum_replies  enable row level security;

-- Public read for all three (anonymous visitors browse forums).
do $$
declare
  t text;
begin
  foreach t in array array[
    'glowe_forum_groups', 'glowe_forum_threads', 'glowe_forum_replies'
  ] loop
    execute format('drop policy if exists "glowe public read" on public.%I', t);
    execute format(
      'create policy "glowe public read" on public.%I for select to anon, authenticated using (true)', t
    );
  end loop;
end $$;

-- Groups: only GLOWE admins may insert/update/delete (admin-managed catalog).
-- Uses has_admin_role directly (granted to authenticated in 0113, the RLS
-- convention across 0168/0169/0170) rather than the internal is_glowe_admin,
-- so no extra function grant is needed. glowe_admin OR super_admin qualifies.
drop policy if exists "glowe forum groups admin write" on public.glowe_forum_groups;
create policy "glowe forum groups admin write" on public.glowe_forum_groups
  for all to authenticated
  using (
    public.has_admin_role((select auth.uid()), 'glowe_admin')
    or public.has_admin_role((select auth.uid()), 'super_admin')
  )
  with check (
    public.has_admin_role((select auth.uid()), 'glowe_admin')
    or public.has_admin_role((select auth.uid()), 'super_admin')
  );

-- Threads + replies: owner-scoped write via user_id (mirrors glowe_posts).
do $$
declare
  t text;
begin
  foreach t in array array['glowe_forum_threads', 'glowe_forum_replies'] loop
    execute format('drop policy if exists "glowe owner write" on public.%I', t);
    execute format(
      'create policy "glowe owner write" on public.%I for all to authenticated '
      || 'using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)',
      t
    );
  end loop;
end $$;

-- ── 3. Grants (RLS still governs row visibility) ────────────────────────────
grant select on
  public.glowe_forum_groups, public.glowe_forum_threads, public.glowe_forum_replies
  to anon, authenticated;

grant insert, update, delete on
  public.glowe_forum_groups, public.glowe_forum_threads, public.glowe_forum_replies
  to authenticated;

-- ── 4. Seed the four existing discussion groups (idempotent) ────────────────
insert into public.glowe_forum_groups (id, title, description, tags, icon) values
  ('education',   'Education & Knowledge',
   'A focused group for learning spaces, youth programs, multilingual knowledge sharing, and practical education tools.',
   array['Education', 'Knowledge Sharing', 'Youth'], 'book'),
  ('environment', 'Environment & Climate Action',
   'For climate, food systems, waste, restoration, repair, and local environmental action.',
   array['Climate', 'Food Security', 'Repair'], 'leaf'),
  ('health',      'Health & Community Care',
   'A moderated space for wellbeing, preventive health, emergency response, and community care methods.',
   array['Health', 'Wellbeing', 'Crisis Response'], 'heart'),
  ('rights',      'Rights, Safety & Civic Power',
   'For rights-based action, civic participation, safe moderation, and community trust.',
   array['Justice', 'Safety', 'Civic Action'], 'shield')
on conflict (id) do nothing;
