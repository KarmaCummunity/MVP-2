# Karma Points (FR-KARMA) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give every user one server-authoritative "karma points" engagement number that rises on registration, posting, outreach, gaining followers, and (most of all) closed deliveries — scaled by an optional estimated-item-value slider — displayed privately on the user's own profile + stats, updating in real time.

**Architecture:** Karma is a denormalized `users.karma_points` column backed by an append-only `karma_ledger`, maintained by `SECURITY DEFINER` triggers on the same tables that already drive the existing counters (mirrors migration `0006`). A nightly `pg_cron` recompute reconciles drift (mirrors `0045`). Awards are anchored to exactly one trigger per event (append-and-sum), so reversals (reopen / unfollow / un-mark / admin-remove) net to zero without a fragile global unique key; only never-reversed "once" events (registration, post_created, outreach, backfill) get a partial-unique guard. The mobile client subscribes to its own `users` row via Supabase Realtime (`postgres_changes`, RLS-gated, publication already exists from `0007`) and writes updates into the existing `['user-profile', userId]` react-query cache, so the karma badge **and all counters** update live.

**Tech Stack:** TypeScript monorepo (pnpm + turbo) · `packages/{domain,application,infrastructure-supabase,ui}` + `apps/mobile` (Expo / React Native / expo-router) · Supabase (Postgres + RLS + Realtime + pg_cron) · vitest · react-i18next (Hebrew).

**Design source:** `docs/superpowers/specs/2026-05-29-karma-points-design.md`.

**Working directory note:** the pnpm monorepo root is `app/`. Run all `pnpm` commands from `app/`. Migrations live at repo-root `supabase/migrations/`. Latest existing migration is `0096`, so new files are `0097`–`0100`.

**Branch:** `feat/FR-KARMA-001-karma-points` off latest `origin/dev`. Frequent commits (one per task). PR targets `dev`.

**Verification gate:** every code response during execution starts with `Mapped to spec: FR-KARMA-<id>. Refactor logged: <Yes/No/NA>.` Before any push, from `app/`: `pnpm typecheck && pnpm test && pnpm lint` all green.

---

## Phase map (BE → FE dependency)

- **Phase 0 — Domain contract** (Tasks 1–2): pure karma economy + entity fields. No I/O. FE + BE both depend on this; commit first.
- **Phase 1 — Database** (Tasks 3–8): `estimated_value`, ledger, helpers, triggers, recompute, backfill.
- **Phase 2 — Infrastructure** (Tasks 9–13): realtime port + adapter, mappers, create-adapter, generated types.
- **Phase 3 — Mobile** (Tasks 14–19): slider, publish wiring, realtime hook, karma badge on profile, stats card.
- **Phase 4 — SSOT** (Task 20): new spec, BACKLOG, DECISIONS, TECH_DEBT, statistics-AC note.

---

## File Structure

**Create:**
- `app/packages/domain/src/karma.ts` — `KarmaEventType`, `KARMA_VALUE_BONUS_DIVISOR`, `KARMA_VALUE_BONUS_CAP_VALUE`, `computeValueBonus()` (award amounts live in SQL only).
- `app/packages/domain/src/__tests__/karma.test.ts`
- `supabase/migrations/0097_post_estimated_value.sql`
- `supabase/migrations/0098_karma_schema.sql`
- `supabase/migrations/0099_karma_triggers.sql`
- `supabase/migrations/0100_karma_recompute_and_backfill.sql`
- `app/packages/application/src/ports/IUserRealtime.ts`
- `app/packages/infrastructure-supabase/src/users/SupabaseUserRealtime.ts`
- `app/packages/infrastructure-supabase/src/users/__tests__/SupabaseUserRealtime.test.ts`
- `app/apps/mobile/src/components/CreatePostForm/EstimatedValueSlider.tsx`
- `app/apps/mobile/src/hooks/useMeRealtime.ts`
- `app/apps/mobile/src/components/profile/KarmaBadge.tsx`
- `app/apps/mobile/src/services/userRealtimeComposition.ts`
- `app/apps/mobile/src/i18n/locales/he/modules/karma.ts`
- `docs/SSOT/spec/14_karma.md`

**Modify:**
- `app/packages/domain/src/entities.ts` — `User.karmaPoints`.
- `app/packages/domain/src/posts.ts` — `Post.estimatedValue`.
- `app/packages/domain/src/index.ts` — export `./karma`.
- `app/packages/application/src/ports/IPostRepository.ts` — `CreatePostInput.estimatedValue`.
- `app/packages/application/src/index.ts` — export `IUserRealtime` (verify barrel).
- `app/packages/infrastructure-supabase/src/users/mapUserRow.ts` — `karma_points` → `karmaPoints`.
- `app/packages/infrastructure-supabase/src/posts/mapPostRow.ts` — `estimated_value` → `estimatedValue`.
- `app/packages/infrastructure-supabase/src/posts/SupabasePostRepository.ts:114` — insert `estimated_value`.
- `app/packages/infrastructure-supabase/src/database.types.ts` — `posts.estimated_value`, `users.karma_points`.
- `app/apps/mobile/src/hooks/useCreatePostFormState.ts` — `estimatedValue` state + setter + draft apply.
- `app/apps/mobile/src/lib/postDraftFormState.ts` — `PostDraftFormState`, `POST_DRAFT_DEFAULTS`, `isFormStateAtDefaults`, `buildDraftPayload` all gain `estimatedValue`.
- `app/apps/mobile/src/store/postDraftStore.ts` — `PostDraftPayload` gains `estimatedValue`.
- `app/apps/mobile/src/hooks/usePostDraftAutosave.ts` — include `estimatedValue`.
- `app/apps/mobile/src/hooks/useCreatePostPublish.ts` — thread `estimatedValue` into `create()`.
- `app/apps/mobile/app/(tabs)/create.tsx` — pass `estimatedValue` to the form/publish hooks + scroll content.
- `app/apps/mobile/src/components/CreatePostForm/CreatePostFormScrollContent.tsx` — mount slider in the `isGive` block.
- `MyProfileChrome.tsx` (the self-profile chrome that reads `['user-profile', userId]`) — mount `KarmaBadge` (self view only); NOT `profile/index.tsx`.
- `app/apps/mobile/app/stats.tsx` — karma card + `useMeRealtime`.
- `app/apps/mobile/app/_layout.tsx` — render `<MeRealtimeMount/>` inside the `QueryClientProvider`.
- `app/apps/mobile/src/i18n/locales/he/index.ts` — wire `karmaHe`.
- `docs/SSOT/BACKLOG.md`, `docs/SSOT/DECISIONS.md`, `docs/SSOT/TECH_DEBT.md`, `docs/SSOT/spec/10_statistics.md`.

---

## Phase 0 — Domain contract

### Task 1: Karma economy (pure domain)

**Files:**
- Create: `app/packages/domain/src/karma.ts`
- Test: `app/packages/domain/src/__tests__/karma.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// app/packages/domain/src/__tests__/karma.test.ts
import { describe, it, expect } from 'vitest';
import {
  KARMA_VALUE_BONUS_DIVISOR,
  KARMA_VALUE_BONUS_CAP_VALUE,
  computeValueBonus,
} from '../karma';

describe('karma value-bonus constants (mirror the SQL source of truth — keep in sync with 0099)', () => {
  it('matches the approved divisor + cap', () => {
    expect(KARMA_VALUE_BONUS_DIVISOR).toBe(50);
    expect(KARMA_VALUE_BONUS_CAP_VALUE).toBe(1000);
  });
});

describe('computeValueBonus', () => {
  it('is 0 for null/undefined/zero/negative', () => {
    expect(computeValueBonus(null)).toBe(0);
    expect(computeValueBonus(undefined)).toBe(0);
    expect(computeValueBonus(0)).toBe(0);
    expect(computeValueBonus(-200)).toBe(0);
  });
  it('scales by divisor with rounding', () => {
    expect(computeValueBonus(50)).toBe(1);
    expect(computeValueBonus(75)).toBe(2); // round(1.5) = 2
    expect(computeValueBonus(100)).toBe(2);
    expect(computeValueBonus(500)).toBe(10);
    expect(computeValueBonus(1000)).toBe(20);
  });
  it('clamps above the cap value', () => {
    expect(computeValueBonus(1001)).toBe(20);
    expect(computeValueBonus(9999)).toBe(20);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd app && pnpm --filter @kc/domain test -- karma`
Expected: FAIL — `Cannot find module '../karma'`.

- [ ] **Step 3: Write minimal implementation**

```ts
// app/packages/domain/src/karma.ts
// Karma value-bonus helper for the create-post slider preview. The DB (migration
// 0099) is the authoritative awarder of ALL points; the client never needs the
// per-event award amounts (the badge renders only the total; the explainer is
// qualitative i18n copy). Only the value-bonus divisor/cap are mirrored here,
// asserted against the spec in __tests__/karma.test.ts. Keep in sync with 0099.

export type KarmaEventType =
  | 'registration'
  | 'post_created'
  | 'post_removed'
  | 'outreach'
  | 'follower_gained'
  | 'follower_gained_reverse'
  | 'closure_giver'
  | 'closure_receiver'
  | 'closure_reverse'
  | 'backfill';

export const KARMA_VALUE_BONUS_DIVISOR = 50;
export const KARMA_VALUE_BONUS_CAP_VALUE = 1000;

/** Giver bonus at closure for a Give post's estimated value (FR-KARMA-003). */
export function computeValueBonus(estimatedValue: number | null | undefined): number {
  if (!estimatedValue || estimatedValue <= 0) return 0;
  const clamped = Math.min(estimatedValue, KARMA_VALUE_BONUS_CAP_VALUE);
  return Math.round(clamped / KARMA_VALUE_BONUS_DIVISOR);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd app && pnpm --filter @kc/domain test -- karma`
Expected: PASS (2 suites, all green).

- [ ] **Step 5: Commit**

```bash
git add app/packages/domain/src/karma.ts app/packages/domain/src/__tests__/karma.test.ts
git commit -m "feat(domain): add karma economy schedule + value bonus (FR-KARMA-002/003)"
```

---

### Task 2: Entity fields + barrel export

**Files:**
- Modify: `app/packages/domain/src/entities.ts:59`, `app/packages/domain/src/posts.ts:44`, `app/packages/domain/src/index.ts`

- [ ] **Step 1: Add `karmaPoints` to `User`**

In `app/packages/domain/src/entities.ts`, the `User` interface counters block ends at `followingCount: number;` (line 59). Add directly below it:

```ts
  followingCount: number;
  /** Engagement score (FR-KARMA-001). Server-maintained, floored at 0. */
  karmaPoints: number;
```

- [ ] **Step 2: Add `estimatedValue` to `Post`**

In `app/packages/domain/src/posts.ts`, the `Post` interface has `urgency: string | null;` (line 41). Add below it:

```ts
  urgency: string | null;               // only for Request
  /** Optional estimated item value 0..1000 (FR-KARMA-004). Give posts only; null otherwise. */
  estimatedValue: number | null;
```

- [ ] **Step 3: Export karma from the barrel**

In `app/packages/domain/src/index.ts`, add after `export * from './personalActivity';`:

```ts
export * from './karma';
```

- [ ] **Step 4: Typecheck**

Run: `cd app && pnpm --filter @kc/domain typecheck`
Expected: PASS. (Consumers that build `User`/`Post` literals get fixed in later tasks; domain itself has no literal builders so it stays green.)

- [ ] **Step 5: Commit**

```bash
git add app/packages/domain/src/entities.ts app/packages/domain/src/posts.ts app/packages/domain/src/index.ts
git commit -m "feat(domain): add User.karmaPoints + Post.estimatedValue (FR-KARMA-001/004)"
```

---

## Phase 1 — Database

> SQL verification runs against the **dev** Supabase project only (`roeefqpdbftlndzsvhfj`, per CLAUDE.md §13). Apply a migration with the Supabase CLI (`supabase db push` / `supabase migration up`) or the SQL editor, then run the verification SQL. Never run these against prod.

### Task 3: `posts.estimated_value` column + grant

**Files:**
- Create: `supabase/migrations/0097_post_estimated_value.sql`

- [ ] **Step 1: Write the migration**

```sql
-- 0097_post_estimated_value | FR-KARMA-004 — optional estimated item value (Give posts)
-- 0..1000; null = unset. Feeds the karma closure value bonus (0099). The slider
-- only renders for Give in the client; the column is generic (no type CHECK so a
-- future Request-value variant needs no schema change — D-155 / non-goal note).

alter table public.posts
  add column if not exists estimated_value integer
    check (estimated_value is null or (estimated_value >= 0 and estimated_value <= 1000));

-- INSERT is already table-level granted (0002 §9). Add estimated_value to the
-- column-level UPDATE grant so edit-post can change it too.
grant update (estimated_value) on public.posts to authenticated;

-- end of 0097_post_estimated_value
```

- [ ] **Step 2: Apply + verify**

Apply the migration to dev, then run:

```sql
-- column exists with the bound
insert into public.posts (post_id, owner_id, type, status, visibility, title, category, city, location_display_level, estimated_value)
values (gen_random_uuid(), (select user_id from public.users limit 1), 'Give', 'open', 'Public', 'kverify', 'Furniture', (select city from public.users where city is not null limit 1), 'city', 1500)
returning estimated_value;
```

Expected: ERROR — `violates check constraint` (1500 > 1000). Then re-run with `1000` → returns `1000`. Delete the verify row: `delete from public.posts where title = 'kverify';`

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/0097_post_estimated_value.sql
git commit -m "feat(infra): add posts.estimated_value column 0..1000 (FR-KARMA-004)"
```

---

### Task 4: Karma schema — column, ledger, helpers

**Files:**
- Create: `supabase/migrations/0098_karma_schema.sql`

- [ ] **Step 1: Write the migration**

```sql
-- 0098_karma_schema | FR-KARMA-001/002 — karma_points column, append-only ledger, award helpers
--
-- Mechanism (refines the design doc): awards are anchored to exactly ONE trigger
-- per event (0099) and the ledger is append-and-sum, so reversible events
-- (follow→unfollow, reopen, un-mark) net to zero across two rows without a global
-- unique key that would wrongly block a legitimate re-follow. A PARTIAL unique
-- index guards only the never-reversed "once" events (registration, post_created,
-- outreach, backfill). karma_points is the denorm of sum(ledger), floored at 0.

-- ── 1. Denorm column on users ───────────────────────────────────────────────
-- Not in the 0001 users UPDATE column-grant, so clients cannot write it; the
-- SECURITY DEFINER helpers below are the only writers.
alter table public.users
  add column if not exists karma_points integer not null default 0
    check (karma_points >= 0);

-- Realtime (FR-KARMA-009): a filtered `postgres_changes` UPDATE subscription +
-- RLS re-check on broadcast need the FULL row image, not just the PK. An UPDATE
-- that touches only karma_points is the fragile case without this.
alter table public.users replica identity full;

-- ── 2. Append-only ledger ────────────────────────────────────────────────────
create table if not exists public.karma_ledger (
  ledger_id    bigserial primary key,
  user_id      uuid not null references public.users (user_id) on delete cascade,
  event_type   text not null,
  points_delta integer not null,
  ref_type     text not null,
  ref_id       text not null,
  created_at   timestamptz not null default now()
);

create index if not exists karma_ledger_user_idx on public.karma_ledger (user_id);

-- Covering index for the nightly recompute's per-user GROUP BY sum.
create index if not exists karma_ledger_user_delta_idx on public.karma_ledger (user_id, points_delta);

-- Idempotency guard for never-reversed events only.
create unique index if not exists karma_ledger_once_idx
  on public.karma_ledger (user_id, event_type, ref_id)
  where event_type in ('registration', 'post_created', 'outreach', 'backfill');

alter table public.karma_ledger enable row level security;

-- Public-ready: a user may read their own ledger (FE doesn't use it yet, but this
-- keeps a future karma-breakdown a display change only). No client writes.
create policy karma_ledger_select_self on public.karma_ledger
  for select to authenticated
  using (auth.uid() = user_id);

revoke insert, update, delete on public.karma_ledger from authenticated, anon;
grant select on public.karma_ledger to authenticated;

-- ── 3. Value bonus (mirror of domain computeValueBonus / 0099 closure) ──────
create or replace function public.karma_value_bonus(p_value integer)
returns integer
language sql
immutable
as $$
  select case
    when p_value is null or p_value <= 0 then 0
    else round(least(p_value, 1000)::numeric / 50)::integer
  end;
$$;

-- ── 4. Award helpers (SECURITY DEFINER — only writers of karma_points) ──────
-- karma_grant_once: idempotent insert for never-reversed events; only bumps the
-- denorm when a ledger row was actually inserted.
create or replace function public.karma_grant_once(
  p_user uuid, p_event text, p_ref_type text, p_ref_id text, p_delta integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare v_inserted integer;
begin
  if p_user is null then return; end if;
  -- ON CONFLICT against the partial unique index is race-safe: a concurrent
  -- duplicate becomes a no-op (row_count = 0) instead of a unique_violation that
  -- would abort the host transaction (e.g. the messages INSERT for outreach).
  insert into public.karma_ledger (user_id, event_type, points_delta, ref_type, ref_id)
  values (p_user, p_event, p_delta, p_ref_type, p_ref_id)
  on conflict (user_id, event_type, ref_id)
    where event_type in ('registration', 'post_created', 'outreach', 'backfill')
    do nothing;
  get diagnostics v_inserted = row_count;
  if v_inserted > 0 then
    update public.users set karma_points = greatest(0, karma_points + p_delta)
     where user_id = p_user;
  end if;
end;
$$;

-- karma_apply: append + adjust for reversible events (no dedupe; reversal is a
-- second row with a negative delta and a *_reverse event_type).
create or replace function public.karma_apply(
  p_user uuid, p_event text, p_ref_type text, p_ref_id text, p_delta integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_user is null then return; end if;
  insert into public.karma_ledger (user_id, event_type, points_delta, ref_type, ref_id)
  values (p_user, p_event, p_delta, p_ref_type, p_ref_id);
  update public.users set karma_points = greatest(0, karma_points + p_delta)
   where user_id = p_user;
end;
$$;

revoke all on function public.karma_grant_once(uuid, text, text, text, integer) from public;
revoke all on function public.karma_apply(uuid, text, text, text, integer) from public;

-- end of 0098_karma_schema
```

- [ ] **Step 2: Apply + verify helpers**

Apply to dev, then run:

```sql
select public.karma_value_bonus(0)   as b0,   -- 0
       public.karma_value_bonus(500) as b500, -- 10
       public.karma_value_bonus(1000) as b1k, -- 20
       public.karma_value_bonus(5000) as bcap; -- 20
-- idempotency: granting the same once-event twice bumps karma exactly once
do $$
declare v uuid := (select user_id from public.users limit 1);
begin
  perform public.karma_grant_once(v, 'post_created', 'post', 'verify-ref-1', 5);
  perform public.karma_grant_once(v, 'post_created', 'post', 'verify-ref-1', 5);
end $$;
select count(*) from public.karma_ledger where ref_id = 'verify-ref-1'; -- 1
-- cleanup
delete from public.karma_ledger where ref_id = 'verify-ref-1';
update public.users set karma_points = greatest(0, karma_points - 5)
 where user_id = (select user_id from public.users limit 1);
```

Expected: `b0=0, b500=10, b1k=20, bcap=20`; ledger count = `1`.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/0098_karma_schema.sql
git commit -m "feat(infra): add karma_points column, ledger, award helpers (FR-KARMA-001/002)"
```

---

### Task 5: Karma triggers

**Files:**
- Create: `supabase/migrations/0099_karma_triggers.sql`

- [ ] **Step 1: Write the migration**

```sql
-- 0099_karma_triggers | FR-KARMA-002/003/005/006 — single-anchor award triggers
--
-- Each scored event has exactly ONE trigger (no double counting). Reversible
-- events append a negative *_reverse row. The numeric schedule here is the
-- authoritative source; the domain TS constants (packages/domain/src/karma.ts)
-- mirror it for the slider preview only.

-- ── 1. registration (+1) — users AFTER INSERT ───────────────────────────────
create or replace function public.karma_on_user_insert()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.karma_grant_once(new.user_id, 'registration', 'user', new.user_id::text, 1);
  return null;
end;
$$;
create trigger karma_users_after_insert
  after insert on public.users
  for each row execute function public.karma_on_user_insert();

-- ── 2. post_created (+5) / removed (-5) / closure (both roles) — posts ───────
-- Anchored to the AUTHORITATIVE delivery signal: the posts.status transition,
-- NOT recipients-row existence (a recipient row can precede the status flip — see
-- close_post_with_recipient in 0015 — or be deleted in a different order on
-- un-mark, see 0075). This mirrors how items_given is anchored in 0006 and yields
-- the product-required end-states: closure karma exists iff the post is currently
-- closed_delivered with a marked recipient. Reversal zeroes the post's closure
-- ledger balance per user (robust to recipient-row deletion order). Give:
-- owner=giver, recipient=receiver, bonus to giver. Request: recipient=giver,
-- owner=receiver, no bonus.
create or replace function public.karma_on_post_change()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_rid   text;
  v_rec   uuid;
  v_giver uuid;
  v_recv  uuid;
  v_bonus integer;
begin
  if tg_op = 'INSERT' then
    perform public.karma_grant_once(new.owner_id, 'post_created', 'post', new.post_id::text, 5);
    return null;
  end if;

  v_rid := new.post_id::text;

  -- admin removal reverses the creation award
  if new.status = 'removed_admin' and old.status is distinct from 'removed_admin' then
    perform public.karma_apply(new.owner_id, 'post_removed', 'post', v_rid, -5);
  end if;

  -- entering closed_delivered → award both economic roles
  if new.status = 'closed_delivered' and old.status is distinct from 'closed_delivered' then
    select r.recipient_user_id into v_rec
      from public.recipients r where r.post_id = new.post_id
      order by r.marked_at desc limit 1;
    if v_rec is not null then
      if new.type = 'Give' then
        v_giver := new.owner_id; v_recv := v_rec; v_bonus := public.karma_value_bonus(new.estimated_value);
      else
        v_giver := v_rec; v_recv := new.owner_id; v_bonus := 0;
      end if;
      perform public.karma_apply(v_giver, 'closure_giver', 'post', v_rid, 20 + v_bonus);
      perform public.karma_apply(v_recv,  'closure_receiver', 'post', v_rid, 15);
    end if;
  end if;

  -- leaving closed_delivered (reopen / un-mark) → zero the post's closure balance.
  -- `bal` snapshots each user's pre-reversal closure balance (CTE sees the table as
  -- of statement start); `ins` posts the negation; the UPDATE applies it.
  if old.status = 'closed_delivered' and new.status is distinct from 'closed_delivered' then
    with bal as (
      select l.user_id, sum(l.points_delta) as b
        from public.karma_ledger l
       where l.ref_id = v_rid and l.event_type like 'closure%'
       group by l.user_id
      having sum(l.points_delta) <> 0
    ),
    ins as (
      insert into public.karma_ledger (user_id, event_type, points_delta, ref_type, ref_id)
      select user_id, 'closure_reverse', -b, 'post', v_rid from bal
      returning user_id, points_delta
    )
    update public.users u
       set karma_points = greatest(0, u.karma_points + i.points_delta)
      from ins i
     where u.user_id = i.user_id;
  end if;

  return null;
end;
$$;
create trigger karma_posts_after_insert
  after insert on public.posts
  for each row execute function public.karma_on_post_change();
create trigger karma_posts_after_status_update
  after update of status on public.posts
  for each row execute function public.karma_on_post_change();

-- ── 4. follower (+1 / -1) — follow_edges INSERT/DELETE ──────────────────────
create or replace function public.karma_on_follow_change()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_ref text;
begin
  if tg_op = 'INSERT' then
    v_ref := new.follower_id::text || ':' || new.followed_id::text;
    perform public.karma_apply(new.followed_id, 'follower_gained', 'follow', v_ref, 1);
    return null;
  end if;
  v_ref := old.follower_id::text || ':' || old.followed_id::text;
  perform public.karma_apply(old.followed_id, 'follower_gained_reverse', 'follow', v_ref, -1);
  return null;
end;
$$;
create trigger karma_follow_after_insert
  after insert on public.follow_edges
  for each row execute function public.karma_on_follow_change();
create trigger karma_follow_after_delete
  after delete on public.follow_edges
  for each row execute function public.karma_on_follow_change();

-- ── 5. outreach (+1, once per sender+anchor-post, soft daily cap) — messages ─
-- First message a non-owner sends in a post-anchored chat. Per-post dedupe via the
-- once-index; a soft daily cap (FR-KARMA-006) blocks mass-DM farming + the real
-- inbox-spam harm. System messages (sender null) ignored. The cheap short-circuits
-- run first, so the ~99% of messages that aren't first-contact skip the count query.
create or replace function public.karma_on_message_insert()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_anchor uuid; v_owner uuid; v_today integer;
begin
  if new.sender_id is null then return null; end if;
  select c.anchor_post_id into v_anchor from public.chats c where c.chat_id = new.chat_id;
  if v_anchor is null then return null; end if;
  select p.owner_id into v_owner from public.posts p where p.post_id = v_anchor;
  if v_owner is null or v_owner = new.sender_id then return null; end if;
  select count(*) into v_today from public.karma_ledger
   where user_id = new.sender_id and event_type = 'outreach'
     and created_at >= date_trunc('day', now());
  if v_today >= 10 then return null; end if;  -- KARMA_OUTREACH_DAILY_CAP
  perform public.karma_grant_once(new.sender_id, 'outreach', 'post', v_anchor::text, 1);
  return null;
end;
$$;
create trigger karma_messages_after_insert
  after insert on public.messages
  for each row execute function public.karma_on_message_insert();

-- end of 0099_karma_triggers
```

- [ ] **Step 2: Apply + verify award/reverse symmetry**

Apply to dev. Run this self-contained check (creates a temp giver/receiver, exercises closure + reverse, asserts net zero):

```sql
do $$
declare
  g uuid := (select user_id from public.users order by created_at limit 1);
  r uuid := (select user_id from public.users order by created_at offset 1 limit 1);
  pid uuid := gen_random_uuid();
  k_g0 integer; k_r0 integer;   -- baselines
  k_g1 integer; k_r1 integer;   -- after closure
  k_g2 integer; k_r2 integer;   -- after reverse
begin
  select karma_points into k_g0 from public.users where user_id = g;
  select karma_points into k_r0 from public.users where user_id = r;

  insert into public.posts (post_id, owner_id, type, status, visibility, title, category, city, location_display_level, estimated_value)
  values (pid, g, 'Give', 'open', 'Public', 'kclose', 'Furniture',
          (select city from public.users where city is not null limit 1), 'city', 500);
  insert into public.recipients (post_id, recipient_user_id) values (pid, r);
  update public.posts set status = 'closed_delivered' where post_id = pid;   -- delivery → award
  select karma_points into k_g1 from public.users where user_id = g;  -- +5 post +30 giver closure (20+10)
  select karma_points into k_r1 from public.users where user_id = r;  -- +15 receiver closure

  update public.posts set status = 'open' where post_id = pid;               -- reopen → reverse closure
  select karma_points into k_g2 from public.users where user_id = g;  -- giver back to +5 (post only)
  select karma_points into k_r2 from public.users where user_id = r;  -- receiver back to baseline

  raise notice 'giver: closure=+% (want 35) after_reverse=+% (want 5) | receiver: closure=+% (want 15) after_reverse=+% (want 0)',
    k_g1 - k_g0, k_g2 - k_g0, k_r1 - k_r0, k_r2 - k_r0;

  -- cleanup
  delete from public.recipients where post_id = pid;
  delete from public.posts where post_id = pid;
  delete from public.karma_ledger where ref_id = pid::text;
  update public.users set karma_points = k_g0 where user_id = g;
  update public.users set karma_points = k_r0 where user_id = r;
end $$;
```

Expected NOTICE: `giver: closure=+35 after_reverse=+5 | receiver: closure=+15 after_reverse=+0`.

> If a status-FSM guard trigger rejects the direct `update posts set status`, drive the transitions via the real RPCs instead — `close_post_with_recipient(pid, r)` to deliver and the reopen RPC to revert; the karma trigger fires identically on the resulting status change.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/0099_karma_triggers.sql
git commit -m "feat(infra): add karma award/reverse triggers for all events (FR-KARMA-002/005/006)"
```

---

### Task 6: Nightly recompute + drift + pg_cron

**Files:**
- Create: `supabase/migrations/0100_karma_recompute_and_backfill.sql` (recompute part)

- [ ] **Step 1: Write the recompute half of the migration**

```sql
-- 0100_karma_recompute_and_backfill | FR-KARMA-001 — nightly drift recompute + backfill
-- Mirrors 0045 (stats recompute). karma_points is the denorm of sum(karma_ledger);
-- this reconciles drift and seeds existing users (registration + counters).

set search_path = public;

-- ── 1. Drift tables ─────────────────────────────────────────────────────────
create table if not exists public.karma_recompute_runs (
  run_id          bigserial primary key,
  run_at          timestamptz not null default now(),
  users_processed integer not null,
  drift_events    integer not null
);
create table if not exists public.karma_drift_events (
  drift_id    bigserial primary key,
  run_id      bigint not null references public.karma_recompute_runs (run_id) on delete cascade,
  detected_at timestamptz not null default now(),
  user_id     uuid not null references public.users (user_id) on delete cascade,
  old_value   integer not null,
  new_value   integer not null
);
create index if not exists karma_drift_events_run_idx on public.karma_drift_events (run_id);

alter table public.karma_recompute_runs enable row level security;
alter table public.karma_drift_events enable row level security;
create policy karma_recompute_runs_select_admin on public.karma_recompute_runs
  for select using (public.is_admin(auth.uid()));
create policy karma_drift_events_select_admin on public.karma_drift_events
  for select using (public.is_admin(auth.uid()));
revoke insert, update, delete on public.karma_recompute_runs from authenticated, anon;
revoke insert, update, delete on public.karma_drift_events from authenticated, anon;
revoke select on public.karma_recompute_runs from authenticated, anon;
revoke select on public.karma_drift_events from authenticated, anon;

-- ── 2. Recompute (SECURITY DEFINER) ─────────────────────────────────────────
create or replace function public.karma_recompute_nightly()
returns table (users_processed integer, drift_events integer)
language plpgsql security definer set search_path = public as $$
declare v_run_id bigint; v_processed integer := 0; v_drift integer := 0;
begin
  insert into public.karma_recompute_runs (users_processed, drift_events) values (0, 0)
  returning run_id into v_run_id;

  -- Single GROUP BY pass over the ledger (uses karma_ledger_user_delta_idx),
  -- left-joined to users — not a per-user correlated subquery (was 3× full scans).
  with sums as (
    select user_id, greatest(0, sum(points_delta))::integer as v
      from public.karma_ledger group by user_id
  ),
  ins as (
    insert into public.karma_drift_events (run_id, user_id, old_value, new_value)
    select v_run_id, u.user_id, u.karma_points, coalesce(s.v, 0)
      from public.users u left join sums s on s.user_id = u.user_id
     where u.karma_points is distinct from coalesce(s.v, 0)
    returning drift_id
  )
  select count(*)::integer into v_drift from ins;

  with sums as (
    select user_id, greatest(0, sum(points_delta))::integer as v
      from public.karma_ledger group by user_id
  )
  update public.users u
     set karma_points = coalesce(s.v, 0)
    from sums s
   where u.user_id = s.user_id and u.karma_points is distinct from coalesce(s.v, 0);

  -- Defensive: users with an empty ledger but nonzero karma (should not happen).
  update public.users u set karma_points = 0
   where u.karma_points <> 0
     and not exists (select 1 from public.karma_ledger l where l.user_id = u.user_id);

  select count(*)::integer into v_processed from public.users;
  if v_drift > 0 then
    raise notice 'karma_drift_detected run_id=% drift_events=%', v_run_id, v_drift;
  end if;
  update public.karma_recompute_runs set users_processed = v_processed, drift_events = v_drift
   where run_id = v_run_id;
  return query select v_processed, v_drift;
end;
$$;
revoke all on function public.karma_recompute_nightly() from public;

-- ── 3. pg_cron schedule (04:30, after stats at 04:15) ───────────────────────
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    if exists (select 1 from cron.job where jobname = 'karma_recompute_nightly') then
      perform cron.unschedule('karma_recompute_nightly');
    end if;
    perform cron.schedule('karma_recompute_nightly', '30 4 * * *',
      $sql$ select * from public.karma_recompute_nightly(); $sql$);
  else
    raise notice 'pg_cron not enabled — karma_recompute_nightly not scheduled. Enable in Supabase dashboard, then re-run.';
  end if;
end$$;
```

- [ ] **Step 2: Commit (backfill appended next task)**

Do not commit yet — Task 7 appends the backfill block to the same file, then commits. Proceed to Task 7.

---

### Task 7: One-time backfill

**Files:**
- Modify: `supabase/migrations/0100_karma_recompute_and_backfill.sql` (append backfill)

- [ ] **Step 1: Append the backfill block** to the end of `0100_karma_recompute_and_backfill.sql`:

```sql
-- ── 4. One-time backfill (FR-KARMA-001) ─────────────────────────────────────
-- Seed every existing user: +1 registration + counters. One summary ledger row
-- per user (the once-index dedupes a re-run). New signups after this migration
-- get +1 via the registration trigger (0099); their backfill row is also +1 but
-- the once-index prevents a double registration ledger entry for the same user
-- across both paths — backfill uses event_type='backfill' (distinct ref space),
-- so the trigger's 'registration' row and this 'backfill' row coexist by design
-- ONLY for users that predate the trigger. Guard: only backfill users with no
-- 'registration' ledger row yet (i.e. created before 0099).
insert into public.karma_ledger (user_id, event_type, points_delta, ref_type, ref_id)
select u.user_id,
       'backfill',
       1 + (u.items_given_count * 20) + (u.items_received_count * 15) + (u.followers_count * 1),
       'user',
       u.user_id::text
  from public.users u
 where not exists (
   select 1 from public.karma_ledger l
    where l.user_id = u.user_id and l.event_type = 'registration'
 )
on conflict do nothing;

-- Reconcile the denorm from the ledger for everyone.
update public.users u
   set karma_points = greatest(0, coalesce(
         (select sum(l.points_delta) from public.karma_ledger l where l.user_id = u.user_id), 0));

-- end of 0100_karma_recompute_and_backfill
```

- [ ] **Step 2: Apply + verify backfill + recompute**

Apply `0100` to dev, then:

```sql
-- every user worth >= 1
select count(*) as below_one from public.users where karma_points < 1; -- 0
-- denorm equals ledger sum (no drift right after backfill)
select count(*) as drift from public.users u
 where u.karma_points <> greatest(0, coalesce(
   (select sum(l.points_delta) from public.karma_ledger l where l.user_id = u.user_id), 0));
-- expect 0
select * from public.karma_recompute_nightly(); -- drift_events should be 0
```

Expected: `below_one = 0`, `drift = 0`, recompute `drift_events = 0`.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/0100_karma_recompute_and_backfill.sql
git commit -m "feat(infra): add karma nightly recompute + drift + backfill (FR-KARMA-001)"
```

---

### Task 8: Regenerate / extend generated DB types

**Files:**
- Modify: `app/packages/infrastructure-supabase/src/database.types.ts`

- [ ] **Step 1: Add the new columns to the generated types**

Preferred: regenerate against dev — `cd app && pnpm dlx supabase gen types typescript --project-id roeefqpdbftlndzsvhfj > packages/infrastructure-supabase/src/database.types.ts` (requires `SUPABASE_ACCESS_TOKEN` from `~/.kc-dev-secrets.env`).

If regenerating is not possible, hand-edit deterministically: in the `posts` table `Row`/`Insert`/`Update` blocks add `estimated_value: number | null` (Row) and `estimated_value?: number | null` (Insert/Update); in the `users` table `Row` add `karma_points: number` and `Insert`/`Update` add `karma_points?: number`.

- [ ] **Step 2: Typecheck**

Run: `cd app && pnpm --filter @kc/infrastructure-supabase typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add app/packages/infrastructure-supabase/src/database.types.ts
git commit -m "chore(infra): regenerate db types for estimated_value + karma_points"
```

---

## Phase 2 — Infrastructure

### Task 9: `IUserRealtime` port

**Files:**
- Create: `app/packages/application/src/ports/IUserRealtime.ts`
- Modify: `app/packages/application/src/index.ts` (export barrel — verify the pattern other ports use)

- [ ] **Step 1: Write the port**

```ts
// app/packages/application/src/ports/IUserRealtime.ts
import type { User } from '@kc/domain';
// Reuse the existing Unsubscribe type — do NOT redeclare it. IChatRealtime
// already exports `Unsubscribe`; a second declaration re-exported through the
// barrel is a TS2308 "already exported a member named 'Unsubscribe'" error.
import type { Unsubscribe } from './IChatRealtime';

/**
 * Subscribe to the signed-in user's own `users` row (FR-KARMA-009).
 * RLS guarantees a client only ever receives its own row. Used to push
 * karma_points + all per-user counters live (closes FR-STATS-001 AC2 / TD-98).
 * `onError` fires on a dropped/timed-out channel so the consumer can resubscribe
 * (a silent dead socket would otherwise freeze counters with no recovery signal).
 */
export interface IUserRealtime {
  subscribeToSelf(
    userId: string,
    onChange: (user: User) => void,
    onError?: (err: Error) => void,
  ): Unsubscribe;
}
```

- [ ] **Step 2: Export from the application barrel**

Open `app/packages/application/src/index.ts`. Find the block where other ports are re-exported (e.g. `export * from './ports/IChatRealtime';`) and add a **named** export (not `export *` — that would re-export `Unsubscribe` a second time → TS2308):

```ts
export type { IUserRealtime } from './ports/IUserRealtime';
```

- [ ] **Step 3: Typecheck**

Run: `cd app && pnpm --filter @kc/application typecheck`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add app/packages/application/src/ports/IUserRealtime.ts app/packages/application/src/index.ts
git commit -m "feat(application): add IUserRealtime port for self-row subscription (FR-KARMA-009)"
```

---

### Task 10: `SupabaseUserRealtime` adapter

> **Order:** complete **Task 11** (`mapUserRow` → `karma_points`) FIRST. This adapter and its test map `karma_points`; without Task 11 they will not typecheck or pass.

**Files:**
- Create: `app/packages/infrastructure-supabase/src/users/SupabaseUserRealtime.ts`
- Test: `app/packages/infrastructure-supabase/src/users/__tests__/SupabaseUserRealtime.test.ts`
- Modify: `app/packages/infrastructure-supabase/src/index.ts` — add `export * from './users/SupabaseUserRealtime';` (REQUIRED — the mobile composition imports it from `@kc/infrastructure-supabase`).

- [ ] **Step 1: Write the failing test** (mirrors `chat/__tests__/SupabaseChatRealtime.chat.test.ts` — a fake channel captures the `postgres_changes` handler and the test invokes it)

```ts
// app/packages/infrastructure-supabase/src/users/__tests__/SupabaseUserRealtime.test.ts
import { describe, it, expect, vi } from 'vitest';
import { SupabaseUserRealtime } from '../SupabaseUserRealtime';
import type { UserRow } from '../mapUserRow';

function makeRow(overrides: Partial<UserRow> = {}): UserRow {
  return {
    user_id: 'u1', auth_provider: 'email', share_handle: 'h', display_name: 'D',
    city: 'c', city_name: 'City', biography: null, avatar_url: null,
    privacy_mode: 'Public', privacy_changed_at: null, account_status: 'active',
    onboarding_state: 'complete', notification_preferences: {}, is_super_admin: false,
    closure_explainer_dismissed: false, first_post_nudge_dismissed: false,
    items_given_count: 0, items_received_count: 0, active_posts_count_internal: 0,
    followers_count: 0, following_count: 0, karma_points: 7,
    created_at: 't', updated_at: 't', ...overrides,
  };
}

function fakeClient() {
  let handler: ((payload: { new: UserRow }) => void) | undefined;
  const channel = {
    on: vi.fn((_evt: string, _cfg: unknown, cb: (p: { new: UserRow }) => void) => {
      handler = cb; return channel;
    }),
    subscribe: vi.fn(() => channel),
  };
  const client = {
    channel: vi.fn(() => channel),
    removeChannel: vi.fn(),
  };
  return { client, channel, fire: (row: UserRow) => handler?.({ new: row }) };
}

describe('SupabaseUserRealtime', () => {
  it('subscribes to own users row and maps karma_points through', () => {
    const { client, channel, fire } = fakeClient();
    const rt = new SupabaseUserRealtime(client as never);
    const onChange = vi.fn();
    const unsub = rt.subscribeToSelf('u1', onChange);

    expect(client.channel).toHaveBeenCalledTimes(1);
    const cfg = channel.on.mock.calls[0][1] as { table: string; filter: string; event: string };
    expect(cfg.table).toBe('users');
    expect(cfg.event).toBe('UPDATE');
    expect(cfg.filter).toBe('user_id=eq.u1');

    fire(makeRow({ karma_points: 42 }));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ userId: 'u1', karmaPoints: 42 }));

    unsub();
    expect(client.removeChannel).toHaveBeenCalledWith(channel);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd app && pnpm --filter @kc/infrastructure-supabase test -- SupabaseUserRealtime`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the adapter**

```ts
// app/packages/infrastructure-supabase/src/users/SupabaseUserRealtime.ts
// Supabase adapter for IUserRealtime. postgres_changes UPDATE on the caller's own
// public.users row. RLS filters server-side (publication from 0007). Mirrors the
// SupabaseChatRealtime / SupabaseFeedRealtime house pattern. FR-KARMA-009.
import type { SupabaseClient } from '@supabase/supabase-js';
import type { IUserRealtime, Unsubscribe } from '@kc/application';
import type { User } from '@kc/domain';
import type { Database } from '../database.types';
import { mapUserRow, type UserRow } from './mapUserRow';

export class SupabaseUserRealtime implements IUserRealtime {
  constructor(private readonly client: SupabaseClient<Database>) {}

  subscribeToSelf(
    userId: string,
    onChange: (user: User) => void,
    onError?: (err: Error) => void,
  ): Unsubscribe {
    const topic = `me:${userId}:${Math.random().toString(36).slice(2, 10)}`;
    const channel = this.client
      .channel(topic)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'users', filter: `user_id=eq.${userId}` },
        (payload) => onChange(mapUserRow(payload.new as UserRow)),
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          onError?.(new Error(`user channel ${status.toLowerCase()}`));
        }
      });
    return () => {
      void this.client.removeChannel(channel);
    };
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd app && pnpm --filter @kc/infrastructure-supabase test -- SupabaseUserRealtime`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/packages/infrastructure-supabase/src/users/SupabaseUserRealtime.ts app/packages/infrastructure-supabase/src/users/__tests__/SupabaseUserRealtime.test.ts app/packages/infrastructure-supabase/src/index.ts
git commit -m "feat(infra): add SupabaseUserRealtime self-row adapter (FR-KARMA-009)"
```

---

### Task 11: `mapUserRow` — karma_points

**Files:**
- Modify: `app/packages/infrastructure-supabase/src/users/mapUserRow.ts:39,69`
- Test: add to the nearest existing users mapper test, or create `app/packages/infrastructure-supabase/src/users/__tests__/mapUserRow.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// app/packages/infrastructure-supabase/src/users/__tests__/mapUserRow.test.ts
import { describe, it, expect } from 'vitest';
import { mapUserRow, type UserRow } from '../mapUserRow';

const base: UserRow = {
  user_id: 'u1', auth_provider: 'email', share_handle: 'h', display_name: null,
  city: null, city_name: null, biography: null, avatar_url: null, privacy_mode: 'Public',
  privacy_changed_at: null, account_status: 'active', onboarding_state: 'complete',
  notification_preferences: {}, is_super_admin: false, closure_explainer_dismissed: false,
  first_post_nudge_dismissed: false, items_given_count: 0, items_received_count: 0,
  active_posts_count_internal: 0, followers_count: 0, following_count: 0, karma_points: 13,
  created_at: 't', updated_at: 't',
};

describe('mapUserRow karma', () => {
  it('maps karma_points → karmaPoints', () => {
    expect(mapUserRow(base).karmaPoints).toBe(13);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd app && pnpm --filter @kc/infrastructure-supabase test -- mapUserRow`
Expected: FAIL — `karma_points` not on `UserRow` / `karmaPoints` undefined.

- [ ] **Step 3: Implement**

In `mapUserRow.ts`, add to the `UserRow` interface after `following_count: number;` (line 40):

```ts
  following_count: number;
  karma_points: number;
```

And in the returned object after `followingCount: row.following_count,` (line 70):

```ts
    followingCount: row.following_count,
    karmaPoints: row.karma_points,
```

- [ ] **Step 4: Run to verify it passes**

Run: `cd app && pnpm --filter @kc/infrastructure-supabase test -- mapUserRow`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/packages/infrastructure-supabase/src/users/mapUserRow.ts app/packages/infrastructure-supabase/src/users/__tests__/mapUserRow.test.ts
git commit -m "feat(infra): map users.karma_points → User.karmaPoints (FR-KARMA-001)"
```

---

### Task 12: `mapPostRow` + `CreatePostInput` + create adapter — estimated_value

**Files:**
- Modify: `app/packages/infrastructure-supabase/src/posts/mapPostRow.ts:71`
- Modify: `app/packages/application/src/ports/IPostRepository.ts:103`
- Modify: `app/packages/infrastructure-supabase/src/posts/SupabasePostRepository.ts:126`
- Test: `app/packages/infrastructure-supabase/src/posts/__tests__/mapPostRow.test.ts` (create or extend)

- [ ] **Step 1: Write the failing test — reuse the REAL row fixture**

`mapPostRow` does **not** take a flat literal — it consumes a generated `posts` row joined with owner/city/media (`PostJoinedRow`) and builds a nested `address` via `mapAddress` (see `mapPostRow.ts`). Do NOT hand-roll a `as never` object — that defeats the type-checker and makes the test a false positive. Instead, open the existing sibling test(s) in `app/packages/infrastructure-supabase/src/posts/__tests__/` (e.g. `mapPostRow.*.test.ts`), copy their real fixture factory, and add an `estimated_value` case. Add (in a new `estimated_value` describe, or extend the existing file):

```ts
import { describe, it, expect } from 'vitest';
import { mapPostRow } from '../mapPostRow';
// `makePostRow` = the existing real fixture builder used by the sibling tests
// (typed against the generated posts Row + joins). Reuse it — do not invent one.
import { makePostRow } from './fixtures'; // adjust to the actual helper/location

describe('mapPostRow estimated_value (FR-KARMA-004)', () => {
  it('maps estimated_value → estimatedValue', () => {
    expect(mapPostRow(makePostRow({ estimated_value: 250 })).estimatedValue).toBe(250);
  });
  it('defaults to null when unset', () => {
    expect(mapPostRow(makePostRow({ estimated_value: null })).estimatedValue).toBeNull();
  });
});
```

If no shared fixture builder exists, construct the row from `Database['public']['Tables']['posts']['Row']` (plus the joins `mapPostRow` reads) — fully typed, no `as never`.

- [ ] **Step 2: Run to verify it fails**

Run: `cd app && pnpm --filter @kc/infrastructure-supabase test -- mapPostRow`
Expected: FAIL — `estimatedValue` undefined.

- [ ] **Step 3: Implement the three edits**

(a) `mapPostRow.ts` — after `urgency: row.urgency,` (line 71):

```ts
    urgency: row.urgency,
    estimatedValue: (row as { estimated_value?: number | null }).estimated_value ?? null,
```

(b) `IPostRepository.ts` `CreatePostInput` — after `urgency: string | null;` (line 103). Make it **optional** (`?`) so existing `create()` callers/tests don't all break at once — minimal-footprint per CLAUDE.md §5:

```ts
  urgency: string | null;
  /** FR-KARMA-004 — estimated item value 0..1000 (Give only). Optional; null/absent = unset. */
  estimatedValue?: number | null;
```

(c) `SupabasePostRepository.ts` insert object — after `urgency: input.urgency,` (line 126):

```ts
        urgency: input.urgency,
        estimated_value: input.estimatedValue ?? null,
```

- [ ] **Step 4: Run to verify it passes + typecheck**

Run: `cd app && pnpm --filter @kc/infrastructure-supabase test -- mapPostRow && pnpm --filter @kc/infrastructure-supabase typecheck`
Expected: tests PASS; typecheck may now flag callers of `create()` missing `estimatedValue` — those are mobile hooks fixed in Task 15. The infra package itself should pass.

- [ ] **Step 5: Commit**

```bash
git add app/packages/infrastructure-supabase/src/posts/mapPostRow.ts app/packages/application/src/ports/IPostRepository.ts app/packages/infrastructure-supabase/src/posts/SupabasePostRepository.ts app/packages/infrastructure-supabase/src/posts/__tests__/mapPostRow.test.ts
git commit -m "feat(infra): persist + map posts.estimated_value (FR-KARMA-004)"
```

---

## Phase 3 — Mobile

### Task 13: Karma i18n module

**Files:**
- Create: `app/apps/mobile/src/i18n/locales/he/modules/karma.ts`
- Modify: `app/apps/mobile/src/i18n/locales/he/index.ts`

- [ ] **Step 1: Create the karma strings**

```ts
// app/apps/mobile/src/i18n/locales/he/modules/karma.ts
// Karma points UI strings (FR-KARMA-004/007). Hebrew only (R-MVP-Core-4).
export const karmaHe = {
  badgeLabel: 'נקודות קארמה',
  howToEarnTitle: 'איך צוברים נקודות קארמה?',
  howToEarnIntro: 'הנקודות מודדות את המעורבות שלך בקהילה — לתת, לבקש, להגיב ולסגור.',
  earnRegistration: 'הצטרפות לקהילה',
  earnPost: 'פרסום פוסט',
  earnOutreach: 'פנייה למפרסם של פוסט',
  earnFollower: 'עוקב חדש שמצטרף אליך',
  earnClosure: 'סגירת פוסט שנמסר — לשני הצדדים, והכי הרבה נקודות',
  close: 'סגירה',
  estimatedValueTitle: 'שווי מוערך של החפץ',
  estimatedValueHint: 'משפיע על הנקודות שתקבל בסגירה',
  estimatedValueMax: '1000+',
  estimatedValueAmount: '{{value}} ₪',
} as const;
```

- [ ] **Step 2: Wire it into the bundle**

In `app/apps/mobile/src/i18n/locales/he/index.ts`: add an import alongside the other module imports —

```ts
import { karmaHe } from './modules/karma';
```

and add a key in the `const he = { ... }` object (next to `feed: feedHe,`):

```ts
  karma: karmaHe,
```

- [ ] **Step 3: Typecheck**

Run: `cd app && pnpm --filter @kc/mobile typecheck`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add app/apps/mobile/src/i18n/locales/he/modules/karma.ts app/apps/mobile/src/i18n/locales/he/index.ts
git commit -m "feat(mobile): add karma i18n strings (FR-KARMA-004/007)"
```

---

### Task 14: `EstimatedValueSlider` component

**Files:**
- Create: `app/apps/mobile/src/components/CreatePostForm/EstimatedValueSlider.tsx`

- [ ] **Step 1: Install the slider dependency (confirmed missing)**

`@react-native-community/slider` is NOT in `app/apps/mobile/package.json` nor the lockfile (FE review confirmed). It IS web-compatible (ships `Slider.web.js` → `<input type="range">`) and Expo SDK 54 supported. Install it and stage the lockfile in this task's commit BEFORE any wiring (CI runs `pnpm install --frozen-lockfile`, which fails on an out-of-date lock):

Run: `cd app && pnpm --filter @kc/mobile add @react-native-community/slider`
Confirm `app/apps/mobile/package.json` and `app/pnpm-lock.yaml` both changed.

- [ ] **Step 2: Write the component**

```tsx
// app/apps/mobile/src/components/CreatePostForm/EstimatedValueSlider.tsx
// FR-KARMA-004 — centered title + 0..1000 (step 50) slider, "1000+" top label.
// Give posts only (mounted under the isGive block in CreatePostFormScrollContent).
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import { useTranslation } from 'react-i18next';
import { colors, spacing, typography, radius } from '@kc/ui';

const MAX = 1000;
const STEP = 50;

export function EstimatedValueSlider({
  value,
  onChange,
}: {
  readonly value: number;
  readonly onChange: (next: number) => void;
}) {
  const { t } = useTranslation();
  const atMax = value >= MAX;
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{t('karma.estimatedValueTitle')}</Text>
      <Text style={styles.amount}>
        {atMax ? t('karma.estimatedValueMax') : t('karma.estimatedValueAmount', { value })}
      </Text>
      <Slider
        style={styles.slider}
        minimumValue={0}
        maximumValue={MAX}
        step={STEP}
        value={value}
        onValueChange={onChange}
        minimumTrackTintColor={colors.primary}
        maximumTrackTintColor={colors.border}
        accessibilityLabel={t('karma.estimatedValueTitle')}
      />
      <Text style={styles.hint}>{t('karma.estimatedValueHint')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: spacing.base,
    padding: spacing.base,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: { ...typography.h4, color: colors.textPrimary, textAlign: 'center' },
  amount: { ...typography.h3, color: colors.primary, textAlign: 'center', marginTop: 2 },
  slider: { width: '100%', height: 40, marginTop: spacing.xs },
  hint: { ...typography.caption, color: colors.textSecondary, textAlign: 'center' },
});
```

> All `@kc/ui` tokens used here exist (FE review verified `colors.primary/surface/border`, `radius.lg`, `typography.h3/h4/caption`).

- [ ] **Step 3: Typecheck**

Run: `cd app && pnpm --filter @kc/mobile typecheck`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add app/apps/mobile/src/components/CreatePostForm/EstimatedValueSlider.tsx app/apps/mobile/package.json app/pnpm-lock.yaml
git commit -m "feat(mobile): add EstimatedValueSlider (Give-only) + slider dep (FR-KARMA-004)"
```

---

### Task 15: Thread `estimatedValue` through form → draft → publish → slider mount

**Files:**
- Modify: `useCreatePostFormState.ts`, `store/postDraftStore.ts`, `usePostDraftAutosave.ts`, `useCreatePostPublish.ts`, `app/(tabs)/create.tsx`, `CreatePostFormScrollContent.tsx`

- [ ] **Step 1: Form state** — in `useCreatePostFormState.ts`:
  - Add state after the `urgency` state (line 22): `const [estimatedValue, setEstimatedValue] = useState<number>(POST_DRAFT_DEFAULTS.estimatedValue);`
  - In `applyDraft` (near line 41, after `setUrgency(draft.urgency);`): `setEstimatedValue(draft.estimatedValue ?? 0);`
  - In the returned object (after `urgency, setUrgency,`): `estimatedValue, setEstimatedValue,`

- [ ] **Step 2: Draft state + defaults + persistence** — `POST_DRAFT_DEFAULTS` lives in `src/lib/postDraftFormState.ts` (NOT `store/postDraftStore.ts`). Add `estimatedValue` to ALL FOUR structures there, or autosave/dirty-detection silently drops it:
  - `PostDraftFormState` type → add `estimatedValue: number`.
  - `POST_DRAFT_DEFAULTS` → add `estimatedValue: 0`.
  - `isFormStateAtDefaults(...)` (the dirty/equality check) → compare `estimatedValue`.
  - `buildDraftPayload(...)` → include `estimatedValue`.
  - Then in `src/store/postDraftStore.ts`, add `estimatedValue: number` to the `PostDraftPayload` type.

- [ ] **Step 3: Autosave** — in `usePostDraftAutosave.ts`: add `estimatedValue` to the input type (`PostDraftAutosaveInput`), to the persisted payload, AND to the effect's **dependency array** (the hook lists every field in deps; without it the debounced save won't re-fire when the slider moves). Then in `create.tsx`'s `usePostDraftAutosave({ ... })` (lines 54-68) add `estimatedValue: form.estimatedValue,`.

- [ ] **Step 4: Publish** — in `useCreatePostPublish.ts`:
  - Add `estimatedValue: number;` to the hook args type (near line 38 where `urgency: string;` is).
  - In the `create({ ... })` payload (near line 79-80, after `urgency: ...`): `estimatedValue: args.isGive ? args.estimatedValue : null,`
  - In `create.tsx` `useCreatePostPublish({ ... })` (line 124-144) add `estimatedValue: form.estimatedValue,`

- [ ] **Step 5: Mount the slider (Give-only)** — in `CreatePostFormScrollContent.tsx`:
  - Add two props to the component's props type (near line 31-41): `readonly estimatedValue: number;` and `readonly onEstimatedValueChange: (next: number) => void;`
  - Destructure them in the params (near line 68-78).
  - Inside the existing `{isGive && ( ... )}` block (starts line 195), after the condition `</View>` that closes the condition row, render: `<EstimatedValueSlider value={estimatedValue} onChange={onEstimatedValueChange} />`
  - Add the import at the top: `import { EstimatedValueSlider } from './EstimatedValueSlider';`
  - In `create.tsx` where `<CreatePostFormScrollContent ... />` is rendered (around line 188-200), pass: `estimatedValue={form.estimatedValue}` and `onEstimatedValueChange={form.setEstimatedValue}`.

- [ ] **Step 6: Typecheck + test + lint**

Run: `cd app && pnpm --filter @kc/mobile typecheck && pnpm --filter @kc/mobile test && pnpm --filter @kc/mobile lint`
Expected: PASS (the `create()` caller now supplies `estimatedValue`, clearing the Task 12 typecheck note).

- [ ] **Step 7: Verify in web preview** (memory: verify UI before claiming done)

`cd app && pnpm --filter @kc/mobile web`, open the Create tab. Confirm: slider appears under "מצב הפריט" only when type = "נותן"; switching to "בקשה" hides it; the amount label shows `₪` values and `1000+` at the top. Capture the DOM/screenshot via Chrome MCP.

- [ ] **Step 8: Commit**

```bash
git add app/apps/mobile/src/hooks/useCreatePostFormState.ts app/apps/mobile/src/store/postDraftStore.ts app/apps/mobile/src/hooks/usePostDraftAutosave.ts app/apps/mobile/src/hooks/useCreatePostPublish.ts app/apps/mobile/app/\(tabs\)/create.tsx app/apps/mobile/src/components/CreatePostForm/CreatePostFormScrollContent.tsx
git commit -m "feat(mobile): wire estimated-value slider through create-post flow (FR-KARMA-004)"
```

---

### Task 16: `useMeRealtime` hook + composition

**Files:**
- Create: `app/apps/mobile/src/services/userRealtimeComposition.ts`
- Create: `app/apps/mobile/src/hooks/useMeRealtime.ts`
- Modify: `app/apps/mobile/app/_layout.tsx`

- [ ] **Step 1: Composition root for the adapter** — follow the pattern of `src/services/userComposition.ts`:

```ts
// app/apps/mobile/src/services/userRealtimeComposition.ts
import type { IUserRealtime } from '@kc/application';
import { SupabaseUserRealtime, getSupabaseClient } from '@kc/infrastructure-supabase';
import { pickStorage } from './storage'; // same helper userComposition.ts uses

let instance: IUserRealtime | null = null;
export function getUserRealtime(): IUserRealtime {
  if (!instance) {
    instance = new SupabaseUserRealtime(getSupabaseClient({ storage: pickStorage() }));
  }
  return instance;
}
```

> Match `getSupabaseClient` + `pickStorage` to exactly what `src/services/userComposition.ts` imports — it constructs `getSupabaseClient({ storage: pickStorage() })` (there is **no** `./supabaseClient` module; do not invent one). `SupabaseUserRealtime` is exported from the infra barrel in Task 10.

- [ ] **Step 2: The hook** — subscribes once for the signed-in user and writes the live row into the existing `['user-profile', userId]` react-query cache, so the karma badge + every counter (profile, stats) update live:

```ts
// app/apps/mobile/src/hooks/useMeRealtime.ts
// FR-KARMA-009 — push karma_points + all per-user counters live by patching the
// shared ['user-profile', userId] query cache from the self-row subscription.
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { getUserRealtime } from '../services/userRealtimeComposition';

export function useMeRealtime(): void {
  const userId = useAuthStore((s) => s.session?.userId);
  const queryClient = useQueryClient();
  useEffect(() => {
    if (!userId) return;
    const unsub = getUserRealtime().subscribeToSelf(
      userId,
      (user) => queryClient.setQueryData(['user-profile', userId], user),
      (err) => { if (__DEV__) console.warn('[karma] self-realtime channel error:', err.message); },
    );
    return unsub;
  }, [userId, queryClient]);
}
```

- [ ] **Step 3: Mount once INSIDE the providers** — `useMeRealtime` calls `useQueryClient()`, so it must run **inside** the `QueryClientProvider` subtree. The provider is in `_layout.tsx`'s returned JSX (~line 202); a hook in `RootLayout`'s own body is ABOVE the provider and would throw "No QueryClient set". Add a tiny mount component and render it inside the provider tree:

```tsx
function MeRealtimeMount() { useMeRealtime(); return null; }
```

Render `<MeRealtimeMount />` just inside `<QueryClientProvider>` (a sibling above `<Stack />`). Add `import { useMeRealtime } from '../src/hooks/useMeRealtime';` at the top.

- [ ] **Step 4: Typecheck + test**

Run: `cd app && pnpm --filter @kc/mobile typecheck && pnpm --filter @kc/mobile test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/apps/mobile/src/services/userRealtimeComposition.ts app/apps/mobile/src/hooks/useMeRealtime.ts app/apps/mobile/app/_layout.tsx
git commit -m "feat(mobile): subscribe to self-row realtime → live counters + karma (FR-KARMA-009)"
```

---

### Task 17: `KarmaBadge` + mount on My Profile (self only)

**Files:**
- Create: `app/apps/mobile/src/components/profile/KarmaBadge.tsx`
- Modify: the self-profile chrome that reads `['user-profile', userId]` (`MyProfileChrome.tsx`) — **NOT** `profile/index.tsx` (that file has no `user` variable; it only queries `['my-posts']`).

- [ ] **Step 1: Write the badge** (number + a "how to earn" modal sheet)

```tsx
// app/apps/mobile/src/components/profile/KarmaBadge.tsx
// FR-KARMA-007 — self-only karma number + "how to earn" explainer.
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors, spacing, typography, radius } from '@kc/ui';

export function KarmaBadge({ points }: { readonly points: number }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  return (
    <>
      <TouchableOpacity style={styles.badge} onPress={() => setOpen(true)} accessibilityRole="button">
        <Ionicons name="sparkles" size={18} color={colors.primary} />
        <Text style={styles.points}>{points}</Text>
        <Text style={styles.label}>{t('karma.badgeLabel')}</Text>
        <Ionicons name="information-circle-outline" size={16} color={colors.textSecondary} />
      </TouchableOpacity>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.sheetTitle}>{t('karma.howToEarnTitle')}</Text>
            <Text style={styles.sheetIntro}>{t('karma.howToEarnIntro')}</Text>
            {(['earnRegistration', 'earnPost', 'earnOutreach', 'earnFollower', 'earnClosure'] as const).map((k) => (
              <Text key={k} style={styles.rule}>• {t(`karma.${k}`)}</Text>
            ))}
            <TouchableOpacity style={styles.closeBtn} onPress={() => setOpen(false)}>
              <Text style={styles.closeText}>{t('karma.close')}</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.xs,
    alignSelf: 'flex-end', paddingHorizontal: spacing.sm, paddingVertical: spacing.xs,
    backgroundColor: colors.primarySurface, borderRadius: radius.full,
    borderWidth: 1, borderColor: colors.primaryLight,
  },
  points: { ...typography.h4, color: colors.primary },
  label: { ...typography.caption, color: colors.textPrimary },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: spacing.lg },
  sheet: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.xs },
  sheetTitle: { ...typography.h3, color: colors.textPrimary, textAlign: 'right' },
  sheetIntro: { ...typography.body, color: colors.textSecondary, textAlign: 'right', marginBottom: spacing.xs },
  rule: { ...typography.body, color: colors.textPrimary, textAlign: 'right' },
  closeBtn: { marginTop: spacing.base, alignSelf: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  closeText: { ...typography.button, color: colors.primary },
});
```

> All these `@kc/ui` tokens exist (FE review verified `colors.primarySurface/primaryLight/textPrimary/textSecondary`, `radius.full/lg`, `typography.button/h3/h4/caption/body`).

- [ ] **Step 2: Mount inside `MyProfileChrome` (self only)** — `profile/index.tsx` has no `user` variable (it queries `['my-posts']`). The signed-in `User` (with `karmaPoints`) is read in `MyProfileChrome.tsx` (`getUserRepo().findById` via `['user-profile', userId]`, ~line 47). Mount the badge there, near `ProfileStatsRow` (~line 101):

```tsx
{user ? <KarmaBadge points={user.karmaPoints} /> : null}
```

Add the import with the correct relative path to `KarmaBadge` (if `MyProfileChrome.tsx` is in the same `components/profile/` folder, it's `./KarmaBadge`). `MyProfileChrome` renders ONLY for the signed-in user; the other-user screen (`app/user/[handle]/index.tsx`, query key `['profile-other', handle]`) must NOT render the badge (FR-KARMA-008) — do not touch it.

- [ ] **Step 3: Typecheck + lint**

Run: `cd app && pnpm --filter @kc/mobile typecheck && pnpm --filter @kc/mobile lint`
Expected: PASS.

- [ ] **Step 4: Verify in web preview**

Load the Profile tab → karma badge shows the number; tap it → "how to earn" sheet lists the rules. Load another user's profile → **no** badge. Screenshot via Chrome MCP.

- [ ] **Step 5: Commit**

```bash
# add KarmaBadge.tsx + the MyProfileChrome.tsx you edited (use its real path)
git add app/apps/mobile/src/components/profile/KarmaBadge.tsx
git add "$(git ls-files '**/MyProfileChrome.tsx')"
git commit -m "feat(mobile): show self-only karma badge on My Profile (FR-KARMA-007/008)"
```

---

### Task 18: Karma card on the stats screen

**Files:**
- Modify: `app/apps/mobile/app/stats.tsx`

- [ ] **Step 1: Add live updates + a karma card** — `stats.tsx` already reads `userQuery.data` (`u`) from `['user-profile', userId]`. Add the realtime hook and a karma card above the personal strip:
  - Add import: `import { useMeRealtime } from '../src/hooks/useMeRealtime';` and `import { KarmaBadge } from '../src/components/profile/KarmaBadge';`
  - Call `useMeRealtime();` inside `StatsScreen` (after the `userId` line).
  - In the JSX, just above `<View style={styles.hero}>` (line 114), insert:

```tsx
        {u ? (
          <View style={styles.karmaCard}>
            <KarmaBadge points={u.karmaPoints} />
          </View>
        ) : null}
```

  - Add to the `StyleSheet`: `karmaCard: { alignItems: 'flex-end' },`

- [ ] **Step 2: Typecheck + lint + test**

Run: `cd app && pnpm --filter @kc/mobile typecheck && pnpm --filter @kc/mobile lint && pnpm --filter @kc/mobile test`
Expected: PASS.

- [ ] **Step 3: Verify realtime end-to-end** (dev DB)

With the stats screen open in web preview, in a second window run an award against your dev user:

```sql
select public.karma_apply((select user_id from public.users where /* your test account */ true limit 1),
  'follower_gained', 'follow', 'manual-verify', 1);
```

Confirm the stats karma number increments **without** refocusing the screen. Then revert: `select public.karma_apply(<same user>, 'follower_gained_reverse', 'follow', 'manual-verify', -1);` and `delete from public.karma_ledger where ref_id = 'manual-verify';`

- [ ] **Step 4: Commit**

```bash
git add app/apps/mobile/app/stats.tsx
git commit -m "feat(mobile): karma card + realtime on stats screen (FR-KARMA-007/009)"
```

---

## Phase 4 — SSOT

### Task 19: Canonical spec `14_karma.md`

**Files:**
- Create: `docs/SSOT/spec/14_karma.md`

- [ ] **Step 1: Author the FR spec** with the status header (✅ on merge), `FR-KARMA-001..009`, ACs lifted from the design doc's "Goals" + "Points schedule" sections, plus a **Mechanism notes** section recording the council corrections that supersede the design doc:
  - Closure karma is anchored to the **`posts.status` transition** into/out of `closed_delivered` (not recipients-row existence); reversal zeroes the post's closure-ledger balance per user.
  - Awards are single-anchor + append-and-sum; a **partial unique index** dedupes only the never-reversed once-events; reversible events net to zero — supersedes the design doc's "global UNIQUE" phrasing.
  - Realtime filters the own `users` row by **`user_id`** (the PK), not `id` (the design doc's `id=eq` is wrong), with `replica identity full`.
  - Outreach has a soft daily cap (**shipped**, not deferred).
  - Client live-update patches the `['user-profile', userId]` react-query cache (refines the design doc's `meStore`).

  Cross-link `docs/superpowers/specs/2026-05-29-karma-points-design.md`. English only; FR-IDs + code paths English.

- [ ] **Step 2: Commit**

```bash
git add docs/SSOT/spec/14_karma.md
git commit -m "docs(ssot): add FR-KARMA spec domain 14_karma (FR-KARMA-001..009)"
```

---

### Task 20: BACKLOG + DECISIONS + TECH_DEBT + statistics note

**Files:**
- Modify: `docs/SSOT/BACKLOG.md`, `docs/SSOT/DECISIONS.md`, `docs/SSOT/TECH_DEBT.md`, `docs/SSOT/spec/10_statistics.md`

- [ ] **Step 1: BACKLOG** — add a P2 row (e.g. `P2.24 | Karma points (FR-KARMA) | agent-fullstack | ✅ Done | spec/14_karma.md`). If executing incrementally, set `🟡 In progress` at start and flip to `✅ Done` here.

- [ ] **Step 2: DECISIONS** — add `D-155` (karma): self-only-for-now visibility (public-ready model), the points economy + retunable single-source, +1 registration floor, server-authoritative single-anchor awards, status-anchored closure, realtime via own-row `postgres_changes`. Add `D-156` (anti-collusion gate): collusive fake-delivery farming (+35/+15 per pair, permanent) is tolerated at MVP because karma is self-only — no incentive to inflate a private number — but reciprocity/velocity caps are a **hard precondition of the public flip (FR-KARMA-008)**, plus an in-app heads-up before a months-old private number first becomes visible. (Confirm `D-155`/`D-156` are the next free ids; bump if others landed.)

- [ ] **Step 3: TECH_DEBT** — close `TD-98` (per-user counters are now realtime, not focus-only). Add watch items: (a) "Anti-collusion (reciprocity/velocity caps) required before the FR-KARMA-008 public flip — see D-156"; (b) "Karma realtime uses `postgres_changes` per own-row; upgrade path is Broadcast-from-DB if subscriber fan-out grows." Use FE/BE id lanes per CLAUDE.md §9. (The outreach soft daily-cap is **shipped** in `0099`, not deferred.)

- [ ] **Step 4: statistics AC note** — in `docs/SSOT/spec/10_statistics.md`, update the FR-STATS-001 AC2 status note (and the header ⚠️ line) to record that counters now update via own-row Realtime (FR-KARMA-009), closing the focus-only gap.

- [ ] **Step 5: Commit**

```bash
git add docs/SSOT/BACKLOG.md docs/SSOT/DECISIONS.md docs/SSOT/TECH_DEBT.md docs/SSOT/spec/10_statistics.md
git commit -m "docs(ssot): backlog/decisions/tech-debt + stats realtime note for FR-KARMA"
```

---

## Final integration gate (before PR)

- [ ] From `app/`: `pnpm typecheck && pnpm test && pnpm lint` — all green.
- [ ] `pnpm lint:arch` — file-size (≤300) + dependency-direction caps pass (split any file that grew over the cap).
- [ ] Dev DB: all four migrations applied; `select * from public.karma_recompute_nightly();` returns `drift_events = 0`.
- [ ] Manual: create a Give post with a value → close it as **delivered** (mark recipient) → both karma numbers move; reopen → both revert; follow/unfollow nets zero; new outreach +1 once (and stops at the daily cap).
- [ ] Open PR to `dev` with the §6 body template incl. the `Mapped to spec: FR-KARMA-001..009` line; `gh pr merge --auto --squash --delete-branch`; watch checks.

---

## Self-review checklist (author runs before handing off)

- **Spec coverage:** FR-KARMA-001 (Tasks 4,6,7,11), 002 (1,5), 003 (1,5), 004 (3,12,13,14,15), 005 (5), 006 (5), 007 (13,17,18), 008 (17), 009 (4,9,10,16,18). All covered.
- **Council corrections applied:** closure re-anchored to `posts.status` (Task 5); `karma_grant_once` race-safe `on conflict` (Task 4); `replica identity full` + `user_id` filter (Tasks 4/10); recompute pre-aggregated (Task 6); `Unsubscribe` collision + realtime `onError` (Tasks 9/10/16); dead `KARMA_POINTS` removed (Task 1); `mapPostRow` fixture real (Task 12); slider dep install + lockfile (Task 14); draft defaults in `lib/postDraftFormState.ts` (Task 15); composition uses `getSupabaseClient` (Task 16); badge mounts in `MyProfileChrome` (Task 17); outreach daily cap shipped + D-156 (Tasks 5/20).
- **Type consistency:** `estimatedValue`/`estimated_value`, `karmaPoints`/`karma_points`, `computeValueBonus`, `subscribeToSelf`, `getUserRealtime`, `useMeRealtime` used identically across tasks.
- **No placeholders:** every code step has complete code; SQL verify steps have concrete expected output.
