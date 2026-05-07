-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: 0007_users_realtime_publication
-- P0.2.f1 — Add `public.users` to the `supabase_realtime` publication so that
--           counter UPDATEs (followers/following/active_posts/items_*) are
--           projected to subscribed clients per FR-PROFILE-013 AC5 and
--           NFR-PERF-005 (≤2,000 ms p95 freshness).
--
-- Mapped to: FR-PROFILE-013 AC5 (counters projected via Realtime),
--            NFR-PERF-005 (Realtime freshness budget).
--
-- Caught by the post-P0.2.f spec audit: 0006 added the counter triggers but
-- forgot to add `users` to the publication, so client subscriptions to a
-- profile screen never observe counter changes. Same guarded pattern as 0004
-- (chats + messages) to stay safe on local environments where the publication
-- may not exist yet.
--
-- RLS still applies on the broadcast side — Supabase Realtime only delivers
-- events for rows the subscriber is allowed to SELECT under the policies on
-- `users` from 0001 + 0003 (Public-mode active rows + self + approved-follower
-- expansion). So no privacy regression.
-- ─────────────────────────────────────────────────────────────────────────────

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'users'
    ) then
      execute 'alter publication supabase_realtime add table public.users';
    end if;
  end if;
end $$;

-- end of 0007_users_realtime_publication
