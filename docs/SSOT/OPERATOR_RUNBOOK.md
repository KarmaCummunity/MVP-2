# Operator Runbook — Karma Community

> Migration verification steps for each numbered migration (0001–0009, P0.6).

**Status**: Migrations 0001–0009 all applied to the live Supabase project (0009 applied 2026-05-08).

## Standard procedure for any migration

```bash
supabase db push
supabase gen types typescript --project-id <ref> \
  > app/packages/infrastructure-supabase/src/database.types.ts
```

**GitHub Actions — DB deploy:** Workflow [`.github/workflows/db-deploy.yml`](../../.github/workflows/db-deploy.yml) is manual (`workflow_dispatch`). Pick **target** `supabase-prod` or `supabase-dev` (each GitHub Environment must define the same three secrets: `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD`, `SUPABASE_PROJECT_REF`). Run once with **apply** unchecked (dry-run), then with **apply** checked. The workflow passes `--yes` to the CLI so non-interactive runs do not fail on prompts.

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

---

## 0009 — Avatars Storage bucket {#0009}

Required for FR-AUTH-011 (onboarding profile photo) and FR-PROFILE-007 (Edit Profile photo replace).

```sql
-- Bucket must exist with the right shape
select id, public, file_size_limit, allowed_mime_types
from storage.buckets where id = 'avatars';
-- → ('avatars', true, 524288, '{image/jpeg}')

-- 4 RLS policies must exist on storage.objects
select polname from pg_policies
where schemaname = 'storage' and tablename = 'objects' and polname like 'avatars_%';
-- → avatars_insert_own, avatars_update_own, avatars_delete_own, avatars_read_public

-- As authenticated user A, upload to <user_a_id>/avatar.jpg → success
-- As authenticated user A, upload to <user_b_id>/avatar.jpg → RLS denied
-- As anon, fetch public URL of any avatars/<id>/avatar.jpg → 200 OK
```

After apply, verify in the app: onboarding photo step → camera or gallery → image visible after upload → "Continue with current photo" advances to tour. Errors keep Skip available.

---

## P0.6 — Closure flow (one-time setup, 2026-05-10)

The closure flow ships two SQL migrations that depend on the `pg_cron` extension being enabled on the Supabase project. The migration file is idempotent and safe to re-run.

### 1. Enable `pg_cron` extension

In the Supabase dashboard:

1. Database → Extensions → search "pg_cron".
2. Toggle **Enable**.

### 2. Apply migrations

```bash
# From the repo root, with the Supabase CLI logged in to the dev project:
supabase migration up 0015_closure_rpcs.sql
supabase migration up 0016_closure_cleanup_cron.sql

# Or via the dashboard SQL editor: paste each file's contents and run.
```

### 3. Verify

```sql
-- Two new RPCs exist
select proname from pg_proc
 where proname in ('close_post_with_recipient', 'reopen_post_marked', 'closure_cleanup_expired_with_metric');
-- → 3 rows

-- Daily cron schedule installed
select jobname, schedule from cron.job where jobname = 'closure_cleanup_daily';
-- → ('closure_cleanup_daily', '0 4 * * *')

-- Metric table exists
select count(*) from public.closure_cleanup_metrics; -- 0 until first run
```

### 4. App-side smoke (after migrations)

- Sign in as a test user with at least one open post and one chat partner on it.
- PostDetail → "סמן כנמסר ✓" → Step 1 confirm → Step 2 picker → "סמן וסגור ✓" → Step 3 explainer → done.
- Profile → "פריטים שתרמתי" should be +1.
- Reopen the same post via "📤 פתח מחדש" → counter -1.

Repeat for staging / prod when promoting.

---

## FR-STATS — Activity log + nightly counter recompute (migrations `0044`, `0045`, 2026-05-12)

Same **`pg_cron` prerequisite** as P0.6 §1. Apply `0044_personal_activity_log.sql` then `0045_stats_recompute_nightly.sql` (or `supabase db push` from repo root).

### Verify

```sql
-- Timeline RPC still exists (reads `user_personal_activity_log`)
select proname from pg_proc where proname = 'rpc_my_activity_timeline';

-- Nightly job + drift tables
select proname from pg_proc where proname = 'stats_recompute_personal_counters_nightly';
select jobname, schedule from cron.job where jobname = 'stats_recompute_nightly';
-- → ('stats_recompute_nightly', '15 4 * * *') when pg_cron is enabled

-- Manual smoke (postgres / SQL editor — function is not granted to `authenticated`)
select * from public.stats_recompute_personal_counters_nightly();
select * from public.stats_recompute_runs order by run_id desc limit 3;
```

Drift rows are visible to super-admins via RLS on `stats_drift_events` / `stats_recompute_runs`. For **NFR-RELI-005** (>0.1% drift/night), wire alerts from database logs or export `stats_drift_events` to your metrics stack.

Regenerate `database.types.ts` after applying (or merge the manually added table + function stubs from `main`).

---

## Edge Functions — CI deploy + prod smoke (2026-05-12)

**Workflow:** `.github/workflows/supabase-functions-deploy.yml`  
**Triggers:** `push` to `main` when `supabase/functions/**` or the workflow file changes; manual **Run workflow** (`workflow_dispatch`).

**GitHub:** Repository → Settings → Environments → `supabase-prod` must expose the same secrets as DB deploy:

| Secret | Purpose |
| ------ | ------- |
| `SUPABASE_ACCESS_TOKEN` | Supabase account access token (dashboard → Account → Access tokens). |
| `SUPABASE_PROJECT_REF` | Project ref from the dashboard URL (not `project_id` from local `config.toml`). |

`SUPABASE_DB_PASSWORD` is **not** required for function deploy.

**After merge:** open Actions → latest **Supabase Functions deploy** run → confirm **Deploy all Edge Functions** succeeded. If it failed: fix secrets/permissions, re-run the job or use **Run workflow**.

**One-time catch-up (if prod was behind `main`):** from a machine with the CLI logged in, at repo root:

```bash
supabase link --project-ref "<SUPABASE_PROJECT_REF>"
supabase functions deploy
```

**Smoke — donation link edit (guards against stale `validate-donation-link`):**

1. As an authenticated user, open an existing donation link and change only display name; save.
2. In SQL editor: `select id, display_name, validated_at, created_at from public.donation_links where submitted_by = '<user_id>' order by created_at desc limit 5;`  
   Expect **one** row per logical link: the same `id` as before the edit, updated `display_name` / `validated_at` — not a second row with the same URL/category from the same edit session.

### Optional — duplicate `donation_links` rows from pre-fix prod

If historical bad data exists (same contributor intent, two live rows), identification is **manual** and needs product/operator judgment — do **not** bulk-delete blindly.

Heuristic: same `submitted_by`, same `category_slug`, same `url`, two rows with different `created_at` (often the “edit” created an unintended INSERT). Keep the row you want to show (typically the older canonical row or the one referenced by UI); remove or soft-hide the duplicate per your data policy. Migration `0050_donation_links_purge_soft_deleted.sql` only addresses `hidden_at` / soft-delete hygiene, not this class of duplicate.
