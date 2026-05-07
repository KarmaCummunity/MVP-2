# Operator Runbook — Karma Community

> Verification steps extracted from PROJECT_STATUS.md §4 to avoid per-entry repetition.

**Status**: Migrations 0001–0008 all applied to the live Supabase project (confirmed 2026-05-07).

## Standard procedure for any migration

```bash
supabase db push
supabase gen types typescript --project-id <ref> \
  > app/packages/infrastructure-supabase/src/database.types.ts
```

---

## 0001 — Foundation & Identity {#0001}

Verify: sign in with Google → confirm row appears in `public.users` with Google name + avatar → re-sign-in must not create a duplicate row.

---

## 0002 — Posts core {#0002}

Verify: sign in as test user → insert via SQL editor:
```sql
insert into posts (owner_id, type, title, city, street, street_number)
values ('<your-user-id>', 'Give', 'Test couch', '5000', 'Bialik', '12');
```
Expect the row to appear. Once P0.4 wires real CRUD, it should surface in the feed.

---

## 0003 — Following & Blocking {#0003}

```sql
-- NULL-safe helper
select public.is_blocked(
  '00000000-0000-0000-0000-000000000000'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid
); -- → false

-- Self-follow must error self_follow_forbidden
insert into public.follow_edges(follower_id, followed_id) values ('A', 'A');

-- Blocked relationship must error blocked_relationship
insert into public.blocks(blocker_id, blocked_id) values ('A', 'B');
insert into public.follow_edges(follower_id, followed_id) values ('A', 'B');
```

Regenerate `database.types.ts` after applying.

---

## 0004 — Chat & Messaging {#0004}

```sql
-- NULL-safe helper
select public.has_blocked(null::uuid, null::uuid); -- → false

-- Canonicalize trigger: (B, A) must return (A, B)
insert into public.chats (participant_a, participant_b)
values ('B-uuid', 'A-uuid')
returning participant_a, participant_b;

-- Message must bump chats.last_message_at
insert into public.messages (chat_id, sender_id, body)
values ('<chat-id>', 'A-uuid', 'hello');

-- After A blocks B: querying chats as A → 0 rows (RLS hides); as B → row still visible
```

Realtime: subscribe a client to `messages:chat_id=eq.<chat-id>` and send a message — recipient must receive the event.

Regenerate `database.types.ts` after applying.

---

## 0005 — Moderation {#0005}

```sql
-- Admin helper
select public.is_admin(null::uuid); -- → false

-- Report must create a reporter_hide row + audit_events row
insert into public.reports (reporter_id, target_type, target_id, reason)
values ('A-uuid', 'post', '<post-id>', 'Spam');

-- Re-running same INSERT within 24 h must error duplicate_report

-- After 3 distinct reporters on the same post:
-- posts.status must flip to removed_admin
-- audit_events must have an auto_remove_target row

-- Bump posts.reopen_count to 5 → moderation_queue_entries row with reason='excessive_reopens'
```

Regenerate `database.types.ts` after applying.

---

## 0006 — Stats Counters {#0006}

```sql
select * from public.community_stats;
-- → 1 row with registered_users, active_public_posts, items_delivered_total, as_of

-- As user A, insert a Public post, then:
select active_posts_count_internal,
       active_posts_count_public_open,
       posts_created_total
from public.users where user_id = 'A-uuid';
-- → 1, 1, 1

-- visibility is upgrade-only: OnlyMe → Public allowed; Public → OnlyMe is blocked by trigger
-- After deleting the post: active_posts_count_internal + public_open → 0; posts_created_total stays 1

-- Viewer-aware function
select public.active_posts_count_for_viewer('A-uuid', 'A-uuid'); -- owner view (internal)
select public.active_posts_count_for_viewer('A-uuid', null);      -- anon view (public-only)

-- Two users mutual follow → followers_count + following_count of both = 1

-- Clamp-at-zero NOTICE
select public.stats_safe_dec(0); -- → 0, emits NOTICE in pg logs
```

Regenerate `database.types.ts` after applying.

---

## 0007 — Users Realtime Publication {#0007}

```sql
-- users must be in the publication
select tablename
from pg_publication_tables
where pubname = 'supabase_realtime' and schemaname = 'public';
-- row with tablename = 'users' must be present

-- Subscribe a client to the users channel, then:
update public.users
set followers_count = followers_count
where user_id = '<id>';
-- subscribed client must receive the Realtime event
```

---

## 0008 — City Seed {#0008}

```sql
select count(*) from public.cities; -- ≥ 1,306

-- New auth user created via trigger must have city = '5000', city_name = 'תל אביב - יפו'
-- Pre-existing users with legacy slug cities must be remapped to numeric codes
```

Regenerate `database.types.ts` after applying.
