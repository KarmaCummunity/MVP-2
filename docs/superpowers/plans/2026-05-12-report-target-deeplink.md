# Report-Target Deeplink Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Admin gets a tappable target preview (author handle, content snippet, navigation) inside `report_received` and `auto_removed` system message bubbles in their chat with a reporter — closes FR-MOD-001 AC4 and FR-MOD-005 AC3.

**Architecture:**
- DB trigger snapshots target data into `messages.system_payload` at report INSERT time (point-in-time evidence; avoids N+1; survives target deletion).
- Both bubbles render an admin-gated rich preview card that tap-navigates to the post / user profile via expo-router typed routes. Non-admin viewers see legacy title-only render (UI-layer privacy floor).
- Single migration `0043` replaces `reports_after_insert_apply_effects` (touches both `report_received` and threshold-side `auto_removed` emission), drops obsolete `0013` trigger, includes a `-- ROLLBACK:` comment block for operator recovery.

**Tech Stack:** PostgreSQL (Supabase), pgTAP-style PL/pgSQL tests, React Native + Expo (typed routes), TypeScript, `@expo/vector-icons` for the chevron.

**Spec:** [docs/superpowers/specs/2026-05-12-report-target-deeplink-design.md](../specs/2026-05-12-report-target-deeplink-design.md)

---

## Task 1: Branch setup + BACKLOG tracking

**Files:**
- Modify: `docs/SSOT/BACKLOG.md`

- [ ] **Step 1: Pre-flight git check**

Run from repo root:
```bash
gh auth status && git config user.name && git config user.email
gh repo view --json nameWithOwner -q .nameWithOwner
```
Expected: `KarmaCummunity/MVP-2`. If anything fails, stop and consult `SETUP_GIT_AGENT.md`.

- [ ] **Step 2: Create the branch from fresh main**

```bash
git fetch origin
git switch main
git pull --ff-only origin main
git switch -c feat/FR-MOD-001-admin-report-deeplink
```

- [ ] **Step 3: Add P1.3.1 row to BACKLOG**

Open `docs/SSOT/BACKLOG.md`. Find the row `P1.3` under `## P1 — Safety, Discovery & Polish` (around line 28). Insert immediately after it:

```markdown
| P1.3.1 | Admin report-bubble deeplink + auto-removed message (FR-MOD-001 AC4 + FR-MOD-005 AC3) | agent-be + agent-fe | 🟡 In progress | `spec/08_moderation.md` |
```

- [ ] **Step 4: Commit BACKLOG + spec + plan docs**

```bash
git add docs/SSOT/BACKLOG.md \
  docs/superpowers/specs/2026-05-12-report-target-deeplink-design.md \
  docs/superpowers/plans/2026-05-12-report-target-deeplink.md
git commit -m "docs(plan): brainstorm + plan for FR-MOD-001 AC4 deeplink

- spec/...-design.md: design v3 (council-reviewed; D8/D11 deferred to TD).
- plans/...-deeplink.md: implementation plan (DB + FE + CI + SSOT).
- BACKLOG.md: P1.3.1 row added (in progress)."
```

---

## Task 2: Update CI to run all DB tests (D14)

**Files:**
- Modify: `.github/workflows/db-validate.yml:55-61`

- [ ] **Step 1: Replace the single-file test step with a glob loop**

Open `.github/workflows/db-validate.yml`. Replace lines 55-61 (the `Run migration-coverage tests` step) with:

```yaml
      - name: Run all DB tests (supabase/tests/*.sql)
        env:
          PGPASSWORD: postgres
        run: |
          set -euo pipefail
          shopt -s nullglob
          for f in supabase/tests/*.sql; do
            echo "── Running $f ──"
            psql -h 127.0.0.1 -p 54322 -U postgres -d postgres \
              -v ON_ERROR_STOP=1 \
              -f "$f"
          done
```

Rationale: today only `migration-coverage.sql` runs in CI; new `0043_*.sql` test file would be silent dead code without this change.

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/db-validate.yml
git commit -m "ci(db): run all supabase/tests/*.sql, not just migration-coverage

Without this, new pgTAP-style test files are dead code in CI."
```

---

## Task 3: DB tests (TDD — write first, expect to fail until Task 4 lands)

**Files:**
- Create: `supabase/tests/0043_report_admin_payload_enrichment.sql`

- [ ] **Step 1: Create the test file**

```sql
-- supabase/tests/0043_report_admin_payload_enrichment.sql
-- Tests for FR-MOD-001 AC4 + FR-MOD-005 AC3.
-- Verifies:
--   1. report_received system_payload has link_target + target_preview for post/user/chat.
--   2. chat→user mapping resolves the OTHER participant (both directions).
--   3. is_support_thread reports yield link_target=null.
--   4. target_type='none' produces no link_target / target_preview.
--   5. Threshold breach (3 distinct reporters) produces a single auto_removed
--      system message with the same enriched payload structure.
--   6. Regression: only ONE system message per report (the obsolete 0013 trigger
--      is gone — no duplicate kind='report' message).
--
-- Tests create their own users/posts/chats with random UUIDs so they don't
-- collide with seed data and can re-run without cleanup.

create or replace function pg_temp.assert(p_cond boolean, p_msg text)
returns void language plpgsql as $$
begin
  if not p_cond then raise exception 'ASSERT FAILED: %', p_msg; end if;
end $$;

create or replace function pg_temp.mk_user(p_handle text)
returns uuid language plpgsql as $$
declare v_id uuid := gen_random_uuid();
begin
  insert into public.users (
    user_id, share_handle, display_name, biography,
    privacy_mode, account_status,
    city, neighborhood
  ) values (
    v_id, p_handle, 'Display ' || p_handle, 'Bio of ' || p_handle,
    'Public', 'active',
    (select city_id from public.cities limit 1), 'Test'
  );
  return v_id;
end $$;

-- ───────────────────────────── TEST 1: post report ──────────────────────────
do $$
declare
  v_reporter uuid := pg_temp.mk_user('t1_reporter_' || substr(gen_random_uuid()::text,1,8));
  v_author   uuid := pg_temp.mk_user('t1_author_'   || substr(gen_random_uuid()::text,1,8));
  v_post     uuid;
  v_payload  jsonb;
begin
  insert into public.posts (post_id, owner_id, type, title, description, city, street, street_number)
  values (gen_random_uuid(), v_author, 'Give', 'Test post title', 'A description here',
          (select city_id from public.cities limit 1), 'TestSt', '1')
  returning post_id into v_post;

  insert into public.reports (reporter_id, target_type, target_id, reason)
  values (v_reporter, 'post', v_post, 'Spam');

  select m.system_payload into v_payload
    from public.messages m
    join public.chats c on c.chat_id = m.chat_id
   where c.is_support_thread = true
     and (c.participant_a = v_reporter or c.participant_b = v_reporter)
     and m.system_payload->>'kind' = 'report_received'
   order by m.created_at desc limit 1;

  perform pg_temp.assert(v_payload is not null, 'T1: report_received message missing');
  perform pg_temp.assert(v_payload->'link_target'->>'type' = 'post', 'T1: link_target.type wrong');
  perform pg_temp.assert((v_payload->'link_target'->>'id')::uuid = v_post, 'T1: link_target.id wrong');
  perform pg_temp.assert(v_payload->'target_preview'->>'kind' = 'post', 'T1: target_preview.kind wrong');
  perform pg_temp.assert(v_payload->'target_preview'->>'author_handle' like 't1_author_%', 'T1: author_handle wrong');
  perform pg_temp.assert(position('Test post title' in (v_payload->'target_preview'->>'body_snippet')) > 0, 'T1: body_snippet missing title');
  perform pg_temp.assert((v_payload->'target_preview'->>'has_image')::boolean = false, 'T1: has_image should be false');

  raise notice '✓ T1 post-report enrichment OK';
end $$;

-- ───────────────────────────── TEST 2: user report ──────────────────────────
do $$
declare
  v_reporter uuid := pg_temp.mk_user('t2_reporter_' || substr(gen_random_uuid()::text,1,8));
  v_target   uuid := pg_temp.mk_user('t2_target_'   || substr(gen_random_uuid()::text,1,8));
  v_payload  jsonb;
begin
  insert into public.reports (reporter_id, target_type, target_id, reason)
  values (v_reporter, 'user', v_target, 'Offensive');

  select m.system_payload into v_payload
    from public.messages m
    join public.chats c on c.chat_id = m.chat_id
   where c.is_support_thread = true
     and (c.participant_a = v_reporter or c.participant_b = v_reporter)
     and m.system_payload->>'kind' = 'report_received'
   order by m.created_at desc limit 1;

  perform pg_temp.assert(v_payload->'link_target'->>'type' = 'user', 'T2: link_target.type wrong');
  perform pg_temp.assert((v_payload->'link_target'->>'id')::uuid = v_target, 'T2: link_target.id wrong');
  perform pg_temp.assert(v_payload->'link_target'->>'handle' like 't2_target_%', 'T2: handle wrong');
  perform pg_temp.assert(v_payload->'target_preview'->>'kind' = 'user', 'T2: preview kind wrong');
  perform pg_temp.assert(position('Bio of t2_target' in (v_payload->'target_preview'->>'bio_snippet')) > 0, 'T2: bio_snippet wrong');

  raise notice '✓ T2 user-report enrichment OK';
end $$;

-- ───────────── TEST 3: chat report — counterpart resolution (both sides) ─────
do $$
declare
  v_a uuid := pg_temp.mk_user('t3_a_' || substr(gen_random_uuid()::text,1,8));
  v_b uuid := pg_temp.mk_user('t3_b_' || substr(gen_random_uuid()::text,1,8));
  v_lo uuid; v_hi uuid;
  v_chat uuid;
  v_payload jsonb;
begin
  -- canonical pair order: participant_a < participant_b
  if v_a < v_b then v_lo := v_a; v_hi := v_b; else v_lo := v_b; v_hi := v_a; end if;

  insert into public.chats (chat_id, participant_a, participant_b, is_support_thread)
  values (gen_random_uuid(), v_lo, v_hi, false)
  returning chat_id into v_chat;

  -- Case A: participant_a reports → counterpart should be participant_b
  insert into public.reports (reporter_id, target_type, target_id, reason)
  values (v_lo, 'chat', v_chat, 'Spam');
  select m.system_payload into v_payload
    from public.messages m
    join public.chats c on c.chat_id = m.chat_id
   where c.is_support_thread = true
     and (c.participant_a = v_lo or c.participant_b = v_lo)
     and m.system_payload->>'kind' = 'report_received'
   order by m.created_at desc limit 1;
  perform pg_temp.assert((v_payload->'link_target'->>'id')::uuid = v_hi, 'T3a: counterpart wrong (lo reports → expect hi)');

  -- Case B: participant_b reports → counterpart should be participant_a
  insert into public.reports (reporter_id, target_type, target_id, reason)
  values (v_hi, 'chat', v_chat, 'Spam');
  select m.system_payload into v_payload
    from public.messages m
    join public.chats c on c.chat_id = m.chat_id
   where c.is_support_thread = true
     and (c.participant_a = v_hi or c.participant_b = v_hi)
     and m.system_payload->>'kind' = 'report_received'
   order by m.created_at desc limit 1;
  perform pg_temp.assert((v_payload->'link_target'->>'id')::uuid = v_lo, 'T3b: counterpart wrong (hi reports → expect lo)');

  raise notice '✓ T3 chat counterpart resolution OK';
end $$;

-- ─────────── TEST 4: chat report on a support thread → link_target=null ──────
do $$
declare
  v_user uuid := pg_temp.mk_user('t4_user_' || substr(gen_random_uuid()::text,1,8));
  v_support_chat uuid;
  v_payload jsonb;
begin
  v_support_chat := public.find_or_create_support_chat(v_user);
  perform pg_temp.assert(v_support_chat is not null, 'T4: could not get support chat');

  insert into public.reports (reporter_id, target_type, target_id, reason)
  values (v_user, 'chat', v_support_chat, 'Spam');

  select m.system_payload into v_payload
    from public.messages m
    join public.chats c on c.chat_id = m.chat_id
   where c.chat_id = v_support_chat
     and m.system_payload->>'kind' = 'report_received'
   order by m.created_at desc limit 1;

  perform pg_temp.assert(v_payload->'link_target' = 'null'::jsonb or v_payload->'link_target' is null, 'T4: link_target should be null for support thread');

  raise notice '✓ T4 support-thread report yields null link_target';
end $$;

-- ─────────── TEST 5: target_type='none' (support ticket) — no enrichment ─────
do $$
declare
  v_user uuid := pg_temp.mk_user('t5_user_' || substr(gen_random_uuid()::text,1,8));
  v_payload jsonb;
begin
  insert into public.reports (reporter_id, target_type, target_id, reason, note)
  values (v_user, 'none', null, 'Other', 'support description here');

  select m.system_payload into v_payload
    from public.messages m
    join public.chats c on c.chat_id = m.chat_id
   where c.is_support_thread = true
     and (c.participant_a = v_user or c.participant_b = v_user)
     and m.system_payload->>'kind' = 'report_received'
   order by m.created_at desc limit 1;

  perform pg_temp.assert(v_payload->'link_target' is null or v_payload->'link_target' = 'null'::jsonb, 'T5: target=none should have no link_target');
  perform pg_temp.assert(v_payload->'target_preview' is null or v_payload->'target_preview' = 'null'::jsonb, 'T5: target=none should have no target_preview');

  raise notice '✓ T5 target_type=none produces no enrichment';
end $$;

-- ─────────── TEST 6: threshold breach → auto_removed message with payload ────
do $$
declare
  v_r1 uuid := pg_temp.mk_user('t6_r1_' || substr(gen_random_uuid()::text,1,8));
  v_r2 uuid := pg_temp.mk_user('t6_r2_' || substr(gen_random_uuid()::text,1,8));
  v_r3 uuid := pg_temp.mk_user('t6_r3_' || substr(gen_random_uuid()::text,1,8));
  v_author uuid := pg_temp.mk_user('t6_author_' || substr(gen_random_uuid()::text,1,8));
  v_post uuid;
  v_auto_payload jsonb;
begin
  insert into public.posts (post_id, owner_id, type, title, description, city, street, street_number)
  values (gen_random_uuid(), v_author, 'Give', 'Threshold post', 'desc',
          (select city_id from public.cities limit 1), 'St', '1')
  returning post_id into v_post;

  insert into public.reports (reporter_id, target_type, target_id, reason) values (v_r1, 'post', v_post, 'Spam');
  insert into public.reports (reporter_id, target_type, target_id, reason) values (v_r2, 'post', v_post, 'Spam');
  insert into public.reports (reporter_id, target_type, target_id, reason) values (v_r3, 'post', v_post, 'Spam');

  -- The auto_removed message lives in the 3rd reporter's support thread.
  select m.system_payload into v_auto_payload
    from public.messages m
    join public.chats c on c.chat_id = m.chat_id
   where c.is_support_thread = true
     and (c.participant_a = v_r3 or c.participant_b = v_r3)
     and m.system_payload->>'kind' = 'auto_removed'
   order by m.created_at desc limit 1;

  perform pg_temp.assert(v_auto_payload is not null, 'T6: auto_removed message missing in r3 thread');
  perform pg_temp.assert(v_auto_payload->'link_target'->>'type' = 'post', 'T6: auto_removed link_target.type wrong');
  perform pg_temp.assert((v_auto_payload->'link_target'->>'id')::uuid = v_post, 'T6: auto_removed link_target.id wrong');
  perform pg_temp.assert(v_auto_payload->'target_preview'->>'kind' = 'post', 'T6: auto_removed target_preview.kind wrong');
  perform pg_temp.assert(v_auto_payload->>'distinct_reporters' = '3', 'T6: distinct_reporters should be 3');

  raise notice '✓ T6 threshold breach emits enriched auto_removed';
end $$;

-- ───────── TEST 7: regression — only ONE system message per report ───────────
do $$
declare
  v_r uuid := pg_temp.mk_user('t7_r_' || substr(gen_random_uuid()::text,1,8));
  v_a uuid := pg_temp.mk_user('t7_a_' || substr(gen_random_uuid()::text,1,8));
  v_post uuid;
  v_count int;
begin
  insert into public.posts (post_id, owner_id, type, title, description, city, street, street_number)
  values (gen_random_uuid(), v_a, 'Give', 'Regression', 'd',
          (select city_id from public.cities limit 1), 'St', '1')
  returning post_id into v_post;

  insert into public.reports (reporter_id, target_type, target_id, reason)
  values (v_r, 'post', v_post, 'Spam');

  -- Should be exactly one report_received message in v_r's support thread for this report.
  select count(*) into v_count
    from public.messages m
    join public.chats c on c.chat_id = m.chat_id
   where c.is_support_thread = true
     and (c.participant_a = v_r or c.participant_b = v_r)
     and m.system_payload->>'kind' in ('report', 'report_received')
     and (m.system_payload->>'target_id')::uuid = v_post;

  perform pg_temp.assert(v_count = 1, format('T7: expected 1 system message, got %s (obsolete 0013 trigger may still be live)', v_count));

  raise notice '✓ T7 no duplicate system messages';
end $$;

\echo '✓ 0043 report-admin-payload-enrichment tests passed'
```

- [ ] **Step 2: Run the test against the current DB to confirm it fails**

```bash
cd /Users/navesarussi/KC/MVP-2
supabase start -x studio,inbucket,imgproxy,edge-runtime,realtime,storage-api 2>/dev/null || true
PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres \
  -v ON_ERROR_STOP=1 -f supabase/tests/0043_report_admin_payload_enrichment.sql
```
Expected: T1 fails with `ASSERT FAILED: T1: link_target.type wrong` (or earlier assertion failure) — because the current trigger doesn't write `link_target`. T7 may also fail if duplicate messages exist.

If `supabase start` fails because Docker is not running, ask the user to start Docker Desktop first; do not skip this verification step.

- [ ] **Step 3: Commit the failing test (TDD discipline)**

```bash
git add supabase/tests/0043_report_admin_payload_enrichment.sql
git commit -m "test(mod): pgTAP-style tests for 0043 report payload enrichment

Tests fail until 0043 migration lands (TDD). Covers:
- report_received link_target + target_preview for post/user/chat
- chat→user counterpart resolution (both directions)
- support-thread / target_type=none yield null enrichment
- threshold breach emits enriched auto_removed
- regression: no duplicate system message from obsolete 0013 trigger

Mapped to spec: FR-MOD-001 AC4, FR-MOD-005 AC3."
```

---

## Task 4: Migration 0043 — replace function + drop obsolete trigger + ROLLBACK block

**Files:**
- Create: `supabase/migrations/0043_report_admin_payload_enrichment.sql`

- [ ] **Step 1: Create the migration file**

```sql
-- 0043_report_admin_payload_enrichment | FR-MOD-001 AC4 + FR-MOD-005 AC3
--
-- Replaces reports_after_insert_apply_effects (originally 0005, last
-- replaced in 0040) to:
--   - enrich the report_received system_payload with link_target +
--     target_preview (snapshot at INSERT time);
--   - on threshold breach (FR-MOD-005), emit a NEW kind='auto_removed'
--     system message into the 3rd reporter's support thread with the
--     same enriched payload — closes FR-MOD-005 AC3 which had no BE
--     implementation.
--
-- Also drops the obsolete reports_after_insert_emit_message trigger
-- defined in 0013 — it produced kind='report' duplicates that the
-- dispatcher never rendered (latent dead noise + double-write).
--
-- Privacy floor for MVP is UI-side (admin-gated bubble render). DB-level
-- visibility predicate and RTBF scrub are TD (see TECH_DEBT.md).
--
-- The trigger binding `reports_after_insert_effects` (on public.reports)
-- defined in 0005 still references this function — no recreation needed.

-- ── 0. drop obsolete duplicate-emitter trigger from 0013 ────────────────────
drop trigger if exists reports_after_insert_emit_message on public.reports;

-- ── 1. reports_after_insert_apply_effects — enriched payload ────────────────
create or replace function public.reports_after_insert_apply_effects()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  distinct_reporters int;
  v_chat              uuid;
  v_threshold_hit     boolean := false;
  v_owner_id          uuid;
  v_owner_chat        uuid;
  -- enrichment locals
  v_target_user_id    uuid;
  v_chat_is_support   boolean;
  v_link_handle       text;
  v_link_target       jsonb := null;
  v_target_preview    jsonb := null;
  v_payload           jsonb;
begin
  -- (1) Reporter-side hide (no-op for target_type='none').
  if new.target_type <> 'none' then
    insert into public.reporter_hides (reporter_id, target_type, target_id)
    values (new.reporter_id, new.target_type, new.target_id)
    on conflict do nothing;
  end if;

  -- (2) Audit.
  insert into public.audit_events (actor_id, action, target_type, target_id, metadata)
  values (
    new.reporter_id,
    'report_target',
    new.target_type,
    new.target_id,
    jsonb_build_object('report_id', new.report_id, 'reason', new.reason)
  );

  -- (3) Auto-removal threshold (skipped for target_type='none').
  if new.target_type <> 'none' then
    perform pg_advisory_xact_lock(
      hashtext('mod_target_' || new.target_type || '_' || new.target_id::text)::bigint);

    select count(distinct reporter_id) into distinct_reporters
      from public.reports
     where target_type = new.target_type
       and target_id   = new.target_id
       and status      = 'open';

    if distinct_reporters >= 3 then
      v_threshold_hit := true;
      if new.target_type = 'post' then
        update public.posts set status = 'removed_admin'
         where post_id = new.target_id and status <> 'removed_admin';
      elsif new.target_type = 'user' then
        update public.users set account_status = 'suspended_admin'
         where user_id = new.target_id
           and account_status not in ('suspended_admin','banned','deleted');
      elsif new.target_type = 'chat' then
        update public.chats set removed_at = now()
         where chat_id = new.target_id and removed_at is null;
      end if;

      insert into public.audit_events (actor_id, action, target_type, target_id, metadata)
      values (null, 'auto_remove_target', new.target_type, new.target_id,
              jsonb_build_object('distinct_reporters', distinct_reporters));
    end if;
  end if;

  -- ── ENRICHMENT — build link_target + target_preview ───────────────────────
  -- Resolve "the user being reported" (target_type=user, or chat→counterpart).
  -- For post: link points at the post; preview is post-shaped.
  -- For chat: reject is_support_thread=true (counterpart would be admin).
  if new.target_type = 'post' then
    select jsonb_build_object(
      'type', 'post',
      'id',   p.post_id,
      'handle', u.share_handle
    ),
    jsonb_build_object(
      'kind', 'post',
      'author_handle',       u.share_handle,
      'author_display_name', u.display_name,
      'body_snippet', nullif(trim(regexp_replace(
        left(p.title || coalesce(' — ' || p.description, ''), 80),
        '\s+', ' ', 'g'
      )), ''),
      'has_image', exists (select 1 from public.media_assets m where m.post_id = p.post_id)
    )
    into v_link_target, v_target_preview
    from public.posts p
    join public.users u on u.user_id = p.owner_id
    where p.post_id = new.target_id;

  elsif new.target_type = 'user' then
    v_target_user_id := new.target_id;
    select share_handle into v_link_handle from public.users where user_id = v_target_user_id;
    if v_link_handle is not null then
      v_link_target := jsonb_build_object('type', 'user', 'id', v_target_user_id, 'handle', v_link_handle);
    end if;

    select jsonb_build_object(
      'kind', 'user',
      'handle', share_handle,
      'display_name', display_name,
      'bio_snippet', nullif(trim(regexp_replace(left(coalesce(biography, ''), 80), '\s+', ' ', 'g')), '')
    ) into v_target_preview
    from public.users where user_id = v_target_user_id;

  elsif new.target_type = 'chat' then
    select
      case when participant_a = new.reporter_id then participant_b else participant_a end,
      is_support_thread
    into v_target_user_id, v_chat_is_support
    from public.chats where chat_id = new.target_id;

    if v_target_user_id is not null and coalesce(v_chat_is_support, false) = false then
      select share_handle into v_link_handle from public.users where user_id = v_target_user_id;
      if v_link_handle is not null then
        v_link_target := jsonb_build_object('type', 'user', 'id', v_target_user_id, 'handle', v_link_handle);
      end if;

      select jsonb_build_object(
        'kind', 'user',
        'handle', share_handle,
        'display_name', display_name,
        'bio_snippet', nullif(trim(regexp_replace(left(coalesce(biography, ''), 80), '\s+', ' ', 'g')), '')
      ) into v_target_preview
      from public.users where user_id = v_target_user_id;
    end if;
  end if;
  -- target_type='none' leaves v_link_target/v_target_preview null.

  -- (4) Best-effort admin-side support-thread message (report_received).
  begin
    v_chat := public.find_or_create_support_chat(new.reporter_id);
    if v_chat is not null then
      v_payload := jsonb_build_object(
        'kind',        'report_received',
        'report_id',   new.report_id,
        'target_type', new.target_type,
        'target_id',   new.target_id,
        'reason',      new.reason,
        'link_target', v_link_target,
        'target_preview', v_target_preview
      );
      perform public.inject_system_message(v_chat, v_payload, null);
    end if;
  exception when others then
    raise warning 'admin-side report_received message failed: % (state %, report_id %)',
      sqlerrm, sqlstate, new.report_id;
  end;

  -- (5) Best-effort owner-side notification on auto-removal.
  -- Owner = post.owner_id (post target) or the suspended user (user target).
  if v_threshold_hit then
    begin
      v_owner_id := case new.target_type
        when 'post' then (select owner_id from public.posts where post_id = new.target_id)
        when 'user' then new.target_id
        else null
      end;
      if v_owner_id is not null and v_owner_id <> new.reporter_id then
        v_owner_chat := public.find_or_create_support_chat(v_owner_id);
        if v_owner_chat is not null then
          perform public.inject_system_message(v_owner_chat,
            jsonb_build_object('kind', 'owner_auto_removed',
                               'target_type', new.target_type,
                               'target_id', new.target_id),
            null);
        end if;
      end if;
    exception when others then
      raise warning 'owner_auto_removed message failed: % (state %, target %/%)',
        sqlerrm, sqlstate, new.target_type, new.target_id;
    end;
  end if;

  -- (6) NEW — admin-side auto_removed bubble in the 3rd reporter's thread.
  if v_threshold_hit then
    begin
      -- Reuse v_chat (already the reporter's support thread). If the (4) block
      -- above failed and v_chat is null, retry resolution.
      if v_chat is null then
        v_chat := public.find_or_create_support_chat(new.reporter_id);
      end if;
      if v_chat is not null then
        perform public.inject_system_message(
          v_chat,
          jsonb_build_object(
            'kind',               'auto_removed',
            'target_type',        new.target_type,
            'target_id',          new.target_id,
            'distinct_reporters', distinct_reporters,
            'link_target',        v_link_target,
            'target_preview',     v_target_preview
          ),
          null
        );
      end if;
    exception when others then
      raise warning 'admin-side auto_removed message failed: % (state %, target %/%)',
        sqlerrm, sqlstate, new.target_type, new.target_id;
    end;
  end if;

  return new;
end;
$$;

-- ════════════════════════════════════════════════════════════════════════════
-- ROLLBACK (operator: paste & execute the block below to revert this migration
-- in production. CREATE OR REPLACE FUNCTION cannot be reverted via git revert.)
-- ════════════════════════════════════════════════════════════════════════════
--
-- create or replace function public.reports_after_insert_apply_effects()
-- returns trigger
-- language plpgsql
-- security definer
-- set search_path = public
-- as $$
-- declare
--   distinct_reporters int;
--   v_chat        uuid;
--   v_threshold_hit boolean := false;
--   v_owner_id    uuid;
--   v_owner_chat  uuid;
-- begin
--   if new.target_type <> 'none' then
--     insert into public.reporter_hides (reporter_id, target_type, target_id)
--     values (new.reporter_id, new.target_type, new.target_id)
--     on conflict do nothing;
--   end if;
--   insert into public.audit_events (actor_id, action, target_type, target_id, metadata)
--   values (new.reporter_id, 'report_target', new.target_type, new.target_id,
--           jsonb_build_object('report_id', new.report_id, 'reason', new.reason));
--   if new.target_type <> 'none' then
--     perform pg_advisory_xact_lock(
--       hashtext('mod_target_' || new.target_type || '_' || new.target_id::text)::bigint);
--     select count(distinct reporter_id) into distinct_reporters
--       from public.reports
--      where target_type = new.target_type and target_id = new.target_id and status = 'open';
--     if distinct_reporters >= 3 then
--       v_threshold_hit := true;
--       if new.target_type = 'post' then
--         update public.posts set status = 'removed_admin' where post_id = new.target_id and status <> 'removed_admin';
--       elsif new.target_type = 'user' then
--         update public.users set account_status = 'suspended_admin'
--          where user_id = new.target_id and account_status not in ('suspended_admin','banned','deleted');
--       elsif new.target_type = 'chat' then
--         update public.chats set removed_at = now() where chat_id = new.target_id and removed_at is null;
--       end if;
--       insert into public.audit_events (actor_id, action, target_type, target_id, metadata)
--       values (null, 'auto_remove_target', new.target_type, new.target_id,
--               jsonb_build_object('distinct_reporters', distinct_reporters));
--     end if;
--   end if;
--   begin
--     v_chat := public.find_or_create_support_chat(new.reporter_id);
--     if v_chat is not null then
--       perform public.inject_system_message(v_chat,
--         jsonb_build_object('kind', 'report_received', 'report_id', new.report_id,
--                            'target_type', new.target_type, 'target_id', new.target_id,
--                            'reason', new.reason),
--         null);
--     end if;
--   exception when others then
--     raise warning 'admin-side report_received message failed: % (state %, report_id %)',
--       sqlerrm, sqlstate, new.report_id;
--   end;
--   if v_threshold_hit then
--     begin
--       v_owner_id := case new.target_type
--         when 'post' then (select owner_id from public.posts where post_id = new.target_id)
--         when 'user' then new.target_id else null end;
--       if v_owner_id is not null and v_owner_id <> new.reporter_id then
--         v_owner_chat := public.find_or_create_support_chat(v_owner_id);
--         if v_owner_chat is not null then
--           perform public.inject_system_message(v_owner_chat,
--             jsonb_build_object('kind', 'owner_auto_removed',
--                                'target_type', new.target_type,
--                                'target_id', new.target_id),
--             null);
--         end if;
--       end if;
--     exception when others then
--       raise warning 'owner_auto_removed message failed: % (state %, target %/%)',
--         sqlerrm, sqlstate, new.target_type, new.target_id;
--     end;
--   end if;
--   return new;
-- end;
-- $$;
--
-- (Note: re-creating the dropped 0013 trigger is intentionally omitted — the
-- duplicate it produced is a bug, not desired behaviour.)
```

- [ ] **Step 2: Apply the migration locally**

```bash
cd /Users/navesarussi/KC/MVP-2
supabase db reset 2>&1 | tail -20
```
Expected: clean exit; "Finished `supabase db reset`." line. If 0043 has a syntax error, fix it inline before continuing.

- [ ] **Step 3: Run the tests — they should now pass**

```bash
PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres \
  -v ON_ERROR_STOP=1 -f supabase/tests/0043_report_admin_payload_enrichment.sql
```
Expected: 7 `✓ Tx ... OK` notices and final `✓ 0043 report-admin-payload-enrichment tests passed`. No `ASSERT FAILED` lines.

If a test fails, read the assertion message, fix the migration (not the test), re-run from Step 2.

- [ ] **Step 4: Run migration-coverage too (regression)**

```bash
PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres \
  -v ON_ERROR_STOP=1 -f supabase/tests/migration-coverage.sql
```
Expected: `✓ migration-coverage.sql passed`.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/0043_report_admin_payload_enrichment.sql
git commit -m "feat(mod): enrich report_received + emit auto_removed payload

- Add link_target + target_preview snapshot to report_received system message.
- Implement FR-MOD-005 AC3: emit kind='auto_removed' system message on
  threshold breach (3 distinct reporters), into the 3rd reporter's support
  thread, with the same enriched payload structure.
- Drop obsolete reports_after_insert_emit_message trigger from 0013
  (produced unrendered kind='report' duplicates).
- Bottom-of-file -- ROLLBACK: comment block contains the previous (0040)
  function body verbatim for operator recovery.

Mapped to spec: FR-MOD-001 AC4, FR-MOD-005 AC3."
```

---

## Task 5: i18n strings

**Files:**
- Modify: `app/apps/mobile/src/i18n/partials/moderationHe.ts`

- [ ] **Step 1: Extend the bubble strings**

Open `app/apps/mobile/src/i18n/partials/moderationHe.ts`. Replace the existing `bubble:` block (lines 34-49) with:

```ts
  bubble: {
    reportReceived: {
      title: 'דיווח התקבל',
      body: 'דיווח על {target_type} · {reason} · {count}/3',
    },
    autoRemoved: {
      title: 'הוסר אוטומטית',
      body: '{target_type} הוסר לאחר 3 דיווחים',
    },
    modActionTaken: {
      body: '✅ טופל ע״י אדמין · {action} · {time}',
    },
    ownerAutoRemoved: {
      body: 'הפוסט שלך הוסר אוטומטית בעקבות דיווחים חוזרים. אם זו טעות, ניתן לערער דרך כתובת התמיכה.',
    },
    targetPreview: {
      open: 'פתח',
      postLabel: 'פוסט',
      profileLabel: 'פרופיל',
      hasImage: '📷 כולל תמונה',
      reporterNoteLabel: 'הערת מדווח:',
      evidenceLabel: 'צילום מצב מרגע הדיווח',
      chatNote: 'דיווח על שיחה — מוצג הצד השני',
      a11yOpenPost: 'פתח פוסט מאת ‎@{handle}',
      a11yOpenProfile: 'פתח פרופיל של ‎@{handle}',
    },
  },
```

- [ ] **Step 2: Run typecheck to confirm the `as const` shape is still valid**

```bash
cd app && pnpm --filter @kc/mobile typecheck
```
Expected: no errors related to `moderationHe`. (Other unrelated errors should be pre-existing — if this command surfaces them, scope them out.)

- [ ] **Step 3: Commit**

```bash
git add app/apps/mobile/src/i18n/partials/moderationHe.ts
git commit -m "i18n(mod): add target-preview strings for report bubbles"
```

---

## Task 6: ReportReceivedBubble — admin-gated preview card

**Files:**
- Modify: `app/apps/mobile/src/components/chat/system/ReportReceivedBubble.tsx`

- [ ] **Step 1: Replace the file with the new bubble**

Replace the entire content of `app/apps/mobile/src/components/chat/system/ReportReceivedBubble.tsx` with:

```tsx
// FR-ADMIN-003 / FR-MOD-001 AC4 — admin-facing system bubble for newly-filed
// reports. Renders an admin-gated rich preview card (handle + content snippet
// + tap to open) when payload contains link_target + target_preview, and
// shows dismiss / confirm action buttons to super admins. Dimmed once a
// later mod_action_taken bubble references this message.
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useIsSuperAdmin } from '../../../hooks/useIsSuperAdmin';
import { container } from '../../../lib/container';
import he from '../../../i18n/he';
import { confirmAndRun, showAdminToast } from './adminActions';
import type { SystemMessageBubbleProps } from './SystemMessageBubble';

type LinkTarget = { type: 'post' | 'user'; id: string; handle: string };
type PostPreview = {
  kind: 'post';
  author_handle: string;
  author_display_name: string;
  body_snippet: string | null;
  has_image: boolean;
};
type UserPreview = {
  kind: 'user';
  handle: string;
  display_name: string;
  bio_snippet: string | null;
};
type TargetPreview = PostPreview | UserPreview;

function readLinkTarget(p: Record<string, unknown> | null): LinkTarget | null {
  const lt = p?.link_target as Record<string, unknown> | null | undefined;
  if (!lt || typeof lt !== 'object') return null;
  const type = lt.type;
  const id = lt.id;
  const handle = lt.handle;
  if ((type !== 'post' && type !== 'user') || typeof id !== 'string' || typeof handle !== 'string') return null;
  return { type, id, handle };
}

function readPreview(p: Record<string, unknown> | null): TargetPreview | null {
  const tp = p?.target_preview as Record<string, unknown> | null | undefined;
  if (!tp || typeof tp !== 'object') return null;
  if (tp.kind === 'post') {
    return {
      kind: 'post',
      author_handle: String(tp.author_handle ?? ''),
      author_display_name: String(tp.author_display_name ?? ''),
      body_snippet: typeof tp.body_snippet === 'string' ? tp.body_snippet : null,
      has_image: Boolean(tp.has_image),
    };
  }
  if (tp.kind === 'user') {
    return {
      kind: 'user',
      handle: String(tp.handle ?? ''),
      display_name: String(tp.display_name ?? ''),
      bio_snippet: typeof tp.bio_snippet === 'string' ? tp.bio_snippet : null,
    };
  }
  return null;
}

export function ReportReceivedBubble({
  payload,
  body,
  handledByLaterAction,
}: SystemMessageBubbleProps) {
  const isAdmin = useIsSuperAdmin();
  const router = useRouter();
  const t = he.moderation;
  const reportId = payload?.report_id as string | undefined;
  const targetType = payload?.target_type as string | undefined;
  const reason = payload?.reason as string | undefined;
  const showActions = isAdmin && !handledByLaterAction && !!reportId;

  const linkTarget = readLinkTarget(payload);
  const preview = readPreview(payload);
  const showRichPreview = isAdmin && !!linkTarget && !!preview;
  const showChatNote = showRichPreview && targetType === 'chat';

  const navigate = () => {
    if (!linkTarget) return;
    if (linkTarget.type === 'post') {
      router.push({ pathname: '/post/[id]', params: { id: linkTarget.id } });
    } else {
      router.push({ pathname: '/user/[handle]', params: { handle: linkTarget.handle } });
    }
  };

  const a11yLabel =
    preview?.kind === 'post'
      ? t.bubble.targetPreview.a11yOpenPost.replace('{handle}', (preview as PostPreview).author_handle)
      : preview?.kind === 'user'
        ? t.bubble.targetPreview.a11yOpenProfile.replace('{handle}', (preview as UserPreview).handle)
        : '';

  return (
    <View style={[styles.bubble, handledByLaterAction && styles.dimmed]}>
      <Text style={styles.title}>{t.bubble.reportReceived.title}</Text>
      {showChatNote ? <Text style={styles.note}>{t.bubble.targetPreview.chatNote}</Text> : null}
      {reason ? <Text style={styles.body}>{`${reason}`}</Text> : null}

      {showRichPreview && preview && linkTarget ? (
        <Pressable
          onPress={navigate}
          accessibilityRole="button"
          accessibilityLabel={a11yLabel}
          style={styles.card}
        >
          {preview.kind === 'post' ? (
            <>
              <Text style={styles.handle}>
                {`‎@${preview.author_handle} · ${t.bubble.targetPreview.postLabel}`}
              </Text>
              {preview.body_snippet ? (
                <Text style={styles.snippet} numberOfLines={3}>
                  {preview.body_snippet}
                </Text>
              ) : null}
              {preview.has_image ? <Text style={styles.snippet}>{t.bubble.targetPreview.hasImage}</Text> : null}
            </>
          ) : (
            <>
              <Text style={styles.handle}>
                {`‎@${preview.handle} · ${t.bubble.targetPreview.profileLabel}`}
              </Text>
              {preview.display_name ? <Text style={styles.snippet}>{preview.display_name}</Text> : null}
              {preview.bio_snippet ? (
                <Text style={styles.snippet} numberOfLines={3}>
                  {preview.bio_snippet}
                </Text>
              ) : null}
            </>
          )}
          <View style={styles.openRow}>
            <Ionicons name="chevron-back" size={16} color="#1a3d8f" />
            <Text style={styles.openText}>{t.bubble.targetPreview.open}</Text>
          </View>
        </Pressable>
      ) : null}

      {showRichPreview ? <Text style={styles.evidence}>{t.bubble.targetPreview.evidenceLabel}</Text> : null}

      {body.length > 0 ? (
        <Text style={styles.body}>
          <Text style={styles.noteLabel}>{`${t.bubble.targetPreview.reporterNoteLabel} `}</Text>
          {body}
        </Text>
      ) : null}

      {showActions ? (
        <View style={styles.row}>
          <Pressable
            onPress={() =>
              confirmAndRun({
                action: 'dismiss',
                onConfirm: () => container.dismissReport.execute({ reportId: reportId! }),
                onSuccess: () => showAdminToast(t.actions.success.dismiss),
                onError: showAdminToast,
              })
            }
          >
            <Text style={styles.btn}>{t.actions.dismiss}</Text>
          </Pressable>
          <Pressable
            onPress={() =>
              confirmAndRun({
                action: 'confirm',
                onConfirm: () => container.confirmReport.execute({ reportId: reportId! }),
                onSuccess: () => showAdminToast(t.actions.success.confirm),
                onError: showAdminToast,
              })
            }
          >
            <Text style={styles.btn}>{t.actions.confirm}</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    padding: 8,
    backgroundColor: '#fff7e0',
    borderRadius: 8,
    marginVertical: 4,
    alignSelf: 'center',
    maxWidth: '90%',
  },
  dimmed: { opacity: 0.5 },
  title: { fontWeight: '600' },
  body: { marginTop: 2, fontSize: 13 },
  noteLabel: { fontWeight: '600' },
  note: { fontSize: 11, color: '#666', fontStyle: 'italic', marginTop: 2 },
  card: {
    marginTop: 6,
    padding: 8,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e0d8b0',
    minHeight: 44,
  },
  handle: { fontWeight: '600' },
  snippet: { fontSize: 13, marginTop: 2 },
  openRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 4 },
  openText: { color: '#1a3d8f', fontWeight: '600', fontSize: 13 },
  evidence: { fontSize: 11, color: '#666', fontStyle: 'italic', marginTop: 4 },
  row: { flexDirection: 'row-reverse', gap: 16, marginTop: 8 },
  btn: { color: '#1a3d8f', fontWeight: '600' },
});
```

- [ ] **Step 2: Typecheck**

```bash
cd app && pnpm --filter @kc/mobile typecheck
```
Expected: no errors related to `ReportReceivedBubble`.

- [ ] **Step 3: Commit**

```bash
git add app/apps/mobile/src/components/chat/system/ReportReceivedBubble.tsx
git commit -m "feat(mod): admin-gated preview card in ReportReceivedBubble

Renders rich preview (handle + snippet + tap-to-open) when payload contains
link_target + target_preview AND viewer is super admin. Falls back to legacy
title-only render otherwise. Uses sibling Pressable structure (no nesting
with action buttons) and typed expo-router navigation.

Mapped to spec: FR-MOD-001 AC4."
```

---

## Task 7: AutoRemovedBubble — admin-gated preview card

**Files:**
- Modify: `app/apps/mobile/src/components/chat/system/AutoRemovedBubble.tsx`

- [ ] **Step 1: Replace the file with the new bubble**

Replace the entire content of `app/apps/mobile/src/components/chat/system/AutoRemovedBubble.tsx` with:

```tsx
// FR-ADMIN-002 / FR-ADMIN-004 / FR-MOD-005 AC3 — admin-facing bubble for
// auto-removed targets. Shows restore + (for user targets) ban actions to
// super admins, plus a rich preview card identical to ReportReceivedBubble's
// when the enriched payload (link_target + target_preview) is present.
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useIsSuperAdmin } from '../../../hooks/useIsSuperAdmin';
import { useAuthStore } from '../../../store/authStore';
import { container } from '../../../lib/container';
import he from '../../../i18n/he';
import { confirmAndRun, showAdminToast } from './adminActions';
import type { SystemMessageBubbleProps } from './SystemMessageBubble';

type TargetType = 'post' | 'user' | 'chat';

type LinkTarget = { type: 'post' | 'user'; id: string; handle: string };
type PostPreview = {
  kind: 'post';
  author_handle: string;
  author_display_name: string;
  body_snippet: string | null;
  has_image: boolean;
};
type UserPreview = {
  kind: 'user';
  handle: string;
  display_name: string;
  bio_snippet: string | null;
};
type TargetPreview = PostPreview | UserPreview;

function readLinkTarget(p: Record<string, unknown> | null): LinkTarget | null {
  const lt = p?.link_target as Record<string, unknown> | null | undefined;
  if (!lt || typeof lt !== 'object') return null;
  const type = lt.type;
  const id = lt.id;
  const handle = lt.handle;
  if ((type !== 'post' && type !== 'user') || typeof id !== 'string' || typeof handle !== 'string') return null;
  return { type, id, handle };
}

function readPreview(p: Record<string, unknown> | null): TargetPreview | null {
  const tp = p?.target_preview as Record<string, unknown> | null | undefined;
  if (!tp || typeof tp !== 'object') return null;
  if (tp.kind === 'post') {
    return {
      kind: 'post',
      author_handle: String(tp.author_handle ?? ''),
      author_display_name: String(tp.author_display_name ?? ''),
      body_snippet: typeof tp.body_snippet === 'string' ? tp.body_snippet : null,
      has_image: Boolean(tp.has_image),
    };
  }
  if (tp.kind === 'user') {
    return {
      kind: 'user',
      handle: String(tp.handle ?? ''),
      display_name: String(tp.display_name ?? ''),
      bio_snippet: typeof tp.bio_snippet === 'string' ? tp.bio_snippet : null,
    };
  }
  return null;
}

export function AutoRemovedBubble({
  payload,
  body,
  handledByLaterAction,
}: SystemMessageBubbleProps) {
  const isAdmin = useIsSuperAdmin();
  const me = useAuthStore((s) => s.session?.userId ?? null);
  const router = useRouter();
  const t = he.moderation;
  const targetType = payload?.target_type as TargetType | undefined;
  const targetId = payload?.target_id as string | undefined;
  const showActions = isAdmin && !handledByLaterAction && !!targetType && !!targetId;

  const linkTarget = readLinkTarget(payload);
  const preview = readPreview(payload);
  const showRichPreview = isAdmin && !!linkTarget && !!preview;
  const showChatNote = showRichPreview && targetType === 'chat';

  const navigate = () => {
    if (!linkTarget) return;
    if (linkTarget.type === 'post') {
      router.push({ pathname: '/post/[id]', params: { id: linkTarget.id } });
    } else {
      router.push({ pathname: '/user/[handle]', params: { handle: linkTarget.handle } });
    }
  };

  const a11yLabel =
    preview?.kind === 'post'
      ? t.bubble.targetPreview.a11yOpenPost.replace('{handle}', (preview as PostPreview).author_handle)
      : preview?.kind === 'user'
        ? t.bubble.targetPreview.a11yOpenProfile.replace('{handle}', (preview as UserPreview).handle)
        : '';

  return (
    <View style={[styles.bubble, handledByLaterAction && styles.dimmed]}>
      <Text style={styles.title}>{t.bubble.autoRemoved.title}</Text>
      {showChatNote ? <Text style={styles.note}>{t.bubble.targetPreview.chatNote}</Text> : null}

      {showRichPreview && preview && linkTarget ? (
        <Pressable
          onPress={navigate}
          accessibilityRole="button"
          accessibilityLabel={a11yLabel}
          style={styles.card}
        >
          {preview.kind === 'post' ? (
            <>
              <Text style={styles.handle}>
                {`‎@${preview.author_handle} · ${t.bubble.targetPreview.postLabel}`}
              </Text>
              {preview.body_snippet ? (
                <Text style={styles.snippet} numberOfLines={3}>
                  {preview.body_snippet}
                </Text>
              ) : null}
              {preview.has_image ? <Text style={styles.snippet}>{t.bubble.targetPreview.hasImage}</Text> : null}
            </>
          ) : (
            <>
              <Text style={styles.handle}>
                {`‎@${preview.handle} · ${t.bubble.targetPreview.profileLabel}`}
              </Text>
              {preview.display_name ? <Text style={styles.snippet}>{preview.display_name}</Text> : null}
              {preview.bio_snippet ? (
                <Text style={styles.snippet} numberOfLines={3}>
                  {preview.bio_snippet}
                </Text>
              ) : null}
            </>
          )}
          <View style={styles.openRow}>
            <Ionicons name="chevron-back" size={16} color="#1a3d8f" />
            <Text style={styles.openText}>{t.bubble.targetPreview.open}</Text>
          </View>
        </Pressable>
      ) : null}

      {showRichPreview ? <Text style={styles.evidence}>{t.bubble.targetPreview.evidenceLabel}</Text> : null}

      {body.length > 0 ? <Text style={styles.body}>{body}</Text> : null}

      {showActions ? (
        <View style={styles.row}>
          <Pressable
            onPress={() =>
              confirmAndRun({
                action: 'restore',
                onConfirm: () =>
                  container.restoreTarget.execute({
                    targetType: targetType!,
                    targetId: targetId!,
                  }),
                onSuccess: () => showAdminToast(t.actions.success.restore),
                onError: showAdminToast,
              })
            }
          >
            <Text style={styles.btn}>{t.actions.restore}</Text>
          </Pressable>
          {targetType === 'user' && me ? (
            <Pressable
              onPress={() =>
                confirmAndRun({
                  action: 'ban',
                  onConfirm: () =>
                    container.banUser.execute({
                      adminId: me,
                      targetUserId: targetId!,
                      reason: 'policy_violation',
                      note: 'auto-removed at threshold',
                    }),
                  onSuccess: () => showAdminToast(t.actions.success.ban),
                  onError: showAdminToast,
                })
              }
            >
              <Text style={styles.btn}>{t.actions.ban}</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    padding: 8,
    backgroundColor: '#fff0d0',
    borderRadius: 8,
    marginVertical: 4,
    alignSelf: 'center',
    maxWidth: '90%',
  },
  dimmed: { opacity: 0.5 },
  title: { fontWeight: '600' },
  body: { marginTop: 2, fontSize: 13 },
  note: { fontSize: 11, color: '#666', fontStyle: 'italic', marginTop: 2 },
  card: {
    marginTop: 6,
    padding: 8,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#dcc88a',
    minHeight: 44,
  },
  handle: { fontWeight: '600' },
  snippet: { fontSize: 13, marginTop: 2 },
  openRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 4 },
  openText: { color: '#1a3d8f', fontWeight: '600', fontSize: 13 },
  evidence: { fontSize: 11, color: '#666', fontStyle: 'italic', marginTop: 4 },
  row: { flexDirection: 'row-reverse', gap: 16, marginTop: 8 },
  btn: { color: '#1a3d8f', fontWeight: '600' },
});
```

- [ ] **Step 2: Typecheck**

```bash
cd app && pnpm --filter @kc/mobile typecheck
```
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add app/apps/mobile/src/components/chat/system/AutoRemovedBubble.tsx
git commit -m "feat(mod): admin-gated preview card in AutoRemovedBubble

Same rich-preview pattern as ReportReceivedBubble — closes the FE half of
FR-MOD-005 AC3. Bubble was previously FE scaffolding only; with the new
0043 trigger emitting kind='auto_removed' messages, this is now wired
end-to-end.

Mapped to spec: FR-MOD-005 AC3."
```

---

## Task 8: Pre-push gates

**Files:** none — verification only.

- [ ] **Step 1: Typecheck the whole monorepo**

```bash
cd /Users/navesarussi/KC/MVP-2/app && pnpm typecheck
```
Expected: green. Fix any new errors introduced by Tasks 5-7.

- [ ] **Step 2: Lint**

```bash
cd /Users/navesarussi/KC/MVP-2/app && pnpm lint
```
Expected: green.

- [ ] **Step 3: Tests**

```bash
cd /Users/navesarussi/KC/MVP-2/app && pnpm test
```
Expected: green. (`@kc/application` is the only package with vitest tests; new code lives outside it but typecheck still validates type contracts.)

- [ ] **Step 4: Architecture lint**

```bash
cd /Users/navesarussi/KC/MVP-2/app && pnpm lint:arch
```
Expected: green. (CLAUDE.md §5 enforces file-size and dependency-direction rules.)

If any of Steps 1-4 fail, fix and re-run before continuing.

---

## Task 9: Manual UI verification

**Files:** none — browser verification, per memory `feedback_verify_ui_before_claiming_done`.

- [ ] **Step 1: Start the dev server**

```bash
cd /Users/navesarussi/KC/MVP-2/app && pnpm --filter @kc/mobile web
```

- [ ] **Step 2: Sign in as super admin**

Open the dev URL in a browser. Sign in with `karmacommunity2.0@gmail.com` (credentials in user memory `super_admin_test_account`).

- [ ] **Step 3: Trigger reports from another browser/incognito**

In a separate incognito window, sign in as a regular test user. Create a post (or use an existing one). Sign in as a second test user, find that post, tap `⋮ → Report`, pick a reason, submit. Repeat for: report a profile, report a chat (open chat with the first user, tap `⋮ → Report`).

- [ ] **Step 4: Verify the admin chat**

Back as super admin, open the admin chat / inbox. For each report bubble, confirm:
- Title "דיווח התקבל" present.
- Preview card visible with author handle + snippet (post) or handle + display_name + bio (user/chat).
- Chat-report bubble shows "דיווח על שיחה — מוצג הצד השני" note above the preview, and the preview is the OTHER party (not the reporter).
- Tap on preview card navigates to the right screen.
- "פטור" / "אשר הפרה" buttons still work and do not trigger navigation.
- Evidence label "צילום מצב מרגע הדיווח" present.

- [ ] **Step 5: Verify the auto_removed bubble**

Have three different test users report the same post in sequence. Confirm in the third reporter's support thread (admin's view) that a "הוסר אוטומטית" bubble appears with the rich preview + tap-to-open.

- [ ] **Step 6: Verify reporter-side render (admin gate)**

Sign out admin. Sign in as one of the reporters. Open their support thread. Confirm the bubble shows ONLY the title (and reason for report_received) — no preview card, no evidence label.

- [ ] **Step 7: Verify legacy fallback (pre-migration row)**

In the Supabase studio (or psql), insert a `report_received` message into a support thread without `link_target`/`target_preview` (mimicking a pre-migration row). Confirm the admin viewer sees the legacy title-only render — no crash, no broken card.

```sql
-- Example (replace v_chat with a real support_thread chat_id):
insert into public.messages (chat_id, sender_id, kind, body, system_payload, status, delivered_at)
values (
  '<v_chat>'::uuid, null, 'system', null,
  jsonb_build_object('kind','report_received','reason','Spam','target_type','post','target_id',gen_random_uuid()),
  'delivered', now()
);
```

If anything visually breaks, fix in source (Tasks 5-7) and re-verify.

---

## Task 10: SSOT closure

**Files:**
- Modify: `docs/SSOT/spec/08_moderation.md`
- Modify: `docs/SSOT/TECH_DEBT.md`
- Modify: `docs/SSOT/DECISIONS.md`
- Modify: `docs/SSOT/BACKLOG.md`

- [ ] **Step 1: Update spec status notes**

Open `docs/SSOT/spec/08_moderation.md`. In the FR-MOD-001 section (around lines 27-46), append after the AC list:

```markdown
> **Implementation note (2026-05-12):** AC4 satisfied for reports created on/after migration `0043_report_admin_payload_enrichment.sql`. Admin sees a rich preview card with author handle, content snippet, and tap-to-open. Legacy rows (pre-0043) render in degraded mode (title-only).
```

In the FR-MOD-005 section (around lines 118-138), append:

```markdown
> **Implementation note (2026-05-12):** AC3 implemented in migration `0043_report_admin_payload_enrichment.sql`. Threshold breach now emits a `kind='auto_removed'` system message into the 3rd reporter's support thread, with the same enriched payload (link_target + target_preview) as `report_received`.
```

- [ ] **Step 2: Open new TECH_DEBT entries**

Open `docs/SSOT/TECH_DEBT.md`. Find the BE Active section (TD-50..99 range per CLAUDE.md). Append four new rows (use the next free TD IDs in that range):

```markdown
| TD-XX | Trigger-level visibility filter for `messages.system_payload` snapshots (reports). UI-layer admin-gate is in place; a non-mobile client consuming payloads would see private bios. Add a visibility predicate to `reports_after_insert_apply_effects`. | BE | Low | 2026-05-12 |
| TD-XX | RTBF scrub of `messages.system_payload` snapshots in `delete_account_data` (R-MVP-Privacy-6). Defer until pre-EU-launch GDPR readiness pass. | BE | Low | 2026-05-12 |
| TD-XX | Translate `Report.reason` enum values to Hebrew in admin bubbles (currently shows raw English: `Spam`, `Offensive`, ...). | FE | Low | 2026-05-12 |
| TD-XX | Pre-migration `report_received` rows render as title-only (0040 trigger wrote `body=null`). Cosmetic — would show "Spam · post" with backfill. | FE | Low | 2026-05-12 |
```

(Replace `XX` with the actual next free IDs — read the existing file to find them.)

- [ ] **Step 3: Add a DECISIONS entry**

Open `docs/SSOT/DECISIONS.md`. Append a new D-XX (use the next free ID):

```markdown
## D-XX — Admin report-bubble snapshot privacy floor (2026-05-12)

For `messages.system_payload` snapshots taken by `reports_after_insert_apply_effects` (migration `0043`), the MVP privacy floor is the UI-layer admin-gate (`useIsSuperAdmin()`) in `ReportReceivedBubble` / `AutoRemovedBubble`. Trigger-level visibility filter (TD-XX) and RTBF scrub (TD-XX) deferred until: (a) a non-mobile client consumes payloads, or (b) an EU launch is on the roadmap. Council-reviewed; documented to prevent re-litigating the question.
```

- [ ] **Step 4: Flip BACKLOG status**

Open `docs/SSOT/BACKLOG.md`. Change the P1.3.1 row added in Task 1 from `🟡 In progress` to `✅ Done`.

- [ ] **Step 5: Commit SSOT changes**

```bash
git add docs/SSOT/spec/08_moderation.md docs/SSOT/TECH_DEBT.md docs/SSOT/DECISIONS.md docs/SSOT/BACKLOG.md
git commit -m "docs(ssot): close P1.3.1 — admin report-bubble deeplink

- spec/08_moderation.md: AC4/AC3 implementation notes.
- TECH_DEBT.md: open TDs for deferred privacy filter / RTBF scrub /
  reason-enum Hebrew translation / legacy-row degraded render.
- DECISIONS.md: D-XX records the MVP privacy-floor rationale.
- BACKLOG.md: flip P1.3.1 to Done."
```

---

## Task 11: Open the PR

**Files:** none — git/gh only.

- [ ] **Step 1: Final pre-push gate (one more time on a clean state)**

```bash
cd /Users/navesarussi/KC/MVP-2/app
pnpm typecheck && pnpm test && pnpm lint && pnpm lint:arch
```
Expected: all green.

- [ ] **Step 2: Push branch**

```bash
git push -u origin HEAD
```

- [ ] **Step 3: Create PR**

```bash
gh pr create --base main --head "$(git branch --show-current)" \
  --title "feat(mod): admin report-bubble deeplink + auto-removed message (P1.3.1)" \
  --label "FR-MOD" --assignee "@me" \
  --body "$(cat <<'EOF'
## Summary

Closes the missing link between the report bubble in the super admin's chat
and the reported content. Previously, admins saw `דיווח חדש: Spam · יעד: post`
with no way to open the post — they had to dismiss/confirm blind. This PR
adds an admin-gated rich preview card (handle + snippet + tap-to-open) to
both `report_received` and `auto_removed` bubbles, snapshotted at trigger
time so it survives target deletion.

Also closes FR-MOD-005 AC3 — auto-removal previously updated DB state and
created an audit row but emitted no admin-facing system message; the
`AutoRemovedBubble.tsx` was FE scaffolding never wired to BE. Migration 0043
now emits `kind='auto_removed'` into the 3rd reporter's support thread.

## Mapped to spec

- FR-MOD-001 AC4 — link to target in admin system message.
- FR-MOD-005 AC3 — auto-removed system message + link.
- Spec: `docs/superpowers/specs/2026-05-12-report-target-deeplink-design.md`

## Changes

- DB: new migration `0043_report_admin_payload_enrichment.sql` replaces
  `reports_after_insert_apply_effects` with enriched payload + threshold-side
  `auto_removed` emission. Drops obsolete `reports_after_insert_emit_message`
  trigger from 0013 (latent duplicate-message bug). Bottom-of-file
  `-- ROLLBACK:` comment block for operator recovery.
- DB tests: new `supabase/tests/0043_*.sql` with 7 cases (post/user/chat
  reports, support-thread report, target=none, threshold breach, no-duplicate
  regression).
- CI: `db-validate.yml` now runs all `supabase/tests/*.sql`, not only
  `migration-coverage.sql`.
- FE: `ReportReceivedBubble` and `AutoRemovedBubble` render an admin-gated
  preview card with sibling Pressable structure and typed expo-router nav.
- i18n: new strings under `bubble.targetPreview`.

## Tests

- `pnpm typecheck` ✅
- `pnpm test`      ✅
- `pnpm lint`      ✅
- `pnpm lint:arch` ✅
- DB tests: `psql -f supabase/tests/0043_*.sql` — 7 ✓ assertions pass
- Manual: super admin sees rich preview + nav for post/user/chat reports
  and for the auto_removed bubble after threshold; reporter-side viewer
  sees legacy title-only.

## SSOT updated

- [x] `BACKLOG.md` — P1.3.1 added and flipped to ✅ Done.
- [x] `spec/08_moderation.md` — AC4 / AC3 implementation notes added.
- [x] `TECH_DEBT.md` — 4 new TDs (privacy filter, RTBF scrub, reason i18n,
  legacy-row degraded render).
- [x] `DECISIONS.md` — D-XX records MVP privacy-floor rationale.

## Privacy floor

UI-layer admin-gate (`useIsSuperAdmin()`) in both bubbles; non-admin viewers
see legacy title-only render. Trigger-level visibility filter and RTBF scrub
deferred to TD per council review (no non-mobile client; no EU launch in
MVP scope).

## Risk / rollout

Low. Single migration; idempotent function replace; backward-compatible
(legacy rows render in degraded mode). `delete_account_data` untouched.
ROLLBACK comment block at bottom of 0043 for operator recovery.
EOF
)"
```

- [ ] **Step 4: Auto-merge after CI**

```bash
gh pr merge --auto --squash --delete-branch
gh pr checks --watch
```

- [ ] **Step 5: Local cleanup after merge**

```bash
git switch main
git pull --ff-only origin main
git branch -D feat/FR-MOD-001-admin-report-deeplink
```

---

## Self-review checklist (run by the implementer before submitting)

- [ ] All 7 DB test assertions pass on a fresh local DB.
- [ ] Both bubbles compile cleanly with `pnpm typecheck`.
- [ ] No new `pnpm lint` warnings.
- [ ] Reporter-side view confirmed to NOT show preview card (admin-gate works).
- [ ] Pre-migration row test confirmed legacy fallback works.
- [ ] PR body's "Mapped to spec" line present.
- [ ] All 4 SSOT files updated in the same change-set.
